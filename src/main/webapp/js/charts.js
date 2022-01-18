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
var minimumProcessQueryIntervalUnit = 750;
var chart = null;
var displayedRangeIntervalCount = 150;
var dataBeingLoaded = false;
let localmin, localmax;
let chartJsonKeys;
let colorTab = ['#396AB1', '#DA7C30', '#3E9651', '#CC2529', '#535154', '#6B4C9A', '#922428', '#948B3D'];
var currentChartType = null;
let progressIntervalId = null;
const chartTypes = new Map([
    ["density", {
        displayName: "Density",
        queryURL: selectionDensityDataURL,
        title: "Distribution of {{totalVariantCount}} {{displayedVariantType}} variants on sequence {{displayedSequence}}",
        subtitle: "The value provided for a position is actually the number of variants around it in an interval of size {{intervalSize}}",
        xAxisTitle: "Positions on selected sequence",
        series: [{
            name: "Variants in interval",
            enableMarker: false,
            lineWidth: 2,
        }],
        manualDisplay: false,
        buildCustomisation: function (){
            let content = ""
            if ($("#vcfFieldFilterGroup1 input").length > 0) {
                content += '<div class="col-md-3"><p>Additional series based on VCF genotype metadata</p>';
                $("#vcfFieldFilterGroup1 input").each(function(index) {
                    let fieldName = this.id.substring(0, this.id.lastIndexOf("_"));
                    content += '<div><input type="checkbox" class="showHideSeriesBox" onchange="dispayOrHideSeries(\'' + fieldName + '\', this.checked, ' + (index + 1) + ')"> Cumulated ' + fieldName + ' data</div>';
                });
                content += "</div>"
                if (getGenotypeInvestigationMode() != 0)
                    content += '<div class="col-md-6"><div id="plotIndividuals">Individuals to take into account <select id="plotIndividualSelectionMode" onchange="clearVcfFieldBasedSeries(); toggleIndividualSelector($(\'#plotIndividuals\'), \'choose\' == $(this).val(), 10, \'clearVcfFieldBasedSeries\');">' + getExportIndividualSelectionModeOptions() + '</select></div></div>';
            }
            return content;
        }
    }],
    ["fst", {
        displayName: "Fst",
        queryURL: selectionFstDataURL,
        title: "Fst value for {{displayedVariantType}} variants on sequence {{displayedSequence}}",
        subtitle: "The value provided for a position is the Weir and Cockerham Fst estimate over an interval of size {{intervalSize}} between the selected groups",
        xAxisTitle: "Positions on selected sequence",
        series: [{
            name: "Fst estimate",
            enableMarker: true,
            lineWidth: 2,
        }],
        manualDisplay: true,
        enableCondition: function (){
            if (genotypeInvestigationMode != 2 && !gotMetaData){
                return "Fst is only defined with at least two groups. You need to set investigation groups or metadata.";
            } else if (areGroupsOverlapping() && !gotMetaData){
                return "Investigation groups are overlapping";
            } else if (ploidy != 2){
                return "Ploidy levels other than 2 are not supported";
            } else {
                return null;
            }
        },
        buildCustomisation: function (){
            return ('<div id="fstThresholdGroup" class="col-md-2"><input type="checkbox" id="showFstThreshold" onchange="displayOrHideThreshold(this.checked)" /> Show threshold<br />' +
                        'Significance threshold : <input id="fstThreshold" type="number" min="0" max="1" step="0.01" value="0.10" onchange="setFstThreshold()" />' +
                    '</div><div id="plotGroups" class="col-md-3">' +
                        'Group by <select id="plotGroupingSelectionMode" onchange="clearVcfFieldBasedSeries(); setFstGroupingOption();">' + getGroupingOptions() + '</select>' +
                    '</div><div id="plotMetadata" style="display: none" class="col-md-3">' +
                        'Metadata values to select (at least 2) <br/><select id="plotGroupingMetadataValues" multiple></select>' +
                    '</div>');
        },
        buildRequestPayload: function (payload){
            const groupOption = $("#plotGroupingSelectionMode").find(":selected").val();
            if (groupOption != "__"){
                const selectedValues = $("#plotGroupingMetadataValues").val();
                if (selectedValues === null || selectedValues.length < 2){
                    return null;
                }
                
                let groups = new Map();
                callSetResponse.forEach(function (callset){
                    const fieldValue = callset.info[groupOption][0];
                    if (fieldValue !== undefined){
                        let valueGroup = groups.get(fieldValue);
                        if (valueGroup !== undefined){
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
        subtitle: "The value provided is the Tajima's D value (excluding missing and more than biallelic variants)",
        xAxisTitle: "Positions on selected sequence",
        series: [
            {
                name: "Tajima's D",
                enableMarker: true,
                lineWidth: 2,
            },
            {
                name: "Segregating sites",
                enableMarker: false,
                lineWidth: 1,
            },
        ],
        manualDisplay: true,
        enableCondition: function (){
            if (ploidy != 2){
                return "Ploidy levels other than 2 are not supported";
            } else {
                return null;
            }
        },
        buildCustomisation: function (){
            let content = ""
            if ($("#vcfFieldFilterGroup1 input").length > 0) {
                content += '<div class="col-md-3"><p>Additional series based on VCF genotype metadata</p>';
                $("#vcfFieldFilterGroup1 input").each(function(index) {
                    let fieldName = this.id.substring(0, this.id.lastIndexOf("_"));
                    content += '<div><input type="checkbox" class="showHideSeriesBox" onchange="dispayOrHideSeries(\'' + fieldName + '\', this.checked, ' + (index + 1) + ')"> Cumulated ' + fieldName + ' data</div>';
                });
                content += "</div>";
            }
            if (getGenotypeInvestigationMode() != 0)
                content += '<div class="col-md-6"><div id="plotIndividuals">Individuals to take into account <select id="plotIndividualSelectionMode" onchange="clearVcfFieldBasedSeries(); toggleIndividualSelector($(\'#plotIndividuals\'), \'choose\' == $(this).val(), 10, \'clearVcfFieldBasedSeries\');">' + getExportIndividualSelectionModeOptions() + '</select></div></div>';
            return content;
        }
    }]
]);

function initializeAndShowDensityChart(){
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

    $('div#chartContainer').html('<div id="densityChartArea" style="min-width:310px; height:370px; margin:0 auto; overflow:hidden;"></div><div id="additionalCharts" style="display:none;"></div>');
    var selectedSequences = getSelectedSequences() == "" ? [] : getSelectedSequences().split(";");
    var selectedTypes = getSelectedTypes().split(";");
    $.ajax({
        url: distinctSequencesInSelectionURL + "/" + $('#project :selected').data("id"),
        type: "GET",
        headers: {
            "Authorization": "Bearer " + token
        },
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

function clearVcfFieldBasedSeries() {
	$('.showHideSeriesBox').attr('checked', false);
	$('.showHideSeriesBox').change();
}

function getGroupingOptions() {
    let options = ""
    if (getGenotypeInvestigationMode() == 2 && !areGroupsOverlapping())
        options += '<option value="__">Investigation groups</option>';
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

    let customisationDivHTML = "<div class='panel panel-default two-third-width container-fluid'><div class='row panel-body panel-grey shadowed-panel graphCustomization'><div class='col-md-3'><p>Customisation options</p>";
    customisationDivHTML += 'Number of Intervals <input maxlength="3" size="3" type="text" id="intervalCount" value="' + displayedRangeIntervalCount + '" onchange="changeIntervalCount()"><br/>(between 50 and 300)</div>';
    customisationDivHTML += '<div id="chartTypeCustomisationOptions">';
    if (chartInfo.buildCustomisation !== undefined){
        customisationDivHTML += chartInfo.buildCustomisation();
    }
    customisationDivHTML += manualDisplayButton(chartInfo.manualDisplay);
	$("div#chartContainer div#additionalCharts").html(customisationDivHTML + "</div></div></div>");

	if (chartInfo.onLoad !== undefined)
        chartInfo.onLoad();
	
    loadChart();
}

function manualDisplayButton(manualDisplay){
    let html = "";
    if (manualDisplay)
        html += '<div class="col-md-1"><button class="btn btn-success" onclick="displayChart()">Show</button></div>';
    return html;
}

function setChartType(typeSelect) {
    currentChartType = typeSelect.options[typeSelect.selectedIndex].value;
    const typeInfo = chartTypes.get(currentChartType);
    
    if (typeInfo.enableCondition !== undefined){
        const failMessage = typeInfo.enableCondition();
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
    
    if (typeInfo.buildCustomisation !== undefined){
        $("#chartTypeCustomisationOptions").html(typeInfo.buildCustomisation() + manualDisplayButton(typeInfo.manualDisplay));
    } else {
        $("#chartTypeCustomisationOptions").html(manualDisplayButton(typeInfo.manualDisplay));
    }
    
    if (typeInfo.onLoad !== undefined)
        typeInfo.onLoad();
    
    loadChart();
}

function abortOngoingOperation() {
    $.ajax({
        url: abortUrl,
        type: "DELETE",
        headers: {
            "Authorization": "Bearer " + token
        },
        success: function (jsonResult) {
            if (!jsonResult.processAborted) {
                console.log("Unable to abort!");
            } else {
                dataBeingLoaded = false;
                clearInterval(progressIntervalId);
            }
        },
        error: function (xhr, ajaxOptions, thrownError) {
            handleError(xhr, thrownError);
        }
    });
}

function buildDataPayLoad(displayedSequence, displayedVariantType) {
	var annotationFieldThresholds = {}, annotationFieldThresholds2 = {};
	$('#vcfFieldFilterGroup1 input').each(function() {
		if (parseInt($(this).val()) > 0)
			annotationFieldThresholds[this.id.substring(0, this.id.lastIndexOf("_"))] = $(this).val();
	});
	$('#vcfFieldFilterGroup2 input').each(function() {
		if (parseInt($(this).val()) > 0)
			annotationFieldThresholds2[this.id.substring(0, this.id.lastIndexOf("_"))] = $(this).val();
	});
	
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

        "callSetIds": getSelectedIndividuals(1),
        "gtPattern": $('#Genotypes1').val(),
        "mostSameRatio": $('#mostSameRatio1').val(),
        "minmaf": $('#minmaf1').val() === null ? 0 : parseFloat($('#minmaf1').val()),
        "maxmaf": $('#maxmaf1').val() === null ? 50 : parseFloat($('#maxmaf1').val()),
        "missingData": $('#missingdata1').val() === null ? 100 : parseInt($('#missingdata1').val()),
		"annotationFieldThresholds": annotationFieldThresholds,

        "callSetIds2": getSelectedIndividuals(2),
        "gtPattern2": $('#Genotypes2').val(),
        "mostSameRatio2": $('#mostSameRatio2').val(),
        "minmaf2": $('#minmaf1').val() === null ? 0 : parseFloat($('#minmaf2').val()),
        "maxmaf2": $('#maxmaf1').val() === null ? 50 : parseFloat($('#maxmaf2').val()),
        "missingData2": $('#missingdata1').val() === null ? 100 : parseInt($('#missingdata2').val()),
        "annotationFieldThresholds2": annotationFieldThresholds2,

        "discriminate": $('#discriminate').prop('checked'),
        "pageSize": 100,
        "pageToken": "0",
        "displayedSequence": displayedSequence,
        "displayedVariantType": displayedVariantType != "" ? displayedVariantType : null,
        "displayedRangeMin": localmin,
        "displayedRangeMax": localmax,
        "displayedRangeIntervalCount": displayedRangeIntervalCount
    };
}

function loadChart(minPos, maxPos) {    
    const typeInfo = chartTypes.get(currentChartType);
    
    if (dataBeingLoaded)
        abortOngoingOperation();
    
    var zoomApplied = minPos != null && maxPos != null;
    if (!typeInfo.manualDisplay || zoomApplied)
        displayChart(minPos, maxPos);
    else if (typeInfo.manualDisplay)
        $("div#chartContainer div#additionalCharts").show();
}

function displayChart(minPos, maxPos){
    localmin = minPos;
    localmax = maxPos;
    const typeInfo = chartTypes.get(currentChartType);
    
    var zoomApplied = minPos != null && maxPos != null;
    $("input#resetZoom").toggle(zoomApplied);
    
    if (chart != null) {
        if (zoomApplied)
            chart.showLoading("Zooming in...");
        else if (!dataBeingLoaded)
            chart.destroy();
    }
    
    var displayedSequence = $("select#chartSequenceList").val();
    var displayedVariantType = $("select#chartVariantTypeList").val();
    var dataPayLoad = buildDataPayLoad(displayedSequence, displayedVariantType);
    if (typeInfo.buildRequestPayload !== undefined)
        dataPayLoad = typeInfo.buildRequestPayload(dataPayLoad);
        if (dataPayLoad === null) return;

    $.ajax({
        url: typeInfo.queryURL + '/' + encodeURIComponent($('#project :selected').data("id")),
        type: "POST",
        contentType: "application/json;charset=utf-8",
        headers: {
            "Authorization": "Bearer " + token
        },
        data: JSON.stringify(dataPayLoad),
        success: function(jsonResult) {
            if (jsonResult.length == 0)
                return; // probably aborted
            
            // TODO : Key to the middle of the interval ?
            chartJsonKeys = typeInfo.series.length == 1 ? Object.keys(jsonResult) : Object.keys(jsonResult[0]);
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
                    text: typeInfo.title.replace("{{totalVariantCount}}", totalVariantCount).replace("{{displayedVariantType}}", displayedVariantType).replace("{{displayedSequence}}", displayedSequence),
                },
                subtitle: {
                    text: isNaN(intervalSize) ? '' : typeInfo.subtitle.replace("{{intervalSize}}", intervalSize),
                },
                xAxis: {
                    categories: chartJsonKeys,
                    title: {
                        text: typeInfo.xAxisTitle,
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
                }
            });
            
            for (let seriesIndex in typeInfo.series) {
                const series = typeInfo.series[seriesIndex];
                const seriesData = (typeInfo.series.length == 1) ? jsonResult : jsonResult[seriesIndex];
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
            
            if (typeInfo.onDisplay !== undefined)
                typeInfo.onDisplay();
        },
        error: function(xhr, ajaxOptions, thrownError) {
            handleError(xhr, thrownError);
        }
    });
    monitorProgress();
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
        },
        error: function(xhr, ajaxOptions, thrownError) {
            handleError(xhr, thrownError);
            $('.showHideSeriesBox').prop('disabled', false);
        }
    });
    monitorProgress();
}

function monitorProgress() {
    // This is probably unnecessary in most cases, but it may avoid conflicts in certain synchronisation edge cases
    if (progressIntervalId != null)
        clearInterval(progressIntervalId);
    progressIntervalId = setInterval(checkChartLoadingProgress, minimumProcessQueryIntervalUnit);
}

function checkChartLoadingProgress() {
    $.ajax({
        url: progressUrl,
        type: "GET",
        contentType: "application/json;charset=utf-8",
        headers: {
            "Authorization": "Bearer " + token
        },
        success: function(jsonResult) {
            if (jsonResult == null)
            {
                $("div#densityLoadProgress").html("");
                dataBeingLoaded = false;	// complete
                clearInterval(progressIntervalId);
            }
            else
            {
                dataBeingLoaded = true;	// still running
                if (jsonResult['error'] != null)
                {
                    parent.totalRecordCount = 0;
                    alert("Error occured:\n\n" + jsonResult['error']);
                    $('#density').modal('hide');
                    clearInterval(progressIntervalId);
                }
                else
                {
                    $('div#densityLoadProgress').html(jsonResult['progressDescription']);
                }
            }
        },
        error: function(xhr, thrownError) {
            handleError(xhr, thrownError);
        }
    });
}

function dispayOrHideSeries(fieldName, isChecked, colorIndex) {
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
    const typeInfo = chartTypes.get(currentChartType);
    if (isChecked) {
        const threshold = parseFloat($("#fstThreshold").val());
        chart.addSeries({
            id: "threshold",
            name: "Threshold",
            marker: {enabled: false},
            lineWidth: 0.5,
            color: "#CC0000",
            data: chartJsonKeys.map(val => threshold),
            yAxis: typeInfo.series[0].name,
        }, true);
    } else {
        const series = chart.get("threshold");
        if (series !== undefined) series.remove();
    }
}

function setFstThreshold(){
    const threshold = parseFloat($("#fstThreshold").val());
    const series = chart.get("threshold");
    if (series !== undefined){
        series.setData(chartJsonKeys.map(val => threshold), true, true);
    }
}

function changeIntervalCount() {
    let tempValue = parseInt($('#intervalCount').val());
    if (isNaN(tempValue))
    	displayedRangeIntervalCount = 150;
    else if (tempValue > 300)
        displayedRangeIntervalCount = 300;
    else if (tempValue < 50)
        displayedRangeIntervalCount = 50;
    else
    	displayedRangeIntervalCount = tempValue;
    $('#intervalCount').val(displayedRangeIntervalCount);
    loadChart(localmin, localmax);
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
        $("#plotMetadata").css("display", "block");
    } else {
        $("#plotMetadata").css("display", "none");
    }
}

$(document).on("ready", function() {
    $("#density").on("hidden.bs.modal", function () {
        if (dataBeingLoaded)
            abortOngoingOperation();
    });
});
