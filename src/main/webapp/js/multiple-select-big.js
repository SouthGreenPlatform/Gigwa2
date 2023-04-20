/*******************************************************************************
 * GIGWA - Genotype Investigator for Genome Wide Analyses
 * Copyright (C) 2016 - 2019, <CIRAD> <IRD>
 *
 * This program is free software: you can redistribute it and/or modify it under
 * the terms of the GNU Affero General Public License, version 3 as published by
 * the Free Software Foundation.
 *
 * This program is distributed in the hope that it will be useful, but WITHOUT
 * ANY WARRANTY; without even the implied warranty of MERCHANTABILITY or FITNESS
 * FOR A PARTICULAR PURPOSE. See the GNU Affero General Public License for more
 * details.
 *
 * See <http://www.gnu.org/licenses/agpl.html> for details about GNU General
 * Public License V3.
 *******************************************************************************/
(function ($, window, document, undefined) {

    function Selectmultiple(element, opts) {
        this.options = $.extend({}, Selectmultiple.DEFAULTS, opts);
        this.$element = $(element);
        this.init();
        this.$element.data('value', null);
        this.$element.data('count', 0);
        this.$element.data('options', this.options.data);
        this.$element.data('searchDone', false);
    }

    var pluginName = 'selectmultiple';

    // default options
    Selectmultiple.DEFAULTS = {
        data: [],
        size: 200,
        text: 'selectmultiple',
        placeholder: 'search'
    };

    // draw the html widget and load the first options.size items
    Selectmultiple.prototype = {
        init: function () {
			this.nLoadedItems = 0;
            this.$element.empty(); // clear element content
            this.optionPage = 1;
            this.page = 1;
            this.scrollAmount = 0;
            // make the multipe select fit in the parent container if no width specified 
//            this.width = (this.options.width >= this.$element.parent().width() || typeof this.options.width == 'undefined') ? this.$element.parent().width() : this.options.width;
            this.length = this.options.data.length;
            this.select = []; // array of boolean, size of data.length. Store wether an option is selected (true) or not
            for (var i = 0; i < this.length; i++) {
                this.select[i] = false;
            }
            // CREATE HTML COMPONENTS
            this.$element.addClass('btn-group');
            this.$element.addClass('show-tick');

            this.$buttonsearch = $('<button type="button" class="btn btn-default btn-xs dropdown-toggle" data-toggle="dropdown" aria-haspopup="true" aria-expanded="false">')
                    .css('width', this.width)
                    .appendTo(this.$element);

            this.$buttontext = $('<span>')
                    .text(this.options.text)
                    .appendTo(this.$buttonsearch);

            this.$buttoniconspan = $('<span class="caret"> ')
                    .css('margin-left', '10px')
                    .appendTo(this.$buttonsearch);

            this.$menu = $('<div class="dropdown-menu" >')
                    .css({'width': '100%', 'padding': '10px'})
                    .appendTo(this.$element);

            this.$row = $('<div>')
                    .appendTo(this.$menu);

            this.$buttonselectall = $('<button type="button" class="btn btn-default btn-xs btn-secondary"">')
                    .css({'width': '45%', 'overflow': 'hidden'})
                    .text('select all')
                    .appendTo(this.$row);
            this.$buttondeselectall = $('<button type="button" class="btn btn-default btn-xs btn-secondary">')
                    .css({'width': '45%', 'overflow': 'hidden', 'float': 'right'})
                    .text('deselect all')
                    .appendTo(this.$row);

            this.$input = $('<input type="text" class="input-sm form-control" >')
                    .css({'margin-top': '6px', 'width': (this.width - 30) + 'px'})
                    .prop('placeholder', this.options.placeholder)
                    .appendTo(this.$menu);

            this.$select = $('<select multiple size="15" >')
                    .css({'min-width': '100%', 'margin-top': '6px'})
                    .appendTo(this.$menu);
            if (this.length > this.options.size) {
                this.$buttonloadall = $('<button type="button" class="btn btn-default btn-xs btn-secondary">')
                        .css({'width': '100%', 'margin-top': '10px'})
                        .text('load all')
                        .appendTo(this.$menu);
                // load all the list at once 
                this.$buttonloadall.off('click').on('click', $.proxy(function () {
                    this.load(this.length);
                    this.$input.val("");
					$(this.$buttonloadall).hide();
                }, this));
            }
            // LOAD ITEMS 
            this.load(this.options.size);

            // on text input, search for options matching the text entered 
            // use str.indexOf() for the moment, should use a regex? 
            this.$input.off('change paste keyup').on('change paste keyup', $.proxy(function () {
                if (this.$input.val() === "") {
                    this.page = 1;
                    this.load(this.nLoadedItems);
                } else {
                    this.page = 1;
                    this.optionPage = 1;
                	this.$element.data('searchDone', false);
                    this.search(this.$input.val());
                }
            }, this));

            // when values are selected, refill the this.select array to store new selected options 
            this.$select.off('change').on('change', $.proxy(function () {
                var id = [];
                this.$select.children().filter(":selected").each(function (i, selected) {
                    id[i] = parseInt($(selected).prop('id'));
                });

            	var displayedItems = this.$select.children();	// we only apply changes to the displayed portion
                for (var j=0; j<=displayedItems.length-1; j++) {
                	var jId = parseInt(displayedItems[j].id);
                    this.select[jId] = id.indexOf(jId) !== -1;
                }

                var val = [];
                for (var k = 0; k < this.length; k++) {
                    if (this.select[k]) {
                        val.push(this.options.data[k]);
                    }
                }
                this.$element.data('count', val.length);
                this.$element.data('value', val.length === 0 ? null : val);
                this.$buttonsearch.trigger('multiple_select_change'); // custom event to detect when selected values changed
            }, this));

            this.$buttonselectall.off('click').on('click', $.proxy(function () {
                this.selectAll(true);
            }, this));

            this.$buttondeselectall.off('click').on('click', $.proxy(function () {
                this.selectAll(false);
            }, this));

            // when select bottom is reached after scrolling, load more items 
            // only do this if the search field is empty 
            this.$select.on('scroll', $.proxy(function () {
                if ((this.$select.scrollTop() + this.$select.innerHeight() >= this.$select[0].scrollHeight) && (this.page * this.options.size < this.length)) {
                    this.scrollAmount = this.$select.scrollTop();
                    if (this.$input.val() === "") {
                        this.appendItems();
                    } else if (!this.$element.data('searchDone')) {
                        this.optionPage++;
                        this.search(this.$input.val());
                    }
                }
            }, this));
            // when the menu is cliked, it doesn't hide
            this.$menu.click(function (event) {
                event.stopPropagation();
            });
        },
        // load the first ln items in the select 
        load: function (ln) {
            if (ln === this.length) {
                this.page = (this.length / this.options.size) + 1;
            } else {
                this.page = 1;
            }
            ln = ln > this.length ? this.length : ln;
            var html = '';
            for (var i = 0; i < ln; i++) {
                html += '<option id="' + i + '"' + (this.select[i] ? ' selected' : '') + '>' + this.options.data[i] + '</option>';
            }
			this.nLoadedItems = ln;
            this.$select.html(html);
        },
        // append options.size items to the select 
        appendItems: function () {
            var html = '';
            var start = this.page * this.options.size;
            var end = (start + this.options.size) >= this.length ? this.length : (start + this.options.size);
            for (var i = start; i < end; i++) {
                html += '<option id="' + i + '"' + (this.select[i] ? ' selected' : '') + '>' + this.options.data[i] + '</option>';
            }
			this.nLoadedItems = end;
            this.page++;
            this.$select.append(html);
            this.$select.scrollTop(this.scrollAmount);
        },
        // redraw the list to display only options matching user input 
        search: function (input) {
            var html = '';
            var size = this.optionPage * this.options.size;
            var nb_opt = 0;
            for (var i = 0; i < this.length; i++) {
                if ((this.options.data[i].toLowerCase().indexOf(input.toLowerCase()) !== -1) && (nb_opt < size)) {
                    nb_opt++;
                    html += '<option id="' + i + '"' + (this.select[i] ? ' selected' : '') + '>' + this.options.data[i] + '</option>';
                }
            }
            if (nb_opt < size)
            	this.$element.data('searchDone', true);
            this.$select.html(html);
            this.$select.scrollTop(this.scrollAmount);

			// these two avoid having the first visible item to be selected instead of the one under the mouse pointer
			$(this.$select).focus();
			$(this.$input).focus();
        },
        // select or deselect all according to bool value (select all if true) 
        selectAll: function (bool) {
            if (bool === null)
                bool = true;
            for (var i = 0; i < this.length; i++)
                this.select[i] = bool;
			if (bool)
				$(this.$buttonloadall).hide();
	        this.load(bool ? this.options.data.length : this.nLoadedItems);
            var hasChanged = this.$element.data('count') != (bool ? this.options.data.length : 0);
            this.$element.data('count', bool ? this.$select[0].length : 0);
            this.$element.data('value', bool ? this.options.data : null);
            this.$input.val("");
            this.$buttonsearch.trigger('multiple_select_change');
            if (hasChanged)
	            this.$input.trigger('change');
        },
        deselectAll: function () {
            this.selectAll(false);
        },
        // select multiple items at once 
        batchSelect: function (labelArray, alertOnIssues) {
          var selectedCount = 0, lastSelected = 0;
          for (var i=0; i<this.length; i++)
            for (var j=0; j<labelArray.length; j++) {
        	  if (this.options.data[i] == labelArray[j])
        	  {
        		  this.select[i] = true;
        		  selectedCount++;
        		  lastSelected = i;
        		  break;
        	  }
        	  else
        		  this.select[i] = false;
          }
          this.load(Math.min((lastSelected + this.options.size) - (lastSelected % this.options.size), this.length));
          this.$element.data('count', selectedCount);
          if (selectedCount != labelArray.length) {
          	var msg = (labelArray.length - selectedCount) + ' pasted entries could not be found!';
          	if (alertOnIssues)
          		alert(msg);
          	else
          		console.log(msg);
          }
          this.$element.data('value', selectedCount == labelArray.length ? labelArray : $(this.$select).find("option:selected").toArray().map(opt => opt.text));
          this.$buttonsearch.trigger('multiple_select_change');
        }
    };
    // eihter trigger a public fonction or call constructor 
    $.fn.selectmultiple = function (methodOrOptions) {
        var args = arguments;
        if (methodOrOptions === 'value') {
            return this.data('value');
        } else if (methodOrOptions === 'count') {
            return this.data('count');
        } else if (methodOrOptions === 'option') {
            return this.data('options');
        }
        return this.each(function () {
            if (typeof methodOrOptions === 'object') {
                $.data(this, 'plugin_' + pluginName, new Selectmultiple(this, methodOrOptions));
            } else if (Selectmultiple.prototype[methodOrOptions]) {
                if (typeof $.data(this, 'plugin_' + pluginName) != 'undefined') {
                    $.data(this, 'plugin_' + pluginName)[methodOrOptions].apply($.data(this, 'plugin_' + pluginName), args[1]);
                }
            } else {
                $.error('Method ' + methodOrOptions + ' does not exist on multiselect');
            }
        });
    };

})(jQuery, window, document);