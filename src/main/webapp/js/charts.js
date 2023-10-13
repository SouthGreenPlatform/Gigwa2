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
var chart = null;
var displayedRangeIntervalCount = 200;
var dataBeingLoaded = false;
let localmin, localmax;
let chartJsonKeys;
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
            if (genotypeInvestigationMode != 2 && !gotMetaData){
                return "Fst is only defined with at least two groups. You need to define investigation groups or upload metadata.";
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

    $('div#chartContainer').html('<div id="densityChartArea" style="min-width:350px; height:415px; margin:0 auto; overflow:hidden;"></div><div id="additionalCharts" style="display:none;"></div>');
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
                    selectedTypes == "" ? $('#variantTypes option').map(option => option.value).get() : selectedTypes);
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
    if (getGenotypeInvestigationMode() == 2 && !areGroupsOverlapping())
        options += '<option value="__">Investigated groups</option>';
    else if (getGenotypeInvestigationMode() == 2)
    	alert("Investigated groups are overlapping, you may not use them for Fst calculation!"); 
    const fields = callSetMetadataFields.slice();
    fields.sort();
    fields.forEach(function (field){
        options += '<option value="' + field + '">' + field + '</option>';
    });
    return options;
}

function feedSequenceSelectAndLoadVariantTypeList(sequences, types) {
    const headerHtml = ('<input type="button" id="resetZoom" value="Reset zoom" style="display:none; float:right; margin-top:3px; height:25px;" onclick="displayChart();">' +
                        '<div id="densityLoadProgress" style="position:absolute; margin:10px; right:120px; font-weight:bold;">&nbsp;</div>' + 
                        '<form><div style="padding:3px; width:100%; background-color:#f0f0f0;">' +
                            'Data to display: <select id="chartTypeList" style="margin-right:20px; heigh:25px;" onchange="setChartType(this);"></select>' + 
                            'Choose a sequence: <select id="chartSequenceList" style="margin-right:20px; height:25px;" onchange="loadChart();"></select>' + 
                            'Choose a variant type: <select id="chartVariantTypeList" style="height: 25px;" onchange="if (options.length > 2) loadChart();"><option value="">ANY</option></select>' +
                        '</div></form>');
    $(headerHtml).insertBefore('div#densityChartArea');

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
    
    for (let key in sequences)
        $("#chartSequenceList").append("<option value='" + sequences[key] + "'>" + sequences[key] + "</option>");
    for (let key in types)
        $("#chartVariantTypeList").append("<option value='" + types[key] + "'>" + types[key] + "</option>");
	
	buildCustomisationDiv(chartInfo);

	if (chartInfo.onLoad !== undefined)
        chartInfo.onLoad();
	
    loadChart();
}

function buildCustomisationDiv(chartInfo) {
    const hasVcfMetadata = $("#vcfFieldFilterGroup1 input").length > 0;
    
    let customisationDivHTML = "<div class='panel panel-default container-fluid' style=\"width: 80%;\"><div class='row panel-body panel-grey shadowed-panel graphCustomization'>";
    customisationDivHTML += '<div class="pull-right"><button id="showChartButton" class="btn btn-success" onclick="displayOrAbort();" style="z-index:999; position:absolute; margin-top:40px; margin-left:-60px;">Show</button></div>';
    customisationDivHTML += '<div class="col-md-3"><p>Customisation options</p><b>Number of intervals</b> <input maxlength="3" size="3" type="text" id="intervalCount" value="' + displayedRangeIntervalCount + '" onchange="changeIntervalCount()"><br/>(between 50 and 500)';
    if (hasVcfMetadata || chartInfo.selectIndividuals)
        customisationDivHTML += '<div id="plotIndividuals" class="margin-top-md"><b>Individuals accounted for</b> <img style="cursor:pointer; cursor:hand;" src="images/magnifier.gif" title="... in calculating Tajima\'s D or cumulating VCF metadata values"/> <select id="plotIndividualSelectionMode" onchange="onManualIndividualSelection(); toggleIndividualSelector($(\'#plotIndividuals\'), \'choose\' == $(this).val(), 10, \'onManualIndividualSelection\'); showSelectedIndCount($(this), $(\'#indSelectionCount\'));">' + getExportIndividualSelectionModeOptions() + '</select> <span id="indSelectionCount"></span></div>';
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
		selectionLabelObj.text(" (" + indCount + " selected)");
	else {
		var selectedIndCount = Object.keys(getSelectedIndividuals(selectedOption.val() == "12" ? null : parseInt(selectedOption.val()))).length;
		selectionLabelObj.text(" (" + (selectedIndCount == 0 ? indCount : selectedIndCount) + " selected)");
	}
}

function displayOrAbort() {
    if (dataBeingLoaded) {
        abortOngoingOperation();
    } else {
        displayChart();
    }
}

function setChartType(typeSelect) {
    currentChartType = typeSelect.options[typeSelect.selectedIndex].value;
    const chartInfo = chartTypes.get(currentChartType);
    
    if (chartInfo.enableCondition !== undefined){
        const failMessage = chartInfo.enableCondition();
        if (failMessage !== null){
            $("#additionalCharts").hide();
            $("#densityChartArea").html("<h3>Chart type unavailable</h3><p>" + failMessage + "</p></h3>");
            return;
        } else {
            $("#densityChartArea").empty();
        }
    }
    $("#additionalCharts").show();
    
    if (chart != null){
        chart.destroy();
        chart = null;
    }
    
    buildCustomisationDiv(chartInfo);
    
    if (chartInfo.onLoad !== undefined)
        chartInfo.onLoad();
    
    loadChart();
}

function buildDataPayLoad(displayedSequence, displayedVariantType) {
    const chartInfo = chartTypes.get(currentChartType);

	var annotationFieldThresholds = {}, annotationFieldThresholds2 = {};
	$('#vcfFieldFilterGroup1 input').each(function() {
		if (parseInt($(this).val()) > 0)
			annotationFieldThresholds[this.id.substring(0, this.id.lastIndexOf("_"))] = $(this).val();
	});
	$('#vcfFieldFilterGroup2 input').each(function() {
		if (parseInt($(this).val()) > 0)
			annotationFieldThresholds2[this.id.substring(0, this.id.lastIndexOf("_"))] = $(this).val();
	});
	
	let plotIndividuals = null;
	if (chartInfo.selectIndividuals) {
	    switch ($('#plotIndividualSelectionMode').val()) {
	        case "choose":
	            plotIndividuals = $('#plotIndividualSelectionMode').parent().parent().find("select.individualSelector").val();
	            break;
	        case "12":
	            plotIndividuals = getSelectedIndividuals();
	            break;
	        case "1":
	            plotIndividuals = getSelectedIndividuals(1);
	            break;
	        case "2":
	            plotIndividuals = getSelectedIndividuals(2);
	            break;
	        default:
	            plotIndividuals = [];
	            break;
	    }
	}
	
	return {         	
        "variantSetId": $('#project :selected').data("id"),
        "searchMode": 0,
        "getGT": false,

        "referenceName": getSelectedSequences(),
        "selectedVariantTypes": getSelectedTypes(),
        "alleleCount": getSelectedNumberOfAlleles(),
        "start": $('#minposition').val() === "" ? -1 : parseInt($('#minposition').val()),
        "end": $('#maxposition').val() === "" ? -1 : parseInt($('#maxposition').val()),
        "variantEffect": $('#variantEffects').val() === null ? "" : $('#variantEffects').val().join(","),
        "geneName": $('#geneName').val().trim().replace(new RegExp(' , ', 'g'), ','),

        "callSetIds": getSelectedIndividuals(1, true),
        "gtPattern": $('#Genotypes1').val(),
        "mostSameRatio": $('#mostSameRatio1').val(),
        "minMaf": $('#minMaf1').val() === null ? 0 : parseFloat($('#minMaf1').val()),
        "maxMaf": $('#maxMaf1').val() === null ? 50 : parseFloat($('#maxMaf1').val()),
        "minMissingData": $('#minMissingData1').val() === null ? 0 : parseFloat($('#minMissingData1').val()),
        "maxMissingData": $('#maxMissingData1').val() === null ? 100 : parseFloat($('#maxMissingData1').val()),
        "minHeZ": $('#minHeZ1').val() === null ? 0 : parseFloat($('#minHeZ1').val()),
        "maxHeZ": $('#maxHeZ1').val() === null ? 100 : parseFloat($('#maxHeZ1').val()),
		"annotationFieldThresholds": annotationFieldThresholds,

        "callSetIds2": getSelectedIndividuals(2, true),
        "gtPattern2": $('#Genotypes2').val(),
        "mostSameRatio2": $('#mostSameRatio2').val(),
        "minMaf2": $('#minMaf2').val() === null ? 0 : parseFloat($('#minMaf2').val()),
        "maxMaf2": $('#maxMaf2').val() === null ? 50 : parseFloat($('#maxMaf2').val()),
        "minMissingData2": $('#minMissingData2').val() === null ? 0 : parseFloat($('#minMissingData2').val()),
        "maxMissingData2": $('#maxMissingData2').val() === null ? 100 : parseFloat($('#maxMissingData2').val()),
        "minHeZ2": $('#minHeZ2').val() === null ? 0 : parseFloat($('#minHeZ2').val()),
        "maxHeZ2": $('#maxHeZ2').val() === null ? 100 : parseFloat($('#maxHeZ2').val()),
        "annotationFieldThresholds2": annotationFieldThresholds2,

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
}

function loadChart(minPos, maxPos) {    
    const chartInfo = chartTypes.get(currentChartType);
    
    var zoomApplied = minPos != null && maxPos != null;
    if (zoomApplied)
        displayChart(minPos, maxPos);
    else
        $("div#chartContainer div#additionalCharts").show();
}

function displayChart(minPos, maxPos) {
    localmin = minPos;
    localmax = maxPos;
    const chartInfo = chartTypes.get(currentChartType);
    
    var zoomApplied = minPos != null && maxPos != null;
    $("input#resetZoom").toggle(zoomApplied);
    
    if (dataBeingLoaded)
        abortOngoingOperation();
    
    if (chart != null) {
        if (zoomApplied) {
            chart.showLoading("Zooming in...");
        } else if (!dataBeingLoaded) {
            chart.destroy();
            chart = null;
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
    
    var displayedSequence = $("select#chartSequenceList").val();
    var displayedVariantType = $("select#chartVariantTypeList").val();
    var dataPayLoad = buildDataPayLoad(displayedSequence, displayedVariantType);
    if (chartInfo.buildRequestPayload !== undefined)
        dataPayLoad = chartInfo.buildRequestPayload(dataPayLoad);
        if (dataPayLoad === null) return;

    $.ajax({
        url: chartInfo.queryURL + '/' + encodeURIComponent($('#project :selected').data("id")),
        type: "POST",
        contentType: "application/json;charset=utf-8",
        headers: buildHeader(token, $('#assembly').val()),
        data: JSON.stringify(dataPayLoad),
        success: function(jsonResult) {
            if (jsonResult.length == 0)
                return; // probably aborted
            
            // TODO : Key to the middle of the interval ?
            chartJsonKeys = chartInfo.series.length == 1 ? Object.keys(jsonResult) : Object.keys(jsonResult[0]);
            var intervalSize = parseInt(chartJsonKeys[1]) - parseInt(chartJsonKeys[0]);
            
            let totalVariantCount = 0;
            if (currentChartType == "density"){
                for (let key of chartJsonKeys)
                    totalVariantCount += jsonResult[key];
            }
            
            chart = Highcharts.chart('densityChartArea', {
                chart: {
                    type: 'spline',
                    zoomType: 'x'
                },
                title: {
                    text: chartInfo.title.replace("{{totalVariantCount}}", totalVariantCount).replace("{{displayedVariantType}}", displayedVariantType).replace("{{displayedSequence}}", displayedSequence),
                },
                subtitle: {
                    text: isNaN(intervalSize) ? '' : chartInfo.subtitle.replace("{{intervalSize}}", intervalSize),
                },
                xAxis: {
                    categories: chartJsonKeys,
                    title: {
                        text: chartInfo.xAxisTitle,
                    },
                    events: {
                        afterSetExtremes: function(e) {
                            if ("zoom" == e.trigger)
                            {   // reload for best resolution
                                var xAxisDataArray = this.chart.series[0].data;
                                var xMin = e.min == null ? null : xAxisDataArray[parseInt(e.min)].category;
                                var xMax = e.max == null ? null : xAxisDataArray[parseInt(e.max)].category;
                                displayChart(xMin, xMax);
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
            
            for (let seriesIndex in chartInfo.series) {
                const series = chartInfo.series[seriesIndex];
                const seriesData = (chartInfo.series.length == 1) ? jsonResult : jsonResult[seriesIndex];
                const seriesValues = new Array();
                for (let key of chartJsonKeys)
                    seriesValues.push(seriesData[key]);
                
                chart.addAxis({
                    id: series.name,
                    title: {
                        text: undefined,  //series.yAxisTitle,
                    },
                    lineWidth: 3,
                    lineColor: colorTab[seriesIndex],
                });
                
                chart.addSeries({
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
            
            $("div#chartContainer div#additionalCharts").toggle(!isNaN(intervalSize));
            if (!isNaN(intervalSize))
                $('.showHideSeriesBox').change();
            
            if (chartInfo.onDisplay !== undefined)
                chartInfo.onDisplay();
        },
        error: function(xhr, ajaxOptions, thrownError) {
            handleError(xhr, thrownError);
        }
    });
    startProcess();
}

function addMetadataSeries(minPos, maxPos, fieldName, colorIndex) {
    localmin = minPos;
    localmax = maxPos;
    
    var displayedSequence = $("select#chartSequenceList").val();
    var displayedVariantType = $("select#chartVariantTypeList").val();   
    var dataPayLoad = buildDataPayLoad(displayedSequence, displayedVariantType);
    dataPayLoad["vcfField"] = fieldName;
    dataPayLoad["plotIndividuals"] = $('#plotIndividualSelectionMode').val() == "choose" ? $('#plotIndividualSelectionMode').parent().parent().find("select.individualSelector").val() : ($('#plotIndividualSelectionMode').val() == "12" ? getSelectedIndividuals() : ($('#plotIndividualSelectionMode').val() == "1" ? getSelectedIndividuals(1) : ($('#plotIndividualSelectionMode').val() == "2" ? getSelectedIndividuals(2) : null)))
    
    $.ajax({
        url: 'rest/gigwa/vcfFieldPlotData/' + encodeURIComponent($('#project :selected').data("id")),
        type: "POST",
        contentType: "application/json;charset=utf-8",
        headers: {
            "Authorization": "Bearer " + token
        },
        data: JSON.stringify(dataPayLoad),
        success: function(jsonResult) {
            if (jsonResult.length == 0)
                return;	// probably aborted

            var jsonKeys = Object.keys(jsonResult);
            var intervalSize = parseInt(jsonKeys[1]) - parseInt(jsonKeys[0]);

            var jsonValues = new Array();
            var totalVariantCount = 0;
            for (var i=0; i<jsonKeys.length; i++){
                jsonValues.push(jsonResult[jsonKeys[i]]);
                totalVariantCount += jsonResult[jsonKeys[i]];
                jsonKeys[i] = parseInt(parseInt(jsonKeys[i]) + intervalSize/2);
            }
            chart.addAxis({ // Secondary yAxis
                id: fieldName,
                title: {
                    text: "Cumulated " + fieldName
                },
                lineWidth: 3,
                lineColor: colorTab[colorIndex],
                opposite: true,
            });
            chart.addSeries({
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
            finishProcess();
        },
        error: function(xhr, ajaxOptions, thrownError) {
            handleError(xhr, thrownError);
            $('.showHideSeriesBox').prop('disabled', false);
            finishProcess();
        }
    });
    startProcess();
}

function startProcess() {
    // This is probably unnecessary in most cases, but it may avoid conflicts in certain synchronisation edge cases
    if (progressTimeoutId != null)
        clearTimeout(progressTimeoutId);
    dataBeingLoaded = true;
    
    $("#chartTypeList").prop("disabled", true);
    $("#chartSequenceList").prop("disabled", true);
    $("#chartVariantTypeList").prop("disabled", true);
    
    $("#showChartButton").removeClass("btn-success").addClass("btn-danger").html("Abort");
    
    progressTimeoutId = setTimeout(checkChartLoadingProgress, minimumProcessQueryIntervalUnit);
}

function finishProcess() {
    if (dataBeingLoaded) {
        dataBeingLoaded = false;
        
        $("div#densityLoadProgress").html("");
        
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
            finishProcess();
        },
        error: function (xhr, ajaxOptions, thrownError) {
            handleError(xhr, thrownError);
        }
    });
}

function checkChartLoadingProgress() {
    $.ajax({
        url: progressUrl,
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
				}
				else
                	setTimeout(checkChartLoadingProgress, minimumProcessQueryIntervalUnit);
            }
            else if (jsonResult != null && jsonResult['complete'] == true) {
               	emptyResponseCountsByProcess[token] = null;
                $('#progress').modal('hide');
                finishProcess();
            }
            else if (jsonResult != null && jsonResult['aborted'] == true) {
                processAborted = true;
                emptyResponseCountsByProcess[token] = null;
                $('#progress').modal('hide');
                finishProcess();
            }
            else {
                if (jsonResult != null && jsonResult['error'] != null) {
                    parent.totalRecordCount = 0;
                    alert("Error occurred:\n\n" + jsonResult['error']);
                    finishProcess();
                    $('#density').modal('hide');
                    emptyResponseCountsByProcess[token] = null;
                } else {
					if (jsonResult != null)
                    	$('div#densityLoadProgress').html(jsonResult['progressDescription']);
                    setTimeout(checkChartLoadingProgress, minimumProcessQueryIntervalUnit);
                }
            }
        },
        error: function(xhr, thrownError) {
            handleError(xhr, thrownError);
        }
    });
}

function displayOrHideSeries(fieldName, isChecked, colorIndex) {
    if (chart === null)
        return;
    
    $('.showHideSeriesBox').prop('disabled', true);
    if (isChecked) {
        addMetadataSeries(localmin, localmax, fieldName, colorIndex);
        chart.series.forEach(function (element) {
            if(element.name==fieldName){
                element.yAxis.update({
                    visible:true
                });
            }
        })
    }
    else {
        chart.series.forEach(function (element) {
            if(element.name==fieldName){
                chart.get(fieldName).remove();
            }
        });
        $('.showHideSeriesBox').prop('disabled', false);
    }
}

function displayOrHideThreshold(isChecked) {
    if (chart === null)
        return;
    
    const chartInfo = chartTypes.get(currentChartType);
    if (isChecked) {
        const threshold = parseFloat($("#fstThreshold").val());
        chart.addSeries({
            id: "threshold",
            name: "Threshold",
            marker: {enabled: false},
            lineWidth: 0.5,
            color: "#CC0000",
            data: chartJsonKeys.map(val => threshold),
            yAxis: chartInfo.series[0].name,
        }, true);
    } else {
        const series = chart.get("threshold");
        if (series !== undefined) series.remove();
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
    const series = chart.get("threshold");
    if (series !== undefined){
        series.setData(chartJsonKeys.map(val => threshold), true, true);
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
        $('#showChartButton').prop('disabled', false);
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
