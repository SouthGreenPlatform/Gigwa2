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

function buildHeader(token, assemblyId, individuals) {
    var headers = { "Authorization": "Bearer " + token };
    if (assemblyId != null)
    	headers["assembly"] = assemblyId;
    if (individuals != null)
    	headers["ind"] = individuals;
	return headers;
}