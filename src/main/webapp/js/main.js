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

var maxPastableGeneIdCount = 1000, maxSelectableGeneIdCount = 5000;
var maxUploadableVariantIdCount = 1000000, maxPastableVariantIdCount = 1000, maxSelectableVariantIdCount = 10000;
var selectedVariantIDsWhenTooManyToFitInSelect = null;
var igvGenomeOptions = null;
var filtersToColumns = new Array();


function getSelectedTypes() {
    var variantTypes = $('#variantTypes').val();
    if (variantTypes === null || variantTypes.length === variantTypesCount)
        return "";
    return variantTypes.join(";");
}

function getSelectedSequences() {
    var selectedSequences = $('#Sequences').selectmultiple('value');
    if (selectedSequences === null || selectedSequences.length === seqCount)
        return "";
    return selectedSequences.join(";");
}

function getSelectedVariantIds() {
    if (selectedVariantIDsWhenTooManyToFitInSelect != null)
        return selectedVariantIDsWhenTooManyToFitInSelect.join(";");    // case when variantIdsSelect is disabled because too many variant IDs were specified

    var selectedVariantIds = $('#variantIdsSelect').val();
    if (selectedVariantIds === null || selectedVariantIds === undefined)
        return "";
    return selectedVariantIds.join(";");
}

function getGroupNames() {
	return $("input.groupName").map(function() {
	    return $(this).val();
	}).get();
}

function getDiscriminateArray() {
	var result = [];
	for (var i = 1; i <= $(".genotypeInvestigationDiv").length; i++)
		result.push($('#discriminate' + i).val() == "" ? null : parseInt($('#discriminate' + i).val()));
	return result;
}

function getSelectedGenesIds() {
    var mode = "";
    if ($('#plusMode').hasClass('active')) {
        mode = "+";
    } else if ($('#minusMode').hasClass('active')) {
        mode = "-";
    }

    if (mode !== "") {
        return mode;
    } else {
		var selectedGenesIds = $('#geneIdsSelect').val();
		if (selectedGenesIds === null || selectedGenesIds === undefined){
			return "";
		}
		else {
			return selectedGenesIds.join(",");
		}		
    }
}

function getSelectedNumberOfAlleles() {
    var selectedNbAlleles = $('#numberOfAlleles').val();
    if (selectedNbAlleles === null || selectedNbAlleles.length === alleleCount)
        return "";
    return selectedNbAlleles.join(";");
}

function getSearchMinPosition(){
    return $('#minposition').val() === "" ? -1 : parseInt($('#minposition').val());
}

function getSearchMaxPosition(){
    return $('#maxposition').val() === "" ? -1 : parseInt($('#maxposition').val());
}

// 0 = Disabled, 1 = 1 group, etc...
function getGenotypeInvestigationMode(){
    return parseInt($("#genotypeInvestigationMode").val());
}

// fill all widgets for a specific module & project
function fillWidgets() {
    loadVariantTypes();
    loadSequences();
    fillExportFormat();
    loadVariantEffects();
//    loadSearchableVcfFields();
    loadVcfFieldHeaders();
    loadIndividuals();
    loadNumberOfAlleles();
    loadGenotypePatterns();
    readPloidyLevel();
    loadVariantIds();
    loadGeneIds();
}

function loadSearchableVcfFields() {
    $.ajax({    // load searchable annotations
        url: searchableVcfFieldListURL + '/' + encodeURIComponent(getProjectId()),
        type: "GET",
        dataType: "json",
        async: false,
        contentType: "application/json;charset=utf-8",
        headers: {
            "Authorization": "Bearer " + token
        },
        success: function (jsonResult) {
            for (var i = 1; i <= $(".genotypeInvestigationDiv").length; i++)
            	if (($('#vcfFieldFilterGroup' + i).html()) == "") {
	                var htmlContents = "";
	                for (var key in jsonResult)
	                    htmlContents += '<div class="col-xl-6 input-group third-width" style="margin-left:2px; margin-top:1px; float:left;"> <span class="input-group-addon input-xs"><label for="' + jsonResult[key] + '_threshold' + i + '" class="' + jsonResult[key] + '_thresholdLabel">' + jsonResult[key] + '</label></span> <input id="' + jsonResult[key] + '_threshold' + i + '" class="form-control input-sm" type="number" step="0.1" min="0" name="' + jsonResult[key] + '_threshold' + i + '" value="0" maxlength="4" onkeypress="return isNumberKey(event);" onblur="if ($(this).val() == \'\') $(this).val(0);"></div>';
	                $('#vcfFieldFilterGroup' + i).html(htmlContents);
	                $('.vcfFieldFilters').toggle(htmlContents != "");
	            }
        },
        error: function (xhr, ajaxOptions, thrownError) {
            handleError(xhr, thrownError);
        }
    });
}

function loadVcfFieldHeaders() {
    $.ajax({
        url: vcfFieldHeadersURL + '/' + encodeURIComponent(getProjectId()),
        type: "GET",
        dataType: "json",
        async: false,
        contentType: "application/json;charset=utf-8",
        headers: {
            "Authorization": "Bearer " + token
        },
        success: function(jsonResult) {
            vcfFieldHeaders = jsonResult.annotationHeaders;
               $('#vcfFieldFilterGroup1 input').each(function() {
                   var annId = this.id.substring(0, this.id.indexOf("_"));
                   if (vcfFieldHeaders[annId] != null)
                       $("label." + annId + "_thresholdLabel").attr('title', vcfFieldHeaders[annId]);
               });
        },
        error: function(xhr, ajaxOptions, thrownError) {
            handleError(xhr, thrownError);
        }
    });
}

function resetMafWidgetsIfNecessary(nGroup) {
    var onlyBiAllelicInSelection = ($('#numberOfAlleles').children().length == 1 && $('#numberOfAlleles').children()[0].innerText == "2") || $('#numberOfAlleles').val() == 2;
    var enableMaf = onlyBiAllelicInSelection && !$("#filterIDsCheckbox").is(":checked") && ploidy <= 2 && $('#Genotypes' + nGroup).val() != null && !$('#Genotypes' + nGroup).val().startsWith("All Homozygous");
    if (!enableMaf) {
        $('#minMaf' + nGroup).val(0);
        $('#maxMaf' + nGroup).val(50);
    }
}

function updateGtPatterns() {
    for (var i = 1; i <= $(".genotypeInvestigationDiv").length; i++) {
        var selectedIndivCount = $('#Individuals' + i).selectmultiple('count');
        var option = "";
        var previousVal = $('#Genotypes' + i).val();
        var gtPatternIndex = 0;
        for (var gtPattern in gtTable) {
            if ( !(selectedIndivCount == 1 && gtPatternIndex >= 1 && gtPattern.toLowerCase().indexOf("all ") > -1) )
                option += '<option' + (previousVal == gtPattern ? ' selected' : '') + '>' + gtPattern + '</option>';
            gtPatternIndex++;
        }
        $('#Genotypes' + i).html(option).val(previousVal).selectpicker('refresh');
        $('#Genotypes' + i).change();
    }

    if ($('input[name="igvGroupsButton"]:checked').val() != null)	// otherwise we are probably removing groups
	    igvUpdateIndividuals();
}

function browsingBoxChanged()
{
    var fEnabled = $("input#browsingAndExportingEnabled").is(":checked");
    localStorage.setItem('browsingAndExportingEnabled', fEnabled ? 1 : 0);
    if (!fEnabled)
    {
        $('#resultDisplayPanel').hide();
        $('#countResultPanel').show();
        $('#navigationPanel').hide();
        if (count > 0)
            handleCountSuccess();
    }
    else if (count > 0 && $("#variantResultTable tr:gt(0)").length == 0)
        searchVariants(1, '0');
}

function checkBrowsingBoxAccordingToLocalVariable()
{
	$('input#browsingAndExportingEnabled').prop("checked", localStorage.getItem('browsingAndExportingEnabled') == 1);
}


function buildSearchQuery(searchMode, pageToken) {

    let activeGroups = $(".genotypeInvestigationDiv").length;

    let query = {
        "variantSetId": getProjectId(),
        "searchMode": searchMode,
        "getGT": false,

        "referenceName": getSelectedSequences(),
        "selectedVariantTypes": getSelectedTypes(),
        "alleleCount": getSelectedNumberOfAlleles(),
        "start": getSearchMinPosition(),
        "end": getSearchMaxPosition(),
        "variantEffect": $('#variantEffects').val() === null ? "" : $('#variantEffects').val().join(","),
        "geneName": getSelectedGenesIds(),
        "callSetIds": getSelectedIndividuals(activeGroups !== 0 ? [1] : null, true),
        "discriminate": getDiscriminateArray(),
        "groupName": getGroupNames(),
        "pageSize": 100,
        "pageToken": pageToken,
        "sortBy": sortBy,
        "sortDir": sortDesc === true ? 'desc' : 'asc',
        "selectedVariantIds": getSelectedVariantIds(),
    };

    let geno = [];
    let mostsameratio = [];
    let minmaf = [];
    let maxmaf = [];
    let minmissingdata = [];
    let maxmissingdata = [];
    let minhez = [];
    let maxhez = [];
    let callsetids = [];
    var annotationFieldThresholds = [];
    for (let i = 0; i < activeGroups; i++) {
        var threshold = {};
        $(`#vcfFieldFilterGroup${i + 1} input`).each(function() {
            if (parseInt($(this).val()) > 0)
                threshold[this.id.substring(0, this.id.lastIndexOf("_"))] = $(this).val();
        });
        if (i !== 0)
            callsetids.push(getSelectedIndividuals([i + 1], true));
        annotationFieldThresholds.push(threshold);
        geno.push($(`#Genotypes${i + 1}`).val());
        mostsameratio.push($(`#mostSameRatio${i + 1}`).val());
        minmaf.push($(`#minMaf${i + 1}`).val() === null ? 0 : parseFloat($(`#minMaf${i + 1}`).val()));
        maxmaf.push($(`#maxMaf${i + 1}`).val() === null ? 50 : parseFloat($(`#maxMaf${i + 1}`).val()));
        minmissingdata.push($(`#minMissingData${i + 1}`).val() === null ? 0 : parseFloat($(`#minMissingData${i + 1}`).val()));
        maxmissingdata.push($(`#maxMissingData${i + 1}`).val() === null ? 100 : parseFloat($(`#maxMissingData${i + 1}`).val()));
        minhez.push($(`#minHeZ${i + 1}`).val() === null ? 0 : parseFloat($(`#minHeZ${i + 1}`).val()));
        maxhez.push($(`#maxHeZ${i + 1}`).val() === null ? 100 : parseFloat($(`#maxHeZ${i + 1}`).val()));
    }

    query["gtPattern"] = geno;
    query["mostSameRatio"] = mostsameratio;
    query["minMaf"] = minmaf;
    query["maxMaf"] = maxmaf;
    query["minMissingData"] = minmissingdata;
    query["maxMissingData"] = maxmissingdata;
    query["minHeZ"] = minhez;
    query["maxHeZ"] = maxhez;
    query["annotationFieldThresholds"] = annotationFieldThresholds;
    query["additionalCallSetIds"] = callsetids;

    return query;
}


function handleCountSuccess() {
    if (!processAborted) {
        $('#rightSidePanel').show();
        $('#countResultPanel').show();
        $('#result').html(count + ' variants found').show();
        $('#progress').modal('hide');
    }
}

function handleSearchSuccess(jsonResult, pageToken) {
    var genomeBrowserURL = localStorage.getItem("genomeBrowserURL-" + referenceset);
    var gotGenomeBrowserURL = genomeBrowserURL != null && genomeBrowserURL.trim() != "";
    var content = '';
    var row;
    var headerContent = '<thead><tr style="background-color:darkgrey;"><th class="hand-cursor" id="thId">id<span id="iconId" class="glyphicon' + (sortBy == "_id" ? (" glyphicon-chevron-" + (sortDesc ? "down" : "up")) : '') + '"></span></th>' +
    ' <th class="hand-cursor" id="thSeq">sequence<span id="iconSeq" class="glyphicon' + (sortBy == seqPath ? (" glyphicon-chevron-" + (sortDesc ? "down" : "up")) : '') + '"></span></th>' +
    ' <th class="hand-cursor" id="thPos">start<span id="iconPos" class="glyphicon' + (sortBy == posPath ? (" glyphicon-chevron-" + (sortDesc ? "down" : "up")) : '') + '"></span></th>' +
    '<th>stop</th><th>alleles</th>';
    if (isAnnotated)
        headerContent += '<th>effect</th><th>gene</th>';
    if (gotGenomeBrowserURL)
        headerContent += "<th></th>";
    headerContent += '</tr></thead>';
    for (var variant in jsonResult.variants) {
        var allele = '';
        var knownAlleles = jsonResult.variants[variant].alternateBases;
        if (knownAlleles.length > 0 || jsonResult.variants[variant].referenceBases != "")	// the DTO used here requires a reference allele to be provided: the chosen convention is to provide a single allele coded as an empty string when no allele is known for a variant
        	knownAlleles.unshift(jsonResult.variants[variant].referenceBases);
        for (var all in jsonResult.variants[variant].alternateBases) {
            allele += '<div class="allele">' + (jsonResult.variants[variant].alternateBases[all] == "" ? "&nbsp;" : jsonResult.variants[variant].alternateBases[all]) + '</div>';
        }
        var effect = '';
        for (var eff in jsonResult.variants[variant].info["EFF_nm"]) {
            effect += jsonResult.variants[variant].info["EFF_nm"][eff] + '</br>';
        }
        var geneName = '';
        for (var gene in jsonResult.variants[variant].info["EFF_ge"]) {
            geneName += jsonResult.variants[variant].info["EFF_ge"][gene] + '</br>';
        }
        var id = splitId(jsonResult.variants[variant].id, 2);
        if (idLooksGenerated(id))
            id = "";
        row = '<tr class="clickable-row" data-id="' + jsonResult.variants[variant].id + '">' +
            '<td>' + id + '</td>' +
            '<td>' + jsonResult.variants[variant].referenceName + '</td>' +
            '<td>' + jsonResult.variants[variant].start + '</td>' +
            '<td>' + jsonResult.variants[variant].end + '</td>' +
            '<td>' + allele + '</td>';

        if (isAnnotated)
            row += '<td>' + effect + '</td><td>' + geneName + '</td>';

           var genomeBrowserLink = !gotGenomeBrowserURL ? "" : "<a href=\"javascript:viewGeneInGenomeBrowser('" + jsonResult.variants[variant].referenceName + ":" + jsonResult.variants[variant].start + ".." + (jsonResult.variants[variant].end == "" ? jsonResult.variants[variant].start : jsonResult.variants[variant].start) + "');\" title='Click to browse genome'><img src='images/icon_genome_browser.gif'></a>";
           row += "<td style='border:none; text-align:right;' nowrap>" + genomeBrowserLink + "</td>";

        content += row + "</tr>";
    }
    if (!processAborted) {
        if (typeof jsonResult.count !== 'undefined') {
            count = jsonResult.count;
        }
        if (((parseInt(pageToken) + 1) * 100) <= count) {
            $('#next').prop('disabled', false);
        } else {
            $('#next').prop('disabled', true);
        }
        if (currentPageToken === '0') {
            if (count === 0) {
                $('#currentPage').html("no results");
                $('#next').prop('disabled', true);
                $('#showCharts').hide();
                $('#showIGV').hide();
                $('#exportBoxToggleButton').hide();
            } else {
                if (count < 100) {
                    $('#currentPage').html("1 - " + count + " / " + count);
                    $('#next').prop('disabled', true);
                } else {
                    $('#currentPage').html("1 - 100 / " + count);
                }
            }
        }
        $('#variantTable').html(headerContent + '<tbody class="hand-cursor" >' + content + '</tbody>');
        $('#rightSidePanel').show();
        $('#countResultPanel').hide();
        $('#resultDisplayPanel').show();
        $('#progress').modal('hide');
        $('#navigationPanel').show();
        $(".clickable-row td").click(function() {
            variantId = $(this).parent().data("id");
            $(this).parent().addClass('bg-info').siblings().removeClass('bg-info');
            
            if ($(this).index() < $(this).parent().find("td").length - 1)    // the last column is reserved for extra functionalities
                loadVariantAnnotationData();
        });
        
        if (igvBrowser) igvUpdateVariants();
    }
}

function toggleExportPanel() {
//    updateExportToServerCheckBox();
    $('#exportPanel').toggle();
}

function updateExportToServerCheckBox() {
    if (!$('#keepExportOnServ').is(':visible'))
    {
        var forbidDirectDownload =  indOpt.length*count > 1000000000;
        if (!forbidDirectDownload)
            $('#keepExportOnServ').attr("disabled", false);

        if ($('#keepExportOnServ').prop("checked") != forbidDirectDownload)
            $('#keepExportOnServ').click();
    
        if (forbidDirectDownload)
            $('#keepExportOnServ').attr("disabled", true);
        $('#keepExportOnServ').attr("title", "If ticked, generates a file URL instead of initiating a direct download." + (forbidDirectDownload ? " The matrix you are about to export contains more than 1 billion genotypes and may not be downloaded directly (would last too long)." : ""));
    }
}

function viewGeneInGenomeBrowser(variantPos) {
    if ($("input#genomeBrowserURL").val() != "") {
        $('#genomeBrowserFrame').css('height', parseInt($(window).height()*0.88 - 20) + "px");
        $("#genomeBrowserPanel").modal({
            opacity: 80,
            overlayCss: {
                backgroundColor: "#111111"
            }
        });

        let url = $("input#genomeBrowserURL").val().replace(/\*/g, variantPos);
        $('#genomeBrowserPanelHeader').html('<center><a href="' + url + '" target="_blank" onclick="$(\'#genomeBrowserPanel\').modal(\'hide\');">Click here to open genome browser in a different window</a></center>');
        $("#genomeBrowserFrame").attr('src', $("input#genomeBrowserURL").val().replace(/\*/g, variantPos));
    }
}

function applyGenomeBrowserURL() {
    if ($("input#genomeBrowserURL").val() == "")
        $("input#genomeBrowserURL").val(defaultGenomeBrowserURL);

    localStorage.setItem("genomeBrowserURL-" + referenceset, $("input#genomeBrowserURL").val());
    $("div#genomeBrowserConfigDiv").modal("hide");
}

function markInconsistentGenotypesAsMissing() {
	var multiSampleIndividuals = new Set();
	var displayedIndividuals = new Set();
	$('table.genotypeTable tr th:first-child').map(function() {
	    var indName = $(this).text();
	    if (indName != "Individual") {
		    if (displayedIndividuals.has(indName))
		    	multiSampleIndividuals.add(indName);
		    displayedIndividuals.add(indName);
		}
	});
	
	if (multiSampleIndividuals.size == 0)
		return; // no multi-sample individuals displayed

	multiSampleIndividuals.forEach(function(ind) {
		let rowsToConsider = $("table.genotypeTable tr.ind_" + ind.replaceAll(" ", "_")).filter(function() { return $(this).find('td.missingData').length == 0; });
		var indGTs = rowsToConsider.map(function() {
			return $(this).find("td:eq(0)").text();
		}).get();

		if (indGTs.size < 2)
			return;

		var correctIndGT = mostFrequentString(indGTs);
		rowsToConsider.each(function() {
			var gtCell = $(this).find("td:eq(0)");
			if (gtCell.text() != "" && gtCell.text() != correctIndGT) {
	            gtCell.addClass("missingData");
			}
		});
    });
}

const mostFrequentString = strings => {
  const validStrings = strings.filter(str => str.trim() !== '');

  if (validStrings.length === 0)
    return '';

  const stringCount = {};
  let mostRepresented = null, maxCount = 0, multipleMaxCount = false;

  validStrings.forEach(str => {
    stringCount[str] = (stringCount[str] || 0) + 1;
    if (stringCount[str] > maxCount) {
      mostRepresented = str;
      maxCount = stringCount[str];
      multipleMaxCount = false;
    } else if (stringCount[str] === maxCount)
      multipleMaxCount = true;
  });

  return multipleMaxCount ? null : mostRepresented;
};


function getSelectedIndividuals(groupNumber, provideGa4ghId) {
    const selectedIndividuals = new Set();
    const groups = groupNumber == null ? Array.from({ length: $(".genotypeInvestigationDiv").length }, (_, index) => index + 1) : groupNumber;
    const ga4ghId = getProjectId() + idSep;
    for (let groupKey in groups) {
        const groupIndex = groups[groupKey];
        let groupIndividuals = $('#Individuals' + groupIndex).selectmultiple('value');
        if (groupIndividuals == null)
            groupIndividuals = $('#Individuals' + groupIndex).selectmultiple('option');
        // All individuals are selected in a single group, no need to look further
        if (groupIndividuals.length ===  indOpt.length)
            return [];

        for (let indKey in groupIndividuals)
            selectedIndividuals.add((provideGa4ghId ? ga4ghId : "") + groupIndividuals[indKey]);
    }
    return selectedIndividuals.size ===  indOpt.length ? [] : Array.from(selectedIndividuals);
}


function getAnnotationThresholds(individual, groupIndArrays)
{
    let result = {};
    for (let i=0; i<groupIndArrays.length; i++) {
		let inGroup = groupIndArrays[i].length == 0 || groupIndArrays[i].includes(individual);
		if (inGroup)
			$('#vcfFieldFilterGroup' + (i+1) + ' input').each(function() {
				var value = $(this).val();
				if (value != "0") {
					let annotation = this.id.substring(0, this.id.lastIndexOf("_"));
					result[annotation] = result[annotation] != null ? Math.max(result[annotation], parseFloat(value)) : parseFloat(value);
				}
			});
	}
    return result;
}

// pagination mechanism
function iteratePages(next) {
    var pageToken;
    var current = parseInt(currentPageToken);
    if (next) {
        pageToken = current + 1;
    } else {
        pageToken = current - 1;
    }
    var start = (pageToken * 100) + 1;
    var end = (start + 100) <= count ? (start + 99) : count;
    $('#currentPage').html(start + " - " + end + " / " + count);
    searchVariants(2, pageToken.toString());
}

function groupNameChanged(n) {
    let name = $("input#group" + n).val().trim().replaceAll(" ", "_");
    $("input#group" + n).val($("input.groupName").filter(function() {
        return $(this).val() === name;
    }).length > 1 || name == "" ? "Group" + n : name);

	let newName = $("input#group" + n).val();
	for (var i = 1; i <= getGenotypeInvestigationMode(); i++)
   	   if (i != n) {
		   $('#discriminate' + i + ` option[value='${n}']`).text(newName).attr('title', newName);
		   $('#discriminate' + i).selectpicker('refresh');

		   $("#igvGroupsMenu li input[value=group" + n + "]").parent().find("span").text(newName);
		}
}

function setGenotypeInvestigationMode(mode) {
    var container = $("#searchDiv");
    var childContainer = container.children().first();

    // Compter le nombre d'éléments enfants actuels dans childContainer
    var elements = $(".genotypeInvestigationDiv");
    var count = elements.length;

    var multipleSelectOpts = {
        text: 'Individuals',
        data: indOpt,
        placeholder: 'Lookup'
    }
    
	$("#igvGroupsMenu ul").html('<li id="igvGroupsNone"><a href="#"><label><input checked type="radio" name="igvGroupsButton" value="none" onchange="igvSelectGroup();" /> None</label></a></li>');
    if (mode == 0) {
	    $("#igvGroupsMenu ul").append('<li id="igvGroupsAll"><a href="#"><label><input type="radio" name="igvGroupsButton" value="all" onchange="igvSelectGroup();"/> All individuals '+ (indOpt.length > 500 ? '(may be slow!)' : '') + '</label></a></li>');
	    igvUpdateVariants();
	}
    else if (mode > 1) {
    	$("#igvGroupsMenu ul").append('<li id="igvGroupsSelected"><a href="#"><label><input type="radio" name="igvGroupsButton" value="selected" onchange="igvSelectGroup();" /> All selected individuals</label></a></li>');
    	$("#igvGroupsMenu ul").append('<li id="igvGroupsSeparate"><a href="#"><label><input type="radio" name="igvGroupsButton" value="separate" onChange="igvSelectGroup();"/> All groups</label></a></li>');
    }

    if (mode < count) {	// remove unwanted groups
    	let toDitch = elements.slice(mode);
		for (let i=0; i<toDitch.length; i++) {
			$(toDitch[i]).find("form button.glyphicon-floppy-save").removeClass('active');
			applyGroupMemorizing(parseInt(toDitch[i].id.replace("genotypeInvestigationDiv", "")));
			toDitch[i].remove();
		}
    }

    for (var i = 1; i <= mode; i++) {
		if (i >= count + 1) {
            var htmlContent = `<div class="row genotypeInvestigationDiv" id="genotypeInvestigationDiv${i}" style="display:none;"><input type="text" class="groupName" onchange="groupNameChanged(${i});" onfocus="select();" title="You may give a name to this group" maxlength="12" style="border:1px solid lightgrey; text-align:center; float:right; height:17px; margin:6px 2px 1px 2px; padding:0 1px; width:85px; font-weight:bold;" id="group${i}" value="Group${i}"></input><div class="panel panel-default group${i} shadowed-panel"><div class="panel-body"><form class="form" role="form"><div class="custom-label" id="individualsLabel${i}">Individuals <span style="font-weight:normal;"></span></div><div id="Individuals${i}" class="indListBox"></div><div style="margin-top:-25px; text-align:right;"><button type="button" class="btn btn-default btn-xs glyphicon glyphicon-floppy-save" data-toggle="button" aria-pressed="false" id="groupMemorizer${i}" onclick="setTimeout('applyGroupMemorizing(${i});', 100);"></button><button type="button" class="btn btn-default btn-xs glyphicon glyphicon-search hidden" title="Filter using metadata" id="groupSelector${i}" onclick="selectGroupUsingMetadata(${i});"></button><button type="button" class="btn btn-default btn-xs glyphicon glyphicon-copy" title="Copy current selection to clipboard" onclick="copyIndividuals(${i}); var infoDiv=$('<div style=\\'margin-top:-40px; right:55px; position:absolute;\\'>Copied!</div>'); $(this).before(infoDiv); setTimeout(function() {infoDiv.remove();}, 1200);"></button><button type="button" class="btn btn-default btn-xs glyphicon glyphicon-paste" aria-pressed="false" title="Paste filtered list from clipboard" id="pasteIndividuals${i}" onclick="toggleIndividualPasteBox(${i});"></button></div><div class="col margin-top-md vcfFieldFilters"><label class="custom-label">Minimum per-sample...</label><br/><div class="container-fluid"><div class="row" id="vcfFieldFilterGroup${i}"></div></div><small class="text-muted">(other data seen as missing)</small></div><div class="margin-top-md"><div class="container-fluid"><div class="row" style="padding-bottom:5px;"><div class="col-md-4" style="padding:0;"><div class="input-group"><input name="minMissingData${i}" value="0" id="minMissingData${i}" class="form-control input-sm" type="number" step="0.1" maxlength="2" min="0" max="100" onblur="rangeChanged('MissingData', ${i}, 0, 100);"><span class="input-group-addon input-sm">&le;</span></div></div><div class="col-md-4" style="text-align:center; padding:7px 2px; margin-top:-3px;"><label class="custom-label">Missing %</label></div><div class="col-md-4" style="padding:0;"><div class="input-group"><span class="input-group-addon input-sm">&le;</span><input name="maxMissingData${i}" value="100" id="maxMissingData${i}" class="form-control input-sm" type="number" step="0.1" maxlength="2" min="0" max="100" onblur="rangeChanged('MissingData', ${i}, 0, 100);"></div></div></div></div></div><div class="mafZone"><div class="container-fluid"><div class="row" style="padding-bottom:5px;"><div class="col-md-4" style="padding:0;"><div class="input-group"><input name="minMaf${i}" value="0" id="minMaf${i}" class="form-control input-sm" type="number" step="0.1" maxlength="2" min="0" max="50" onblur="rangeChanged('Maf', ${i}, 0, 50);"><span class="input-group-addon input-sm">&le;</span></div></div><div class="col-md-4" style="text-align:center; display:flex; flex-direction:column; padding:0 2px; margin-top:-1px;"><label class="custom-label">MAF %</label><small style="margin-top: -5px;" >(for bi-allelic)</small></div><div class="col-md-4" style="padding:0;"><div class="input-group"><span class="input-group-addon input-sm">&le;</span><input name="maxMaf${i}" value="50" id="maxMaf${i}" class="form-control input-sm" type="number" step="0.1" maxlength="2" min="0" max="50" onblur="rangeChanged('Maf', ${i}, 0, 50);"></div></div></div></div></div><div><div class="container-fluid"><div class="row" style="padding-bottom:5px;"><div class="col-md-4" style="padding:0;"><div class="input-group"><input name="minHeZ${i}" value="0" id="minHeZ${i}" class="form-control input-sm" type="number" step="0.1" maxlength="2" min="0" max="100" onblur="rangeChanged('HeZ', ${i}, 0, 100);"><span class="input-group-addon input-sm">&le;</span></div></div><div class="col-md-4" style="text-align:center; padding:7px 2px;"><label class="custom-label">HeteroZ %</label></div><div class="col-md-4" style="padding:0;"><div class="input-group"><span class="input-group-addon input-sm">&le;</span><input name="maxHeZ${i}" value="100" id="maxHeZ${i}" class="form-control input-sm" type="number" step="0.1" maxlength="2" min="0" max="100" onblur="rangeChanged('HeZ', ${i}, 0, 100);"></div></div></div></div></div><div class="margin-top-md"><div id="mostSameRatioSpan${i}" style="position:absolute; right:10px; margin-top:-2px;">&nbsp;Similarity ratio <input id="mostSameRatio${i}" class="input-xs" style="width:35px;" value="100" maxlength="3" onkeypress="return isNumberKey(event);" onblur="if ($(this).val().trim() == '' || isNaN($(this).val()) || $(this).val() > 100) $(this).val(100);">%</div><label for="Genotypes${i}" class="custom-label">Genotype patterns</label>&nbsp;<br/><span class="glyphicon glyphicon-question-sign" id="genotypeHelp${i}"  style="cursor:pointer; cursor:hand; float:right; margin-top:7px;"></span><select class="selectpicker gtPatterns" id="Genotypes${i}" data-actions-box="true" data-width="calc(100% - 20px)" data-live-search="true" name="Genotypes${i}"></select></div><div class="margin-top-md row discriminationDiv"><div class="margin-top-md col-md-6" style="white-space:nowrap; text-align:right;"><span class="glyphicon glyphicon-question-sign" id="genotypeDiscriminateHelp" style="cursor:pointer; cursor:hand;" title="Select another group here to limit search to variants for which the major genotype differs between both groups.\n\nTotal discrimination can be achieved by selecting pattern 'All or mostly the same' with Similarity ratio at 100% in both groups."></span>&nbsp;<b>Discriminate with</b></div><div class="col-md-5" style="text-align:left; width:92px;"><select class="selectpicker" id="discriminate${i}" data-width="100%" name="discriminate${i}" onchange="checkGroupOverlap(${i});"></select></div><div class="col-md-1 group${i}" id="overlapWarning${i}" hidden style="position:absolute; font-weight:bold; padding:5px; border-radius:3px; z-index:2; border:1px solid black; right:-90px; width:80px; cursor:pointer; cursor:hand; color:black;" title="Some individuals are selected in both groups">Overlap&nbsp;<img align="left" src="images/warning.png" height="15" width="18"/></div></div></form></div></div></div>`;
            childContainer.append(htmlContent);
            $('#discriminate' + i).selectpicker();

            if (gotMetaData)
                $("button#groupSelector" + i).removeClass("hidden");
            else {
                $("button#groupSelector" + i).addClass("hidden");
                $("table#loadIndividualsindividualFilteringTable").html("");
            }

            if (individualSubSet != null)
                multipleSelectOpts['size'] = individualSubSet.length;

            var individualsElement = $('#Individuals' + i);
            individualsElement.selectmultiple(multipleSelectOpts);
            individualsElement.on('change', function (e) {
				var groupNumber = this.id.replace("Individuals", "");
                applyGroupMemorizing(groupNumber);
				checkGroupOverlap(groupNumber);
            });

            $('#individualsLabel' + i + " span").html(indOpt.length + "/" +  indOpt.length);

            var individualsLabelElement = $('#individualsLabel' + i);
            individualsLabelElement.show();
            individualsElement.show();
            individualsElement.next().show();

            $("#genotypeInvestigationMode").prop('disabled', false);

	        $('select#Genotypes' + i).on('change', function () {
	            var id = this.id.replace("Genotypes", "");
	            $('span#genotypeHelp' + id).attr('title', gtTable[$('#Genotypes' + id).val()]);
	            var fMostSameSelected = $('#Genotypes' + id).val().indexOf("ostly the same") != -1;
	            $('#mostSameRatioSpan' + id).toggle(fMostSameSelected);
	            resetMafWidgetsIfNecessary(id);
	        });
	        
	        $("#genotypeInvestigationDiv" + i).show(300);
        }
        $("#igvGroupsMenu ul").append('<li id="igvGroups' + i + '"><a href="#"><label><input type="radio" name="igvGroupsButton" value="group' + i + '" onchange="igvSelectGroup();" /> <span>Group ' + i + '</span></label></a></li>');
    }
    
    $('#igvGroupsMenu ul li:first input').prop("checked", true);
    
    if (mode > count) {
        $('.indListBox').on('multiple_select_change', function () {
            var i = this.id.replace("Individuals", "");
            var nCount = $('#Individuals' + i).selectmultiple('count');
            $('#individualsLabel' + i + " span").html((nCount == 0 ?  indOpt.length : nCount) + "/" +  indOpt.length);
            updateGtPatterns();
        });
	}
	
	if (mode > 0) {
	    updateGtPatterns();
	    loadGenotypePatterns();
    }

   for (var i = 1; i <= mode; i++) {
	   var previousVal = $('#discriminate' + i).val();
		$('#discriminate' + i).html("<option value=''>(none)</option>");
    	for (var j = 1; j <= mode; j++)
			if (j != i)
				$('#discriminate' + i).append("<option value='" + j + "' title='" + $("input#group" + j).val() + "'>" + $("input#group" + j).val() + "</option>");
	
		$('#discriminate' + i).selectpicker('val', previousVal).selectpicker('refresh');
		if ($('#discriminate' + i).val() == '')
			$('#overlapWarning' + i).hide();
	}
	  	
    if (mode <= 1)
        $('.discriminationDiv').hide(300);
    else
        $('.discriminationDiv').show(300);


    loadSearchableVcfFields();
    $('#exportedIndividuals').html(getExportIndividualSelectionModeOptions(mode));
    $('#exportedIndividuals').parent().parent().find('div.individualSelectionDiv').remove();
    $('#exportedIndividuals').selectpicker('refresh');
}

function getExportIndividualSelectionModeOptions(mode) {
    var exportedIndOptions = "";
    if (mode > 1)
        exportedIndOptions += '<option id="exportedIndividualsAllGroups" value="allGroups">All groups</option>';
    for (var i = 1; i <= mode; i++)
        exportedIndOptions += `<option id="exportedIndividuals${i}" value="${i}">Group ${i}</option>`;
    exportedIndOptions += '<option id="exportedIndividualsAll" value="">All of them</option>';
    exportedIndOptions += '<option id="exportedIndividualsChoose" value="choose">Choose some</option>';
    return exportedIndOptions;
}

function applyGroupMemorizing(groupNumber, rememberedSelection) {
    var variableName = "groupMemorizer" + groupNumber + "::" + $('#module').val() + "::" + $('#project').val();
    var groupMemorizer = $("button#groupMemorizer" + groupNumber);
    var active = groupMemorizer.hasClass('active');
    if (active) {
        if (rememberedSelection != null)
            $('#Individuals' + groupNumber).selectmultiple('batchSelect', [rememberedSelection, false]);
        else
            localStorage.setItem(variableName, JSON.stringify(getSelectedIndividuals([groupNumber])));
    }
    else
        localStorage.removeItem(variableName);
    groupMemorizer.attr("title", "Memorize selection in browser: " + (active ? "ON" : "OFF"));
}

function toggleIndividualSelector(previousSibling, flag, size, onchangeFunc) {
    if (flag)
    {
        var allIndOptions = new StringBuffer();
        for (var key in indOpt)
            allIndOptions.append("<option title=\"" + indOpt[key] + "\">" + indOpt[key] + "</option>");
        previousSibling.after("<div style='display:none; margin-top:5px;' class='individualSelectionDiv'><select " + (onchangeFunc != null ? "onchange='" + onchangeFunc + "();' " : "") + " style='width:100%;' multiple size='15' class='individualSelector'>" + allIndOptions + "</select></div>");
        if (!isNaN(size))
            previousSibling.parent().find('select.individualSelector').attr("size", size);
        previousSibling.parent().find('div.individualSelectionDiv').show(200);
    }
    else
        previousSibling.parent().find('div.individualSelectionDiv').hide(200, function() { previousSibling.parent().find('div.individualSelectionDiv').remove() });
}

function updateFilteredIndividualCount()
{
    $("span#filteredIndCount").html($("table#individualFilteringTable tr:gt(0):not([style*='display: none'])").length);
}

function addSelectionDropDownsToHeaders(tableObj)
{
    if (tableObj.rows.length < 1)
        return;

    $.ajax({
        url: distinctIndividualMetadata + '/' + referenceset + "?projID=" + document.getElementById('project').options[document.getElementById('project').options.selectedIndex].dataset.id.split(idSep)[1],
        type: "POST",
        data : "{}",
        contentType: "application/json;charset=utf-8",
        headers: buildHeader(token, $('#assembly').val()),
        success: function (jsonResult) {
            columnCount = tableObj.rows[0].cells.length;
            let colsToIgnore = [];
            for (c=2; c<columnCount; c++) {
                distinctValuesForColumn = jsonResult[tableObj.rows[0].cells[c].innerText];
                if (distinctValuesForColumn.length <= 1) {
					colsToIgnore.push(c - 1 - colsToIgnore.length);
					console.log("Ignoring metadata field filter because it contains less than 2 values: " + tableObj.rows[0].cells[c].innerText);
	            }

                distinctValuesForColumn.sort();

                dropDown = document.createElement("select");
                dropDown.multiple = 'multiple';
                dropDown.className = "selectpicker btn-sm";
                $(dropDown).attr('data-actions-box', "true");
                $(dropDown).attr('data-none-selected-text', "Any");
                $(dropDown).attr('data-select-all-text', "All");
                $(dropDown).attr('data-deselect-all-text', "None");
                $(dropDown).attr('data-selected-text-format', "count>2");
                $(dropDown).attr('data-count-selected-text', "{0} out of {1}");
                $(dropDown).on('change', function () {
                    applyDropDownFiltersToTable(document.getElementById(tableObj.id));
                });
                for (i = 0; i < distinctValuesForColumn.length; i++)
                    dropDown.options[dropDown.length] = new Option(distinctValuesForColumn[i], distinctValuesForColumn[i]);

                tableObj.rows[0].cells[c].appendChild(dropDown);
                filtersToColumns[c] = dropDown;
            }
            
			var ifTable = $("table#individualFilteringTable");
			colsToIgnore.forEach(function (c) {
		        ifTable.find("tr:eq(0) th:eq(" + c + ")").remove();
		    });

            $(tableObj).find("th select.selectpicker").selectpicker();
        }
    });
}

function applyDropDownFiltersToTable(tableObj, reset)
{
    if (tableObj.rows.length < 1)
        return;

    var headers = [];
    var filters = {};
    for (var i = 2; i < tableObj.rows[0].cells.length; i++) {
        var selectElement = tableObj.rows[0].cells[i].querySelector('select');
        var columnName = tableObj.rows[0].cells[i].innerHTML.split('<')[0]
        headers.push(columnName);
        var values = [];
        if (!reset) {	// if resetting we ingore filter contents because dropdowns are being reset synchronouusly
	        var selectedOptions = selectElement.selectedOptions;
        	for (var j = 0; j < selectedOptions.length; j++)
	            values.push(selectedOptions[j].value);
	    }
        filters[columnName] = values;
    }
    
	let ifTable = $("table#individualFilteringTable");
	ifTable.find("tr:gt(0)").remove();
	ifTable.append("<tr><th style='padding:50px; background-color:#eeeeee;' colspan='" + (1 + ifTable.find("tr:eq(0)").children().length) + "'>Loading...<br/><br/><img src='images/progress.gif' /></th></tr>");
	
    $.ajax({
        url: filterIndividualMetadata + '/' + referenceset + "?projID=" + document.getElementById('project').options[document.getElementById('project').options.selectedIndex].dataset.id.split(idSep)[1],
        type: "POST",
        contentType: "application/json;charset=utf-8",
        headers: buildHeader(token, $('#assembly').val()),
        data: JSON.stringify(filters),
        success: function (jsonResult) {
            var dataRows = new StringBuffer();
            for (var ind in jsonResult) {
                dataRows.append("<tr><td><div style='margin-right:5px;' title='Remove from selection' class='close' onclick='$(this).parent().parent().hide(); updateFilteredIndividualCount();'>x</div></td><td><span class='bold'>" + jsonResult[ind].id + "</span></td>");
                for (var i in headers) {
                    var value = jsonResult[ind].additionalInfo[headers[i]];
                    dataRows.append("<td>" + value + "</td>");
                }
                dataRows.append("</tr>");
            }
            $("table#individualFilteringTable tr:eq(1)").replaceWith(dataRows.toString());
            updateFilteredIndividualCount();
        }
    });
}

function resetDropDownFilterTable(tableObj)
{
	setTimeout(function() {
	    $(tableObj).find("th select.selectpicker").each(function() {
	        $(this).val([]);
	        $(this).selectpicker('refresh');
	    });
	}, 1);

    applyDropDownFiltersToTable(tableObj, true);
}

function selectGroupUsingMetadata(groupNumber) {
	if ($("input#resetMetadataFiltersOnDialogShown").prop('checked'))
		resetDropDownFilterTable(document.getElementById('individualFilteringTable'));

    $("span#filteredGroupNumber").html(groupNumber);
    $("table#individualFilteringTable tr:eq(0)").attr("class", "group" + groupNumber);
    $("#individualFiltering").modal({
        opacity: 80,
        overlayCss: {
            backgroundColor: "#111111"
        }
    });
}

function copyIndividuals(groupNumber) {
    var selectedIndividuals = getSelectedIndividuals([groupNumber]);
    copyToClipboard((selectedIndividuals != "" ? selectedIndividuals : $('#Individuals1').selectmultiple('option')).join("\n"));
}

function copyVariants() {
    var selectedVariantIds = $('#variantIdsSelect').val();
    copyToClipboard((selectedVariantIds != "" ? selectedVariantIds : $('#variantIdsSelect').selectmultiple('option')).join("\n"));
}

function copyToClipboard(text){
    var textarea = document.createElement('textarea');
    document.body.appendChild(textarea);
    textarea.value = text;
    textarea.select();
    document.execCommand('copy', false);
    textarea.remove();
}

function toggleIndividualPasteBox(groupNumber) {
    var otherGroupNumber = groupNumber == 1 ? 2 : 1;
    var previousSibling = $("button#pasteIndividuals" + groupNumber).prev();
    if (previousSibling.html() == "")
    {
        var otherGroupBox = $("button#pasteIndividuals" + otherGroupNumber).prev();
        if (otherGroupBox.html() != "")
            $("button#pasteIndividuals" + otherGroupNumber).click();

        var pasteBoxHtml = '<div class="panel shadowed-panel group' + groupNumber + '" style="text-align:left; position:absolute; border:1px solid white; left:105px; margin-top:-45px; padding:5px; z-index:200;" id="individualPastePanel' + groupNumber + '">Please paste your individual selection (one per line) in the box below:<textarea id="pastedIndividuals1" style="width:100%;" rows="15"></textarea><input type="button" style="float:right;" class="btn btn-primary btn-sm" onclick="onPasteIndividuals(' + groupNumber + ', $(this).prev());" value="Apply" /><input type="button" class="btn btn-primary btn-sm" onclick="$(this).parent().remove();" value="Cancel" /></div>';
        $("button#pasteIndividuals" + groupNumber).before(pasteBoxHtml);
    }
    else
        previousSibling.remove();
}

function onPasteIndividuals(groupNumber, textarea) {
    var cleanSelectionArray = [];
    $("#variantIdsSelect").html("");
    textarea.val().split("\n").map(id => id.trim()).filter(id => id.length > 0).forEach(function (ind) {
        cleanSelectionArray.push(ind);
    });
    $('#Individuals' + groupNumber).selectmultiple('batchSelect', [cleanSelectionArray, true]);
    applyGroupMemorizing(groupNumber);
	checkGroupOverlap(groupNumber);
    $("button#pasteIndividuals" + groupNumber).click();
}

function toggleGenesPasteBox() {
    var genesIdsPastePanel = $("div#genesIdsPastePanel");
    if (genesIdsPastePanel.get().length == 0)
    {
        var pasteBoxHtml = '<div class="panel shadowed-panel panel-grey" style="text-align:left; position:absolute; border:1px solid white; left:105px; margin-top:-45px; padding:5px; z-index:200;" id="genesIdsPastePanel">Please paste up to ' + maxPastableGeneIdCount + ' gene IDs (one per line) in the box below:<textarea id="pasteAreaGeneIds" style="width:100%;" rows="15"></textarea><input type="button" style="float:right;" class="btn btn-primary btn-sm" onclick="onProvideGeneIds($(this).prev().val(), maxPastableGeneIdCount);" value="Apply" /><input type="button" class="btn btn-primary btn-sm" onclick="$(this).parent().remove();" value="Cancel" /></div>';
        $("button#pasteGeneIds").before(pasteBoxHtml);
    }
    else
        genesIdsPastePanel.remove();
}

function toggleVariantsPasteBox() {
    var variantsIdsPastePanel = $("div#variantsIdsPastePanel");
    if (variantsIdsPastePanel.get().length == 0)
    {
        var pasteBoxHtml = '<div class="panel shadowed-panel panel-grey" style="text-align:left; position:absolute; border:1px solid white; left:105px; margin-top:-45px; padding:5px; z-index:200;" id="variantsIdsPastePanel">Please paste up to ' + maxPastableVariantIdCount + ' variant IDs (one per line) in the box below:<textarea id="pasteAreaVariantIds" style="width:100%;" rows="15"></textarea><input type="button" style="float:right;" class="btn btn-primary btn-sm" onclick="onProvideVariantIds($(this).prev().val(), maxPastableVariantIdCount);" value="Apply" /><input type="button" class="btn btn-primary btn-sm" onclick="$(this).parent().remove();" value="Cancel" /></div>';
        $("button#pasteVariantIds").before(pasteBoxHtml);
    }
    else
        variantsIdsPastePanel.remove();
}

function onProvideGeneIds(geneIdLines, maxAllowedItems) {
    $("#geneIdsSelect").html("");
    var idArray = geneIdLines.split("\n").map(id => id.trim()).filter(id => id.length > 0);
    if (idArray.length > maxAllowedItems) {
        alert("You may not provide more than " + maxAllowedItems + " gene IDs!  (" + idArray.length + " provided)");
        return;
    }

    var selectTitle;
    var spanText;

    var optionSB = new StringBuffer();
    if (idArray.length > maxSelectableGeneIdCount) {    // we can't handle selects with too many items
        selectedGeneIDsWhenTooManyToFitInSelect = idArray;
        spanText = idArray.length + " selected";
        selectTitle = "too many IDs for manual selection";
        $('#geneIdsSelect').val(null).prop('disabled', true);
        $('#copyGeneIds').hide();
        $('#clearGeneIdSelection').css('display', 'inline');
    }
    else {
        selectedGeneIDsWhenTooManyToFitInSelect = null;
        selectTitle = "Select to enter IDs";
        $('#geneIdsSelect').removeAttr('disabled').selectpicker('refresh');
        idArray.forEach(function (varId) {
            optionSB.append('<option selected value="'+varId+'">'+varId+'</option>');
        });
        $('#copyGeneIds').show();
        $('#clearGeneIdSelection').hide();
    }

    $("#geneIdsSelect").append(optionSB.toString());
    if (idArray.length > maxSelectableGeneIdCount)
        $('#geneIdsSelect').trigger('change');
    $('button[data-id="geneIdsSelect"]').prop("title", selectTitle);
    $('button[data-id="geneIdsSelect"] span.filter-option').html(spanText);
    $("#geneIdsSelect").prop("title", selectTitle);
    if (idArray.length <= maxSelectableGeneIdCount)
        $('#geneIdsSelect').trigger('change');

    $("div#genesIdsPastePanel").remove();
	onGeneSelectionEditMode();
}

function onProvideVariantIds(variantIdLines, maxAllowedItems) {
    $("#variantIdsSelect").html("");
    var idArray = variantIdLines.split("\n").map(id => id.trim()).filter(id => id.length > 0);
    if (idArray.length > maxAllowedItems) {
        alert("You may not provide more than " + maxAllowedItems + " variant IDs!  (" + idArray.length + " provided)");
        return;
    }

    var selectTitle;
    var spanText;

    var optionSB = new StringBuffer();
    if (idArray.length > maxSelectableVariantIdCount) {    // we can't handle selects with too many items
        selectedVariantIDsWhenTooManyToFitInSelect = idArray;
        spanText = idArray.length + " selected";
        selectTitle = "too many IDs for manual selection";
        $('#variantIdsSelect').val(null).prop('disabled', true);
        $('#copyVariantIds').hide();
        $('#clearVariantIdSelection').css('display', 'inline');
    }
    else {
        selectedVariantIDsWhenTooManyToFitInSelect = null;
        selectTitle = "Select to enter IDs";
        $('#variantIdsSelect').removeAttr('disabled').selectpicker('refresh');
        idArray.forEach(function (varId) {
            optionSB.append('<option selected value="'+varId+'">'+varId+'</option>');
        });
        $('#copyVariantIds').show();
        $('#clearVariantIdSelection').hide();
    }

    $("#variantIdsSelect").append(optionSB.toString());
    if (idArray.length > maxSelectableVariantIdCount)
        $('#variantIdsSelect').trigger('change');
    $('button[data-id="variantIdsSelect"]').prop("title", selectTitle);
    $('button[data-id="variantIdsSelect"] span.filter-option').html(spanText);
    $("#variantIdsSelect").prop("title", selectTitle);
    if (idArray.length <= maxSelectableVariantIdCount)
        $('#variantIdsSelect').trigger('change');

    $("div#variantsIdsPastePanel").remove();
}

function clearVariantIdSelection() {
    selectedVariantIDsWhenTooManyToFitInSelect = null;
    $('#copyVariantIds').prop('disabled', true);
    $('#copyVariantIds').show();
    $('#clearVariantIdSelection').hide();
	$('#variantIdsSelect').removeAttr('disabled').selectpicker('deselectAll').find('[value]').remove()
    $('#variantIdsSelect').selectpicker('refresh');
}

function clearGeneIdSelection() {
    $('#clearGenesIdSelection').hide();
	$('#geneIdsSelect').removeAttr('disabled').selectpicker('deselectAll').find('[value]').remove()
    $('#geneIdsSelect').selectpicker('refresh');
}

function displayProjectInfo(projName)
{
    $("#projectInfoContainer").html("<h4>Information on project " + projName + "</h4><div style='font-weight:bold; float:right;'>" + dbDesc + "</div><p>This project contains " + runList.length + " run(s) of data.</p><pre>" + projectDescriptions[projName] + "</pre>");
    $("#projectInfo").modal({
        opacity: 80,
        overlayCss: {
            backgroundColor: "#111111"
        }
    });
}

function areGroupsOverlapping(specificGroups) {
    let groups = specificGroups != null ? [...specificGroups] : Array.from({ length: $(".genotypeInvestigationDiv").length }, (_, index) => index + 1);
    if (groups.length < 2)
    	return false;

	var groupIndividuals = getSelectedIndividuals([groups[0]]);
	groups = groups.splice(1);
	seen = new Set(groupIndividuals.length == 0 ? indOpt : groupIndividuals);
    for (const group of groups) {
        const individuals = getSelectedIndividuals([group]);
        if (individuals.length == 0)
       		return true;

        for (const individual of individuals) {
            if (seen.has(individual))
                return true;
			seen.add(individual);
        }
    }
    return false;
}

function checkGroupOverlap(groupNumber) {
	$('#overlapWarning' + groupNumber).toggle($("#discriminate" + groupNumber).val() != "" && areGroupsOverlapping([groupNumber, $("#discriminate" + groupNumber).val()]));
	$(".discriminationDiv select option:selected[value='" + groupNumber + "']").each(function() {
		var id = $(this).parent().attr('id').replace(/[^0-9.]/g, '');
		$('#overlapWarning' + id).toggle(areGroupsOverlapping([groupNumber, id]));
	});
}

function applyOutputToolConfig() {
	if ($("input#outputToolURL").val().trim() == "") {
		localStorage.removeItem("outputTool_" + $("#onlineOutputTools").val());
		configureSelectedExternalTool();
	} else
		localStorage.setItem("outputTool_" + $("#onlineOutputTools").val(), JSON.stringify({"url" : $("input#outputToolURL").val(), "formats" : $("input#outputToolFormats").val()}));

	if ($("input#galaxyInstanceURL").val().trim() == "")
		localStorage.removeItem("galaxyInstanceURL");
	else {
		localStorage.setItem("galaxyInstanceURL", $("input#galaxyInstanceURL").val());
		$("#galaxyPushButton input").val("Send exported data to " + $("input#galaxyInstanceURL").val());
	}
	
	showServerExportBox($('#keepExportOnServ').prop('checked'));

	$("#applyOutputToolConfig").prop("disabled", "disabled");
}

function configureSelectedExternalTool() {
    var config = getOutputToolConfig($("#onlineOutputTools").val());
    $('#outputToolURL').val(config['url']);
    $('#outputToolFormats').val(config['formats']);
    $("#applyOutputToolConfig").prop('disabled', 'disabled');
}

function checkIfOuputToolConfigChanged() {
    var changed = $('#outputToolFormats').val() != $('#outputToolFormats').prop('previousVal') || $('#outputToolURL').val() != $('#outputToolURL').prop('previousVal');
    $("#applyOutputToolConfig").prop('disabled', changed ? false : 'disabled');
}

function resetFilters() {
    $('#genomeBrowserPanel').fadeOut();
    $('#variantDetailPanel').fadeOut();
    $('#rightSidePanel').fadeOut();
    $('#variantTypes').selectpicker('deselectAll');
    $('#numberOfAlleles').selectpicker('deselectAll');
    $('#Sequences').selectmultiple('deselectAll');
    $('#minposition').val("");
    $('#maxposition').val("");
    $('#geneIdsSelect').val("");
    $('#geneIdsSelect').prop('disabled', true);
    $("#GeneIds button").removeClass("active").change();
    $('#variantEffects').selectpicker('deselectAll');
    $('#variantIdsSelect').selectpicker('deselectAll');
    $('#genotypeInvestigationMode').val(0);
    $('.selectpicker').selectpicker('refresh')
    $('#genotypeInvestigationMode').change();
}

// Function from three line menu clicking
function menuAction(){    
    var $submenu = $('#submenu');
    if($submenu.css('display') == 'none'){
        $submenu.css('display', 'inline');
        $submenu.mouseleave(function(){
            var to = setTimeout(function(){
                $submenu.css('display', 'none');
            }, 400);
            $submenu.mouseover(function(){
                if(to.length != 0){
                    window.clearTimeout(to);
                }
            });
        });
    }
    else
        $submenu.css('display', 'none');
}

//This function allow the user to save a query into the DB
function saveQuery() {
    var queryName = ""; // test
    while (queryName.trim() == "")
        if ((queryName = prompt("Enter query name")) == null)
            return;

    let activeGroups = $(".genotypeInvestigationDiv").length;

    var query = {
        "variantSetId": getProjectId(),
        "getGT": false,
        "queryLabel": queryName,

        "referenceName": getSelectedSequences(),
        "selectedVariantTypes": getSelectedTypes(),
        "selectedVariantIds": getSelectedVariantIds(),
        "alleleCount": getSelectedNumberOfAlleles(),
        "start": getSearchMinPosition(),
        "end": getSearchMaxPosition(),
        "variantEffect": $('#variantEffects').val() === null ? "" : $('#variantEffects').val().join(","),
		"geneName": getSelectedGenesIds(),
        "callSetIds": getSelectedIndividuals(activeGroups !== 0 ? [1] : null, true),
        "discriminate": getDiscriminateArray(),
		"groupName": getGroupNames(),
        "pageSize": 100,
        "sortBy": sortBy,
        "sortDir": sortDesc === true ? 'desc' : 'asc'
    };

    let geno = [];
    let mostsameratio = [];
    let minmaf = [];
    let maxmaf = [];
    let minmissingdata = [];
    let maxmissingdata = [];
    let minhez = [];
    let maxhez = [];
    let callsetids = [];
    var annotationFieldThresholds = [];
    for (let i = 0; i < activeGroups; i++) {
        var threshold = {};
        $(`#vcfFieldFilterGroup${i + 1} input`).each(function() {
            if (parseInt($(this).val()) > 0)
                threshold[this.id.substring(0, this.id.lastIndexOf("_"))] = $(this).val();
        });
        if (i !== 0)
            callsetids.push(getSelectedIndividuals([i + 1], true));
        annotationFieldThresholds.push(threshold);
        geno.push($(`#Genotypes${i + 1}`).val());
        mostsameratio.push($(`#mostSameRatio${i + 1}`).val());
        minmaf.push($(`#minMaf${i + 1}`).val() === null ? 0 : parseFloat($(`#minMaf${i + 1}`).val()));
        maxmaf.push($(`#maxMaf${i + 1}`).val() === null ? 50 : parseFloat($(`#maxMaf${i + 1}`).val()));
        minmissingdata.push($(`#minMissingData${i + 1}`).val() === null ? 0 : parseFloat($(`#minMissingData${i + 1}`).val()));
        maxmissingdata.push($(`#maxMissingData${i + 1}`).val() === null ? 100 : parseFloat($(`#maxMissingData${i + 1}`).val()));
        minhez.push($(`#minHeZ${i + 1}`).val() === null ? 0 : parseFloat($(`#minHeZ${i + 1}`).val()));
        maxhez.push($(`#maxHeZ${i + 1}`).val() === null ? 100 : parseFloat($(`#maxHeZ${i + 1}`).val()));
    }

    query["gtPattern"] = geno;
    query["mostSameRatio"] = mostsameratio;
    query["minMaf"] = minmaf;
    query["maxMaf"] = maxmaf;
    query["minMissingData"] = minmissingdata;
    query["maxMissingData"] = maxmissingdata;
    query["minHeZ"] = minhez;
    query["maxHeZ"] = maxhez;
    query["annotationFieldThresholds"] = annotationFieldThresholds;
    query["additionalCallSetIds"] = callsetids;

    $.ajax({
        url: saveBookmarkedQueryURL,
        type: "POST",
        contentType: "application/json;charset=utf-8",
        timeout: 0,
        headers: {
            "Authorization": "Bearer " + token,
        },
        data: JSON.stringify(query),
        success: function (jsonResult) {
            $('#savequery').append('<span id="okIcon" class="glyphicon glyphicon-ok" aria-hidden="true"> </span>');
            setTimeout(function () {
                $('#okIcon').remove();
            }, 1000);
        },
        error: function (xhr, ajaxOptions, thrownError) {
            alert(xhr.responseText);
            if (xhr.status == 400)
                saveQuery();
            else
                handleError(xhr, thrownError);
        }
    });

}

//This function allows the user to list previously saved queries
function listQueries(){
    $('#loadedQueries p').remove();
    $('#queryManager').modal("show");
    $.ajax({    // load queries 
        url: listBookmarkedQueriesURL + '?module=' + referenceset,
        type: "GET",
        dataType: "json",
        async: false,
        contentType: "application/json;charset=utf-8",
        headers: {
            "Authorization": "Bearer " + token
        },
        success: function(jsonResult) {
            var i=0;
            for (key in jsonResult)
            {    
                i++;
                $('#loadedQueries').append('<p id="'+key+'">' +'<span class="queryIcon glyphicon glyphicon-trash" aria-hidden="true" data-toggle="tooltip" title="Delete"></span>'+'<span class="NameQuery">'
                        +jsonResult[key]+'</span>'+'</span>'+'<span  class="queryIcon glyphicon glyphicon-pencil" aria-hidden="true" data-toggle="tooltip" title="Rename"></span>'
                + '<span style="font-size: 15px;" class="queryIcon glyphicon glyphicon-folder-open" aria-hidden="true" data-toggle="tooltip" title="Open"></span>' +'</p>');
            }
        },
        error: function(xhr, ajaxOptions, thrownError) {
            handleError(xhr, thrownError);
        }
    });    
    
    //When the pencil icon is clicked
    $('#loadedQueries p .glyphicon-pencil').click(function () {
        var queryId = $(this).parent('p').attr('id');
        queryName = "";
        while (queryName.trim() == "")
            if ((queryName = prompt("Enter query name", $(this).parent('p').text())) == null)
                return;
        $.ajax({    // load queries 
            url: loadBookmarkedQueryURL + '?module=' + referenceset + '&queryId=' + queryId,
            type: "GET",
            dataType: "json",
            async: false,
            contentType: "application/json;charset=utf-8",
            headers: {
                "Authorization": "Bearer " + token
            },
            success: function (jsonResult) {
                var requestData = {
                    "variantSetId": getProjectId(),
                    "getGT": false,
                    "queryLabel": queryName,

                    "referenceName": jsonResult['referenceName'],
                    "selectedVariantTypes": jsonResult['selectedVariantTypes'],
                    "selectedVariantIds": jsonResult['selectedVariantIds'],
                    "alleleCount": jsonResult['alleleCount'],
                    "start": jsonResult['start'],
                    "end": jsonResult['end'],
                    "variantEffect": jsonResult['variantEffect'],
                    "geneName": jsonResult['geneName'],
                    "callSetIds": jsonResult['callSetIds'],

                    "groupName": jsonResult['groupName'],
                    "discriminate": jsonResult['discriminate'],
                    "pageSize": jsonResult['pageSize'],
                    "sortBy": jsonResult['sortBy'],
                    "sortDir": jsonResult['sortDir'],
                    
	                "additionalCallSetIds": jsonResult["additionalCallSetIds"],
	                "gtPattern": jsonResult["gtPattern"],
	                "mostSameRatio": jsonResult["mostSameRatio"],
	                "minMaf": jsonResult["minMaf"],
	                "maxMaf": jsonResult["maxMaf"],
	                "minMissingData": jsonResult["minMissingData"],
	                "maxMissingData": jsonResult["maxMissingData"],
	                "minHeZ": jsonResult["minHeZ"],
	               	"maxHeZ": jsonResult["maxHeZ"],
	                "annotationFieldThresholds": jsonResult["annotationFieldThresholds"]
                };

                $.ajax({
                    url: saveBookmarkedQueryURL,
                    type: "POST",
                    contentType: "application/json;charset=utf-8",
                    timeout: 0,
                    headers: {
                        "Authorization": "Bearer " + token,
                    },
                    data: JSON.stringify(requestData),
                    success: function(jsonResult) {
                        $('#' + queryId + ' .NameQuery').html(queryName);
                    },
                    error: function(xhr, ajaxOptions, thrownError) {
                        alert(xhr.responseText);
                        listQueries();
                        handleError(xhr, thrownError);
                    }
                });
            },

            error: function (xhr, ajaxOptions, thrownError) {
                handleError(xhr, thrownError);
            }
        });
    });


    //When the open icon is clicked
    $('#loadedQueries p .glyphicon-folder-open').click(function(){
        var queryId = $(this).parent('p').attr('id');
        $.ajax({    // load queries 
            url: loadBookmarkedQueryURL + '?module=' + referenceset 
            + '&queryId='+ queryId,
            type: "GET",
            dataType: "json",
            async: false,
            contentType: "application/json;charset=utf-8",
            headers: {
                "Authorization": "Bearer " + token
            },
            success: function(jsonResult) {
                resetFilters();
                
                var filterByVariantIDs = jsonResult['selectedVariantIds'] != null && jsonResult['selectedVariantIds'] != "";
                $("#filterIDsCheckbox").prop("checked", !filterByVariantIDs);	// make it the opposite of what we want
       		    $("#filterIDsCheckbox").click();	// toggle it and let event handlers launch interface update
				if (filterByVariantIDs) {
					var optionSB = new StringBuffer();
			        selectTitle = "Select to enter IDs";
			        $('#variantIdsSelect').removeAttr('disabled').selectpicker('refresh');
			        jsonResult['selectedVariantIds'].split(";").forEach(function (varId) {
			            optionSB.append('<option selected value="'+varId+'">'+varId+'</option>');
			        });
			        $("#variantIdsSelect").append(optionSB.toString());
			        $('#copyVariantIds').show();
			        $('#clearVariantIdSelection').hide();
			   		$('#variantIdsSelect').trigger('change');
				}
				else {                
	                if(jsonResult["start"] != -1) // if there is a start position
	                $('#minposition').val(jsonResult["start"]); 
	                
	                if(jsonResult["end"] != -1) // if there is a end position
	                $('#maxposition').val(jsonResult["end"]);
	                
	                if(jsonResult['referenceName'] != ""){
	                    var tabRefs = jsonResult['referenceName'].split(';'); //make an array with the references names
	                    $('#Sequences div select').val(tabRefs); //change the 'select' values
	                    $('#Sequences div select').trigger('change');//trigger the change event
	                }
	                
	                if(jsonResult['selectedVariantTypes'] != ""){
	                    var tabTypes = jsonResult['selectedVariantTypes'].split(';'); //same but with variants types
	                    $('#variantTypes').selectpicker('val', tabTypes);
	                }
	                
	                if(jsonResult['variantEffect'] != ""){
	                    var tabEffects = jsonResult['variantEffect'].split(','); //same but with variants effects
	                    $('#variantEffects').selectpicker('val', tabEffects);
	                }
	                
	                var names = jsonResult['geneName']; //change gene name value
	                if (names == "-")
	                	$('#minusMode').click();
	                else if (names == "+")
	                	$('#plusMode').click();
	                else if (names.trim() != "") {
	                	$('#editMode').click();
				        var optionSB = new StringBuffer();
				        names.split(",").forEach(function (varId) {
				            optionSB.append('<option selected value="'+varId+'">'+varId+'</option>');
				        });
	    				$("#geneIdsSelect").append(optionSB.toString());
	    				$('#geneIdsSelect').trigger('change');
	                }
	                
	                if(jsonResult['alleleCount'] != ""){
	                    var tabAlleles = jsonResult['alleleCount'].split(';'); 
	                    $('#numberOfAlleles').selectpicker('val', tabAlleles);
	                }
	            }

                $('#genotypeInvestigationMode').selectpicker('val', jsonResult['gtPattern'].length);
                  $('#genotypeInvestigationMode').trigger('change');

                for (var i= 0 ; i < jsonResult['gtPattern'].length ; i++) {
	                  var tabIds = i == 0 ? jsonResult['callSetIds'] : jsonResult['additionalCallSetIds'][i - 1];
	                  if (tabIds.length != 0) {
						$("#Individuals" + (i + 1) + " button").filter(function() {
						    return $(this).text() === "load all";
						}).click();
	                    $('#Individuals'+ (i + 1) +' div select').val(tabIds.map(function(x) {
	                        return x.split(idSep)[2];
	                    }));
	                    $('#Individuals'+ (i + 1) +' div select').trigger('change');
	                  }
	                  
	                  let groupThresholds = jsonResult['annotationFieldThresholds'][i];
	                  for (var key in groupThresholds)
	                      $('#vcfFieldFilterGroup'+ (i + 1) +' #' + key + '_threshold' + (i + 1)).val(groupThresholds[key]);
	                  $('#minMissingData'+ (i + 1)).val(jsonResult['minMissingData'][i]);
	                  $('#maxMissingData'+ (i + 1)).val(jsonResult['maxMissingData'][i]);
	                  $('#minHeZ'+ (i + 1)).val(jsonResult['minHeZ'][i]);
	                  $('#maxHeZ'+ (i + 1)).val(jsonResult['maxHeZ'][i]);
	                  $('#minMaf'+ (i + 1)).val(jsonResult['minMaf'][i]);
	                  $('#maxMaf'+ (i + 1)).val(jsonResult['maxMaf'][i]);
					  $('#group'+ (i + 1)).val(jsonResult['groupName'][i]);
	                  $('#Genotypes'+ (i + 1)).selectpicker('val', jsonResult['gtPattern'][i]);
	                  $('#mostSameRatio'+ (i + 1)).val(jsonResult['mostSameRatio'][i]);
	                  $('#Genotypes'+ (i + 1)).trigger('change');
	                  $('#discriminate' + (i + 1)).selectpicker('val', jsonResult['discriminate'][i]);
	                  $('#discriminate'+ (i + 1)).trigger('change');
	                  groupNameChanged(i + 1);
                }
               
                $('#queryManager').modal("hide");
            },
            
            error: function(xhr, ajaxOptions, thrownError) {
                handleError(xhr, thrownError);
            }
        });
    });

    //When the trash is clicked
    $('#loadedQueries p .glyphicon-trash').click(function(){
        var queryId = $(this).parent().attr('id');
        if(confirm('Do you really want to delete this query ?')){
            $.ajax({    
                url: deleteBookmarkedQueryURL + '?module='+referenceset+'&queryId='+queryId,
                type: "DELETE",
                dataType: "json",
                async: false,
                contentType: "application/json;charset=utf-8",
                headers: {
                    "Authorization": "Bearer " + token
                },
                success: function(jsonResult) {
                    $('#'+queryId).remove();
                },
                
                error: function(xhr, ajaxOptions, thrownError) {
                    handleError(xhr, thrownError);
                }
            });
        }
    });
}

function onFilterByIds(checked) {
    if (checked) {
        localStorage.setItem($('#module').val() + idSep + $('#project').val() + '_filterByIds', true);
        $('#variantTypes').prop('disabled', true).selectpicker('deselectAll').selectpicker('refresh');
        
        $('#numberOfAlleles').prop('disabled', true).selectpicker('deselectAll').selectpicker('refresh');

        $('#Sequences').selectmultiple('selectAll');
        $('#Sequences').find('.btn').prop('disabled', true).selectpicker('refresh');
        
        $('#minposition').val("").prop('disabled', true); 
        $('#maxposition').val("").prop('disabled', true);
        
        $('#variantEffects').prop('disabled', true).selectpicker('deselectAll').selectpicker('refresh');

        $('#variantIdsSelect').removeAttr('disabled').selectpicker('refresh');
        $('#pasteGeneIds').removeAttr('disabled').selectpicker('refresh');
        $('#pasteVariantIds').removeAttr('disabled').selectpicker('refresh');
        $('#uploadVariantIds').removeAttr('disabled').selectpicker('refresh');
        
        $('#GeneIds').val("").prop('disabled', true);
        $('#geneIdsSelect').val(null).prop('disabled', true).selectpicker('deselectAll').selectpicker('refresh');
        $('#clearGeneIdSelection').hide();
        $('#GeneIds button').prop('disabled', true).removeClass('active');
        
		for (var nGroup= 1; nGroup <= groupColors.length; nGroup++) {
	        $('#minMissingData' + nGroup).val(0).prop('disabled', true);
	        $('#maxMissingData' + nGroup).val(100).prop('disabled', true);
	        $('#minHeZ' + nGroup).val(0).prop('disabled', true);
	        $('#maxHeZ' + nGroup).val(100).prop('disabled', true);
	        $('#mostSameRatio' + nGroup).prop('disabled', true);
	        $('#Genotypes' + nGroup).prop('disabled', true).selectpicker('deselectAll').selectpicker('refresh');
		    $('#minMaf' + nGroup).val(0).prop('disabled', true);
		    $('#maxMaf' + nGroup).val(50).prop('disabled', true);
		}
    } else {
        localStorage.removeItem($('#module').val() + idSep + $('#project').val() + '_filterByIds');
		selectedVariantIDsWhenTooManyToFitInSelect = null;
	
        $('#variantTypes').prop('disabled', false).selectpicker('refresh');
        $('#numberOfAlleles').prop('disabled', false).selectpicker('refresh');
        $('#Sequences').find('.btn').prop('disabled', false).selectpicker('refresh');
        $('#minposition').prop('disabled', false);
        $('#maxposition').prop('disabled', false);     
        $('#variantEffects').prop('disabled', false).selectpicker('refresh');        
        
        $('#variantIdsSelect').prop('disabled', true).selectpicker('deselectAll').selectpicker('refresh');
        $('#copyVariantIds').prop('disabled', true);
        $('#copyVariantIds').show();
        $('#clearVariantIdSelection').hide();
        $('#pasteGeneIds').prop('disabled', true);
        $('#pasteVariantIds').prop('disabled', true);
        $('#uploadVariantIds').prop('disabled', true);
        
        $('#GeneIds').prop('disabled', false);
        $('#GeneIds button').prop('disabled', false);
        
        for (var nGroup= 1; nGroup<= groupColors.length; nGroup++) {
	        $('#minMissingData' + nGroup).prop('disabled', false);
	        $('#maxMissingData' + nGroup).prop('disabled', false);
	        $('#minHeZ' + nGroup).prop('disabled', false);
	        $('#maxHeZ' + nGroup).prop('disabled', false);
	        $('#mostSameRatio' + nGroup).prop('disabled', false);
	        $('#Genotypes' + nGroup).prop('disabled', false).selectpicker('refresh');        
		    $('#minMaf' + nGroup).prop('disabled', false);
		    $('#maxMaf' + nGroup).prop('disabled', false);
		}
    }
}

function onGeneSelectionMinusMode() {
    if (!$('#geneIdsSelect').prop('disabled')) {
        $('#geneIdsSelect').val(null).prop('disabled', true).selectpicker('deselectAll').selectpicker('refresh');
    }

    if (!$("#minusMode").hasClass("active")) {
        $("#minusMode").addClass("active");
    }
    else {
		$("#minusMode.active").removeClass("active");
	}
    
    $("#plusMode.active").removeClass("active");
    $("#editMode.active").removeClass("active");
}

function onGeneSelectionPlusMode() {
    if (!$('#geneIdsSelect').prop('disabled')) {
        $('#geneIdsSelect').val(null).prop('disabled', true).selectpicker('deselectAll').selectpicker('refresh');
    }

    if (!$("#plusMode").hasClass("active")) {
        $("#plusMode").addClass("active");
    }
    else {
		$("#plusMode.active").removeClass("active");
	}
    
    $("#minusMode.active").removeClass("active");
    $("#editMode.active").removeClass("active");
}

function onGeneSelectionEditMode() {
    if ($('#geneIdsSelect').prop('disabled')) {
        $('#geneIdsSelect').removeAttr('disabled').selectpicker('refresh');
    }

    if (!$("#editMode").hasClass("active")) {
        $("#editMode").addClass("active");
        $('#geneIdsSelect').removeAttr('disabled').selectpicker('refresh');
    }
    else {
		$("#editMode.active").removeClass("active");
		$('#geneIdsSelect').val(null).prop('disabled', true).selectpicker('refresh');
	}
    
    $("#minusMode.active").removeClass("active");
    $("#plusMode.active").removeClass("active");
}

function rangeChanged(paramName, nGroup, minThreshold, maxThreshold) {
	var minInput = $("input#min" + paramName + nGroup), maxInput = $("input#max" + paramName + nGroup);
	var minApplied = minInput.val() > minThreshold, maxApplied = maxInput.val() < maxThreshold, mustBeReset = false;
	var minInvalid = minInput.val() === '' || minInput.val() < minThreshold || minInput.val() > maxThreshold, maxInvalid = maxInput.val() === '' || maxInput.val() < minThreshold || maxInput.val() > maxThreshold;
	
	if (paramName == "Maf" && (minApplied || maxApplied) && !minInvalid && !maxInvalid) {
		var gotMultipleAlleleCounts = $('#numberOfAlleles').children().length > 1;
		var onlyBiAllelicInSelection = (!gotMultipleAlleleCounts && $('#numberOfAlleles').children()[0].innerText == "2") || $('#numberOfAlleles').val() == 2;
		if (!onlyBiAllelicInSelection && gotMultipleAlleleCounts) {
			if (confirm("MAF filter may only be applied to biallelic data. Do you want to restrain search to such variants?"))
				$('#numberOfAlleles').val(2).selectpicker('refresh');
			else
				mustBeReset = true;
		}
			
		if (!mustBeReset) {
			var allHomozygousSelected = $('#Genotypes' + nGroup).val() != null && $('#Genotypes' + nGroup).val().startsWith("All Homozygous");
			if (allHomozygousSelected) {
				if (confirm("MAF filter is incompatible with All Homozygous genotype pattern. Disable All Homozygous for this group?"))
					$('#Genotypes' + nGroup).val("").selectpicker('refresh');
				else
					mustBeReset = true;
			}
		}
	}
	
	if (mustBeReset || minInvalid)
		minInput.val(minThreshold);	
	if (mustBeReset || maxInvalid)
		maxInput.val(maxThreshold);	
}

function onVariantIdsSelect() {
    if ($('#variantIdsSelect').selectpicker().val() === null && selectedVariantIDsWhenTooManyToFitInSelect === null) {
        $('#copyVariantIds').prop('disabled', true).selectpicker('refresh');
    } else {
        $('#copyVariantIds').removeAttr('disabled').selectpicker('refresh');
    }
}

function buildGenotypeTableContents(jsonResult) {
	const knownAlleles = jsonResult.alternateBases;
	knownAlleles.unshift(jsonResult.referenceBases);
	const gtTable = [];
	const headerPositions = [];

	for (const call in jsonResult.calls) {
		const individual = splitId(jsonResult.calls[call].callSetId, 2);
		const gtRow = [individual];
		let gt = '';
		const alleles = [];

		for (const allele in jsonResult.calls[call].genotype) {
			const alleleIndex = jsonResult.calls[call].genotype[allele];
			alleles.push(knownAlleles[alleleIndex]);
		}

		alleles.forEach(function(allele) {
			gt += '<div class="allele">' + allele + '</div>';
		});

		gtRow.push(gt);

		for (const header in jsonResult.calls[call].info) {
			let headerPos = headerPositions[header];
			if (headerPos == null) {
				headerPos = Object.keys(headerPositions).length;
				headerPositions[header] = headerPos;
			}
			gtRow[headerPos + 2] = jsonResult.calls[call].info[header][0];
		}
		gtTable.push(gtRow);
	}
	var tableHeader = new Array(2);
    for (var header in headerPositions)
        tableHeader[headerPositions[header] + 2] = header;
    
    var indexSample = tableHeader.indexOf("sample");
    var htmlTableContents = new StringBuffer();
    htmlTableContents.append('<thead><tr>');

    // Add "Individual" as first column always
    htmlTableContents.append('<th style="min-width:172px;">&nbsp;Individual&nbsp;</th>');
    // If "sample" is present in the query, add a specific column for it between "Individual" and "Genotype"
    if (indexSample !== -1) {
        htmlTableContents.append('<th' + (typeof vcfFieldHeaders[header] == 'undefined' ? '' : ' title="' + vcfFieldHeaders["sample"] + '"') + '>&nbsp;Sample&nbsp;</th>');
    }
    // Add "Genotype" as a column
    htmlTableContents.append('<th>&nbsp;Genotype&nbsp;</th>');
    
    for (var headerPos in tableHeader) {
        var header = tableHeader[headerPos];
        // If the header is equal to "sample", skip this iteration because we have already added it outside the loop.
        if (header === "sample") {
            continue;
        }
        htmlTableContents.append('<th' + (typeof vcfFieldHeaders[header] == 'undefined' ? '' : ' title="' + vcfFieldHeaders[header] + '"') + '>&nbsp;' + header + '&nbsp;</th>');
    }
    htmlTableContents.append('</tr></thead>');

    var annotationFieldThresholds = {};
    for (var i = 1; i <= 10; i++)
        $('#vcfFieldFilterGroup' + i + ' input').each(function () {
            if (parseFloat($(this).val()) > 0)
                annotationFieldThresholds[this.id.substring(0, this.id.lastIndexOf("_"))] = $(this).val();
        });

    var activeGroups = $(".genotypeInvestigationDiv").length;
    var applyThresholds = Object.keys(annotationFieldThresholds).length > 0
    var individualsByGroup = Array.from({ length: activeGroups }, (_, index) => index + 1).map(group => getSelectedIndividuals([group]));

    var prevFirstElement = null;
    var prevColor = '#d1d1e0';
    for (var row in gtTable) {
        var indivColors = [];

        for (var i = 0; i < individualsByGroup.length; i++) {
            var inGroup = individualsByGroup[i].length == 0 || individualsByGroup[i].includes(gtTable[row][0]);
            if (inGroup)
                indivColors.push(groupColors[i]);
        }
        var annotationThresholds = !applyThresholds ? null : getAnnotationThresholds(gtTable[row][0], individualsByGroup);
        htmlTableContents.append('<tr class="ind_' + gtTable[row][0].replaceAll(" ", "_") + '">');

        for (var i = 0; i < tableHeader.length; i++) {
            var missingData = false;
            // Ignore the "sample" column because we will treat it separately
            if (i !== indexSample) {
                // Adding sample elements to the second column if "sample" is returned in the query and if we are in the second column
                if (indexSample !== -1 && i === 1) {
                	// Changes the color if the first element in the row is different from the previous row
                    var backgroundColor = (gtTable[row][0] !== prevFirstElement) ? (prevColor === '#d1d1e0' ? '#ffffff' : '#d1d1e0') : prevColor;
                    htmlTableContents.append('<th style=background-color:' + backgroundColor + '>' + gtTable[row][indexSample] + '</th>');
                    prevColor = backgroundColor;
                }
                if (applyThresholds && i >= 2) {
                    for (var annotation in annotationThresholds) {
                        if (tableHeader[i] == annotation && gtTable[row][i] < annotationThresholds[annotation]) {
                            missingData = true;
                            break;
                        }
                    }
                }
                htmlTableContents.append((i == 0 ? "<th style='background-image:repeating-linear-gradient(to right, " + indivColors.map((color, index) => { return color + " " + (index*17) + "px, " + color + " " + ((index+1) * 17) + "px"; }).join(', ') + ");'" : "<td") + (missingData ? ' class="missingData"' : '') + ">" + (gtTable[row][i] != null ? gtTable[row][i] : "") + (i == 0 ? "</th>" : "</td>"));
            }
        }
        htmlTableContents.append('</tr>');

        // Updates the first element of the previous row
        prevFirstElement = gtTable[row][0];
    }
    return htmlTableContents.toString();
}

function calculateVariantStats() {
	let individuals = new Set($('table.genotypeTable tr th:first-child').filter(function() {
		    return $(this).text().trim() != "Individual";
		}).map(function() {
		    return $(this).text();
		}));
		
    const nGroupCount = getGenotypeInvestigationMode() + 1;
	const groupsContent = [nGroupCount == 2 && !$("#displayAllGt").prop('checked') ? null : []];

	for (let k = 1; k < nGroupCount; k++) {
		let groupIndivs = getSelectedIndividuals([k]);
		groupsContent.push(groupIndivs);
		if (groupIndivs.length == 0)
			groupsContent[0] = null;	// At least one group contains all individuals so we won't need the overall figures div
	}

	let treatedIndividuals = new Set();
	let alleleCounts = Array.from({ length: nGroupCount }, () => ({}));
	let hetZcount = new Array(nGroupCount).fill(0);
	let doMaf = $("#varKnownAlleles").children().length == 2, doHetZ = ploidy > 1;
	
	$("table.genotypeTable tr").each(function() {
		if ($(this).find("td.missingData").length > 0)
			return;

		let indName = $(this).find('th:first-child').text();
		if (treatedIndividuals.has(indName))
			return;

		for (let i = 0; i < groupsContent.length; i++) {
			if (groupsContent[i] == null || (groupsContent[i].length > 0 && !groupsContent[i].includes(indName)))
				continue;
			
			let distinctIndAlleles = new Set();
			$(this).find('div.allele').map(function() {
				let allele = $(this).text(), prevCount = alleleCounts[i][allele] == null ? 0 : alleleCounts[i][allele];
				alleleCounts[i][allele] = prevCount + 1;
	
				distinctIndAlleles.add(allele);
			});
			treatedIndividuals.add(indName);
			if (doHetZ && distinctIndAlleles.size > 1)
				hetZcount[i]++;
		}
	});
	
	let qvs = $("#quickvariantsstats");
	qvs.html('<b>Quick variant stats</b>');
	for (let i = 0; i < groupsContent.length; i++)
		if (groupsContent[i] != null) {
			let groupSize = groupsContent[i].length == 0 ? individuals.size : groupsContent[i].length;
			let missingCount = groupSize - Object.keys(alleleCounts[i]).map(key => alleleCounts[i][key] || 0).reduce((sum, value) => sum + value, 0) / ploidy;
			let groupStats = '<div style="border:1px solid lightgrey; padding:8px;" class="margin-top-md group' + i + '">';
			groupStats += "<div style='text-decoration:underline;'>" + (i > 0 ? $("input#group" + i).val() : "Overall figures") + " (" + groupSize + " individuals)</div>";
			groupStats += "<div>Missing data: " + (missingCount * 100 / groupSize).toFixed(2) + "%</div>";
			if (doHetZ)
				groupStats += "<div>Heterozygous: " + (hetZcount[i] == 0 ? 0 : hetZcount[i] * 100 / (groupSize - missingCount)).toFixed(2) + "%</div>";
			if (doMaf)
				groupStats += "<div>MAF: " + (Object.keys(alleleCounts[i]).length < 2 ? 0 : Math.min(...Object.values(alleleCounts[i]))*100/Object.values(alleleCounts[i]).reduce((sum, num) => sum + num, 0)).toFixed(2) + "%</div>";
			groupStats += '</div>';
			qvs.append(groupStats);
		}
}

function extractUniqueAlleles(jsonResult) {
	var knownAlleles = [jsonResult.referenceBases, ...jsonResult.alternateBases];
	var allelesWithDivs = knownAlleles.map(allele => '<div class="allele" style="background-color:transparent; margin:0;">' + allele + '</div>').join('');
	return allelesWithDivs;
}

function taxonSelected() {
	let selectedTaxon = $("#taxa").val();
	$("#module option").each(function() {
		let showOption = selectedTaxon == "(Any taxon)" || selectedTaxon == $(this).attr("data-taxon");
		$(this).css("display", showOption ? "block" : "none");
		if (referenceset == $(this).val() && !showOption) {
			$("#module").val(null);
			$('#module').trigger('change');
		}
	});
	$("#module").selectpicker("refresh");
}

function showHideLocalhostWarning() {
	var serverAddr=location.origin.substring(location.origin.indexOf('//') + 2);
	$('div#serverExportWarning').html($("#enableExportPush").prop('checked') && (serverAddr.toLowerCase().indexOf('localhost') == 0 || serverAddr.indexOf('127.0.0.1') == 0) ? 'WARNING: Gigwa seems to be running on localhost, any external tool running on a different machine will not be able to access exported files! If the computer running the webapp has an external IP address or domain name, you should use that instead.' : '');
}