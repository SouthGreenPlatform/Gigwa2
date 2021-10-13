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
 * This file store common js methods 
 */
var minimumProcessQueryIntervalUnit = 100;


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
};

function arrayContainsIgnoreCase(array, element)
{
	for (var i = 0; i < array.length; i++) 
		if ((array[i] == null && element == null) || (array[i] != null && element != null && array[i].toLowerCase() == element.toLowerCase())) 
			return true;
	return false;
};

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

function displayProcessProgress(nbMin, token, onSuccessMethod) {
	var functionToCall = function(onSuccessMethod) {
		$.ajax({
			url: progressUrl,
			type: "GET",
			async: false,
			headers: {
				"Authorization": "Bearer " + token
			},
			success: function (jsonResult) {
				if (jsonResult == null && (typeof processAborted == "undefined" || !processAborted))
					displayProcessProgress(nbMin, token, onSuccessMethod);
				else if (jsonResult['complete'] == true) {
					if (onSuccessMethod != null)
						onSuccessMethod();
					$('#progress').modal('hide');
				}
				else if (jsonResult['aborted'] == true) {
					if (typeof markCurrentProcessAsAborted != "undefined")
						markCurrentProcessAsAborted();
					else
						processAborted = true;
					$('#progress').modal('hide');
				}
				else {
					if (jsonResult['error'] != null) {
						alert("Error occured:\n\n" + jsonResult['error']);
						$('#progress').data('error', true);
						$('#progress').modal('hide');
					} else {
						$('#progressText').html(jsonResult.progressDescription);
						displayProcessProgress(nbMin, token, onSuccessMethod);
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
	processAborted = true;
	$('#exportPanel').hide();
	$.ajax({
		url: abortUrl,
		type: "DELETE",
		headers: {
			"Authorization": "Bearer " + token
		},
		success: function (jsonResult) {
			$('#progress').data('error', true);
			if (jsonResult.processAborted === true) {
				$('#progress').modal('hide');
			} else {
				handleError(null, "unable to abort");
				$('#progress').modal('hide');
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
	if (xhr != null && xhr.status == 401)
	{
		location.href = 'login.jsp';
		return;
	}

	if (xhr != null && xhr.status == 403)
	{
		processAborted = true;
		$('div.modal').modal('hide');
		alert(xhr.responseText);
		return;
	}
		
	var errorMsg;
	if (xhr != null && xhr.responseText != null) {
		try {
			errorMsg = $.parseJSON(xhr.responseText)['errorMsg'];
		}
		catch (err) {
			errorMsg = xhr.responseText;
		}
	}
	$(document.body).append('<div class="alert alert-warning alert-dismissable fade in" style="z-index:2000; position:absolute; top:53px; left:10%; min-width:400px;"><a href="#" class="close" data-dismiss="alert" aria-label="close">&times;</a><strong>An error occured!</strong><div id="msg">' + (xhr != null ? 'Request Status: ' + xhr.status  : '') + (errorMsg != null ? "<button style='float:right; margin-top:-20px;' onclick='$(this).next().show(200); $(this).remove();'>Click for technical details</button><pre style='display:none; font-size:10px;'>" + errorMsg + "</pre>" : thrownError) + '</div></div>');
	window.setTimeout(function() {
		$(".alert").fadeTo(500, 0, function(){
			$(this).remove(); 
		});
	}, 5000);
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
							if (i > 0 || !genomeLines[i].startsWith("<"))	// skip header
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
	$('div#serverExportBox').append("<br/><br/><center><input type='button' value='View in Flapjack-Bytes' onclick='sendToFjBytes();'/></center>");
}

function sendToFjBytes() {
	$("#fjBytesPanel").modal({
		opacity: 80,
		overlayCss: {
			backgroundColor: "#111111"
		}
	});

	let url = "fjbytes.html?m=" + location.origin + $("a#exportOutputUrl").attr("href").replace(new RegExp(/\.[^.]*$/), '.map') + "&g=" + location.origin + $("a#exportOutputUrl").attr("href").replace(new RegExp(/\.[^.]*$/), '.genotype');
	$('#fjBytesPanelHeader').html('<center>This is a functionality under development and might not be totally stable. Check <a href="https://github.com/cropgeeks/flapjack-bytes" target="_blank">https://github.com/cropgeeks/flapjack-bytes</a> for information about Flapjack-Bytes.&nbsp;&nbsp;&nbsp;<a href="' + url + '" target="_blank">Open in separate window</a></center>');
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

// 0 = Disabled, 1 = 1 group, 2 = 2 groups
function getGenotypeInvestigationMode(){
	return parseInt($("#genotypeInvestigationMode").val());
}

// fill all widgets for a specific module & project
function fillWidgets() {
	loadVariantTypes();
	loadSequences();
	fillExportFormat();
	loadVariantEffects();
	loadSearchableVcfFields();
	loadVcfFieldHeaders();
	loadIndividuals();
	loadNumberOfAlleles();
	loadGenotypePatterns();
	readPloidyLevel();
}

function loadSearchableVcfFields()
{
	$.ajax({	// load searchable annotations
		url: searchableVcfFieldListURL + '/' + encodeURIComponent(getProjectId()),
		type: "GET",
		dataType: "json",
		async: false,
		contentType: "application/json;charset=utf-8",
		headers: {
			"Authorization": "Bearer " + token
		},
		success: function(jsonResult) {
			for (var i=1; i<=2; i++)
			{
				var htmlContents = "";
				for (var key in jsonResult)
			   		htmlContents += '<div class="col-xl-6 input-group third-width" style="margin-left:2px; margin-top:1px; float:left;"> <span class="input-group-addon input-xs"><label for="' + jsonResult[key] + '_threshold' + i + '" class="' + jsonResult[key] + '_thresholdLabel">' + jsonResult[key] + '</label></span> <input id="' + jsonResult[key] + '_threshold' + i + '" class="form-control input-sm" type="number" step="0.1" min="0" name="' + jsonResult[key] + '_threshold' + i + '" value="0" maxlength="4" onkeypress="return isNumberKey(event);" onblur="if ($(this).val() == \'\') $(this).val(0);"></div>';
				$('#vcfFieldFilterGroup' + i).html(htmlContents);
				$('.vcfFieldFilters').toggle(htmlContents != "");
			}
		},
		error: function(xhr, ajaxOptions, thrownError) {
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

function enableMafOnlyIfGtPatternAndAlleleNumberAllowTo() {
	var onlyBiAllelicInSelection = ($('#numberOfAlleles').children().length == 1 && $('#numberOfAlleles').children()[0].innerText == "2") || $('#numberOfAlleles').val() == 2;
	var enableMaf = onlyBiAllelicInSelection && ploidy <= 2 && $('#Genotypes1').val() != null && !$('#Genotypes1').val().startsWith("All Homozygous");
	$('#minmaf1').prop('disabled', enableMaf ? false : "disabled");
	$('#maxmaf1').prop('disabled', enableMaf ? false : "disabled");
	$('#minmaf2').prop('disabled', enableMaf ? false : "disabled");
	$('#maxmaf2').prop('disabled', enableMaf ? false : "disabled");
	if (!enableMaf)
	{
		$('#minmaf1').val(0);
		$('#maxmaf1').val(50);
		$('#minmaf2').val(0);
		$('#maxmaf2').val(50);
	}
}

function updateGtPatterns() {
	for (var i=1; i<=2; i++)
	{
		var selectedIndivCount = $('#Individuals' + i).selectmultiple('count');
		var option = "";
		var previousVal = $('#Genotypes' + i).val();
		var gtPatternIndex = 0;
		for (var gtPattern in gtTable) {
			var fAddToSelect = true;
			if (selectedIndivCount == 1 && gtPatternIndex >= 1 && gtPattern.toLowerCase().indexOf("all ") > -1)
				fAddToSelect = false;
			else if (gtPatternIndex == 11)
			{
				var onlyBiAllelicInSelection = ($('#numberOfAlleles').children().length == 1 && $('#numberOfAlleles').children()[0].innerText == "2") || $('#numberOfAlleles').val() == 2; 
				fAddToSelect = ploidy == 2 && onlyBiAllelicInSelection && selectedIndivCount >= 3;
			}
			if (fAddToSelect)
				option += '<option' + (previousVal == gtPattern ? ' selected' : '') + '>' + gtPattern + '</option>';
			gtPatternIndex++;
		}
		$('#Genotypes' + i).html(option).val(previousVal).selectpicker('refresh');
		$('#Genotypes' + i).change();
	}
	
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
	if (localStorage.getItem('browsingAndExportingEnabled') == 1)
		$('input#browsingAndExportingEnabled').attr('checked', 'checked');
	else
		$('input#browsingAndExportingEnabled').removeAttr('checked');
}


function buildSearchQuery(searchMode, pageToken){
	let annotationFieldThresholds = {}, annotationFieldThresholds2 = {};
	$('#vcfFieldFilterGroup1 input').each(function() {
		if (parseFloat($(this).val()) > 0)
			annotationFieldThresholds[this.id.substring(0, this.id.lastIndexOf("_"))] = $(this).val();
	});
	$('#vcfFieldFilterGroup2 input').each(function() {
		if (parseFloat($(this).val()) > 0)
			annotationFieldThresholds2[this.id.substring(0, this.id.lastIndexOf("_"))] = $(this).val();
	});
	
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
		"geneName": $('#geneName').val().trim().replace(new RegExp(' , ', 'g'), ','),

		"callSetIds": getSelectedIndividuals(1, true),
		"gtPattern": $('#Genotypes1').val(),
		"mostSameRatio": $('#mostSameRatio1').val(),
		"minmaf": $('#minmaf1').val() === null ? 0 : parseFloat($('#minmaf1').val()),
		   "maxmaf": $('#maxmaf1').val() === null ? 50 : parseFloat($('#maxmaf1').val()),
		 "missingData": $('#missingdata1').val() === null ? 100 : parseFloat($('#missingdata1').val()),
		"annotationFieldThresholds": annotationFieldThresholds,

		"callSetIds2": getSelectedIndividuals(2, true),
		"gtPattern2": $('#Genotypes2').val(),
		"mostSameRatio2": $('#mostSameRatio2').val(),
		"minmaf2": $('#minmaf2').val() === null ? 0 : parseFloat($('#minmaf2').val()),
		   "maxmaf2": $('#maxmaf2').val() === null ? 50 : parseFloat($('#maxmaf2').val()),
		 "missingData2": $('#missingdata2').val() === null ? 100 : parseFloat($('#missingdata2').val()),
			"annotationFieldThresholds2": annotationFieldThresholds2,
		
		"discriminate": $('#discriminate').prop('checked'),
		"pageSize": 100,
		"pageToken": pageToken,
		"sortBy": sortBy,
		"sortDir": sortDesc === true ? 'desc' : 'asc'
	};
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
	var headerContent = '<thead><tr style="background-color:darkgrey;"><th>id</th>' +
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
		var knownAlleles = jsonResult.variants[variant].alternateBases
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
				$('#showdensity').hide();
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
			
			if ($(this).index() < $(this).parent().find("td").length - 1)	// the last column is reserved for extra functionalities
				loadVariantAnnotationData();
		});
		
		if (igvBrowser) igvUpdateVariants();
	}
}

function toggleExportPanel() {
//	updateExportToServerCheckBox();
	$('#exportPanel').toggle();
}

function updateExportToServerCheckBox() {
	if (!$('#keepExportOnServ').is(':visible'))
	{
		var forbidDirectDownload = indCount*count > 1000000000;
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
	var nRunCount = $("table.genotypeTable").length;
	if (nRunCount < 2)
		return; // nothing to compare

	var indivGenotypes = new Array();
	var tableCounter = 0;
	$("table.genotypeTable").each(function() {
		$(this).find("tr:gt(0)").each(function() {
			var individual = $(this).find("th").text();
			var genotypes = indivGenotypes[individual];
			if (genotypes == null)
				genotypes = new Array();

			var genotype = $(this).find("td:eq(0)").html().trim();
			if (!arrayContains(genotypes, genotype))
				genotypes.push(genotype);
			indivGenotypes[individual] = genotypes;

			if (tableCounter == nRunCount - 1 && Object.keys(genotypes).length > 1)
				markAsMissingData(individual);
		});
		tableCounter++;
	});
}

function markAsMissingData(individual) {
	$("table.genotypeTable").each(function() {
		$(this).find("tr:gt(0)").each(function() {
			if ($.trim($(this).find("th").text()) == individual) {
				$(this).find("td:eq(0)").addClass("missingData");
				$("div#missingDataLegend").show();
			}
		});
	});
}

function getSelectedIndividuals(groupNumber, provideGa4ghId) {
	var selectedIndividuals = [];
	var groups = groupNumber == null ? [1, 2] : [groupNumber];
	var ga4ghId = getProjectId() + "§";
	for (var groupKey in groups)
	{
		var groupIndividuals = $('#Individuals' + groups[groupKey]).selectmultiple('value');
		if (groupIndividuals == null)
			groupIndividuals = $('#Individuals' + groups[groupKey]).selectmultiple('option')
		for (var indKey in groupIndividuals)
			if (!arrayContains(selectedIndividuals, groupIndividuals[indKey]))
				selectedIndividuals.push((provideGa4ghId ? ga4ghId : "") + groupIndividuals[indKey]);
	}
	return selectedIndividuals.length == indCount ? [] : selectedIndividuals;
}

function getAllSelectedIndividuals(provideGa4ghId){
	let individuals;
	let investigationMode = getGenotypeInvestigationMode();
	if (investigationMode == 0){
		individuals = [];
	} else {
		individuals = getSelectedIndividuals(1, provideGa4ghId);
		if (investigationMode >= 2){
			let group2 = getSelectedIndividuals(2, provideGa4ghId);
			if (group2.length == 0){
				individuals = [];
			} else {
				individuals = individuals.concat(group2);
			}
		}
	}
	return individuals;
}

function getAnnotationThresholds(individual, indArray1, indArray2)
{
	var annotationFieldThresholds1 = {}, annotationFieldThresholds2 = {}, result = {};

	var inGroup1 = indArray1.length == 0 || arrayContains(indArray1, individual);
	if (inGroup1)
		$('#vcfFieldFilterGroup1 input').each(function() {
			var value = $(this).val();
			if (value != "0")
				result[this.id.substring(0, this.id.lastIndexOf("_"))] = parseFloat(value);
		});
	
	var inGroup2 = indArray2.length == 0 || arrayContains(indArray2, individual);
	if (inGroup2)
		$('#vcfFieldFilterGroup2 input').each(function() {
			var value = $(this).val();
			if (value != "0")
			{
				var annotation = this.id.substring(0, this.id.lastIndexOf("_"));
				result[annotation] = inGroup1 ? Math.max(result[annotation], parseFloat(value)) : parseFloat(value);
			}
		});

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
	if (mode <= 1)
	{
		$('#discriminationDiv').hide(300);
		$('#discriminate').prop('checked', false);
		$('#Individuals2').selectmultiple('deselectAll');
		$('#Genotypes2').selectpicker('deselectAll');
		$('#missingdata2').val("100");
		$('#vcfFieldFilterGroup2 input').val("0");
		$('#minmaf2').val("0");
		$('#maxmaf2').val("50");
		$('div#genotypeInvestigationDiv2').hide(300);
		
		if (mode == 0)
		{
			$('#Individuals1').selectmultiple('deselectAll');
			$('#Genotypes1').selectpicker('deselectAll');
			$('#missingdata1').val("100");
			$('#vcfFieldFilterGroup1 input').val("0");
			$('#minmaf1').val("0");
			$('#maxmaf1').val("50");
			$('div#genotypeInvestigationDiv1').hide(300);

			$("#igvGroupsAll input").prop("checked", true);
			$("#igvGroupsMenu").hide();
		}
		else {
			$('div#genotypeInvestigationDiv1').show(300);

			$("#igvGroupsMenu").show();
			$("#igvGroups1").hide();
			$("#igvGroups2").hide();
			$("#igvGroupsSeparate").hide();
			$("#igvGroupsSelected input").prop("checked", true);
		}
	}
	else {
 		$('#discriminationDiv').show(300);
		$('div.genotypeInvestigationDiv').show(300);
		
		$("#igvGroupsMenu").show();
		$("#igvGroups1").show();
		$("#igvGroups2").show();
		$("#igvGroupsSeparate").show();
		$("#igvGroupsSelected input").prop("checked", true);
	}
	
	$('#exportedIndividuals').html(getExportIndividualSelectionModeOptions());
	$('#exportedIndividuals').parent().parent().find('div.individualSelectionDiv').remove();
	$('#exportedIndividuals').selectpicker('refresh');
}

function getExportIndividualSelectionModeOptions() {
	var mode = $('select#genotypeInvestigationMode').val();
	var exportedIndOptions = "";
	if (mode > 1)
		exportedIndOptions += '<option id="exportedIndividuals12" value="12">Both groups</option>';
	if (mode > 0)
		exportedIndOptions += '<option id="exportedIndividuals1" value="1">Group 1</option>';
	if (mode > 1)
		exportedIndOptions += '<option id="exportedIndividuals2" value="2">Group 2</option>';
	exportedIndOptions += '<option id="exportedIndividualsAll" value="">All of them (' + indCount + ')</option>';
	exportedIndOptions += '<option id="exportedIndividualsChoose" value="choose">Choose some</option>';
	return exportedIndOptions;
}

function applyGroupMemorizing(groupNumber, rememberedSelection) {
	var variableName = "groupMemorizer" + groupNumber + "::" + $('#module').val() + "::" + $('#project').val();
	var groupMemorizer = $("button#groupMemorizer" + groupNumber);
	var active = groupMemorizer.hasClass('active');
	if (active)
	{
		var variableValue = localStorage.getItem(variableName);
		if (rememberedSelection != null)
			$('#Individuals' + groupNumber).selectmultiple('batchSelect', [rememberedSelection]);
		else
			localStorage.setItem(variableName, JSON.stringify(getSelectedIndividuals(groupNumber)));
	}
	else
		localStorage.removeItem(variableName);
	groupMemorizer.attr("title", "Memorize selection in browser: " + (active ? "ON" : "OFF"));
}

function toggleIndividualSelector(previousSibling, flag, size, onchangeFunc) {
	if (flag)
	{
		var allInd = $('#Individuals1').selectmultiple('option');
		var allIndOptions = new StringBuffer();
		for (var key in allInd)
			allIndOptions.append("<option title=\"" + allInd[key] + "\">" + allInd[key] + "</option>");
		previousSibling.after("<div style='display:none; margin-top:5px;' class='individualSelectionDiv'><select " + (onchangeFunc != null ? "onchange='" + onchangeFunc + "();' " : "") + " style='width:100%;' multiple size='15' class='individualSelector'>" + allIndOptions + "</select></div>");
		if (!isNaN(size))
			previousSibling.parent().find('select.individualSelector').attr("size", size);
		previousSibling.parent().find('div.individualSelectionDiv').show(200);
	}
	else
		previousSibling.parent().find('div.individualSelectionDiv').hide(200, function() { previousSibling.parent().find('div.individualSelectionDiv').remove() });
}

function groupHasFilters(jsonResult, grpNumber){
	var e = grpNumber;
	if (grpNumber == 1) var e = '';
	if(jsonResult['callSetIds'+e].length != 0) return true;
	if(typeof jsonResult['annotationFieldThresholds'+e]['DP'] != 'undefined' && jsonResult['annotationFieldThresholds'+e]['DP'].length != 0)  return true;
	if(typeof jsonResult['annotationFieldThresholds'+e]['GQ'] != 'undefined' && jsonResult['annotationFieldThresholds'+e]['GQ'].length != 0) return true;
	if(jsonResult['missingData'+e] != 100) return true;
	if(jsonResult['minmaf'+e] != 0) return true;
	if(jsonResult['maxmaf'+e] != 50) return true;
	if(jsonResult['gtPattern'+e] != 'Any') return true;
}

function getToken() {
	$.ajax({
		url: tokenURL,
		async: false,
		type: "POST",
		data: JSON.stringify({
			"username": "",
			"password": ""
		}),
		dataType: "json",
		contentType: "application/json;charset=utf-8",
		success: function (jsonResult) {
			token = jsonResult.token;
			if (document.referrer.endsWith("/login.jsp") && jsonResult.msg != null)
				alert(jsonResult.msg);
		},
		error: function (xhr, thrownError) {
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

	columnCount = tableObj.rows[0].cells.length;
	mainLoop : for (c=0; c<columnCount; c++)
	{
		distinctValuesForColumn = new Array();
		for (r=1; r<tableObj.rows.length; r++)
			if (tableObj.rows[r].cells[c] != null)
			{
				if (containsHtmlTags(tableObj.rows[r].cells[c].innerHTML))
					continue mainLoop;	// we don't create filter drop-downs for HTML contents
				if (!arrayContains(distinctValuesForColumn, tableObj.rows[r].cells[c].innerHTML))
					distinctValuesForColumn[distinctValuesForColumn.length] = tableObj.rows[r].cells[c].innerHTML;
			}

		distinctValuesForColumn.sort();

		if (distinctValuesForColumn.length < tableObj.rows.length - 1)
		{
			dropDown = document.createElement("select");
			dropDown.multiple = 'multiple';
			dropDown.className = "selectpicker btn-sm";
			$(dropDown).attr('data-actions-box', "true");
			$(dropDown).attr('data-none-selected-text', "Any");
			$(dropDown).attr('data-select-all-text', "All");
			$(dropDown).attr('data-deselect-all-text', "None");
			$(dropDown).attr('data-selected-text-format', "count>2");
			$(dropDown).attr('data-count-selected-text', "{0} out of {1}");
			$(dropDown).on('change', function() {
				applyDropDownFiltersToTable(document.getElementById(tableObj.id));
				updateFilteredIndividualCount();
			});
			for (i=0; i<distinctValuesForColumn.length; i++)
				  dropDown.options[dropDown.length] = new Option(distinctValuesForColumn[i], distinctValuesForColumn[i]);

			tableObj.rows[0].cells[c].appendChild(dropDown);
			filtersToColumns[c] = dropDown;
		}
	}

	applyDropDownFiltersToTable(document.getElementById(tableObj.id));
	$(tableObj).find("th select.selectpicker").selectpicker();
}

function applyDropDownFiltersToTable(tableObj)
{
	if (tableObj.rows.length < 1)
		return;

	columnCount = tableObj.rows[0].cells.length;
	for (r=1; r<tableObj.rows.length; r++)
	{
		displayVal = "";
		for (c=0; c<columnCount; c++)
		{
			if (filtersToColumns[c] != null)
			{
				var selection = $(filtersToColumns[c]).val();
				if (selection != null && tableObj.rows[r].cells[c] != null && !arrayContains(selection, tableObj.rows[r].cells[c].innerHTML))
				{
					displayVal = "none";
					if (r > 1)
						break;
				}
			}
		}
		tableObj.rows[r].style.display = displayVal;
	}
}

function resetDropDownFilterTable(tableObj)
{
	$(tableObj).find("th select.selectpicker").each(function() {
		$(this).val([]);
		$(this).selectpicker('refresh');
	});
	$(tableObj).find("tr").show();
	updateFilteredIndividualCount();
}

function selectGroupUsingMetadata(groupNumber) {
	$("span#filteredGroupNumber").html(groupNumber);
	$("table#individualFilteringTable tr:eq(0)").attr("class", "group" + groupNumber);
	updateFilteredIndividualCount();
	$("#individualFiltering").modal({
		opacity: 80,
		overlayCss: {
			backgroundColor: "#111111"
		}
	});
}

function copyIndividuals(groupNumber) {
	var selectedIndividuals = getSelectedIndividuals(groupNumber);
	copyToClipboard((selectedIndividuals != "" ? selectedIndividuals : $('#Individuals1').selectmultiple('option')).join("\n"));
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

		var pasteBoxHtml = '<div class="panel shadowed-panel group' + groupNumber + '" style="text-align:left; position:absolute; border:1px solid white; left:150px; margin-top:-45px; padding:5px; z-index:200;" id="individualPastePanel' + groupNumber + '">Please paste your individual selection (one per line) in the box below:<textarea id="pastedIndividuals1" style="width:100%;" rows="15"></textarea><input type="button" style="float:right;" class="btn btn-primary btn-sm" onclick="onPasteIndividuals(' + groupNumber + ', $(this).prev());" value="Apply" /><input type="button" class="btn btn-primary btn-sm" onclick="$(this).parent().remove();" value="Cancel" /></div>';
		$("button#pasteIndividuals" + groupNumber).before(pasteBoxHtml);
	}
	else
		previousSibling.remove();
}

function onPasteIndividuals(groupNumber, textarea) {
	var cleanSelectionArray = [];
	var splitSelection = textarea.val().split("\n");
	for (var selectedInd in splitSelection)
	{
		var trimmedInd = splitSelection[selectedInd].trim();
		if (trimmedInd.length > 0)
			cleanSelectionArray.push(trimmedInd);
	}
	$('#Individuals' + groupNumber).selectmultiple('batchSelect', [cleanSelectionArray]);
	applyGroupMemorizing(groupNumber);
	$("button#pasteIndividuals" + groupNumber).click();
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

function checkGroupOverlap() {
	$('#overlapWarning').toggle($("#discriminate").prop('checked') && arrayIntersection(getSelectedIndividuals(1), getSelectedIndividuals(2)).length > 0);
}

function getOutputToolConfig(toolName)
{
	var storedToolConfig = localStorage.getItem("outputTool_" + toolName);
	return storedToolConfig != null ? JSON.parse(storedToolConfig) : onlineOutputTools[toolName];
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
	$('#geneName').val("");
	$('#variantEffects').selectpicker('deselectAll');

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
	var queryName = "";
	while (queryName.trim() == "")
		if ((queryName = prompt("Enter query name")) == null)
			return;
	var annotationFieldThresholds = {}, annotationFieldThresholds2 = {};
		$('#vcfFieldFilterGroup1 input').each(function() {
			if (parseFloat($(this).val()) > 0)
				annotationFieldThresholds[this.id.substring(0, this.id.lastIndexOf("_"))] = $(this).val();
		});
		$('#vcfFieldFilterGroup2 input').each(function() {
			if (parseFloat($(this).val()) > 0)
				annotationFieldThresholds2[this.id.substring(0, this.id.lastIndexOf("_"))] = $(this).val();
		});
	$.ajax({
		url: 'rest/gigwa/saveQuery',
		type: "POST",
		contentType: "application/json;charset=utf-8",
		timeout:0,
		headers: {
			"Authorization": "Bearer " + token,
		},
		data: JSON.stringify({
			"variantSetId": getProjectId(),
			"getGT": false,
			"queryLabel": queryName,
			
			"referenceName": getSelectedSequences(),
			"selectedVariantTypes": getSelectedTypes(),
			"alleleCount": getSelectedNumberOfAlleles(),
			"start": getSearchMinPosition(),
			"end": getSearchMaxPosition(),
			"variantEffect": $('#variantEffects').val() === null ? "" : $('#variantEffects').val().join(","),
			"geneName": $('#geneName').val().trim().replace(new RegExp(' , ', 'g'), ','),

			"callSetIds": getSelectedIndividuals(1, true),
			"gtPattern": $('#Genotypes1').val(),
			"mostSameRatio": $('#mostSameRatio1').val(),
			"minmaf": $('#minmaf1').val() === null ? 0 : parseFloat($('#minmaf1').val()),
			"maxmaf": $('#maxmaf1').val() === null ? 50 : parseFloat($('#maxmaf1').val()),
			"missingData": $('#missingdata1').val() === null ? 100 : parseFloat($('#missingdata1').val()),
			"annotationFieldThresholds": annotationFieldThresholds,

			"callSetIds2": getSelectedIndividuals(2, true),
			"gtPattern2": $('#Genotypes2').val(),
			"mostSameRatio2": $('#mostSameRatio2').val(),
			"minmaf2": $('#minmaf2').val() === null ? 0 : parseFloat($('#minmaf2').val()),
			"maxmaf2": $('#maxmaf2').val() === null ? 50 : parseFloat($('#maxmaf2').val()),
			"missingData2": $('#missingdata2').val() === null ? 100 : parseFloat($('#missingdata2').val()),
	   		"annotationFieldThresholds2": annotationFieldThresholds2,
			
			"discriminate": $('#discriminate').prop('checked'),
			"pageSize": 100,
			"sortBy": sortBy,
			"sortDir": sortDesc === true ? 'desc' : 'asc'
		}),
		
		success: function(jsonResult) {
				$('#savequery').append('<span id="okIcon" class="glyphicon glyphicon-ok" aria-hidden="true"> </span>');
				setTimeout(function(){ 
					$('#okIcon').remove();
				}, 1000);
		},
		error: function(xhr, ajaxOptions, thrownError) {
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
	$.ajax({	// load queries 
		url: 'rest/gigwa/listSavedQueries?module=' + referenceset,
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
	$('#loadedQueries p .glyphicon-pencil').click(function(){
		var queryId = $(this).parent('p').attr('id');
		queryName = "";
		while (queryName.trim() == "")
			if ((queryName = prompt("Enter query name",$(this).parent('p').text())) == null)
				return;
		$.ajax({	// load queries 
			url: 'rest/gigwa/loadQuery?module=' + referenceset 
			+ '&queryId='+ queryId,
			type: "GET",
			dataType: "json",
			async: false,
			contentType: "application/json;charset=utf-8",
			headers: {
				"Authorization": "Bearer " + token
			}, 
			success: function(jsonResult) {
				$.ajax({
					url: 'rest/gigwa/saveQuery',
					type: "POST",
					contentType: "application/json;charset=utf-8",
					timeout:0,
					headers: {
						"Authorization": "Bearer " + token,
					},
					data: JSON.stringify({
						"variantSetId": getProjectId(),
						"getGT": false,
						"queryLabel": queryName,

						"referenceName": jsonResult['referenceName'],
						"selectedVariantTypes": jsonResult['selectedVariantTypes'],
						"alleleCount": jsonResult['alleleCount'],
						"start": jsonResult['start'],
						"end": jsonResult['end'],
						"variantEffect": jsonResult['variantEffect'],
						"geneName": jsonResult['geneName'],

						"callSetIds":	jsonResult['callSetIds'],
						"gtPattern": jsonResult['gtPattern'],
						"mostSameRatio": jsonResult['mostSameRatio'],
						"minmaf": jsonResult['minmaf'],
						"maxmaf": jsonResult['maxmaf'],
						"missingData": jsonResult['missingData'],
						"annotationFieldThresholds": jsonResult['annotationFieldThresholds'],

						"callSetIds2": jsonResult['callSetIds2'],
						"gtPattern2": jsonResult['gtPattern2'],
						"mostSameRatio2": jsonResult['mostSameRatio2'],
						"minmaf2": jsonResult['minmaf2'],
						"maxmaf2": jsonResult['maxmaf2'],
						"missingData2": jsonResult['missingData2'],
				   		"annotationFieldThresholds2": jsonResult['annotationFieldThresholds2'],
						
						"discriminate": jsonResult['discriminate'],
						"pageSize": jsonResult['pageSize'],
						"sortBy": jsonResult['sortBy'],
						"sortDir": jsonResult['sortDir']
					}),
					success: function(jsonResult) {
						   $('#'+queryId+' .NameQuery').html(queryName);
					},
					error: function(xhr, ajaxOptions, thrownError) {
						alert(xhr.responseText);
						listQueries();
						handleError(xhr, thrownError);
					}
				});			
			},
			
			error: function(xhr, ajaxOptions, thrownError) {
				handleError(xhr, thrownError);
			}
		});
	});

	//When the open icon is clicked
	$('#loadedQueries p .glyphicon-folder-open').click(function(){
		var queryId = $(this).parent('p').attr('id');
		$.ajax({	// load queries 
			url: 'rest/gigwa/loadQuery?module=' + referenceset 
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
				$('#geneName').val(names);
				
				if(jsonResult['alleleCount'] != ""){
					var tabAlleles = jsonResult['alleleCount'].split(';'); 
					$('#numberOfAlleles').selectpicker('val', tabAlleles);
				}

				for (var i=1 ; i<=2 ; i++) {
					var e = i==1 ? "" : i;

					if(groupHasFilters(jsonResult, i)){
						$('#genotypeInvestigationMode').selectpicker('val', i);
					  	$('#genotypeInvestigationMode').trigger('change');
					  	
					  	var tabIds = jsonResult['callSetIds'+e];
					  	if(tabIds.length != 0) {
							$('#Individuals'+i+' div select').val(tabIds.map(function(x) {
								return x.split("§")[2];
							}));
							$('#Individuals'+i+' div select').trigger('change');
					  	}
					  	
					  	let groupThresholds = jsonResult['annotationFieldThresholds'+e];
					  	for (var key in groupThresholds)
					  		$('#vcfFieldFilterGroup'+i+' #' + key + '_threshold' + i).val(groupThresholds[key]);
					  	$('#missingdata'+i).val(jsonResult['missingData'+e]);
					  	$('#minmaf'+i).val(jsonResult['minmaf'+e]);
					  	$('#maxmaf'+i).val(jsonResult['maxmaf'+e]);
					  	$('#Genotypes'+i).selectpicker('val',jsonResult['gtPattern'+e]);
					  	$('#mostSameRatio'+i).val(jsonResult['mostSameRatio'+e]);
					  	$('#Genotypes'+i).trigger('change');
					}
				}
		  	 
				if(jsonResult['discriminate']){
					$('#discriminationDiv').show();
					$('#discriminate').prop('checked', true);
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
				url: 'rest/gigwa/deleteQuery?module='+referenceset+'&queryId='+queryId,
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