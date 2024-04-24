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

/**
 * 
 * This file stores common js methods 
 */
var minimumProcessQueryIntervalUnit = 100;
var maxUploadableVariantIdCount = 1000000, maxPastableVariantIdCount = 1000, maxSelectableVariantIdCount = 10000;
var selectedVariantIDsWhenTooManyToFitInSelect = null;
var emptyResponseCountsByProcess = [];

function isHex(h) {
    var a = parseInt(h, 16);
    return (a.toString(16) === h.toLowerCase())
}

function arrayContains(array, element) 
{
    for (var i = 0; i < array.length; i++) 
        if (array[i] == element) 
            return true;
    return false;
}

function arrayContainsIgnoreCase(array, element)
{
    for (var i = 0; i < array.length; i++) 
        if ((array[i] == null && element == null) || (array[i] != null && element != null && array[i].toLowerCase() == element.toLowerCase())) 
            return true;
    return false;
}

function hashCode(s)
{
    return s.toString().split("").reduce(function(a,b){a=((a<<5)-a)+b.charCodeAt(0);return Math.abs(a&a)},0);              
}

function idLooksGenerated(id)
{
    var regex = RegExp("^[0-9a-f]+$");
    return id.length == 20 && regex.exec(id) != null;
}

function getProjectId(){
    return $('#project :selected').data("id");
}

function getModuleName(){
    return $('#module').val();
}

// function to get url param
function $_GET(param) {
    var vars = {};
    window.location.href.replace(location.hash, '').replace(
            /[?&]+([^=&]+)=?([^&]*)?/gi, // regexp
            function (m, key, value) { // callback
                vars[key] = value !== undefined ? value : '';
            }
    );
    if (param) {
        return vars[param] ? vars[param] : null;
    }
    return vars;
}

function displayProcessProgress(nbMin, token, processId, onSuccessMethod) {
    var functionToCall = function(onSuccessMethod) {
        $.ajax({
            url: progressUrl + (processId != null ? "?progressToken=" + processId : ""),	// if no processId provided, server code will use auth token instead
            type: "GET",
            headers: {
                "Authorization": "Bearer " + token
            },
            success: function (jsonResult, textStatus, jqXHR) {
                if (jsonResult == null && (typeof processAborted == "undefined" || !processAborted)) {
					var processKey = processId != null ? processId : token;
					if (emptyResponseCountsByProcess[processKey] == null)
						emptyResponseCountsByProcess[processKey] = 1;
					else
						emptyResponseCountsByProcess[processKey]++;
					if (emptyResponseCountsByProcess[processKey] > 10) {
						console.log("Giving up requesting progress for process " + processKey);
						emptyResponseCountsByProcess[processKey] = null;
					}
					else
                    	displayProcessProgress(nbMin, token, processId, onSuccessMethod);
                }
                else if (jsonResult != null && jsonResult['complete'] == true) {
                    if (onSuccessMethod != null)
                        onSuccessMethod(jsonResult['finalMessage']);
                   	emptyResponseCountsByProcess[processKey] = null;
                    $('#progress').modal('hide');
                }
                else if (jsonResult != null && jsonResult['aborted'] == true) {
                    if (typeof markCurrentProcessAsAborted != "undefined")
                        markCurrentProcessAsAborted();
                    else
                        processAborted = true;
                    emptyResponseCountsByProcess[processKey] = null;
                    $('#progress').modal('hide');
                }
                else {
                    if (jsonResult != null && jsonResult['error'] != null) {
                        alert("Error occurred:\n\n" + jsonResult['error']);
                        $('#progress').data('error', true);
                        $('#progress').modal('hide');
                        emptyResponseCountsByProcess[processKey] = null;
                    } else {
						if (jsonResult != null)
                        	$('#progressText').html(jsonResult.progressDescription);
                        displayProcessProgress(nbMin, token, processId, onSuccessMethod);
                    }
                }
            },
            error: function (xhr, ajaxOptions, thrownError) {
                handleError(xhr, thrownError);
            }
        });
    }
    setTimeout(function() { functionToCall(onSuccessMethod); }, (minimumProcessQueryIntervalUnit * nbMin));
}

function abort(token) {
    $('#progressText').html("Aborting...").fadeIn();
    $('#exportPanel').hide();
    $('#progress').data('error', true);
    $.ajax({
        url: abortUrl,
        type: "DELETE",
        headers: {
            "Authorization": "Bearer " + token
        },
        success: function (jsonResult) {
            if (jsonResult.processAborted === true) {
				processAborted = true;
                $('#progress').modal('hide');
            } else {
                handleError(null, "unable to abort");
                //$('#progress').modal('hide');
            }
        },
        error: function (xhr, ajaxOptions, thrownError) {
            handleError(xhr, thrownError);
        }
    });
}

function displayMessage(message, duration) {
    duration = duration === undefined ? 5000 : duration;
    $(document.body).append('<div class="alert alert-info alert-dismissable fade in" style="z-index:2000; position:absolute; top:100px; left:' + (15 + $("div#searchPanel").width() / 4) + 'px; min-width:450px;"><a href="#" class="close" data-dismiss="alert" aria-label="close">&times;</a><div id="msg">' + message + '</div></div>');
    if (duration !== null){
        window.setTimeout(function() {
            $(".alert").fadeTo(500, 0, function(){
                $(this).remove(); 
            });
        }, duration);
    }
}

function handleError(xhr, thrownError) {
    if (xhr != null && xhr.status == 401) {
        location.href = 'login.do';
        return;
    }

    var mainMsg = null, errorMsg = null;
    if (xhr != null && xhr.status /*DropZone returns 0 for client side errors*/> 0 && xhr.status < 500)
        mainMsg = (xhr.statusText == "" ? "Error " + xhr.status : xhr.statusText) + ": " + (xhr.responseText == "" ? thrownError : xhr.responseText);
    else {
        mainMsg = xhr != null ? 'Request Status: ' + xhr.status  : (thrownError != null ? thrownError : '');
	    if (xhr != null && xhr.responseText != null) {
	        try {
	            errorMsg = (xhr.statusText == "" ? "Error " + xhr.status : xhr.statusText) + ": " + $.parseJSON(xhr.responseText)['errorMsg'];
	        }
	        catch (err) {
	            errorMsg = (xhr.statusText == "" ? "Error " + xhr.status : xhr.statusText) + ": " + xhr.responseText;
	        }
	    }
    }

    $(document.body).append('<div class="alert alert-warning alert-dismissable fade in" style="z-index:2000; position:absolute; top:53px; left:10%; min-width:400px;"><a href="#" class="close" data-dismiss="alert" aria-label="close">&times;</a><strong>An error occured!</strong><div id="msg">' + mainMsg + " " + (errorMsg != null ? "<button style='float:right; margin-top:-20px;' onclick='$(this).next().show(200); $(this).remove();'>Click for technical details</button><pre style='display:none; font-size:10px;'>" + errorMsg + "</pre>" : "") + '</div></div>');
    window.setTimeout(function() {
        $(".alert").fadeTo(500, 0, function(){
            $(this).remove(); 
        });
    }, 5000);
	$('div.modal').modal('hide');
}

var arrayIntersection = function(){
  return Array.from(arguments).reduce(function(previous, current){
    return previous.filter(function(element){
      return current.indexOf(element) > -1;
    });
  });
};

var igvGenomeOptions = null;
function addIgvExportIfRunning() {
    if (igvDataLoadPort == null)
        return;
    
    var igvGenomeOptions = null;
    $.ajax({
        type:"GET",
        url:"http://127.0.0.1:" + igvDataLoadPort,
        success:function(jsonResult) {    
            if ("ERROR Unknown command: /" == jsonResult)
            {
                if (igvGenomeOptions == null)
                {
                    var genomeList = $.ajax({
                        async:false,
                        type:"GET",
                        url:igvGenomeListUrl,
                         crossDomain : true,
                        error:function(xhr, ajaxOptions, thrownError) {}
                    });
                    
                    igvGenomeOptions = "<option>&nbsp;</option>";
                    if (genomeList.responseText != null)
                    {
                        var genomeLines = genomeList.responseText.split("\n");
                        for (var i=0; i<genomeLines.length; i++)
                            if (i > 0 || !genomeLines[i].startsWith("<"))    // skip header
                            {
                                var genomeFields = genomeLines[i].split("\t");
                                if (genomeFields.length == 3)
                                    igvGenomeOptions += "<option value='" + genomeFields[2] + "'>" + genomeFields[0] + "</option>";
                            }
                    }
                    $('div#serverExportBox').append("<br/><br/><center><table><tr><th valign='middle'>View in IGV within genomic/structural context&nbsp;</th></tr><tr><td align='center'><select id='igvGenome' style='min-width:175px;'>" + igvGenomeOptions + "</select><br/>(you may select a genome to switch to)</td><td valign='top'>&nbsp;<input type='button' value='Send' onclick='sendToIGV();'/></td></tr></table></center>");
                }
            }
        },
        error:function(xhr, ajaxOptions, thrownError) {
            //handleError(xhr, ajaxOptions, thrownError);
            console.log("Unable to find IGV instance");
        }
    });
}

function addFjBytesExport() {
    $('div#serverExportBox').append("<br/><br/><center><input type='button' value='View in Flapjack-Bytes' onclick='sendToFjBytes();'/>" + (exportedIndividualCount * count > 500000000 ? "<div class='text-red margin-top'>WARNING: Exported dataset potentially contains more than 500 million genotypes.<br/>A standard workstation's web-browser may be unable to load it in with Flapjack-Bytes </div>" : "") + "</center>");
}

function sendToFjBytes() {
    $("#fjBytesPanel").modal({
        opacity: 80,
        overlayCss: {
            backgroundColor: "#111111"
        }
    });

	let url = "fjbytes.html?m=" + location.origin + $("a#exportOutputUrl").attr("href").replace(new RegExp(/\.[^.]*$/), '.map') +
	            "&g=" + location.origin + $("a#exportOutputUrl").attr("href").replace(new RegExp(/\.[^.]*$/), '.genotype') +
	            "&p=" + location.origin + $("a#exportOutputUrl").attr("href").replace(new RegExp(/\.[^.]*$/), '.phenotype') +
	            "&id=" + getModuleName();
	$('#fjBytesPanelHeader').html('<center>This is a functionality under development and might not be totally stable. Check <a href="https://github.com/cropgeeks/flapjack-bytes" target="_blank">https://github.com/cropgeeks/flapjack-bytes</a> for information about Flapjack-Bytes.&nbsp;&nbsp;&nbsp;<a href="' + url + '" onclick="$(\'#fjBytesPanel\').modal(\'hide\');" target="_blank">Open in separate window</a></center>');
	$("#fjBytesFrame").attr('src', url);
}

function getNcbiTaxonDetails(ncbiTaxonId)
{
    var result = $.ajax({
        async:false,
        type:"GET",
        url:"https://eutils.ncbi.nlm.nih.gov/entrez/eutils/esummary.fcgi?db=taxonomy&retmode=json&id=" + ncbiTaxonId,
        error:function(xhr, ajaxOptions, thrownError) {}
    });
    return result['responseJSON']['result'][ncbiTaxonId];
}

function grabNcbiTaxon(inputObj)
{
    if ($(inputObj).val() == '' || isNaN($(inputObj).val()))
        return;
    var taxonDetails=getNcbiTaxonDetails($(inputObj).val()), taxonName=taxonDetails['scientificname'], genus=taxonDetails['genus'], species=taxonDetails['species'];
    if (taxonName != null && taxonName != '')
        $(inputObj).attr('title', $(inputObj).val());
    if (species != null && species != '')
        $(inputObj).attr('species', genus + " " + species);

    $(inputObj).val(taxonName);
}

function sendToIGV(genomeID)
{
    var genomeID = $("select#igvGenome").val();
    $.ajax({
        type:"GET",
        url:"http://127.0.0.1:" + igvDataLoadPort + "/load?" + (genomeID != "" ? "genome=" + genomeID + "&" : "") + "file=" + location.origin + $("a#exportOutputUrl").attr("href").replace(new RegExp(/\.[^.]*$/), '.vcf'),
        success:function(tsvResult) {
            alert("Variant list was sent to IGV!");
        },
        error:function(xhr, ajaxOptions, thrownError) {
            handleError(xhr, ajaxOptions, thrownError);
        }
    });
}

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
		var indGTs = $("table.genotypeTable tr.ind_" + ind.replaceAll(" ", "_")).map(function() {
			return $(this).find("td:eq(0)").text();
		}).get();

		if (indGTs.size < 2)
			return;

		var correctIndGT = mostFrequentString(indGTs);
		$("table.genotypeTable tr.ind_" + ind.replaceAll(" ", "_")).each(function() {
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

function isNumberKey(evt) {
    var charCode = (evt.which) ? evt.which : evt.keyCode;
    if (charCode > 31 && (charCode < 48 || charCode > 57) && charCode !== 39 && charCode !== 37) {
        return false;
    }
    return true;
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
    
    if (mode == 0) {
	    $("#igvGroupsMenu ul").html('<li id="igvGroupsAll"><a href="#"><label><input type="radio" name="igvGroupsButton" value="all" onchange="igvSelectGroup();"/> All individuals</label></a></li>');
	    igvUpdateVariants();
	}
    else if (mode > 1) {
    	$("#igvGroupsMenu ul").html('<li id="igvGroupsSelected"><a href="#"><label><input type="radio" name="igvGroupsButton" value="selected" onchange="igvSelectGroup();" /> All selected individuals</label></a></li>');
    	$("#igvGroupsMenu ul").append('<li id="igvGroupsSeparate"><a href="#"><label><input type="radio" name="igvGroupsButton" value="separate" onChange="igvSelectGroup();"/> All groups</label></a></li>');
    }
    else
	    $("#igvGroupsMenu ul").html('');

    if (mode < count) {	// remove unwanted groups
    	let toDitch = elements.slice(mode);
		for (let i=0; i<toDitch.length; i++) {
			$("button#groupMemorizer" + (i+1)).removeClass('active');
			var indListBox = $(toDitch[i]).find(".indListBox");
			indListBox.off('change');
			indListBox.selectmultiple('deselectAll');	// doing this will remove possibly stored list in groupMemorize (localStorage)
			toDitch[i].remove();
		}
    }

    for (var i = 1; i <= mode; i++) {
		if (i >= count + 1) {
            var htmlContent = `<div class="row genotypeInvestigationDiv" id="genotypeInvestigationDiv${i}" style="display:none;"><span style="float:right; margin:3px; font-style:italic; font-weight:bold;">Group ${i}</span><div class="panel panel-default group${i} shadowed-panel"><div class="panel-body"><form class="form" role="form"><div class="custom-label" id="individualsLabel${i}">Individuals</div><div id="Individuals${i}" class="indListBox"></div><div style="margin-top:-25px; text-align:right;"><button type="button" class="btn btn-default btn-xs glyphicon glyphicon-floppy-save" data-toggle="button" aria-pressed="false" id="groupMemorizer${i}" onclick="setTimeout('applyGroupMemorizing(${i});', 100);"></button><button type="button" class="btn btn-default btn-xs glyphicon glyphicon-search hidden" title="Filter using metadata" id="groupSelector${i}" onclick="selectGroupUsingMetadata(${i});"></button><button type="button" class="btn btn-default btn-xs glyphicon glyphicon-copy" title="Copy current selection to clipboard" onclick="copyIndividuals(${i}); var infoDiv=$('<div style=\\'margin-top:-40px; right:55px; position:absolute;\\'>Copied!</div>'); $(this).before(infoDiv); setTimeout(function() {infoDiv.remove();}, 1200);"></button><button type="button" class="btn btn-default btn-xs glyphicon glyphicon-paste" aria-pressed="false" title="Paste filtered list from clipboard" id="pasteIndividuals${i}" onclick="toggleIndividualPasteBox(${i});"></button></div><div class="col margin-top-md vcfFieldFilters"><label class="custom-label">Minimum per-sample...</label><br/><div class="container-fluid"><div class="row" id="vcfFieldFilterGroup${i}"></div></div><small class="text-muted">(other data seen as missing)</small></div><div class="margin-top-md"><div class="container-fluid"><div class="row" style="padding-bottom:5px;"><div class="col-md-4" style="padding:0;"><div class="input-group"><input name="minMissingData${i}" value="0" id="minMissingData${i}" class="form-control input-sm" type="number" step="0.1" maxlength="2" min="0" max="100" onblur="rangeChanged('MissingData', ${i}, 0, 100);"><span class="input-group-addon input-sm">&le;</span></div></div><div class="col-md-4" style="text-align:center; padding:7px 2px; margin-top:-3px;"><label class="custom-label">Missing %</label></div><div class="col-md-4" style="padding:0;"><div class="input-group"><span class="input-group-addon input-sm">&le;</span><input name="maxMissingData${i}" value="100" id="maxMissingData${i}" class="form-control input-sm" type="number" step="0.1" maxlength="2" min="0" max="100" onblur="rangeChanged('MissingData', ${i}, 0, 100);"></div></div></div></div></div><div class="mafZone"><div class="container-fluid"><div class="row" style="padding-bottom:5px;"><div class="col-md-4" style="padding:0;"><div class="input-group"><input name="minMaf${i}" value="0" id="minMaf${i}" class="form-control input-sm" type="number" step="0.1" maxlength="2" min="0" max="50" onblur="rangeChanged('Maf', ${i}, 0, 50);"><span class="input-group-addon input-sm">&le;</span></div></div><div class="col-md-4" style="text-align:center; display:flex; flex-direction:column; padding:0 2px; margin-top:-1px;"><label class="custom-label">MAF %</label><small style="margin-top: -5px;" >(for bi-allelic)</small></div><div class="col-md-4" style="padding:0;"><div class="input-group"><span class="input-group-addon input-sm">&le;</span><input name="maxMaf${i}" value="50" id="maxMaf${i}" class="form-control input-sm" type="number" step="0.1" maxlength="2" min="0" max="50" onblur="rangeChanged('Maf', ${i}, 0, 50);"></div></div></div></div></div><div><div class="container-fluid"><div class="row" style="padding-bottom:5px;"><div class="col-md-4" style="padding:0;"><div class="input-group"><input name="minHeZ${i}" value="0" id="minHeZ${i}" class="form-control input-sm" type="number" step="0.1" maxlength="2" min="0" max="100" onblur="rangeChanged('HeZ', ${i}, 0, 100);"><span class="input-group-addon input-sm">&le;</span></div></div><div class="col-md-4" style="text-align:center; padding:7px 2px;"><label class="custom-label">HeteroZ %</label></div><div class="col-md-4" style="padding:0;"><div class="input-group"><span class="input-group-addon input-sm">&le;</span><input name="maxHeZ${i}" value="100" id="maxHeZ${i}" class="form-control input-sm" type="number" step="0.1" maxlength="2" min="0" max="100" onblur="rangeChanged('HeZ', ${i}, 0, 100);"></div></div></div></div></div><div class="margin-top-md"><div id="mostSameRatioSpan${i}" style="position:absolute; right:10px; margin-top:-2px;">&nbsp;Similarity ratio <input id="mostSameRatio${i}" class="input-xs" style="width:35px;" value="100" maxlength="3" onkeypress="return isNumberKey(event);" onblur="if ($(this).val().trim() == '' || isNaN($(this).val()) || $(this).val() > 100) $(this).val(100);">%</div><label for="Genotypes${i}" class="custom-label">Genotype patterns</label>&nbsp;<br/><span class="glyphicon glyphicon-question-sign" id="genotypeHelp${i}"  style="cursor:pointer; cursor:hand; float:right; margin-top:7px;"></span><select class="selectpicker gtPatterns" id="Genotypes${i}" data-actions-box="true" data-width="calc(100% - 20px)" data-live-search="true" name="Genotypes${i}"></select></div><div class="margin-top-md row discriminationDiv"><div class="margin-top-md col-md-6" style="white-space:nowrap; text-align:right;"><span class="glyphicon glyphicon-question-sign" id="genotypeDiscriminateHelp" style="cursor:pointer; cursor:hand;" title="Select another group here to limit search to variants for which the major genotype differs between both groups.\n\nTotal discrimination can be achieved by selecting pattern 'All or mostly the same' with Similarity ratio at 100% in both groups."></span>&nbsp;<b>Discriminate with</b></div><div class="col-md-5" style="text-align:left; width:92px;"><select class="selectpicker" id="discriminate${i}" data-width="100%" name="discriminate${i}" onchange="checkGroupOverlap(${i});"></select></div><div class="col-md-1 group${i}" id="overlapWarning${i}" hidden style="position:absolute; font-weight:bold; padding:5px; border-radius:3px; z-index:2; border:1px solid black; right:-90px; width:80px; cursor:pointer; cursor:hand; color:black;" title="Some individuals are selected in both groups">Overlap&nbsp;<img align="left" src="images/warning.png" height="15" width="18"/></div></div></form></div></div></div>`;
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

            $('#individualsLabel' + i).html("Individuals (" +  indOpt.length + "/" +  indOpt.length + ")");

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
        $("#igvGroupsMenu ul").append('<li id="igvGroups' + i + '"><a href="#"><label><input type="radio" name="igvGroupsButton" value="group' + i + '" onchange="igvSelectGroup();" /> Group ' + i + '</label></a></li>');
    }
    
    $('#igvGroupsMenu ul li:first input').prop("checked", true);
    
    if (mode > count) {
        $('.indListBox').on('multiple_select_change', function () {
            var i = this.id.replace("Individuals", "");
            var nCount = $('#Individuals' + i).selectmultiple('count');
            $('#individualsLabel' + i).html("Individuals (" + (nCount == 0 ?  indOpt.length : nCount) + "/" +  indOpt.length + ")");
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
				$('#discriminate' + i).append("<option value='" + j + "'>Group " + j + "</option>");
	
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

function getToken() {
    $.ajax({
        url: tokenURL,
        async: false,
        type: "POST",
        dataType: "json",
        contentType: "application/json;charset=utf-8",
        success: function (jsonResult) {
            token = jsonResult.token;
            if (document.referrer.endsWith("/login.do") && jsonResult.msg != null)
                alert(jsonResult.msg);
        },
        error: function (xhr, thrownError) {
            handleError(xhr, thrownError);
        }
    });
}

// clear user token
function clearToken() {
	$.ajax({
		url: clearTokenURL,
		type: "DELETE",
		async: navigator.userAgent.indexOf("Firefox") == -1,	// for some reason it has to be synchronous for it to work with Firefox when triggered from a beforeunload event
		dataType: "json",
		contentType: "application/json;charset=utf-8",
		headers: {
			"Authorization": "Bearer " + token
		},
		error: function(xhr, thrownError) {
			if (xhr.status != 0)	// Firefox gets this instead of 401 (!)
				handleError(xhr, thrownError);
		}
	});
}

function containsHtmlTags(xStr)
{
    return xStr != xStr.replace(/<\/?[^>]+>/gi,"");
}

var filtersToColumns = new Array();

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
    var optionSB = new StringBuffer();
    textarea.val().split("\n").map(id => id.trim()).filter(id => id.length > 0).forEach(function (ind) {
        cleanSelectionArray.push(ind);
    });
    $('#Individuals' + groupNumber).selectmultiple('batchSelect', [cleanSelectionArray, true]);
    applyGroupMemorizing(groupNumber);
	checkGroupOverlap(groupNumber);
    $("button#pasteIndividuals" + groupNumber).click();
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
        spanText = idArray.length + " items selected";
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
    let groups = specificGroups != null ? specificGroups : Array.from({ length: $(".genotypeInvestigationDiv").length }, (_, index) => index + 1);
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

function sendToGalaxy(archivedDataFiles) {
	var galaxyInstanceUrl = $("#galaxyInstanceURL").val().trim(), apiKey = sessionStorage.getItem("galaxyApiKey::" + galaxyInstanceUrl);
	if (apiKey == null)
		apiKey = prompt("Enter the API key tied to your account on\n" + galaxyInstanceUrl);
	if (apiKey != null && apiKey.trim() != "") {
		sessionStorage.setItem("galaxyApiKey::" + galaxyInstanceUrl, apiKey);
		$('#progressText').html("Pushing files to " + galaxyInstanceUrl + " ...");
		$('#asyncProgressButton').hide();
		$('button#abort').hide();
		$('#progress').modal({
			backdrop: 'static',
			keyboard: false,
			show: true
		});
		setTimeout(function() {
			var n = 0, responseMsg = null;
			for (var fileUrl in archivedDataFiles)
				$.ajax({
					async: false,
					url: galaxyPushURL + "?galaxyUrl=" + galaxyInstanceUrl + "&galaxyApiKey=" + apiKey + "&fileUrl=" + archivedDataFiles[fileUrl],
					type: "GET",
					success: function(respString) {
						responseMsg = respString;
						n++;
					},
					error: function(xhr, ajaxOptions, thrownError) {
						$('#progress').modal('hide');
						
						if (xhr.status == 403) {
							console.log("Removing invalid Galaxy API key: " + apiKey);
							sessionStorage.removeItem("galaxyApiKey::" + galaxyInstanceUrl);
						}
						
						if (thrownError == "" && xhr.getAllResponseHeaders() == '')
							alert("Error accessing resource: " + genomeURL);
						else
							handleError(xhr, thrownError);
					}
				});
			if (n > 0)
				if (confirm(n + " file(s) " + responseMsg + "\nOpen a window pointing to that Galaxy instance?"))
					window.open(galaxyInstanceUrl);
			$('#progress').modal('hide');
		}, 1);
	}
}

function getOutputToolConfig(toolName)
{
    var storedToolConfig = localStorage.getItem("outputTool_" + toolName);
    return storedToolConfig != null ? JSON.parse(storedToolConfig) : onlineOutputTools[toolName];
}

function applyOutputToolConfig(t) {
	if ($("input#outputToolURL").val().trim() == "") {
		localStorage.removeItem("outputTool_" + $("#onlineOutputTools").val());
		configureSelectedExternalTool();
	} else
		localStorage.setItem("outputTool_" + $("#onlineOutputTools").val(), JSON.stringify({"url" : $("input#outputToolURL").val(), "formats" : $("input#outputToolFormats").val()}));

	if ($("input#galaxyInstanceURL").val().trim() == "")
		localStorage.removeItem("galaxyInstanceURL");
	else
		localStorage.setItem("galaxyInstanceURL", $("input#galaxyInstanceURL").val());

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

function showServerExportBox()
{
	$("div#exportPanel").hide();
	$("a#exportBoxToggleButton").removeClass("active");
	if (processAborted || downloadURL == null)
		return;

	var fileName = downloadURL.substring(downloadURL.lastIndexOf("/") + 1);
	$('#serverExportBox').html('<button type="button" class="close" data-dismiss="modal" aria-hidden="true" style="float:right;" onclick="$(\'#serverExportBox\').hide();">x&nbsp;</button></button>&nbsp;Export file will be available at this URL for 48h:<br/><a id="exportOutputUrl" download href="' + downloadURL + '">' + fileName + '</a> ').show();
	var exportedFormat = $('#exportFormat').val().toUpperCase();
	if ("VCF" == exportedFormat)
		addIgvExportIfRunning();
	else if ("FLAPJACK" == exportedFormat)
		addFjBytesExport();

	var archivedDataFiles = new Array(), exportFormatExtensions = $("#exportFormat option:selected").data('ext').split(";");
	if ($('#exportPanel input#exportedIndividualMetadataCheckBox').is(':checked') && "FLAPJACK" != exportedFormat && "DARWIN" != exportedFormat /* these two already have their own metadata file format*/)
		exportFormatExtensions.push("tsv");
	for (var key in exportFormatExtensions)
		archivedDataFiles[exportFormatExtensions[key]] = location.origin + downloadURL.replace(new RegExp(/\.[^.]*$/), '.' + exportFormatExtensions[key]);
	
	var galaxyInstanceUrl = $("#galaxyInstanceURL").val().trim();
	if (galaxyInstanceUrl.startsWith("http")) {
		var fileURLs = "";
		for (key in archivedDataFiles)
			fileURLs += (fileURLs == "" ? "" : " ,") + "'" + archivedDataFiles[key] + "'";
		$('#serverExportBox').append('<br/><br/>&nbsp;<input type="button" value="Send exported data to Galaxy" onclick="sendToGalaxy([' + fileURLs + ']);" />&nbsp;');			
	}

	if (onlineOutputTools != null)
		for (var toolName in onlineOutputTools) {
			var toolConfig = getOutputToolConfig(toolName);
			if (toolConfig['url'] != null && toolConfig['url'].trim() != "" && (toolConfig['formats'] == null || toolConfig['formats'].trim() == "" || toolConfig['formats'].toUpperCase().split(",").includes($('#exportFormat').val().toUpperCase()))) {		

				var formatsForThisButton = "", urlForThisButton = toolConfig['url'];
				var matchResult = urlForThisButton.match(/{([^}]+)}/g);
				if (matchResult != null) {
					var placeHolders = matchResult.map(res => res.replace(/{|}/g , ''));
					phLoop: for (var i in placeHolders) {
						var phFormats = placeHolders[i].split("\|");
						for (var j in phFormats) {
							for (var key in archivedDataFiles) {
								if (key == phFormats[j]) {
									formatsForThisButton += (formatsForThisButton == "" ? "" : ", ") + key;
									urlForThisButton = urlForThisButton.replace("\{" + placeHolders[i] + "\}", archivedDataFiles[key]);
									continue phLoop;
								}
							}
						}
						console.log("unused param: " + placeHolders[i]);
						urlForThisButton = urlForThisButton.replace("\{" + placeHolders[i] + "\}", "");
					}
				}
				
				if (urlForThisButton == toolConfig['url'] && urlForThisButton.indexOf("*") != -1) {
					urlForThisButton = urlForThisButton.replace("\*", Object.values(archivedDataFiles).join(","));
					formatsForThisButton = Object.keys(archivedDataFiles).join(", ");
				}

				if (formatsForThisButton != "")
					$('#serverExportBox').append('<br/><br/>&nbsp;<input type="button" value="Send ' + formatsForThisButton + ' file(s) to ' + toolName + '" onclick="window.open(\'' + urlForThisButton + '\');" />&nbsp;')
			}
		}
}

var StringBuffer = function() {
    this.buffer = new Array();
};
StringBuffer.prototype.append = function(str) {
    this.buffer[this.buffer.length] = str;
};
StringBuffer.prototype.toString = function() {
    return this.buffer.join("");
};
if (!String.prototype.endsWith) {
   String.prototype.endsWith = function(suffix) {
     return this.indexOf(suffix, this.length - suffix.length) !== -1;
   };
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
        
    } else {
        $submenu.css('display', 'none');
    }
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
            url: loadBookmarkedQueryURL + '?module=' + referenceset
                + '&queryId=' + queryId,
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
	                  if(tabIds.length != 0) {
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
	                  $('#Genotypes'+ (i + 1)).selectpicker('val', jsonResult['gtPattern'][i]);
	                  $('#mostSameRatio'+ (i + 1)).val(jsonResult['mostSameRatio'][i]);
	                  $('#Genotypes'+ (i + 1)).trigger('change');
	                  $('#discriminate' + (i + 1)).selectpicker('val', jsonResult['discriminate'][i]);
	                  $('#discriminate'+ (i + 1)).trigger('change');
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
        $('#pasteVariantIds').removeAttr('disabled').selectpicker('refresh');
        $('#uploadVariantIds').removeAttr('disabled').selectpicker('refresh');
        
        $('#GeneIds').val("").prop('disabled', true);
        $('#geneIdsSelect').prop('disabled', true).selectpicker('deselectAll').selectpicker('refresh');
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
        $('#geneIdsSelect').prop('disabled', true).selectpicker('deselectAll').selectpicker('refresh');
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
        $('#geneIdsSelect').prop('disabled', true).selectpicker('deselectAll').selectpicker('refresh');
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
		$('#geneIdsSelect').prop('disabled', true).selectpicker('refresh');
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

function buildHeader(token, assemblyId, individuals) {
    var headers = { "Authorization": "Bearer " + token };
    if (assemblyId != null)
    	headers["assembly"] = assemblyId;
    if (individuals != null)
    	headers["ind"] = individuals;
	return headers;
}
