;((window, $) => {
  // Declare the jQuery variable to fix the lint error
  const jQuery = window.jQuery

  $.fn.smartColorMultiSelect = function (options) {
    var settings = $.extend({ enable: false }, options)

    var colors = ["#e74c3c", "#f1c40f", "#7f8c8d", "#3498db", "#49b049"]

    function normalizeColorString(s) {
      if (!s) return null
      s = String(s).trim().toLowerCase()

      var m = s.match(/rgba?\s*$$\s*(\d{1,3})\s*,\s*(\d{1,3})\s*,\s*(\d{1,3})(?:\s*,\s*(0|0?\.\d+|1(\.0)?))?\s*$$/i)
      if (m) {
        var r = Math.max(0, Math.min(255, Number.parseInt(m[1], 10)))
        var g = Math.max(0, Math.min(255, Number.parseInt(m[2], 10)))
        var b = Math.max(0, Math.min(255, Number.parseInt(m[3], 10)))
        var a = typeof m[4] !== "undefined" ? Number.parseFloat(m[4]) : 1
        if (a === 0) return null
        var hex = "#" + ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1)
        return hex.toLowerCase()
      }

      if (s === "transparent") return null
      if (s[0] === "#") s = s.substring(1)
      if (/^[0-9a-f]{3}$/.test(s)) {
        var expanded = s
          .split("")
          .map((c) => c + c)
          .join("")
        return "#" + expanded
      }
      if (/^[0-9a-f]{6}$/.test(s)) return "#" + s
      return s
    }

    function colorEquals(a, b) {
      if (!a && !b) return false
      var na = normalizeColorString(a)
      var nb = normalizeColorString(b)
      if (na && nb) return na === nb
      if (a && b) return String(a).trim().toLowerCase() === String(b).trim().toLowerCase()
      return false
    }

    function readColorFromOption($opt) {
      if (!$opt || !$opt.length) return null
      try {
        var a = $opt.attr("data-color")
        if (a) return a
        var d = $opt.data("color")
        if (d) return d
        if ($opt[0] && $opt[0].dataset && $opt[0].dataset.color) return $opt[0].dataset.color
      } catch (e) {}
      return null
    }

    function setOptionColor($opt, color) {
      try {
        $opt.attr("data-color", color)
        $opt.data("color", color)
        if ($opt[0]) {
          $opt[0].setAttribute("data-color", color)
          $opt[0].dataset.color = color
        }
      } catch (e) {}
    }

    function removeOptionColor($opt) {
      try {
        $opt.removeAttr("data-color")
        $opt.removeData("color")
        if ($opt[0]) {
          $opt[0].removeAttribute("data-color")
          delete $opt[0].dataset.color
        }
      } catch (e) {}
    }

    function syncGroupsToOptions($selectElem, groups) {
      try {
        $selectElem.find("option").each(function () {
          removeOptionColor($(this))
        })
        for (var gi = 0; gi < groups.length; gi++) {
          var vals = groups[gi] || []
          for (var vi = 0; vi < vals.length; vi++) {
            var v = vals[vi]
            var $opt = $selectElem
              .find("option")
              .filter(function () {
                return $(this).val() == v
              })
              .first()
            if ($opt.length) setOptionColor($opt, colors[gi])
          }
        }
        $selectElem.data("scms-groups", groups)
      } catch (e) {}
    }

    function pickTextColor(bg) {
      if (!bg) return "#000"
      var hex = String(bg).trim().replace("#", "")
      if (hex.length === 3)
        hex = hex
          .split("")
          .map((c) => c + c)
          .join("")
      if (hex.length !== 6) return "#000"
      var r = Number.parseInt(hex.substring(0, 2), 16)
      var g = Number.parseInt(hex.substring(2, 4), 16)
      var b = Number.parseInt(hex.substring(4, 6), 16)
      var brightness = (r * 299 + g * 587 + b * 114) / 1000
      return brightness > 186 ? "#000" : "#fff"
    }

    if (typeof options === "string") {
      var method = options

      if (method === "getColorGroups") {
        var results = []
        this.each(function () {
          var $first = $(this)
          var $selectElem = $first.is("select") ? $first : $first.find("select").first()
          if (!$selectElem.length) $selectElem = $first

          var $container = $selectElem.closest("div.scms-container")
          var advancedModeActive =
            $container.length && $container.find(".scms-toggle-icon").attr("aria-pressed") === "true"

          if (!advancedModeActive) {
            var selectedValues = []
            $selectElem.find("option:selected").each(function () {
              selectedValues.push($(this).val())
            })
            results.push(selectedValues)
            return
          }

          var groupsMap = $selectElem.data("scms-groups")
          if (groupsMap && Array.isArray(groupsMap)) {
            results.push(groupsMap.filter((group) => group && group.length > 0))
            return
          }

          var groups = colors.map(() => [])
          $selectElem.find("option").each(function () {
            var col = readColorFromOption($(this))
            if (!col) return
            var val = $(this).val()
            for (var ci = 0; ci < colors.length; ci++) {
              if (colorEquals(col, colors[ci])) {
                if (groups[ci].indexOf(val) === -1) groups[ci].push(val)
                break
              }
            }
          })

          results.push(groups.filter((group) => group.length > 0))
        })
        return results.length === 1 ? results[0] : results
      }
      return this
    }

    return this.each(function () {
      var $select = $(this)
      if (!$select.prop("multiple")) return

      var observer = null

      function startObserver() {
        if (observer) return
        observer = new MutationObserver((mutations) => {
          mutations.forEach((mutation) => {
            if (mutation.type === "childList" && initialized) {
              destroyUI()
              buildUI()
              $(".scms-clear-selection").trigger("click")
            }
          })
        })
        observer.observe($select[0], { childList: true, subtree: false })
      }

      function stopObserver() {
        if (observer) {
          observer.disconnect()
          observer = null
        }
      }

      var groupsMap = $select.data("scms-groups") || colors.map(() => [])
      $select.data("scms-groups", groupsMap)

      if ($select.data("scms-applied")) {
        var $existingContainer = $select.closest("div.scms-container")
        if ($existingContainer.length) {
          var $icon = $existingContainer.find(".scms-toggle-icon")
          var pressed = $icon.attr("aria-pressed") === "true"
          var shouldEnable =
            settings.enable ||
            ($select.attr("data-smart-color") !== undefined &&
              ($select.attr("data-smart-color") === "" || $select.attr("data-smart-color") === "true"))
          if (shouldEnable !== pressed) $icon.trigger("click")
        }
        return
      }

      $select.data("scms-applied", true)

      var $container = $select.parent()
      if (!$container.hasClass("scms-container")) {
        $select.wrap('<div class="scms-container"></div>')
        $container = $select.parent().css({
          display: $select.css("display") === "block" ? "block" : "inline-block",
          position: "relative",
        })
      }

      var w = $select.outerWidth()
      var h = $select.outerHeight()
      if (w > 0) $container.css("width", w + "px")
      if (h > 0) $container.css("height", h + "px")

      var $toggleIcon = $container.find(".scms-toggle-icon").first()
      if (!$toggleIcon.length) {
        $toggleIcon = $(
          '<button type="button" class="scms-toggle-icon" aria-pressed="false" title="Advanced mode (group by color)">⚙️</button>',
        )
          .css({
            position: "absolute",
            top: "0",
            right: "-24px",
            zIndex: 1200,
            width: "23px",
            height: "23px",
            lineHeight: "23px",
            padding: 0,
            border: "1px solid rgba(0,0,0,0.06)",
            background: "transparent",
            borderRadius: "5px",
            cursor: "pointer",
            fontSize: "14px",
          })
          .appendTo($container)
      }

      var $wrap = null,
        $palette = null,
        $list = null,
        activeColor = null,
        initialized = false

      function buildUI() {
        if (initialized) return
        initialized = true

        startObserver()

        groupsMap = $select.data("scms-groups")
        activeColor = colors[0]
        var selW = Math.max(120, $select.outerWidth())

        $wrap = $('<div class="smart-color-multiselect"></div>')
          .css({
            border: "1px solid #ccc",
            padding: "4px",
            width: selW + "px",
            background: "#fff",
            fontFamily: "Arial, sans-serif",
            fontSize: "11px",
            position: "absolute",
            top: 0,
            left: 0,
            zIndex: 1100,
            boxSizing: "border-box",
            boxShadow: "0 2px 6px rgba(0,0,0,0.08)",
          })
          .appendTo($container)

        var $paletteRow = $('<div class="palette-row" />')
          .css({ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "8px" })
          .appendTo($wrap)

        $palette = $('<div class="color-palette" />').css({ display: "inline-block" }).appendTo($paletteRow)

        $.each(colors, (i, c) => {
          $('<span title="Color ' + (i + 1) + '"></span>')
            .css({
              display: "inline-block",
              width: "16px",
              height: "16px",
              margin: "2px",
              cursor: "pointer",
              background: c,
              border: "1px solid #666",
              borderRadius: "3px",
            })
            .on("click", function () {
              if (activeColor === c) {
                activeColor = null
                $palette.find("span").css("border", "1px solid #666")
              } else {
                activeColor = c
                $palette.find("span").css("border", "1px solid #666")
                $(this).css("border", "2px solid #000")
              }
            })
            .appendTo($palette)
        })
        $palette.find("span").first().css("border", "2px solid #000")

        $('<button type="button" class="scms-clear-selection" title="Clear selection">Clear</button>')
          .css({
            cursor: "pointer",
            padding: "2px 4px",
            fontSize: "9px",
            background: "transparent",
            border: "1px solid rgba(0,0,0,0.06)",
            borderRadius: "3px",
            marginLeft: "auto",
          })
          .on("click", () => {
            groupsMap = colors.map(() => [])
            $select.data("scms-groups", groupsMap)
            $select.find("option").each(function () {
              removeOptionColor($(this))
              $(this).prop("selected", false)
            })
            $list.find("li").each(function () {
              $(this).removeAttr("data-color").css({ background: "#fff", color: "inherit" })
            })
            syncGroupsToOptions($select, groupsMap)
            $select.trigger("change")
          })
          .appendTo($paletteRow)

        $list = $('<ul class="item-list"></ul>')
          .css({
            listStyle: "none",
            padding: "2px",
            margin: "6px 0 0 0",
            maxHeight: "150px",
            overflow: "auto",
            border: "1px solid #eee",
            borderRadius: "2px",
            background: "#f9f9f9",
            fontSize: "10px",
          })
          .appendTo($wrap)

        $select.find("option").each(function () {
          var $opt = $(this)
          var optionText = $opt.text() || $opt.val()
//          if (optionText.length > 20) optionText = optionText.substring(0, 17) + "..."

          var $li = $("<li></li>")
            .text(optionText)
            .css({
              padding: "3px 4px",
              margin: "1px 0",
              border: "1px solid #e0e0e0",
              cursor: "pointer",
              borderRadius: "2px",
			  minHeight: "20px",
              fontSize: "10px",
              background: "#fff",
              lineHeight: "1.2",
            })
            .attr("data-value", $opt.val())
            .appendTo($list)

          var optColor = readColorFromOption($opt)
          if (optColor) {
            var normColor = normalizeColorString(optColor) || optColor
            $li.css({ background: normColor, color: pickTextColor(normColor) })
            $li.attr("data-color", normColor)
            setOptionColor($opt, normColor)
            $opt.prop("selected", true)

            for (var pi = 0; pi < colors.length; pi++) {
              if (colorEquals(normColor, colors[pi])) {
                if (groupsMap[pi].indexOf($opt.val()) === -1) groupsMap[pi].push($opt.val())
                break
              }
            }
          } else {
            $opt.prop("selected", false)
          }
        })

        $list.on("click", "li", function () {
          var $li = $(this)
          var val = $li.attr("data-value")
          var $opt = $select
            .find("option")
            .filter(function () {
              return $(this).val() == val
            })
            .first()

          groupsMap = $select.data("scms-groups")
          var currentColor = readColorFromOption($opt) || $li.attr("data-color")

          if (currentColor) {
            if (activeColor) {
              if (colorEquals(currentColor, activeColor)) {
                removeOptionColor($opt)
                $li.removeAttr("data-color")
                $opt.prop("selected", false)
                $li.css({ background: "#fff", color: "inherit" })

                for (var gk = 0; gk < groupsMap.length; gk++) {
                  var idx = groupsMap[gk].indexOf(val)
                  if (idx !== -1) groupsMap[gk].splice(idx, 1)
                }
              } else {
                var newColor = normalizeColorString(activeColor) || activeColor
                setOptionColor($opt, newColor)
                $opt.prop("selected", true)
                $li.attr("data-color", newColor)
                $li.css({ background: newColor, color: pickTextColor(newColor) })

                for (var gk2 = 0; gk2 < groupsMap.length; gk2++) {
                  var pos = groupsMap[gk2].indexOf(val)
                  if (pos !== -1) groupsMap[gk2].splice(pos, 1)
                }
                for (var addi = 0; addi < colors.length; addi++) {
                  if (colorEquals(newColor, colors[addi])) {
                    if (groupsMap[addi].indexOf(val) === -1) groupsMap[addi].push(val)
                    break
                  }
                }
              }
            } else {
              removeOptionColor($opt)
              $li.removeAttr("data-color")
              $opt.prop("selected", false)
              $li.css({ background: "#fff", color: "inherit" })

              for (var gk3 = 0; gk3 < groupsMap.length; gk3++) {
                var p = groupsMap[gk3].indexOf(val)
                if (p !== -1) groupsMap[gk3].splice(p, 1)
              }
            }
          } else if (activeColor) {
            var newColor2 = normalizeColorString(activeColor) || activeColor
            setOptionColor($opt, newColor2)
            $opt.prop("selected", true)
            $li.attr("data-color", newColor2)
            $li.css({ background: newColor2, color: pickTextColor(newColor2) })

            for (var gk4 = 0; gk4 < groupsMap.length; gk4++) {
              var pos4 = groupsMap[gk4].indexOf(val)
              if (pos4 !== -1) groupsMap[gk4].splice(pos4, 1)
            }
            for (var addj = 0; addj < colors.length; addj++) {
              if (colorEquals(newColor2, colors[addj])) {
                if (groupsMap[addj].indexOf(val) === -1) groupsMap[addj].push(val)
                break
              }
            }
          }

          $select.data("scms-groups", groupsMap)
          syncGroupsToOptions($select, groupsMap)
          $select.trigger("change")
        })

        $select.css({ visibility: "hidden" })

        $(window).on("resize.scms", () => {
          var newW = Math.max(120, $select.outerWidth())
          $wrap.css("width", newW + "px")
          $container.css("width", newW + "px")
        })
      }

      function destroyUI() {
        if (!initialized) return

        stopObserver()

        if ($wrap) $wrap.remove()
        $wrap = $palette = $list = null
        activeColor = null
        initialized = false

        groupsMap = $select.data("scms-groups")
        syncGroupsToOptions($select, groupsMap)

        $select.css("visibility", "visible")
        $(window).off("resize.scms")
      }

      $toggleIcon.on("click", function (e) {
        e.preventDefault()
        var pressed = $(this).attr("aria-pressed") === "true"
        if (!pressed) {
          $(this).attr("aria-pressed", "true").addClass("active")
          buildUI()
        } else {
          $(this).attr("aria-pressed", "false").removeClass("active")
          destroyUI()
        }
      })

      var shouldAutoEnable =
        settings.enable ||
        ($select.attr("data-smart-color") !== undefined &&
          ($select.attr("data-smart-color") === "" || $select.attr("data-smart-color") === "true"))

      if (shouldAutoEnable) {
        $toggleIcon.attr("aria-pressed", "true").addClass("active")
        buildUI()
      }
    })
  }
})(window, window.jQuery)
