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
var minimumProcessQueryIntervalUnit = 200;
var chart = {};
let localmin = {}, localmax = {};
let chartJsonKeys = []
let colorTab = ['#396AB1', '#DA7C30', '#3E9651', '#CC2529', '#535154', '#6B4C9A', '#922428', '#948B3D'];
var currentChartType = null;
let progressTimeoutId = null;
var emptyResponseCountsByProcess = [];
var cachedResults;
var currentQueries = new Set();
var abortedQueries;
const maxSelections = 5;

const chartTypes = new Map([
    ["density", {
        displayName: "Density",
        queryURL: selectionDensityDataURL,
        title: "Distribution of {{totalVariantCount}} {{displayedVariantType}} variants on sequence {{displayedSequence}}",
        subtitle: "The value provided for a position is the number of variants around it in an interval of size {{intervalSize}}",
        xAxisTitle: "Positions on selected sequence",
        series: [{
            name: "Variants in interval",
            enableMarker: false,
            lineWidth: 2
        }],
    }],
    ["maf", {
        displayName: "MAF distribution",
        queryURL: selectionMafDataURL,
        title: "MAF values for {{displayedVariantType}} variants on sequence {{displayedSequence}}",
        subtitle: "MAF values calculated in an interval of size {{intervalSize}} around each point (excluding missing and multi-allelic variants)",
        xAxisTitle: "Positions on selected sequence",
        selectIndividuals: true,
        series: [
            {
                name: "MAF * 100",
            	enableMarker: true
            }
        ],
        enableCondition: function (){
            if (ploidy != 2){
                return "Ploidy levels other than 2 are not supported";
            } else {
                return null;
            }
        },
    }],
    ["fst", {
        displayName: "Fst",
        queryURL: selectionFstDataURL,
        title: "Fst value for {{displayedVariantType}} variants on sequence {{displayedSequence}}",
        subtitle: "Weir and Cockerham Fst estimate calculated between selected groups in an interval of size {{intervalSize}} around each point",
        xAxisTitle: "Positions on selected sequence",
        series: [{
            name: "Fst estimate",
            enableMarker: true
        }],
        enableCondition: function (){
            if (getGenotypeInvestigationMode() < 2 && !gotMetaData){
                return "Fst can only be calculated with several groups of individuals. You need to define investigation groups or upload metadata.";
            } else if (areGroupsOverlapping() && !gotMetaData){
                return "Investigation groups are overlapping";
            } else if (ploidy != 2){
                return "Ploidy levels other than 2 are not supported";
            } else {
                return null;
            }
        },
        buildCustomisation: function (){
            return ('<div id="fstThresholdGroup" class="col-md-3"><input type="checkbox" id="showFstThreshold" onchange="displayOrHideThreshold(this.checked)" /> <label for="showFstThreshold">Show FST significance threshold</label><br/>with value <input id="fstThreshold" style="width:60px;" type="number" min="0" max="1" step="0.01" value="0.10" onchange="setFstThreshold()" class="margin-bottom" />'
                     + '<div class="margin-top"><span class="bold">Group FST by </span><select id="plotGroupingSelectionMode" onchange="setFstGroupingOption();">' + getGroupingOptions() + '</select></div></div>'
                     + '<div id="plotMetadata" style="display: none" class="col-md-3">'
                     +   '<b>... values defining populations</b> (2 or more)<img style="cursor:pointer; cursor:hand; position:absolute; margin-left:10px;" src="images/magnifier.gif" title="Individuals in each population will be the intersection of Gigwa\ngroups union with the set defined by the metadata value"/><br/><select id="plotGroupingMetadataValues" multiple size="7" style="min-width:150px;" onchange="checkIfValidForSubmit();"></select>'
                     + '</div>');
        },
        buildRequestPayload: function (payload){
            const groupOption = $("#plotGroupingSelectionMode").find(":selected").val();
            const selectedValues = $("#plotGroupingMetadataValues").val();
            if (selectedValues === null || selectedValues.length < 2)
                return null;

			payload.additionalCallSetIds = []; // override default group selection
			if (groupOption != "__") {
                let selectedIndividuals = getSelectedIndividuals();

				payload.callSetIds = []; // override default group selection
				for (var i in selectedValues) {
					var filters = {};
					if (i > 0)
						payload.additionalCallSetIds.push([]);
					var targetGroup = i == 0 ? payload.callSetIds : payload.additionalCallSetIds[i - 1];
					filters[groupOption] = [selectedValues[i]];
				    $.ajax({
				        url: filterIndividualMetadata + '/' + referenceset + "?projID=" + document.getElementById('project').options[document.getElementById('project').options.selectedIndex].dataset.id.split(idSep)[1],
				        type: "POST",
				        async: false,
				        contentType: "application/json;charset=utf-8",
				        headers: buildHeader(token, $('#assembly').val()),
				        data: JSON.stringify(filters),
				        success: function (callSetResponse) {
			                callSetResponse.forEach(function (callset) {
			                    if (selectedIndividuals.length == 0 || selectedIndividuals.includes(callset.id))
									targetGroup.push(callset.id)
			                });
				        }
				    });
				 }
			}
			else 
				for (var i in selectedValues)
					if (i == 0)
						payload.callSetIds = getSelectedIndividuals([selectedValues[i]]); // override default group selection
					else
						payload.additionalCallSetIds.push(getSelectedIndividuals([selectedValues[i]]));
            return payload;
        },
        onLoad: function (){
            setFstGroupingOption();
        },
        onDisplay: function (){
            displayOrHideThreshold(document.getElementById("showFstThreshold").checked);
        }
    }],
    ["tajimad", {
        displayName: "Tajima's D",
        queryURL: selectionTajimaDDataURL,
        title: "Tajima's D values for {{displayedVariantType}} variants on sequence {{displayedSequence}}",
        subtitle: "Tajima's D values calculated in an interval of size {{intervalSize}} around each point (excluding missing and multi-allelic variants)",
        xAxisTitle: "Positions on selected sequence",
        selectIndividuals: true,
        series: [
            {
                name: "Tajima's D",
            	enableMarker: true
            },
            {
                name: "Segregating sites",
//            	lineWidth: 1,
            	enableMarker: true
            }
        ],
        enableCondition: function (){
            if (ploidy != 2){
                return "Ploidy levels other than 2 are not supported";
            } else {
                return null;
            }
        },
    }]
]);

function checkIfValidForSubmit() {    
    let selectedCount = getSelectedSeqs().length;
    if (selectedCount == 0) {
        document.getElementById('showChartButton').setAttribute('disabled', 'true');
		$("#densityLoadProgressContainer").html("<p class='margin-top text-warning'>Please select some sequences to analyse</p>")
        return;
    }

	if (currentChartType == "fst") {
		let groups = $("select#plotGroupingMetadataValues").val();
		if (groups == null || groups.length < 2) {
			$('#showChartButton').prop('disabled', true);
			return;
		}
		else if ($("#plotGroupingSelectionMode").find(":selected").val() == "__" && areGroupsOverlapping($("select#plotGroupingMetadataValues").val())) {
			alert("Fst groups are overlapping, please change selection!");
			$('#showChartButton').prop('disabled', true);
			return;
		}
	}
	$("#densityLoadProgressContainer").html("");
	$('#showChartButton').prop('disabled', false);
}

function initializeChartDisplay(){
    if (distinctSequencesInSelectionURL == null)
    {
        alert("distinctSequencesInSelectionURL is not defined!");
        return;
    }
    if (variantTypesListURL == null)
    {
        alert("variantTypesListURL is not defined!");
        return;
    }
    if (abortUrl == null)
    {
        alert("abortUrl is not defined!");
        return;
    }
    if (selectionDensityDataURL == null)
    {
        alert("selectionDensityDataURL is not defined!");
        return;
    }
    if (progressUrl == null)
    {
        alert("progressUrl is not defined!");
        return;
    }
    if (token == null)
    {
        alert("token is not defined!");
        return;
    }
    if (referenceset == null)
    {
        alert("referenceset is not defined!");
        return;
    }

    $('div#chartContainer').html('<div id="customisationDiv" style=" margin-top:10px;"></div>' + 
    	'<div style="width: 100%; text-align:center;"><div id="densityLoadProgressContainer" class="panel panel-grey panel-default container-fluid" style="width: calc(80% - 65px); display:inline-block; font-weight:bold; height:65px; overflow: auto; text-align: center;"></div>' + 
    	'<button id="showChartButton" class="btn btn-success" onclick="displayOrAbort();" style="display:inline-block; margin-top:-80px; margin-left:10px;" disabled>Show</button></div>' + 
    	'<div id="dynamicChartZones" style="display:none; margin-top:10px;"></div>');
    var selectedSequences = getSelectedSequences() == "" ? [] : getSelectedSequences().split(";");
    var selectedTypes = getSelectedTypes().split(";");
    $.ajax({
        url: distinctSequencesInSelectionURL + "/" + $('#project :selected').data("id"),
        type: "GET",
        headers: buildHeader(token, $('#assembly').val()),
        success: function (jsonResult) {
        	if (selectedSequences.length == 0 || jsonResult.length < selectedSequences.length)
        		selectedSequences = jsonResult;
        	feedSequenceSelectAndLoadVariantTypeList(
                    selectedSequences == "" ? $('#Sequences').selectmultiple('option') : selectedSequences,
                    selectedTypes == "" ? $('#variantTypes option').map(function() {return $(this).val();}).get() : selectedTypes);
    		applyChartType();
        },
        error: function (xhr, ajaxOptions, thrownError) {
            handleError(xhr, thrownError);
        }
    });
}

function onManualIndividualSelection() {
	$("#indSelectionCount").text($("select.individualSelector").val() == null ? "" : ("(" + $("select.individualSelector").val().length + " selected)"));
	$('.showHideSeriesBox').prop('checked', false);
	$('.showHideSeriesBox').change();
}

function getGroupingOptions() {
    let options = getGenotypeInvestigationMode() == 0 ? '' : '<option value="__">Investigated groups</option>';
    const fields = callSetMetadataFields.slice();
    fields.sort();
    fields.forEach(function (field){
        options += '<option value="' + field + '">' + field + '</option>';
    });
    return options;
}

function createCustomSelect(sequences) {
    // Création de l'élément div avec la classe "custom-select"
    var customSelect = document.createElement("div");
    customSelect.classList.add("custom-select");
    customSelect.id = "chartSequenceList";

    // Création de l'élément div avec la classe "select-trigger"
    var selectTrigger = document.createElement("div");
    selectTrigger.classList.add("select-trigger");
    selectTrigger.innerHTML = "Sequences &#9660;";


    // Création de l'élément div avec la classe "select-options"
    var selectedSeqs = document.createElement("div");
    selectedSeqs.id = "selectedSeqs";
    selectedSeqs.classList.add("select-options");
    selectedSeqs.style.display = "none";
    selectedSeqs.style.maxHeight = "auto";

	selectedSeqs.style.maxHeight = "590px";
	selectedSeqs.style.overflowY = "auto";

	let totalOptions = Object.keys(sequences).length;
    for (let key in sequences) {
        var input = document.createElement("input");
        input.type = "checkbox";
        input.id = sequences[key];
        if (totalOptions == 1)
        	input.checked = true;

        var label = document.createElement("label");
        label.setAttribute("for", sequences[key]);
        label.textContent = sequences[key];
        label.style.margin = "0 5px";

        selectedSeqs.appendChild(input);
        selectedSeqs.appendChild(label);
        selectedSeqs.appendChild(document.createElement("br"));
    }

    // Ajout des éléments au DOM
    customSelect.appendChild(selectTrigger);
    customSelect.appendChild(selectedSeqs);

    // Gestion des événements
    selectTrigger.addEventListener('click', function (event) {
        if (selectedSeqs.style.display === 'block') {
            selectedSeqs.style.display = 'none';
        } else {
            selectedSeqs.style.display = 'block';
        }
        event.stopPropagation();
    });

    selectedSeqs.addEventListener('click', function (event) {
        event.stopPropagation();
    });

    document.addEventListener('click', function () {
        selectedSeqs.style.display = 'none';
    });

    var inputs = selectedSeqs.querySelectorAll('input');
    inputs.forEach(function (input) {
        input.addEventListener('change', function() {
		    if (getSelectedSeqs().length > maxSelections) {
		        this.checked = false;
				$("#densityLoadProgressContainer").html("<p class='margin-top text-danger'>You may work with up to " + maxSelections + " sequences at a time!</p>");
				$("#densityLoadProgressContainer p").fadeOut(3000, function() { $(this).remove(); });
			}
		    else
				checkIfValidForSubmit();
		});
    });

    selectTrigger.style.cursor = 'pointer';
    customSelect.style.border = '1px solid rgb(118, 118, 118)';
    customSelect.style.display = 'inline-block';
    customSelect.style.backgroundColor = "white";
    customSelect.style.borderRadius = "2px";
    customSelect.style.padding = "2px";
    selectedSeqs.style.zIndex = "999";
    selectedSeqs.style.position = "absolute";
    selectedSeqs.style.border = '1px solid rgb(118, 118, 118)';
    selectedSeqs.style.backgroundColor = "white";
    selectedSeqs.style.padding = "5px";
    selectedSeqs.style.borderRadius = "2px";

    return customSelect;
}

function getSelectedSeqs() {
    var selectedSeqs = document.getElementById("selectedSeqs");
    var selectedItems = [];
    var inputs = selectedSeqs.querySelectorAll('input');
    inputs.forEach(function (input) {
        if (input.checked) {
            selectedItems.push(input.id);
        }
    });
    return selectedItems;
}

function feedSequenceSelectAndLoadVariantTypeList(sequences, types) {
    var customSelect = createCustomSelect(sequences);
    const headerHtml = ('<form><div id="headerGraphPage" style="padding:3px; width:100%; background-color:#f0f0f0;">' +
                            'Data to display: <select id="chartTypeList" style="margin-right:20px; heigh:25px;" onchange="applyChartType();"></select>' + 
                            'Choose sequences: <div id="customSelectContainer"></div>' +
                            'Choose a variant type: <select id="chartVariantTypeList" style="height: 25px;" onchange="if (options.length > 2) loadChart();"><option value="">ANY</option></select>' +
                            '<button id="exportButton" style="float: right; display: none" onclick="captureCharts()" type="button">Export all graphs</button>' +
                        '</div></form>');
    $("div#chartContainer").prepend(headerHtml);
    var container = document.getElementById("customSelectContainer");
    container.style.display = "inline";
    container.style.marginRight = "20px";
    container.appendChild(customSelect);

    let allowedCharts = [];
    for (const [key, info] of chartTypes){
        if (info.enableCondition !== undefined){
            if (info.enableCondition() == null)
                allowedCharts.push(key);
        } else {
            allowedCharts.push(key);
        }
        $("#chartTypeList").append("<option value='" + key + "'>" + info.displayName + "</option>");
    }
    if (currentChartType === null || !allowedCharts.includes(currentChartType)){
        currentChartType = allowedCharts[0];
    }
    $("#chartTypeList").val(currentChartType);
    const chartInfo = chartTypes.get(currentChartType);

    for (let key in types)
        $("#chartVariantTypeList").append("<option value='" + types[key] + "'>" + types[key] + "</option>");
	
	buildCustomisationDiv(chartInfo);

	if (chartInfo.onLoad !== undefined)
        chartInfo.onLoad();
}

// Function to capture charts as PNG images
function captureCharts() {
    var imageUrls = [];
    Object.values(chart).forEach(function(sampleChart, index) {
        domtoimage.toPng(sampleChart.renderTo).then(function(dataUrl) {
            imageUrls[index] = dataUrl;

            // Check if all charts have been captured
            if (imageUrls.filter(Boolean).length === Object.keys(chart).length) {
                createZip(imageUrls);
            }
        });
    });
}

// Function to create and download the zip file
function createZip(imageUrls) {
    var zip = new JSZip();

    imageUrls.forEach(function(dataUrl, index) {
        zip.file('chart_' + currentChartType + '_' + $(`#densityChartArea${index}`).attr('data-sequence') + '.png', dataUrl.substr(dataUrl.indexOf(',') + 1), { base64: true });
    });

    // Generate the zip file asynchronously
    zip.generateAsync({ type: 'blob' }).then(function(content) {
        var blobUrl = URL.createObjectURL(content);
        var downloadLink = document.createElement('a');
        downloadLink.href = blobUrl;
        downloadLink.download = 'charts.zip';
        downloadLink.click();
    });
}

function buildCustomisationDiv(chartInfo) {
    var vcfMetadataSelectionHTML = "";
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
            i = 0;
            for (var key in jsonResult) {
                let fieldName = jsonResult[key];
                if (i == 0)
                    vcfMetadataSelectionHTML += '<div class="col-md-3"><p align="center">Additional series based on VCF genotype metadata:</p>';
                vcfMetadataSelectionHTML += '<div><input id="chartVCFSeries_' + fieldName + '_' + (i + 1) + '" type="checkbox" style="margin-top:0;" class="showHideSeriesBox" onchange="displayOrHideSeries(\'' + fieldName + '\', this.checked, ' + (i + chartTypes.get(currentChartType).series.length) + ');"> <label style="font-weight:normal;" for="chartVCFSeries_' + fieldName + '_' + (i + 1) + '">Cumulated ' + fieldName + ' data</label></div>';
                i++;
            }
            if (i > 0)
                vcfMetadataSelectionHTML += '</div>';

        },
        error: function (xhr, ajaxOptions, thrownError) {
            handleError(xhr, thrownError);
        }
    });
    let customisationDivHTML = "<div class='panel panel-default container-fluid' style=\"width: 80%;\"><div class='row panel-body panel-grey shadowed-panel graphCustomization'>";
    customisationDivHTML += '<div class="col-md-3"><p>Customisation options</p><b>Number of intervals</b> <input maxlength="4" size="4" type="text" id="intervalCount" value="1000" onchange="changeIntervalCount();"><br/>(between 50 and 1000)';
    if (vcfMetadataSelectionHTML != "" || chartInfo.selectIndividuals)
        customisationDivHTML += '<div id="plotIndividuals" class="margin-top-md"><b>Individuals accounted for</b> <img style="cursor:pointer; cursor:hand;" src="images/magnifier.gif" title="... in calculating Tajima\'s D or cumulating VCF metadata values"/> <select id="plotIndividualSelectionMode" onchange="onManualIndividualSelection(); toggleIndividualSelector($(\'#plotIndividuals\'), \'choose\' == $(this).val(), 10, \'onManualIndividualSelection\'); showSelectedIndCount($(this), $(\'#indSelectionCount\'));">' + getExportIndividualSelectionModeOptions($('select#genotypeInvestigationMode').val()) + '</select> <span id="indSelectionCount"></span></div>';
    customisationDivHTML += '</div>';
    
    customisationDivHTML += '<div id="chartTypeCustomisationOptions">';
	customisationDivHTML += vcfMetadataSelectionHTML;

    if (chartInfo.buildCustomisation !== undefined)
        customisationDivHTML += chartInfo.buildCustomisation();
    customisationDivHTML += '</div>'
    
    $("div#chartContainer div#customisationDiv").html(customisationDivHTML + "</div></div>");
    if (vcfMetadataSelectionHTML != "" || chartInfo.selectIndividuals)
        showSelectedIndCount($('#plotIndividualSelectionMode'), $('#indSelectionCount'));
}

function showSelectedIndCount(selectionObj, selectionLabelObj) {
	var selectedOption = selectionObj.find("option:selected"), chooseMode = selectedOption.val() == "choose";
	if (chooseMode)
		selectionLabelObj.text("");
	else if (selectedOption.val() == "")
		selectionLabelObj.text(" (" + indOpt.length + " selected)");
	else {
        var selectedIndCount = Object.keys(getSelectedIndividuals(selectedOption.val() == "allGroups" ? null : [parseInt(selectedOption.val())])).length;
        selectionLabelObj.text(" (" + (selectedIndCount == 0 ? indOpt.length : selectedIndCount) + " selected)");
    }
}

function displayOrAbort() {
    if (currentQueries.size > 0) {
        abortOngoingOperations();
    } else {
		abortedQueries = null;
		$("div#dynamicChartZones").html();
		Object.values(chart).forEach(x => x.destroy());
		chart = {};
		
		$('#densityLoadProgressContainer div').remove();
	    var displayedSequences = getSelectedSeqs();
	    for (var i=0; i<displayedSequences.length; i++)
	     	displayChart(i).then((result) => onDisplayChart(result));
    }
}

function applyChartType() {
	cachedResults = {};
	var typeSelect = document.getElementById("chartTypeList");
    currentChartType = typeSelect.options[typeSelect.selectedIndex].value;
    const chartInfo = chartTypes.get(currentChartType);
    
    if (chartInfo.enableCondition !== undefined){
        const failMessage = chartInfo.enableCondition();
        if (failMessage !== null) {
            $("#dynamicChartZones").hide();
            $("#densityLoadProgressContainer").html("<h3 style='margin-top:10px;'>Chart type unavailable</h3><p>" + failMessage + "</p></h3>");
        }
        else
            $("#densityLoadProgressContainer").empty();
    }

	Object.values(chart).forEach(x => x.destroy());
    chart = {};
	$("#dynamicChartZones").html("");
    $("#dynamicChartZones").show();
    localmin = {};
    localmax = {};
    
    buildCustomisationDiv(chartInfo);
    checkIfValidForSubmit();
    
    if (chartInfo.onLoad !== undefined)
        chartInfo.onLoad();
}

function buildDataPayLoad(i, displayedVariantType) {
    const chartInfo = chartTypes.get(currentChartType);
	
	let plotIndividuals = null;
	if (chartInfo.selectIndividuals) {
	    switch ($('#plotIndividualSelectionMode').val()) {
	        case "choose":
	            plotIndividuals = $('#plotIndividualSelectionMode').parent().parent().find("select.individualSelector").val();
	            break;
	        case "allGroups":
	            plotIndividuals = getSelectedIndividuals();
	            break;
            case "":
				plotIndividuals = [];
	            break;
	        default:
	            plotIndividuals = getSelectedIndividuals([parseInt($('#plotIndividualSelectionMode').val())]);
	            break;
	    }
	}

    let activeGroups = $(".genotypeInvestigationDiv").length;
	let query = {
        "variantSetId": $('#project :selected').data("id"),
        "callSetIds": getSelectedIndividuals(activeGroups !== 0 ? [1] : null, true),
        "discriminate": getDiscriminateArray(),
        "displayedSequence": getSelectedSeqs()[i],
        "displayedVariantType": displayedVariantType != "" ? displayedVariantType : null,
        "displayedRangeIntervalCount": parseInt($('#intervalCount').val()),
        "plotIndividuals": plotIndividuals,
        "start": $('#minposition').val() === "" ? -1 : parseInt($('#minposition').val()),
        "end": $('#maxposition').val() === "" ? -1 : parseInt($('#maxposition').val())
    };
    if (localmin[i] != null)
 	   query["displayedRangeMin"] = localmin[i];
    if (localmax[i] != null)
 	   query["displayedRangeMax"] = localmax[i];
    let genotypes = [];
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
        genotypes.push($(`#Genotypes${i + 1}`).val());
        mostsameratio.push($(`#mostSameRatio${i + 1}`).val());
        minmaf.push($(`#minMaf${i + 1}`).val() === null ? 0 : parseFloat($(`#minMaf${i + 1}`).val()));
        maxmaf.push($(`#maxMaf${i + 1}`).val() === null ? 50 : parseFloat($(`#maxMaf${i + 1}`).val()));
        minmissingdata.push($(`#minMissingData${i + 1}`).val() === null ? 0 : parseFloat($(`#minMissingData${i + 1}`).val()));
        maxmissingdata.push($(`#maxMissingData${i + 1}`).val() === null ? 100 : parseFloat($(`#maxMissingData${i + 1}`).val()));
        minhez.push($(`#minHeZ${i + 1}`).val() === null ? 0 : parseFloat($(`#minHeZ${i + 1}`).val()));
        maxhez.push($(`#maxHeZ${i + 1}`).val() === null ? 100 : parseFloat($(`#maxHeZ${i + 1}`).val()));
    }

    query["gtPattern"] = genotypes;
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

function onDisplayChart(result) {
    for (let seriesIndex in result.chartInfo.series) {
        const series = result.chartInfo.series[seriesIndex];
        const seriesData = (result.chartInfo.series.length == 1) ? result.jsonResult : result.jsonResult[seriesIndex];
        const seriesValues = new Array();
        for (let key of result.keys)
            seriesValues.push(seriesData[key]);

        chart[result.i].addAxis({
            id: series.name,
            title: {
                text: undefined,  //series.yAxisTitle,
            },
            lineWidth: 3,
            lineColor: colorTab[seriesIndex],
        });

        chart[result.i].addSeries({
            name: series.name,
            marker: {
                enabled: series.enableMarker,
            },
            lineWidth: series.lineWidth,
            color: colorTab[seriesIndex],
            data: seriesValues,
            yAxis: series.name,
        });
    }
//    $("div#chartContainer div#dynamicChartZones").toggle(!isNaN(result.intervalSize));

    if (result.chartInfo.onDisplay !== undefined)
        result.chartInfo.onDisplay();
}

async function displayChart(i) {
    return new Promise(async (resolve, reject) => {
        const chartInfo = chartTypes.get(currentChartType);
        
        var zoomApplied = localmin[i] != null && localmax[i] != null;
        if (document.getElementById(`resetZoom${i}`) === null) {
            const zoomButton = `<input type="button" id="resetZoom${i}" value="Reset zoom" style="display:none; position:absolute; right:60px; margin-top:12px; height:24px; z-index:5;" onclick="localmin[${i}]=null; localmax[${i}]=null; displayChart(${i}).then((result) => onDisplayChart(result));">`;
            $(zoomButton).insertBefore(document.getElementById(`densityChartArea${i}`));
        }
        $(`input#resetZoom${i}`).toggle(zoomApplied);

        var displayedSequences = getSelectedSeqs();

        if (Object.keys(chart).length === displayedSequences.length && i === null) {
            if (zoomApplied) {
                chart[i].showLoading("Zooming in...");
            } else if (currentQueries.size == 0) {
				Object.values(chart).forEach(x => x.destroy());
                chart = {};
            }
        }

		var chartArea = $('#densityChartArea' + i);
        if (chartArea.length ==0) {
            var densityChartArea = `<div id="densityChartArea${i}" data-sequence="${displayedSequences[i]}" style="min-width:350px; overflow:hidden; margin:5px auto;"></div>`;
            $("div#dynamicChartZones").append(densityChartArea);
      	}
        else
            chartArea.attr('data-sequence', displayedSequences[i]);

        var displayedVariantType = $("select#chartVariantTypeList").val();
        var dataPayLoad = buildDataPayLoad(i, displayedVariantType);
        if (chartInfo.buildRequestPayload !== undefined)
            dataPayLoad = chartInfo.buildRequestPayload(dataPayLoad);
        if (dataPayLoad === null) return;
        const loadDiv = `<div id="densityLoadProgress_${getSelectedSeqs()[i]}"></div>`;
        $(`div#densityLoadProgressContainer`).append($(loadDiv));
       	startProcess(i, null);
	    calculateObjectHash(dataPayLoad)
	      .then(hash => {
	        let cachedResult = cachedResults[hash];
	        if (cachedResult != null) {
	            displayResult(chartInfo, cachedResult, displayedVariantType, i, resolve);
				$('.showHideSeriesBox:checked').each(function() {
					let splitCheckboxId = $(this)[0].id.split("_");
					addMetadataSeries(splitCheckboxId[1], parseInt(splitCheckboxId[2]), i);
				});
			}
	        else {
	            $.ajax({
	                url: chartInfo.queryURL + '/' + encodeURIComponent($('#project :selected').data("id")) + "?progressToken=" + token + "::" + currentChartType + "_" + getSelectedSeqs()[i],
           			type: "POST",
	                contentType: "application/json;charset=utf-8",
	                headers: buildHeader(token, $('#assembly').val()),
	                data: JSON.stringify(dataPayLoad),
	                success: function(jsonResult) {
	                    if (jsonResult.length == 0)
	                        return; // probably aborted

					    $('.showHideSeriesBox:checked').each(function() {
							let splitCheckboxId = $(this)[0].id.split("_");
							addMetadataSeries(splitCheckboxId[1], parseInt(splitCheckboxId[2]), i);
						});

	                    if (localmin[i] == null && localmax[i] == null)   // FIXME: for now since we can't zoom out progressively, we only cache the totally unzoomed region's data
	                        cachedResults[hash] = jsonResult;

	                    displayResult(chartInfo, jsonResult, displayedVariantType, i, resolve);
	                },
	                error: function(xhr, ajaxOptions, thrownError) {
	                    handleError(xhr, thrownError);
	                }
	            });
	        }
	      })
	      .catch(error => {
	        console.error(error);
	    });
    });
}

async function calculateObjectHash(obj) {
  const data = JSON.stringify(obj);
  return data.split('').reduce((hash, char) => {
        return char.charCodeAt(0) + (hash << 6) + (hash << 16) - hash;
  }, 0);
}

function displayResult(chartInfo, jsonResult, displayedVariantType, i, resolve) {
    const keys = chartInfo.series.length == 1 ? Object.keys(jsonResult) : Object.keys(jsonResult[0]);
    var intervalSize = parseInt(keys[1]) - parseInt(keys[0]);
    chartJsonKeys.push(keys);

    let totalVariantCount = 0;
    if (currentChartType == "density") {
        for (let key of keys)
            totalVariantCount += jsonResult[key];
    }

    var highchart = Highcharts.chart(`densityChartArea${i}`, {
        chart: {
	        type: 'spline',
	        height: 350,
	        zoomType: 'x',
		    borderColor: '#EBBA95',
			borderWidth: 2,
	        style: {
	            fontSize: '1.5rem'
	        }
	    },
        title: {
            text: chartInfo.title.replace("{{totalVariantCount}}", totalVariantCount).replace("{{displayedVariantType}}", displayedVariantType).replace("{{displayedSequence}}", getSelectedSeqs()[i]),
        },
        subtitle: {
            text: isNaN(intervalSize) ? '' : chartInfo.subtitle.replace("{{intervalSize}}", intervalSize),
        },
	    tooltip: {
            shared: true,
            crosshairs: true,
	        style: {
	             fontSize: 12
	        }
	    },
        xAxis: {
            categories: keys,
            title: {
                text: chartInfo.xAxisTitle,
            },
            events: {
                afterSetExtremes: function (e) {
                    if ("zoom" == e.trigger) {   // reload for best resolution
                        var xAxisDataArray = this.chart.series[0].data;
                        localmin[i] = e.min == null ? null : xAxisDataArray[parseInt(e.min)].category;
        				localmax[i] = e.max == null ? null : xAxisDataArray[parseInt(e.max)].category;
                        displayChart(i).then((result) => onDisplayChart(result));
                        e.preventDefault();
                    }
                }
            },
	        labels: {
	            style: {
	                fontSize: 10
	            }
	        }
        },
        yAxis: {
            text: undefined,
            visible: false,
	        labels: {
	            style: {
	                fontSize: 10
	            }
	        }
        },
        plotOptions: {
            series: {
                marker: {
                    radius: 3
                }
            },
            line: {
                dataLabels: {
                    enabled: false
                },
                enableMouseTracking: true
            }
        },
        exporting: {
            enabled: true,
            buttons: {
                contextButton: {
                    menuItems: ["viewFullscreen", "printChart",
                        "separator",
                        "downloadPNG", "downloadPDF", "downloadSVG",
                        "separator",
                        "downloadCSV", "downloadXLS"]
                }
            }
        }
    });
    chart[i] = highchart;
    resolve({jsonResult, chartInfo, i, keys, intervalSize});
    
    $("div#chartContainer div#dynamicChartZones").toggle(!isNaN(intervalSize));
 
    if (chartInfo.onDisplay !== undefined)
        chartInfo.onDisplay();
}

function addMetadataSeries(fieldName, colorIndex, i) {
    var displayedVariantType = $("select#chartVariantTypeList").val();
    var dataPayLoad = buildDataPayLoad(i, displayedVariantType);
    dataPayLoad["vcfField"] = fieldName;
    dataPayLoad["plotIndividuals"] = $('#plotIndividualSelectionMode').val() == "choose" ? $('#plotIndividualSelectionMode').parent().parent().find("select.individualSelector").val() : ($('#plotIndividualSelectionMode').val() == "allGroups" ? getSelectedIndividuals() : ($('#plotIndividualSelectionMode').val() == "" || $('#plotIndividualSelectionMode').val() == undefined ? [] : getSelectedIndividuals([parseInt($('#plotIndividualSelectionMode').val())])))
    const field = fieldName !== null ? "_" + fieldName : "";
    let progressDivId = `densityLoadProgress_${getSelectedSeqs()[i]}${field}`;
    if ($("#" + progressDivId).length == 0)
	    $(`div#densityLoadProgressContainer`).append($(`<div id=` + progressDivId + `></div>`));
    else
    	$("#" + progressDivId).show();

    startProcess(i, fieldName);

    $.ajax({
        url: 'rest/gigwa/vcfFieldPlotData/' + encodeURIComponent($('#project :selected').data("id")) + "?progressToken=" + token + "::" + currentChartType + field + "_" + getSelectedSeqs()[i],
        type: "POST",
        contentType: "application/json;charset=utf-8",
        headers: buildHeader(token, $('#assembly').val()),
        data: JSON.stringify(dataPayLoad),
        success: function(jsonResult) {
            if (jsonResult.length == 0)
                return;	// probably aborted

            var jsonKeys = Object.keys(jsonResult);
            var intervalSize = parseInt(jsonKeys[1]) - parseInt(jsonKeys[0]);

            var jsonValues = new Array();
            for (var j = 0; j < jsonKeys.length; j++) {
                jsonValues.push(jsonResult[jsonKeys[j]]);
                jsonKeys[j] = parseInt(parseInt(jsonKeys[j]) + intervalSize / 2);
            }
            
            chart[i].addAxis({ // Secondary yAxis
                id: fieldName,
                title: {
                    text: "Cumulated " + fieldName
                },
                lineWidth: 3,
                lineColor: colorTab[colorIndex],
                opposite: true,
            });

            chart[i].addSeries({
                name: fieldName,
                type: 'spline',
                lineWidth: 1,
                color: colorTab[colorIndex],
                yAxis: fieldName,
                marker: {
                    enabled: false
                },
                data: jsonValues
            });
            $('.showHideSeriesBox').prop('disabled', false);
        },
        error: function(xhr, ajaxOptions, thrownError) {
            handleError(xhr, thrownError);
            $('.showHideSeriesBox').prop('disabled', false);

            finishProcess(i, fieldName);
        }
    });
}

function startProcess(i, fieldName) {
    // This is probably unnecessary in most cases, but it may avoid conflicts in certain synchronisation edge cases
    if (progressTimeoutId != null)
        clearTimeout(progressTimeoutId);
        
    currentQueries.add(i + "_" + fieldName);

    $("#chartTypeList").prop("disabled", true);
    $("#chartVariantTypeList").prop("disabled", true);
    
    $("#showChartButton").removeClass("btn-success").addClass("btn-danger").html("Abort");
    
    progressTimeoutId = checkChartLoadingProgress(i, fieldName);
}

function finishProcess() {
    $("#chartTypeList").prop("disabled", false);
    $("#chartSequenceList").prop("disabled", false);
    $("#chartVariantTypeList").prop("disabled", false);
    
    $("#densityLoadProgressContainer div").remove();

    if (progressTimeoutId != null) {
        clearTimeout(progressTimeoutId);
        progressTimeoutId = null;
    }

    $("#showChartButton").addClass("btn-success").removeClass("btn-danger").html("Show");
}

function checkChartLoadingProgress(i, fieldName) {
	let finalIndex = i, finalFieldName = fieldName;
    const field = finalFieldName !== null ? "_" + finalFieldName : "", chrToken = token + "::" + currentChartType + field + "_" + $("#densityChartArea" + finalIndex).data("sequence");

	if (abortedQueries != null)	// the fact that it's not null means all current queries need to be aborted
		$.ajax({
	        url: abortUrl,
	        async: false,
	        type: "DELETE",
	        headers: {
	            "Authorization": "Bearer " + chrToken
	        },
	        success: function (jsonResult) {
	            if (!jsonResult.processAborted)
	                console.log("Unable to abort!");
			    abortedQueries.add(chrToken);
	        },
	        error: function (xhr, ajaxOptions, thrownError) {
	            handleError(xhr, thrownError);
	        }
	    });

    $.ajax({
        url: progressUrl + "?progressToken=" + chrToken,
        type: "GET",
        contentType: "application/json;charset=utf-8",
        headers: {
            "Authorization": "Bearer " + token
        },
        success: function (jsonResult, textStatus, jqXHR) {
            if (jsonResult == null && abortedQueries == null) {
				if (emptyResponseCountsByProcess[chrToken] == null)
					emptyResponseCountsByProcess[chrToken] = 1;
				else
					emptyResponseCountsByProcess[chrToken]++;
				if (emptyResponseCountsByProcess[chrToken] > 10) {
					console.log("Giving up requesting progress for process " + chrToken);
					emptyResponseCountsByProcess[chrToken] = null;
					if (abortedQueries != null && abortedQueries.has(chrToken))
						abortedQueries.delete(chrToken);
	               	currentQueries.delete(finalIndex + "_" + finalFieldName);
	               	if (currentQueries.size == 0)
		                finishProcess();
				}
				else
                	setTimeout("checkChartLoadingProgress(" + finalIndex + ", " + (finalFieldName != null ? "'" + finalFieldName + "'" : null) + ");", minimumProcessQueryIntervalUnit * getSelectedSeqs().length);
            }
            else if (jsonResult != null && jsonResult['complete'] == true) {
				document.getElementById(`densityLoadProgress_${$(`#densityChartArea${finalIndex}`).attr('data-sequence')}${field}`).innerHTML = jsonResult['progressDescription'];
				$(`#densityLoadProgress_${$(`#densityChartArea${finalIndex}`).attr('data-sequence')}${field}`).fadeOut(1000);
               	emptyResponseCountsByProcess[chrToken] = null;
               	currentQueries.delete(finalIndex +"_" + finalFieldName);
               	if (currentQueries.size == 0) {
	                finishProcess();
					document.getElementById('exportButton').style.display = getSelectedSeqs().length > 1 ? "block" : "none";
	            }
            }
            else if (jsonResult != null && jsonResult['aborted'] == true) {
				if (abortedQueries != null && abortedQueries.has(chrToken))
					abortedQueries.delete(chrToken);
				currentQueries.delete(finalIndex +"_" + finalFieldName);
				if (currentQueries.size == 0)
	                finishProcess();
            }
            else {
                if (jsonResult != null && jsonResult['error'] != null) {
                    parent.totalRecordCount = 0;
                    alert("Error occurred:\n\n" + jsonResult['error']);
					if (abortedQueries != null && abortedQueries.has(chrToken))
						abortedQueries.delete(chrToken);
	               	currentQueries.delete(finalIndex +"_" + finalFieldName);
	               	if (currentQueries.size == 0)
						finishProcess();
                    $('#density').modal('hide');
                    emptyResponseCountsByProcess[chrToken] = null;
                } else {
					if (jsonResult != null)
                    	document.getElementById(`densityLoadProgress_${$(`#densityChartArea${finalIndex}`).attr('data-sequence')}${field}`).innerHTML = jsonResult['progressDescription'];
                	setTimeout("checkChartLoadingProgress(" + finalIndex + ", " + (finalFieldName != null ? "'" + finalFieldName + "'" : null) + ");", minimumProcessQueryIntervalUnit * getSelectedSeqs().length);
                }
            }
        },
        error: function(xhr, thrownError) {
            handleError(xhr, thrownError);
        }
    });
}

function abortOngoingOperations() {
	abortedQueries = new Set();	// the fact that it's not null means all current queries need to be aborted
}

function displayOrHideSeries(fieldName, isChecked, colorIndex) {
	if (isChecked)
		abortedQueries = null;
	var chartIndex = 0;
    Object.values(chart).forEach(function (x) {
		if (isChecked)
			addMetadataSeries(fieldName, colorIndex, chartIndex++);
		else if (x.get(fieldName) != null)
			x.get(fieldName).remove();
    });
}

function displayOrHideThreshold(isChecked) {
    if (Object.keys(chart).length === 0)
        return;
    
    const chartInfo = chartTypes.get(currentChartType);
    if (isChecked) {
        const threshold = parseFloat($("#fstThreshold").val());
        for (let i = 0; i < Object.keys(chart).length; i++) {
            chart[i].addSeries({
                id: "threshold",
                name: "Threshold",
                marker: {enabled: false},
                lineWidth: 0.5,
                color: "#CC0000",
                data: chartJsonKeys[i].map(val => threshold),
                yAxis: chartInfo.series[0].name,
            }, true);
        }
    } else {
        const series = [];
        Object.values(chart).forEach(x => series.push(x.get("threshold")));
        series.forEach(x => x !== undefined ? x.remove() : x);
    }
}

function changeIntervalCount() {
    let tempValue = parseInt($('#intervalCount').val());
    if (isNaN(tempValue) || tempValue > 1000)
        $("#intervalCount").val(1000);
    else if (tempValue < 50)
        $("#intervalCount").val(50);
}

function setFstThreshold(){
    const threshold = parseFloat($("#fstThreshold").val());
    const series = [];
    Object.values(chart).forEach(x => series.push(x.get("threshold")));
    for (let i = 0; i < series.length; i++) {
        if (series[i] !== undefined) {
            series[i].setData(chartJsonKeys[i].map(val => threshold), true, true)
        }
    }
}

function setFstGroupingOption() {
    const option = $("#plotGroupingSelectionMode").find(":selected").val();
    let fieldValues = new Set();
    let selectedIndividuals = getSelectedIndividuals();
    $("#plotMetadata").css("display", "block");
    const groupSelect = $("select#plotGroupingMetadataValues");
    if (option != "__")
        $.ajax({
	        url: distinctIndividualMetadata + '/' + referenceset + "?projID=" + document.getElementById('project').options[document.getElementById('project').options.selectedIndex].dataset.id.split(idSep)[1],
	        type: "POST",
	        data: JSON.stringify({"individuals" : selectedIndividuals.length == 0 ? null : selectedIndividuals}),
	        contentType: "application/json;charset=utf-8",
	        headers: buildHeader(token, $('#assembly').val()),
	        success: function (metaDataValues) {
				if (metaDataValues[option] == null)
					return;

		        metaDataValues[option].forEach(function (mdVal) {
	                fieldValues.add(mdVal);
		        });

		        let selectedSeqs = "";
		        let orderedValues = Array.from(fieldValues.values());
		        orderedValues.sort();
		        orderedValues.forEach(function (value){
		            selectedSeqs += '<option value="' + value + '">' + value + '</option>';
		        });
		        groupSelect.html(selectedSeqs);
		        groupSelect.change();
	        }
	    });
	else {
		let selectOptions = "";
		for (var i=1; i<=getGenotypeInvestigationMode(); i++)
			selectOptions += '<option value="' + i + '">Investigation group #' + i + '</option>';
		groupSelect.html(selectOptions);
		if (!areGroupsOverlapping(groupSelect.val()))
			groupSelect.find('option').prop('selected', true);
		groupSelect.change();
	}
}

$(document).on("ready", function() {
    $("#density").on("hidden.bs.modal", function () {
        if (currentQueries.size > 0)
            abortOngoingOperations();
    });
    
    $(window).on('beforeunload', function() {
        if (currentQueries.size > 0)
            abortOngoingOperations();
    });
});