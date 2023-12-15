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
var minimumProcessQueryIntervalUnit = 500;
var chart = [];
var displayedRangeIntervalCount = 200;
var dataBeingLoaded = false;
let localmin, localmax;
let chartJsonKeys = []
let colorTab = ['#396AB1', '#DA7C30', '#3E9651', '#CC2529', '#535154', '#6B4C9A', '#922428', '#948B3D'];
var currentChartType = null;
let progressTimeoutId = null;
var emptyResponseCountsByProcess = [];

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
    ["fst", {
        displayName: "Fst",
        queryURL: selectionFstDataURL,
        title: "Fst value for {{displayedVariantType}} variants on sequence {{displayedSequence}}",
        subtitle: "Weir and Cockerham Fst estimate calculated between selected groups in an interval of size {{intervalSize}} around each point",
        xAxisTitle: "Positions on selected sequence",
        series: [{
            name: "Fst estimate",
//            lineWidth: 2,
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
                     +   '<b>... values defining groups</b> (2 or more)<br/><select id="plotGroupingMetadataValues" multiple size="7" style="min-width:150px;" onchange="let groups = $(this).val(); $(\'#showChartButton\').prop(\'disabled\', groups == null || groups.length < 2);"></select>'
                     + '</div>');
        },
        buildRequestPayload: function (payload){
            const groupOption = $("#plotGroupingSelectionMode").find(":selected").val();
            if (groupOption != "__"){
                const selectedValues = $("#plotGroupingMetadataValues").val();
                if (selectedValues === null || selectedValues.length < 2){
                    return null;
                }
                
                let groups = new Map();
                callSetResponse.forEach(function (callset) {
                    if (callset.info === undefined) return;
                    
                    const field = callset.info[groupOption];
                    if (field === undefined || field.length <= 0) return;
                    
                    const fieldValue = callset.info[groupOption][0];
                    if (fieldValue !== undefined) {
                        let valueGroup = groups.get(fieldValue);
                        if (valueGroup !== undefined) {
                            valueGroup.push(callset.name);
                        } else if (selectedValues.includes(fieldValue)) {
                            groups.set(fieldValue, [callset.name]);
                        }
                    }
                });

                payload.displayedAdditionalGroups = [];
                for (const group of groups.values())
                    payload.displayedAdditionalGroups.push(group);
            }
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
        title: "Tajima's D value for {{displayedVariantType}} variants on sequence {{displayedSequence}}",
        subtitle: "Tajima's D value calculated in an interval of size {{intervalSize}} around each point (excluding missing and more than multi-allelic variants)",
        xAxisTitle: "Positions on selected sequence",
        selectIndividuals: true,
        series: [
            {
                name: "Tajima's D",
//            	lineWidth: 2,
            	enableMarker: true
            },
            {
                name: "Segregating sites",
//            	lineWidth: 1,
            	enableMarker: true
            },
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

    $('div#chartContainer').html('<div id="additionalCharts" style="display:none; margin-top:10px"></div><div id="densityChartArea1" style="min-width:350px; height:415px; margin:0 auto; overflow:hidden;"></div>');
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
    let options = ""
    if (getGenotypeInvestigationMode() > 1 && !areGroupsOverlapping())
        options += '<option value="__">Investigated groups</option>';
    else if (areGroupsOverlapping())
     	alert("Investigated groups are overlapping, you may not use them for Fst calculation!");
    const fields = callSetMetadataFields.slice();
    fields.sort();
    fields.forEach(function (field){
        options += '<option value="' + field + '">' + field + '</option>';
    });
    return options;
}

function createCustomSelect(sequences) {
    var maxSelections = 5;
    var maxVisibleOptions = 10;

    // Création de l'élément div avec la classe "custom-select"
    var customSelect = document.createElement("div");
    customSelect.classList.add("custom-select");
    customSelect.id = "chartSequenceList";

    // Création de l'élément div avec la classe "select-trigger"
    var selectTrigger = document.createElement("div");
    selectTrigger.classList.add("select-trigger");
    selectTrigger.innerHTML = "Sequences &#9660;";


    // Création de l'élément div avec la classe "select-options"
    var selectOptions = document.createElement("div");
    selectOptions.id = "selectOptions";
    selectOptions.classList.add("select-options");
    selectOptions.style.display = "none";
    selectOptions.style.maxHeight = "auto";

    const totalOptions = Object.keys(sequences).length;

    if (totalOptions > maxVisibleOptions) {
        selectOptions.style.maxHeight = (maxVisibleOptions * 27.5) + "px";
        selectOptions.style.overflowY = "auto";
    }

    for (let key in sequences) {
        // $("#chartSequenceList").append("<option value='" + sequences[key] + "'>" + sequences[key] + "</option>");
        var input = document.createElement("input");
        input.type = "checkbox";
        input.id = sequences[key];

        var label = document.createElement("label");
        label.setAttribute("for", sequences[key]);
        label.textContent = sequences[key];
        label.style.marginLeft = "2px";

        selectOptions.appendChild(input);
        selectOptions.appendChild(label);
        selectOptions.appendChild(document.createElement("br"));
    }

    // Ajout des éléments au DOM
    customSelect.appendChild(selectTrigger);
    customSelect.appendChild(selectOptions);

    // Gestion des événements
    selectTrigger.addEventListener('click', function (event) {
        if (selectOptions.style.display === 'block') {
            selectOptions.style.display = 'none';
        } else {
            selectOptions.style.display = 'block';
        }
        event.stopPropagation();
    });

    selectOptions.addEventListener('click', function (event) {
        event.stopPropagation();
    });

    document.addEventListener('click', function () {
        selectOptions.style.display = 'none';
    });

    var inputs = selectOptions.querySelectorAll('input');
    inputs.forEach(function (input) {
        input.addEventListener('change', function () {
            if (!document.getElementById("densityLoadProgressContainer")) {
                const loadDiv = `<div id="densityLoadProgressContainer" class="panel panel-grey panel-default container-fluid" style="font-weight:bold; height: 60px; overflow: auto; text-align: center; width: 80%"></div>`;
                const label = document.createElement("p");
                label.id = "densityLoadProgressContainerText";
                label.innerText = "Click on Show button to load Graphs!";
                $(loadDiv).insertAfter('#additionalCharts');
                document.getElementById('densityLoadProgressContainer').append(label);
            }
            var selectedCount = selectOptions.querySelectorAll('input:checked').length;
            if (selectedCount !== 0) {
                document.getElementById('showChartButton').removeAttribute('disabled');
            }
            else {
                document.getElementById('showChartButton').setAttribute('disabled', 'true');
            }
            if (selectedCount > 1) {
                document.getElementById('exportButton').style.display = "block";
            }
            else {
                document.getElementById('exportButton').style.display = "none";
            }
            if (selectedCount > maxSelections) {
                this.checked = false;
            }
        });
    });

    selectTrigger.style.cursor = 'pointer';
    customSelect.style.border = '1px solid rgb(118, 118, 118)';
    customSelect.style.display = 'inline-block';
    customSelect.style.backgroundColor = "white";
    customSelect.style.borderRadius = "2px";
    customSelect.style.padding = "2px";
    selectOptions.style.zIndex = "999";
    selectOptions.style.position = "absolute";
    selectOptions.style.border = '1px solid rgb(118, 118, 118)';
    selectOptions.style.backgroundColor = "white";
    selectOptions.style.padding = "5px";
    selectOptions.style.borderRadius = "2px";


    return customSelect;
}

function getSelectedItems() {
    var selectOptions = document.getElementById("selectOptions");
    var selectedItems = [];
    var inputs = selectOptions.querySelectorAll('input');
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
                            'Data to display: <select id="chartTypeList" style="margin-right:20px; heigh:25px;" onchange="setChartType(this);"></select>' + 
                            'Choose sequences: <div id="customSelectContainer"></div>' +
                            'Choose a variant type: <select id="chartVariantTypeList" style="height: 25px;" onchange="if (options.length > 2) loadChart();"><option value="">ANY</option></select>' +
                            '<button id="exportButton" style="float: right; display: none" onclick="captureCharts()" type="button">Export all graphs</button>' +
                        '</div></form>');
    $(headerHtml).insertBefore('div#additionalCharts');
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
	
    loadChart();
}

// Function to capture charts as PNG images
function captureCharts() {
    var imageUrls = [];
    chart.forEach(function(sampleChart, index) {
        domtoimage.toPng(sampleChart.renderTo).then(function(dataUrl) {
            imageUrls[index] = dataUrl;

            // Check if all charts have been captured
            if (imageUrls.filter(Boolean).length === chart.length) {
                createZip(imageUrls);
            }
        });
    });
}

// Function to create and download the zip file
function createZip(imageUrls) {
    var zip = new JSZip();

    imageUrls.forEach(function(dataUrl, index) {
        zip.file('chart_' + currentChartType + '_' + $(`#densityChartArea${index + 1}`).data('sequence') + '.png', dataUrl.substr(dataUrl.indexOf(',') + 1), { base64: true });
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
    const hasVcfMetadata = $("#vcfFieldFilterGroup1 input").length > 0;
    
    let customisationDivHTML = "<div class='panel panel-default container-fluid' style=\"width: 80%;\"><div class='row panel-body panel-grey shadowed-panel graphCustomization'>";
    customisationDivHTML += '<div class="pull-right"><button id="showChartButton" class="btn btn-success" onclick="displayOrAbort();" style="z-index:999; margin-top:40px; margin-left:-60px;" disabled>Show</button></div>';
    customisationDivHTML += '<div class="col-md-3"><p>Customisation options</p><b>Number of intervals</b> <input maxlength="3" size="3" type="text" id="intervalCount" value="' + displayedRangeIntervalCount + '" onchange="changeIntervalCount()"><br/>(between 50 and 500)';
    if (hasVcfMetadata || chartInfo.selectIndividuals)
        customisationDivHTML += '<div id="plotIndividuals" class="margin-top-md"><b>Individuals accounted for</b> <img style="cursor:pointer; cursor:hand;" src="images/magnifier.gif" title="... in calculating Tajima\'s D or cumulating VCF metadata values"/> <select id="plotIndividualSelectionMode" onchange="onManualIndividualSelection(); toggleIndividualSelector($(\'#plotIndividuals\'), \'choose\' == $(this).val(), 10, \'onManualIndividualSelection\'); showSelectedIndCount($(this), $(\'#indSelectionCount\'));">' + getExportIndividualSelectionModeOptions($('select#genotypeInvestigationMode').val()) + '</select> <span id="indSelectionCount"></span></div>';
    customisationDivHTML += '</div>';
    
    customisationDivHTML += '<div id="chartTypeCustomisationOptions">';
    if (hasVcfMetadata) {
        customisationDivHTML += '<div class="col-md-3"><p align="center">Additional series based on VCF genotype metadata:</p>';
        $("#vcfFieldFilterGroup1 input").each(function(index) {
            let fieldName = this.id.substring(0, this.id.lastIndexOf("_"));
            customisationDivHTML += '<div><input id="chartVCFSeries_' + fieldName + '" type="checkbox" style="margin-top:0;" class="showHideSeriesBox" onchange="displayOrHideSeries(\'' + fieldName + '\', this.checked, ' + (index + chartTypes.get(currentChartType).series.length) + ')"> <label style="font-weight:normal;" for="chartVCFSeries_' + fieldName + '">Cumulated ' + fieldName + ' data</label></div>';
        });
        customisationDivHTML += "</div>"
    }

    if (chartInfo.buildCustomisation !== undefined)
        customisationDivHTML += chartInfo.buildCustomisation();
    customisationDivHTML += '</div>'
    
    $("div#chartContainer div#additionalCharts").html(customisationDivHTML + "</div></div>");
    if (hasVcfMetadata || chartInfo.selectIndividuals)
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
    if (dataBeingLoaded) {
        abortOngoingOperation();
    } else {
        displayAllChart();
    }
}

function setChartType(typeSelect) {
    currentChartType = typeSelect.options[typeSelect.selectedIndex].value;
    const chartInfo = chartTypes.get(currentChartType);
    
    if (chartInfo.enableCondition !== undefined){
        const failMessage = chartInfo.enableCondition();
        var displayedSequences = getSelectedItems();
        for (var i = 0; i < displayedSequences.length; i++) {
            if (failMessage !== null) {
                $("#additionalCharts").hide();
                $("#densityChartArea" + (i + 1)).html("<h3>Chart type unavailable</h3><p>" + failMessage + "</p></h3>");
                return;
            } else {
                $("#densityChartArea" + (i + 1)).empty();
            }
        }
    }
    $("#additionalCharts").show();
    
    if (chart.length !== 0){
        chart.forEach(x => x.destroy());
        chart = [];
    }
    
    buildCustomisationDiv(chartInfo);
    
    if (chartInfo.onLoad !== undefined)
        chartInfo.onLoad();
    
    loadChart();
}

function buildDataPayLoad(displayedSequence, displayedVariantType) {
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
        "searchMode": 0,
        "getGT": false,

        "referenceName": getSelectedSequences(),
        "selectedVariantTypes": getSelectedTypes(),
        "alleleCount": getSelectedNumberOfAlleles(),
        "start": $('#minposition').val() === "" ? -1 : parseInt($('#minposition').val()),
        "end": $('#maxposition').val() === "" ? -1 : parseInt($('#maxposition').val()),
        "variantEffect": $('#variantEffects').val() === null ? "" : $('#variantEffects').val().join(","),
        "geneName": getSelectedGenesIds(),

        "callSetIds": getSelectedIndividuals(activeGroups !== 0 ? [1] : null, true),

        "discriminate": $('#discriminate').prop('checked'),
        "pageSize": 100,
        "pageToken": "0",
        "displayedSequence": displayedSequence,
        "displayedVariantType": displayedVariantType != "" ? displayedVariantType : null,
        "displayedRangeMin": localmin,
        "displayedRangeMax": localmax,
        "displayedRangeIntervalCount": displayedRangeIntervalCount,
        "plotIndividuals": plotIndividuals,
    };
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

function loadChart(minPos, maxPos) {    
    const chartInfo = chartTypes.get(currentChartType);
    
    var zoomApplied = minPos != null && maxPos != null;
    if (zoomApplied)
        displayAllChart(minPos, maxPos, null);
    else
        $("div#chartContainer div#additionalCharts").show();
}

function clearGraphs() {
    chartJsonKeys = [];
    chart.forEach(x => x.destroy());
    chart = [];
    var i = 2;
    var div = document.getElementById(`densityChartArea${i}`)
    while (div) {
        div.remove();
        i++;
        div = document.getElementById(`densityChartArea${i}`)
    }
}

async function displayAllChart(minPos, maxPos, index) {
    if (index === undefined) {
        clearGraphs();
    }
    var displayedSequences = getSelectedItems();
    function processChart(i) {
        if (i < displayedSequences.length) {
            if (index !== undefined) {
                i = index;
            }
            startProcess(i, null);
            displayChart(minPos, maxPos, i, index !== undefined)
                .then((result) => {
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
                    $("div#chartContainer div#additionalCharts").toggle(!isNaN(result.intervalSize));
                    if (!isNaN(result.intervalSize) && chart.length === displayedSequences.length)
                        $('.showHideSeriesBox').change();

                    if (result.chartInfo.onDisplay !== undefined)
                        result.chartInfo.onDisplay();
                    if (index !== undefined) {
                        return
                    }
                    processChart(i + 1); // Appeler récursivement pour le prochain graphique
                });
        }
    }
    processChart(0);
}

async function displayChart(minPos, maxPos, i, alreadyCreated) {
    return new Promise(async (resolve, reject) => {
        localmin = minPos;
        localmax = maxPos;
        const chartInfo = chartTypes.get(currentChartType);

        var zoomApplied = minPos != null && maxPos != null;
        if (document.getElementById(`resetZoom${i + 1}`) === null) {
            const zoomButton = `<input type="button" id="resetZoom${i + 1}" value="Reset zoom" style="display:none; float:right; margin-top:3px; height:25px;" onclick="displayAllChart(null, null, ${i});">`;
            $(zoomButton).insertBefore(document.getElementById(`densityChartArea${i + 1}`));
        }
        $(`input#resetZoom${i + 1}`).toggle(zoomApplied);

        /*if (dataBeingLoaded)
            abortOngoingOperation();*/

        var displayedSequences = getSelectedItems();

        if (chart.length === displayedSequences.length && i === null) {
            if (zoomApplied) {
                chart[i].showLoading("Zooming in...");
            } else if (!dataBeingLoaded) {
                chart.forEach(x => x.destroy());
                chart = [];
            }
        }

        // Set the interval count until the next chart reload
        let tempValue = parseInt($('#intervalCount').val());
        if (isNaN(tempValue))
            displayedRangeIntervalCount = 200;
        else if (tempValue > 500)
            displayedRangeIntervalCount = 500;
        else if (tempValue < 50)
            displayedRangeIntervalCount = 50;
        else
            displayedRangeIntervalCount = tempValue;

        if (i > 0 && document.getElementById(`densityChartArea${i + 1}`) === null) {
            var densityChartArea = `<div id="densityChartArea${i + 1}" data-sequence="${displayedSequences[i]}" style="min-width:350px; height:415px; margin:0 auto; overflow:hidden;"></div>`;
            $(densityChartArea).insertAfter(`div#densityChartArea${i}`)
        }
        else if (i === 0) {
            $('#densityChartArea1').data('sequence', displayedSequences[i]);
        }
        var displayedSequence = displayedSequences[i];
        var displayedVariantType = $("select#chartVariantTypeList").val();
        var dataPayLoad = buildDataPayLoad(displayedSequence, displayedVariantType);
        if (chartInfo.buildRequestPayload !== undefined)
            dataPayLoad = chartInfo.buildRequestPayload(dataPayLoad);
        if (dataPayLoad === null) return;
        const loadDiv = `<div id="densityLoadProgress_${$(`#densityChartArea${i + 1}`).data('sequence')}"></div>`;
        $(`div#densityLoadProgressContainer`).append($(loadDiv));

        $.ajax({
            url: chartInfo.queryURL + '/' + encodeURIComponent($('#project :selected').data("id")) + "?progressToken=" + token + "_" + currentChartType + "_" + $(`#densityChartArea${i + 1}`).data('sequence'),
            type: "POST",
            contentType: "application/json;charset=utf-8",
            headers: buildHeader(token, $('#assembly').val()),
            data: JSON.stringify(dataPayLoad),
            success: function (jsonResult) {
                if (jsonResult.length == 0)
                    return; // probably aborted

                // TODO : Key to the middle of the interval ?
                const keys = chartInfo.series.length == 1 ? Object.keys(jsonResult) : Object.keys(jsonResult[0]);
                var intervalSize = parseInt(keys[1]) - parseInt(keys[0]);
                chartJsonKeys.push(keys);

                let totalVariantCount = 0;
                if (currentChartType == "density") {
                    for (let key of keys)
                        totalVariantCount += jsonResult[key];
                }

                if (alreadyCreated) {
                    chart[i].destroy();
                }

                var highchart = Highcharts.chart(`densityChartArea${i + 1}`, {
                    chart: {
                        type: 'spline',
                        zoomType: 'x'
                    },
                    title: {
                        text: chartInfo.title.replace("{{totalVariantCount}}", totalVariantCount).replace("{{displayedVariantType}}", displayedVariantType).replace("{{displayedSequence}}", $(`#densityChartArea${i + 1}`).data('sequence')),
                    },
                    subtitle: {
                        text: isNaN(intervalSize) ? '' : chartInfo.subtitle.replace("{{intervalSize}}", intervalSize),
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
                                    var xMin = e.min == null ? null : xAxisDataArray[parseInt(e.min)].category;
                                    var xMax = e.max == null ? null : xAxisDataArray[parseInt(e.max)].category;
                                    displayAllChart(xMin, xMax, i);
                                    e.preventDefault();
                                }
                            }
                        }
                    },
                    yAxis: {
                        text: undefined,
                        visible: false,
                    },
                    tooltip: {
                        shared: true,
                        crosshairs: true
                    },
                    plotOptions: {
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
                if (alreadyCreated) {
                    chart[i] = highchart;
                }
                else {
                    chart.push(highchart);
                }
                resolve({jsonResult, chartInfo, i, keys, intervalSize});
            },
            error: function (xhr, ajaxOptions, thrownError) {
                handleError(xhr, thrownError);
            }
        });
    })
}

function addAllMetadataSeries(minPos, maxPos, fieldName, colorIndex) {
    //var displayedSequences = getSelectedItems();
    for (var i = 0; i < chart.length; i++) {
        startProcess(i, fieldName);
        addMetadataSeries(minPos, maxPos, fieldName, colorIndex, i)
    }
}

function addMetadataSeries(minPos, maxPos, fieldName, colorIndex, i) {
    if (chart[i].get(fieldName)) {
        return;
    }
    localmin = minPos;
    localmax = maxPos;
    var displayedSequences = getSelectedItems();
    var displayedSequence = displayedSequences[i];
    var displayedVariantType = $("select#chartVariantTypeList").val();
    var dataPayLoad = buildDataPayLoad(displayedSequence, displayedVariantType);
    dataPayLoad["vcfField"] = fieldName;
    dataPayLoad["plotIndividuals"] = $('#plotIndividualSelectionMode').val() == "choose" ? $('#plotIndividualSelectionMode').parent().parent().find("select.individualSelector").val() : ($('#plotIndividualSelectionMode').val() == "allGroups" ? getSelectedIndividuals() : ($('#plotIndividualSelectionMode').val() == "" ? [] : getSelectedIndividuals([parseInt($('#plotIndividualSelectionMode').val())])))
    const field = fieldName !== null ? "_" + fieldName : "";
    const loadDiv = `<div id="densityLoadProgress_${$(`#densityChartArea${i + 1}`).data('sequence')}${field}"></div>`;
    $(`div#densityLoadProgressContainer`).append($(loadDiv));
    $.ajax({
        url: 'rest/gigwa/vcfFieldPlotData/' + encodeURIComponent($('#project :selected').data("id")) + "?progressToken=" + token + "_" + currentChartType + field + "_" + $(`#densityChartArea${i + 1}`).data('sequence'),
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
            var totalVariantCount = 0;
            for (var j = 0; j < jsonKeys.length; j++) {
                jsonValues.push(jsonResult[jsonKeys[j]]);
                totalVariantCount += jsonResult[jsonKeys[j]];
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
            //finishProcess(i);
        },
        error: function (xhr, ajaxOptions, thrownError) {
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
    dataBeingLoaded = true;

    document.getElementById("densityLoadProgressContainerText").innerText = "";
    
    $("#chartTypeList").prop("disabled", true);
    //$("#chartSequenceList").prop("disabled", true);
    $("#chartVariantTypeList").prop("disabled", true);
    
    $("#showChartButton").removeClass("btn-success").addClass("btn-danger").html("Abort");
    
    progressTimeoutId = setTimeout(checkChartLoadingProgress(i, fieldName), minimumProcessQueryIntervalUnit);
}

function finishProcess(i, fieldName) {
    if (dataBeingLoaded) {
        const field = fieldName !== null ? "_" + fieldName : "";
        $(`div#densityLoadProgress_${$(`#densityChartArea${i + 1}`).data('sequence')}${field}`).remove();
        if (document.getElementById("densityLoadProgressContainer").children.length === 1) {
            document.getElementById("densityLoadProgressContainerText").innerText = "All graphs were correctly loaded";
            dataBeingLoaded = false;
            $("#chartTypeList").prop("disabled", false);
            $("#chartSequenceList").prop("disabled", false);
            $("#chartVariantTypeList").prop("disabled", false);

            if (progressTimeoutId != null) {
                clearTimeout(progressTimeoutId);
                progressTimeoutId = null;
            }

            $("#showChartButton").addClass("btn-success").removeClass("btn-danger").html("Show");
        }
    }
}

function abortOngoingOperation() {
    $.ajax({
        url: abortUrl,
        type: "DELETE",
        headers: {
            "Authorization": "Bearer " + token
        },
        success: function (jsonResult) {
            if (!jsonResult.processAborted)
                console.log("Unable to abort!");
            else
				processAborted = true;
            finishProcess(0);
        },
        error: function (xhr, ajaxOptions, thrownError) {
            handleError(xhr, thrownError);
        }
    });
}

function checkChartLoadingProgress(i, fieldName) {
    const field = fieldName !== null ? "_" + fieldName : "";
    $.ajax({
        url: progressUrl + "?progressToken=" + token + "_" + currentChartType + field + "_" + $(`#densityChartArea${i + 1}`).data('sequence'),
        type: "GET",
        contentType: "application/json;charset=utf-8",
        //buildHeader(token, $('#assembly').val())
        headers: {
            "Authorization": "Bearer " + token
        },
        success: function (jsonResult, textStatus, jqXHR) {
            if (jsonResult == null && (typeof processAborted == "undefined" || !processAborted)) {
				if (emptyResponseCountsByProcess[token] == null)
					emptyResponseCountsByProcess[token] = 1;
				else
					emptyResponseCountsByProcess[token]++;
				if (emptyResponseCountsByProcess[token] > 10) {
					console.log("Giving up requesting progress for process " + token);
					emptyResponseCountsByProcess[token] = null;
                    finishProcess(i, fieldName);
				}
				else
                	setTimeout(checkChartLoadingProgress(i, fieldName), minimumProcessQueryIntervalUnit);
            }
            else if (jsonResult != null && jsonResult['complete'] == true) {
               	emptyResponseCountsByProcess[token] = null;
                $('#progress').modal('hide');
                finishProcess(i, fieldName);
            }
            else if (jsonResult != null && jsonResult['aborted'] == true) {
                processAborted = true;
                emptyResponseCountsByProcess[token] = null;
                $('#progress').modal('hide');
                finishProcess(i, fieldName);
            }
            else {
                if (jsonResult != null && jsonResult['error'] != null) {
                    parent.totalRecordCount = 0;
                    alert("Error occurred:\n\n" + jsonResult['error']);
                    finishProcess(i, fieldName);
                    $('#density').modal('hide');
                    emptyResponseCountsByProcess[token] = null;
                } else {
					if (jsonResult != null) {
                            document.getElementById(`densityLoadProgress_${$(`#densityChartArea${i + 1}`).data('sequence')}${field}`).innerHTML = jsonResult['progressDescription'];
                    }
                    setTimeout(checkChartLoadingProgress(i, fieldName), minimumProcessQueryIntervalUnit);
                }
            }
        },
        error: function(xhr, thrownError) {
            handleError(xhr, thrownError);
        }
    });
}

function displayOrHideSeries(fieldName, isChecked, colorIndex) {
    if (chart.length === 0)
        return;
    
    $('.showHideSeriesBox').prop('disabled', true);
    if (isChecked) {
            addAllMetadataSeries(localmin, localmax, fieldName, colorIndex);
            chart.forEach(x => x.series.forEach(function (element) {
                if (element.name == fieldName) {
                    element.yAxis.update({
                        visible: true
                    });
                }
            }))
    }
    else {
        chart.forEach(x => x.series.forEach(function (element) {
            if(element.name==fieldName){
                //x.series.splice(x.series.findIndex(function(s) {return s.name === fieldName}), 1);
                x.get(fieldName).remove();
            }
        }));
        $('.showHideSeriesBox').prop('disabled', false);
    }
}

function displayOrHideThreshold(isChecked) {
    if (chart.length === 0)
        return;
    
    const chartInfo = chartTypes.get(currentChartType);
    if (isChecked) {
        const threshold = parseFloat($("#fstThreshold").val());
        for (let i = 0; i < chart.length; i++) {
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
        chart.forEach(x => series.push(x.get("threshold")));
        series.forEach(x => x !== undefined ? x.remove() : x);
    }
}

function changeIntervalCount() {
    let tempValue = parseInt($('#intervalCount').val());
    if (isNaN(tempValue))
        $("#intervalCount").val(200);
    else if (tempValue > 500)
        $("#intervalCount").val(500);
    else if (tempValue < 50)
        $("#intervalCount").val(50);
}

function setFstThreshold(){
    const threshold = parseFloat($("#fstThreshold").val());
    const series = [];
    chart.forEach(x => series.push(x.get("threshold")));
    for (let i = 0; i < series.length; i++) {
        if (series[i] !== undefined) {
            series.setData(chartJsonKeys[i].map(val => threshold), true, true)
        }
    }
}

function setFstGroupingOption() {
    const option = $("#plotGroupingSelectionMode").find(":selected").val();
    if (option != "__"){
        let fieldValues = new Set();
        callSetResponse.forEach(function (callset){
            if (callset.info[option] !== undefined && callset.info[option].length > 0){
                fieldValues.add(callset.info[option][0]);
            }
        });
        
        let selectOptions = "";
        let orderedValues = Array.from(fieldValues.values());
        orderedValues.sort();
        orderedValues.forEach(function (value){
            selectOptions += '<option value="' + value + '">' + value + '</option>';
        });
        $("#plotGroupingMetadataValues").html(selectOptions);
        $("#plotGroupingMetadataValues").change();
        $("#plotMetadata").css("display", "block");
    } else {
        $("#plotMetadata").css("display", "none");
        $("#plotGroupingMetadataValues").change();
    }
}

$(document).on("ready", function() {
    $("#density").on("hidden.bs.modal", function () {
        if (dataBeingLoaded)
            abortOngoingOperation();
    });
    
    $(window).on('beforeunload', function() {
        if (dataBeingLoaded)
            abortOngoingOperation();
    });
});
