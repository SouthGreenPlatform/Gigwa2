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
var emptyResponseCountsByProcess = [];
var archivedDataFiles = new Array();

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
    $(document.body).append('<div class="alert alert-info alert-dismissable fade in" style="z-index:2000; position:absolute; top:200px; left:' + (15 + $("div#searchPanel").width() / 4) + 'px; min-width:450px;"><a href="#" class="close" data-dismiss="alert" aria-label="close">&times;</a><div id="msg">' + message + '</div></div>');
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

function isNumberKey(evt) {
    var charCode = (evt.which) ? evt.which : evt.keyCode;
    if (charCode > 31 && (charCode < 48 || charCode > 57) && charCode !== 39 && charCode !== 37) {
        return false;
    }
    return true;
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
            if (document.referrer.endsWith("/login.do")) {
				if (jsonResult.msg != null)
                	alert(jsonResult.msg);
	            if (jsonResult.redirect != null)
	            	window.location.href = jsonResult.redirect;
	        }
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

function buildHeader(token, assemblyId, workWithSamples) {
    var headers = { "Authorization": "Bearer " + token };
    if (assemblyId != null)
    	headers["assembly"] = assemblyId;
    if (workWithSamples)
    	headers["workWithSamples"] = true;
	return headers;
}

function showServerExportBox(keepExportOnServer, exportFormatExtensions)
{
	$("div#exportPanel").hide();
	$("a#exportBoxToggleButton").removeClass("active");
	if (processAborted || downloadURL == null)
		return;

	var fileName = downloadURL.substring(downloadURL.lastIndexOf("/") + 1);
	$('#serverExportBox').html('<button type="button" class="close" data-dismiss="modal" aria-hidden="true" style="float:right;" onclick="$(\'#serverExportBox\').hide();">x&nbsp;</button></button>&nbsp;Export file will be available at this URL for ' + (!keepExportOnServer ? 1 : 48) + 'h:<br/><a id="exportOutputUrl" download href="' + downloadURL + '">' + fileName + '</a><br/><br/>').show();
	var exportedFormat = $('#exportFormat').val().toUpperCase();
	if ("VCF" == exportedFormat)
		addIgvExportIfRunning();
	else if ("FLAPJACK" == exportedFormat)
		addFjBytesExport();
		
	$('#serverExportBox').append("<div id='galaxyPushButton' />");

	archivedDataFiles = new Array();
	
	if (exportFormatExtensions == null) {
		exportFormatExtensions = $("#exportFormat option:selected").data('ext').split(";");
		if ($('#exportPanel input#exportedIndividualMetadataCheckBox').is(':checked') && "FLAPJACK" != $('#exportFormat').val() && "DARWIN" != $('#exportFormat').val() /* these two already have their own metadata file format*/)
			exportFormatExtensions.push("tsv");
	}
	for (var key in exportFormatExtensions)
		archivedDataFiles[exportFormatExtensions[key]] = location.origin + downloadURL.replace(new RegExp(/\.[^.]*$/), '.' + exportFormatExtensions[key]);
	
	var galaxyInstanceUrl = $("#galaxyInstanceURL").val().trim();
	if (galaxyInstanceUrl.startsWith("http")) {
		var fileURLs = "";
		for (key in archivedDataFiles)
			fileURLs += (fileURLs == "" ? "" : " ,") + "'" + archivedDataFiles[key] + "'";
		$('#galaxyPushButton').html('<div style="display:inline; width:70px; font-weight:bold; background-color:#333333; color:white; border-radius:3px; padding:7px;"><img alt="Galaxy" height="15" src="images/logo-galaxy.png" /> Galaxy</div>&nbsp;<input style="margin-bottom:20px;" type="button" value="Send exported data to ' + galaxyInstanceUrl + '" onclick="sendToGalaxy([' + fileURLs + ']);" /><br/>');
		$("#galaxyPushButton").show();			
	}
	else
		$("#galaxyPushButton").hide();

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
					$('#serverExportBox').append('<input style="margin-bottom:20px;" type="button" value="Send ' + formatsForThisButton + ' file(s) to ' + toolName + '" onclick="window.open(\'' + urlForThisButton + '\');" /><br/>');
			}
		}
}

function getOutputToolConfig(toolName)
{
    var storedToolConfig = localStorage.getItem("outputTool_" + toolName);
    return storedToolConfig != null ? JSON.parse(storedToolConfig) : onlineOutputTools[toolName];
}

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
                    $('div#serverExportBox').append("<center><table style='margin-bottom:20px;'><tr><th valign='middle'>View in IGV within genomic/structural context&nbsp;</th></tr><tr><td align='center'><select id='igvGenome' style='min-width:175px;'>" + igvGenomeOptions + "</select><br/>(you may select a genome to switch to)</td><td valign='top'>&nbsp;<input type='button' value='Send' onclick='sendToIGV();'/></td></tr></table></center>");
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
    $('div#serverExportBox').append("<input style='margin-bottom:20px;' type='button' value='View in Flapjack-Bytes' onclick='sendToFjBytes();'/>" + (exportedIndividualCount * count > 500000000 ? "<div class='text-red margin-top'>WARNING: Exported dataset potentially contains more than 500 million genotypes.<br/>A standard workstation's web-browser may be unable to load it in with Flapjack-Bytes </div>" : "") + "<br/>");
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

function sendToFjBytes() {
	let url = "fjbytes.html?m=" + location.origin + $("a#exportOutputUrl").attr("href").replace(new RegExp(/\.[^.]*$/), '.map') +
            "&g=" + location.origin + $("a#exportOutputUrl").attr("href").replace(new RegExp(/\.[^.]*$/), '.genotype') +
            "&p=" + location.origin + $("a#exportOutputUrl").attr("href").replace(new RegExp(/\.[^.]*$/), '.phenotype') +
            "&id=" + getModuleName();

	if ($("#fjBytesPanel").length == 0) {
		location.href = url;
		return;
	}

    $("#fjBytesPanel").modal({
        opacity: 80,
        overlayCss: {
            backgroundColor: "#111111"
        }
    });

	$('#fjBytesPanelHeader').html('<center>This is a functionality under development and might not be totally stable. Check <a href="https://github.com/cropgeeks/flapjack-bytes" target="_blank">https://github.com/cropgeeks/flapjack-bytes</a> for information about Flapjack-Bytes.&nbsp;&nbsp;&nbsp;<a href="' + url + '" onclick="$(\'#fjBytesPanel\').modal(\'hide\');" target="_blank">Open in separate window</a></center>');
	$("#fjBytesFrame").attr('src', url);
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