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

var importDropzoneG;
var importDropzoneMD;
var currentMetadataValidationStartTime = null;

var onbeforeunloadCalled = false;
window.onbeforeunload = function(e) {
	if (onbeforeunloadCalled)
		return;

	onbeforeunloadCalled = true;
	clearToken();
};

$(document).ready(function () {
    Dropzone.autoDiscover = false;
	
    $('#moduleProjectNavbar').hide();
    $('[data-toggle="tooltip"]').tooltip({delay: {"show": 300, "hide": 100}});
	getToken();
    loadModules();
    loadHost();
	$('#projectExisting').html('<option>- new project -</option>').selectpicker('refresh');
    $('#runExisting').html('<option>- new run -</option>').selectpicker('refresh');

    $(".mandatoryGtField").change(function() {
		var isFormValid = isGenotypingDataFormValid(false);
		$('span#gtFormValid').hide();
		$('span#gtFormInvalid').hide();
		if (isFormValid == null)
			return;	// null means untouched

		if (isFormValid)
			$('span#gtFormValid').show();
		else
			$('span#gtFormInvalid').show();			
		$('#moduleExistingMD').change();	// in case a metadata file was specified before this form became valid
    });
	
    $('#moduleExistingG').on('change', function () {
        clearFields();
        if ($(this).val() !== '- new database -' && $(this).val() !== null) {
            loadProjects($(this).val());
            $('#newModuleDiv').hide();
            $('#taxonDiv').hide();
            $('#hostGrp').hide();
        } else {
			$("input#moduleToImport").val("");
            $('#projectExisting').html('<option>- new project -</option>').selectpicker('refresh');
            $('#runExisting').html('<option>- new run -</option>').selectpicker('refresh');
            $('#newModuleDiv').show();
            $('#taxonDiv').show();
            $('#projectToImport').removeClass('hidden');
            $('#runToImport').removeClass('hidden');
            $('#hostGrp').show();
        }
        $("input#moduleToImport").change();
    });

    $(".mandatoryMdField").change(function() {
		$("span.mdType").text($("#metadataType").val());
	
		if (isAnonymous)
			$("#metadataScopeDesc").html("As an anonymous user, any metadata you import into a database is only visible to yourself and lasts as long as your web session.");
	 	else if (isAdmin || arrayContains(supervisedModules, $('#moduleExistingMD').val()))
			$("#metadataScopeDesc").html("As an administrator or supervisor, any metadata you import into a database is considered global and therefore visible to anyone allowed to work with it.");
	 	else
	 		$("#metadataScopeDesc").html("As an authenticated simple user, any metadata you import into a database is only visible to yourself and is persisted in your account.");
	
		if ($('#mdTab').hasClass("active")) {
		    $("form#importDropzoneMD .dz-file-preview").each(function() {
		        $(this).removeClass('dz-processing');
		        $(this).removeClass('dz-success');
		        $(this).removeClass('dz-complete');
		        $(this).removeClass('dz-error');
		    });
		
		    $.each(importDropzoneMD.files, function(i, file) { // re-add files to the queue
		        file.status = Dropzone.QUEUED;
		    });

		    importDropzoneMD.options.url = metadataValidationURL;
		    currentMetadataValidationStartTime = Date.now();
			$('span#mdFormValid').hide();
			$('span#mdFormInvalid').hide();
		    if (importDropzoneMD.getQueuedFiles().length > 0)
		    	importDropzoneMD.processQueue();
		    else {
		        var blob = new Blob();
		        blob.upload = { name:"nofiles" };
		        importDropzoneMD.uploadFile(blob);
		    }
		}
		else
			checkMetaDataForm(false);
    });
    
    $('input#moduleToImport').on('change', function () {
        $('#projectExisting').change();
	});
    
    $('#projectExisting').on('change', function () {
    	$('#emptyBeforeImportDiv').toggle();
    	var projDesc = projectDescriptions[$(this).val()];
    	$("textarea#projectDesc").val(projDesc == null ? "" : projDesc);
        if ($(this).val() !== '- new project -') {
            loadRuns();
            $('#projectToImport').addClass('hidden');
            $('#emptyBeforeImportDiv').show(100);
            $('#projectDescDiv').show(100);
        } else {
            $('#runExisting').html('<option>- new run -</option>').selectpicker('refresh');
            $('#projectToImport').val("");
            $('#projectToImport').removeClass('hidden');
            $('#emptyBeforeImportDiv').hide(100);
            if ($('#projectToImport').val() != '')
            	$('#projectDescDiv').show(100);
            else
            	$('#projectDescDiv').hide(100);
        }
    	$('#runExisting').change();
    });

    $('#runExisting').on('change', function () {
        if ($(this).val() !== '- new run -') {
            $('#runToImport').hide();
        	$('#overwriteRunWarning').show();
        } else {
            $('#runToImport').show();
            $('#runToImport').val("");
        	$('#overwriteRunWarning').hide();
        }
        $('#runToImport').change();
    });

    // check if entered char is valid 
    $(".text-input").on("keypress", function (event) {
        if (!isValidKeyForNewName(event))
        {
        	event.preventDefault();
        	event.stopPropagation();
        }
    });
    $(".text-input").on("change", function (event) {
        if (!isValidNewName($(this).val()))
        	$(this).val("");
    });

    $('#progress').on('hidden.bs.modal', function () {
    	if (!processAborted && !$('#progress').data('error')) {
            $('.importFormDiv input').prop('disabled', true);
            $('.importFormDiv button').prop('disabled', true);
            $('.importFormDiv textarea').prop('disabled', true);
            var gtFormOK = $('span#gtFormValid').is(":visible")/*, mdFormOK = $('span#mdFormValid').is(":visible")*/;
            $('#progressContents').html('<p class="bold panel" style="padding:10px;">Import complete.<br/>This data is now <a style="cursor:pointer;" href="' + webappUrl + "?module=" + (gtFormOK ? $("#moduleToImport").val() : $("#moduleExistingMD").val()) + (gtFormOK ? "&project=" + $("#projectToImport").val() : "") + '">available here</a></p>');
            if (importFinalMessage != null)
            	$('#progressContents').append('<p class="bold panel" style="padding:10px;">' + importFinalMessage + '</p>');
           	$('#progressContents').append('<p class="bold panel" style="padding:10px;">Add or amend individual / sample metadata <a style="cursor:pointer;" href="' + importPageUrl + "?module=" + (gtFormOK ? $("#moduleToImport").val() : $("#moduleExistingMD").val()) + '&type=metadata">via this link</a></p>');
            $('#progress').modal('show');
        }
        else {
	    	if (processAborted)
	    		alert("Import aborted as requested");

			var gtImportAttempted = $('span#gtFormValid').is(":visible");
		  	if (gtImportAttempted) {
				importDropzoneG.options.maxFiles -= importDropzoneMD.getAcceptedFiles().length;
				for (var i=0; i<importDropzoneMD.getAcceptedFiles().length; i++) {
					var file = importDropzoneMD.getAcceptedFiles()[i];
					//console.log("removing " + file.name + " (" + importDropzoneG.options.maxFiles + ")");
		    		importDropzoneG.removeFile(file);
				}
           	}
			// re-add files to the queue
            $.each((gtImportAttempted ? importDropzoneG : importDropzoneMD).getAcceptedFiles(), function(i, file) {
                file.status = Dropzone.QUEUED;
            });
        }
    });

    $('#brapiPwdDialog').on('hidden.bs.modal', function () {
    	brapiUserPassword = $('#brapiPassword').val();
    	if (brapiUserPassword.length == 0)
    		$('div#brapiDataSelectionDiv').remove();
    	else
    	{
			BRAPI_V1_URL_ENDPOINT = $("input[name=dataFile1]").val().trim().replace(/:\/\/.*@/, ":\/\/");
			if (!checkEndPoint())
				return failAndHideBrapiDataSelectionDiv();
			submitBrapiForm();
    	}
    });    
    $('#brapiPwdDialog').on('shown.bs.modal', function () {
    	$('#brapiPassword').focus();
    });
    
    $.ajax({
        url: maxUploadSizeURL + "?capped=true",
        async: false,
        type: "GET",
        contentType: "application/json;charset=utf-8",
  	  	headers: {
  	  		"Authorization": "Bearer " + token
  	  	},
        success: function(maxUploadSize) {
        	maxUploadSizeInMb = parseInt(maxUploadSize);
        	$("span#maxUploadSize").html(maxUploadSizeInMb);
	        $.ajax({
	            url: maxUploadSizeURL + "?capped=false",
	            async: false,
	            type: "GET",
	            contentType: "application/json;charset=utf-8",
          	  	headers: {
          	  		"Authorization": "Bearer " + token
          	  	},
	            success: function(maxImportSize) {
	            	if (maxImportSize != null && maxImportSize != "" && maxImportSize != maxUploadSize) {
	            		maxImportSizeInMb = parseInt(maxImportSize);
	            		$("span#maxImportSizeSpan").html("Your local or http import volume is limited to <b>" + maxImportSizeInMb + "</b> Mb.");
	            	}
	            },
	            error: function(xhr, thrownError) {
	                handleError(xhr, thrownError);
	            }
	        });
        },
        error: function(xhr, thrownError) {
            handleError(xhr, thrownError);
        }
    });

    function onImportSuccessMethod(finalMessage) {
		importFinalMessage = finalMessage;
	} 
    
	var previewTemplateHTML = "<div class='dz-preview dz-file-preview'>\n <div class='dz-details' style='width:260px;'>\n  <div class='dz-filename' style='max-height:45px;'><span data-dz-name style='overflow-wrap:anywhere; text-align:left;'></span></div>\n  <div class='dz-size'><span data-dz-size></span></div>\n  <a style='float:right;' class='dz-remove' href='javascript:undefined;' data-dz-remove>Remove file</a>\n  </div>\n  <div class='dz-progress'><span class='dz-upload' data-dz-uploadprogress></span></div>\n  <div class='dz-error-message'><span data-dz-errormessage></span></div>\n  <div class='dz-success-mark'>\n  <svg width='54px' height='54px' viewBox='0 0 54 54' version='1.1' xmlns='http://www.w3.org/2000/svg' xmlns:xlink='http://www.w3.org/1999/xlink' xmlns:sketch='http://www.bohemiancoding.com/sketch/ns'>\n   <title>Check</title>\n   <defs></defs>\n   <g id='Page-1' stroke='none' stroke-width='1' fill='none' fill-rule='evenodd' sketch:type='MSPage'>\n    <path d='M23.5,31.8431458 L17.5852419,25.9283877 C16.0248253,24.3679711 13.4910294,24.366835 11.9289322,25.9289322 C10.3700136,27.4878508 10.3665912,30.0234455 11.9283877,31.5852419 L20.4147581,40.0716123 C20.5133999,40.1702541 20.6159315,40.2626649 20.7218615,40.3488435 C22.2835669,41.8725651 24.794234,41.8626202 26.3461564,40.3106978 L43.3106978,23.3461564 C44.8771021,21.7797521 44.8758057,19.2483887 43.3137085,17.6862915 C41.7547899,16.1273729 39.2176035,16.1255422 37.6538436,17.6893022 L23.5,31.8431458 Z M27,53 C41.3594035,53 53,41.3594035 53,27 C53,12.6405965 41.3594035,1 27,1 C12.6405965,1 1,12.6405965 1,27 C1,41.3594035 12.6405965,53 27,53 Z' id='Oval-2' stroke-opacity='0.198794158' stroke='#747474' fill-opacity='0.816519475' fill='#FFFFFF' sketch:type='MSShapeGroup'></path>\n   </g>\n  </svg>\n  </div>\n  <div class='dz-error-mark'>\n  <svg width='54px' height='54px' viewBox='0 0 54 54' version='1.1' xmlns='http://www.w3.org/2000/svg' xmlns:xlink='http://www.w3.org/1999/xlink' xmlns:sketch='http://www.bohemiancoding.com/sketch/ns'>\n   <title>Error</title>\n   <defs></defs>\n   <g id='Page-1' stroke='none' stroke-width='1' fill='none' fill-rule='evenodd' sketch:type='MSPage'>\n    <g id='Check-+-Oval-2' sketch:type='MSLayerGroup' stroke='#747474' stroke-opacity='0.198794158' fill='#ff9999' fill-opacity='0.816519475'>\n     <path d='M32.6568542,29 L38.3106978,23.3461564 C39.8771021,21.7797521 39.8758057,19.2483887 38.3137085,17.6862915 C36.7547899,16.1273729 34.2176035,16.1255422 32.6538436,17.6893022 L27,23.3431458 L21.3461564,17.6893022 C19.7823965,16.1255422 17.2452101,16.1273729 15.6862915,17.6862915 C14.1241943,19.2483887 14.1228979,21.7797521 15.6893022,23.3461564 L21.3431458,29 L15.6893022,34.6538436 C14.1228979,36.2202479 14.1241943,38.7516113 15.6862915,40.3137085 C17.2452101,41.8726271 19.7823965,41.8744578 21.3461564,40.3106978 L27,34.6568542 L32.6538436,40.3106978 C34.2176035,41.8744578 36.7547899,41.8726271 38.3137085,40.3137085 C39.8758057,38.7516113 39.8771021,36.2202479 38.3106978,34.6538436 L32.6568542,29 Z M27,53 C41.3594035,53 53,41.3594035 53,27 C53,12.6405965 41.3594035,1 27,1 C12.6405965,1 1,12.6405965 1,27 C1,41.3594035 12.6405965,53 27,53 Z' id='Oval-2' sketch:type='MSShapeGroup'></path>\n    </g>\n   </g>\n  </svg>\n </div>\n</div>";

    $(function() {
  	  importDropzoneG = new Dropzone("#importDropzoneG", {
  		maxFiles: 3,
  		parallelUploads: 5,
  		previewsContainer: "#dropZonePreviewsG",
  	    dictResponseError: 'Error importing data',
  	    acceptedFiles: ".vcf,.vcf.gz,.bcf,.bcf.gz,.hapmap,.txt,.map,.ped,.intertek,.genotype,.tsv,.csv",
  	  	headers: {
  	  		"Authorization": "Bearer " + token
  	  	},
		previewTemplate: previewTemplateHTML,
  	    init:function(){
  	      var self = this;
  	      self.options.maxFilesize = maxUploadSizeInMb;
  	   	  self.options.autoProcessQueue = false;
  	   	  self.options.uploadMultiple = true;
  	      self.on("addedfile", function (file) {
  	      	setTimeout('$("input#runToImport").change();', 1);
  	      });
  	      self.on("removedfile", function (file) {
			self.files.forEach(function(f) {
				self.removeFile(f);
				f.accepted = null;
				self.addFile(f);
			});
  	      	setTimeout('$("input#runToImport").change();', 1);
  	      });
  	      self.on("sending", function (file) {
  	        $('.meter').show();
  	      });
  	      self.on("success", function(file, processId) {
			  if (importDropzoneG.getActiveFiles().length == 0) {	// don't do anything unless this was the last file
				  $('button#abort').attr('rel', processId);
				  importFinalMessage = null;
	              displayProcessProgress(5, token, processId, onImportSuccessMethod);
	              $("button#asyncWatch").on("click", function() {
	     			 window.open('ProgressWatch.jsp?process=' + processId + '&abortable=true&successURL=' + escape(webappUrl + '?module=' + $('#moduleToImport').val() + '&project=' + $('#projectToImport').val()));
	              });
	           }
          });
  	    }
  	  });
  	    	  
   	  importDropzoneMD = new Dropzone("#importDropzoneMD", {
   		maxFiles: 1,
   		previewsContainer: "#dropZonePreviewsMD",
   	    dictResponseError: 'Error importing data',
   	    acceptedFiles: ".tsv,.csv,.phenotype",
   	  	headers: {
   	  		"Authorization": "Bearer " + token
   	  	},
   	  	previewTemplate: previewTemplateHTML,
   	    init:function(){
   	      var self = this;
   	      self.options.maxFilesize = 5;
   	   	  self.options.autoProcessQueue = false;
   	   	  self.options.uploadMultiple = true;
  	      self.on("addedfile", function (file) {
			if ((file.accepted && !$('span#mdFormValid').is(":visible")) || (!file.accepted && !$('span#mdFormInvalid').is(":visible")))
  	      		setTimeout('$("select#moduleExistingMD").change();', 1);	
  	      });
  	      self.on("removedfile", function (file) {
			self.files.forEach(function(f) {
				self.removeFile(f);
//				f.status = Dropzone.ADDED;
				f.accepted = null;
				self.addFile(f);
			});
			if ((file.accepted && $("#metadataTab span:visible").length > 0) || (!file.accepted && $('span#mdFormInvalid').is(":visible")))
  	      		setTimeout('$("select#moduleExistingMD").change();', 1);
  	      });
   	      self.on("sending", function (file) {
   	        $('.meter').show();
   	      });
   	      self.on("success", function(file, response) {
	        if (importDropzoneMD.getActiveFiles().length == 0) {	// don't do anything else unless this was the last file
				if (self.options.url == metadataValidationURL) {	// process validation response
		        	distinctBrapiMetadataURLs = response;
		        	updateBrapiMetadataNotice();
					checkMetaDataForm(false);
	            	currentMetadataValidationStartTime = null;
			    }
				else { // this is a real import attempt: wait for the last file to be uploaded before checking for progress
	            	importFinalMessage = null;
	            	displayProcessProgress(5, token, response, onImportSuccessMethod); // in this case the response contains the ID of the process we want to watch
	            	$("button#asyncWatch").on("click", function() {
	                	window.open('ProgressWatch.jsp?process=' + response + '&abortable=true&successURL=' + escape(webappUrl + '?module=' + $('#moduleToImport').val() + '&project=' + $('#projectToImport').val()));
	            	});
	            }
            }
		    file.status = Dropzone.QUEUED;
          });
          self.on("error", function(file, msg) {
			if (importDropzoneMD.getActiveFiles().length == 0) {	// don't do anything else unless this was the last file
				$('span#mdFormInvalid').show();
				$('span#mdFormValid').hide();
				distinctBrapiMetadataURLs = null;
				currentMetadataValidationStartTime = null;
				updateBrapiMetadataNotice();
				if ($('#mdTab').hasClass("active") && importDropzoneMD.files.length == 0 /* otherwise the error message will appear on the Dropzone file preview*/)
	            	handleError(file.xhr, msg);
	         }
          });
   	    }
   	  });
  	})
  	
    $('button#importButton').on("click", function() { importDataIfValid(); });
});

function updateBrapiMetadataNotice() {
	if (distinctBrapiMetadataURLs != null && distinctBrapiMetadataURLs.length > 0)
		$('div#brapiMetadataNotice').html("<span class='metadataToPull-yes'>The current selection features " + $("#metadataType").val() + "s that are linked to " + ($("#metadataType").val() == "individual" ? "germplasm" : "sample") + " records from one or more remote BrAPI datasource(s). Clicking SUBMIT will attempt to import their metadata.</span>");
	else
		$('div#brapiMetadataNotice').html("<span class='metadataToPull-no'>Pulling via BrAPI v1 and v2's /search/" + ($("#metadataType").val() == "individual" ? "germplasm" : "samples") + " call is supported by importing metadata fields named <b>" + extRefIdField + "</b> and <b>" + extRefSrcField + "</b> containing respectively the remote <b>" + ($("#metadataType").val() == "individual" ? "germplasmDbId" : "sampleDbId") + "</b> and a <b>BrAPI base-URL</b>. When the system finds these if will automatically attempt to retrieve metadata via BrAPI, and, if successful, remove the two fields you provided.");

}

function importDataIfValid() {
	if (currentMetadataValidationStartTime != null) {
		if (Date.now() - currentMetadataValidationStartTime > 2000)
			alert("Metadata validation seems to have failed (no response after 2s). Metadata tab must be marked as valid before you can submit");
		else
			setTimeout("importDataIfValid();", 500);
		return;
	}

	if ($('span#gtFormInvalid').is(":visible") && !isGenotypingDataFormValid(true)) {
		$("#gtFormInvalid").parent().click();
		return;
	}
		
	if ($('span#mdFormInvalid').is(":visible") && !checkMetaDataForm(true)) {
		$("#mdFormInvalid").parent().click();
		return;
	}

	var gtFormOK = $('span#gtFormValid').is(":visible"), mdFormOK = $('span#mdFormValid').is(":visible");
	
	//console.log($('span#gtFormValid').is(":visible") + "  / " + $('span#mFormValid').is(":visible"));
	
	if (gtFormOK)
		importGenotypes(mdFormOK);
	else if (mdFormOK)
		importMetadata();
	else
		alert("You must fill-in at least one of the two forms!");
}

function submitBrapiForm() {
	if ($("div#brapiDataSelectionDiv").length == 0)
	{
		var dataFile1Input = $("input[name=dataFile1]");

        brapiGenotypesToken = prompt("Please enter token for genotyping data source\n" + BRAPI_V1_URL_ENDPOINT + "\n(leave blank if unneeded, cancel to abort import)");
        if (brapiGenotypesToken == null)
        	return failAndHideBrapiDataSelectionDiv();

	 	$("#importButton").attr('disabled', 'disabled');
		$("<div id='brapiDataSelectionDiv'><img src='images/progress.gif' /> Querying BrAPI service...</div>").insertBefore(dataFile1Input);
		brapiParameters = null;
	
		setTimeout(function() {
	     	var mapList = readMapList();
	     	var studyList = readStudyList("genotype");
	     	$("#importButton").removeAttr('disabled');
	     	if (mapList == null || studyList == null)
	     		return failAndHideBrapiDataSelectionDiv();
	     	if (mapList.length == 0)
	     		return failAndHideBrapiDataSelectionDiv("No genome maps found!");
	     	if (studyList.length == 0)
	     		return failAndHideBrapiDataSelectionDiv("No genotyping studies found!");
	     	
	     	var mapListSelect = "Select a map <select id='brapiMapList' style='margin-bottom:5px;'>";
	     	for (var i=0; i<mapList.length; i++)
	     		mapListSelect += "<option value=\"" + mapList[i]['mapDbId'] + "\">" + (mapList[i]['name'] == null ? mapList[i]['mapDbId'] : mapList[i]['name']) + " [" + mapList[i]['markerCount'] + " markers]" + "</option>";
	     	mapListSelect += "</select>";
	     	var studyListSelect = "Select a study <select id='brapiStudyList'>";
	     	for (var i=0; i<studyList.length; i++)
	     		studyListSelect += "<option value=\"" + studyList[i]['studyDbId'] + "\">" + studyList[i]['name'] + " [" + readMarkerProfiles(studyList[i]['studyDbId']).length + " samples]" + "</option>";
	     	studyListSelect += "</select>";
	     	$("div#brapiDataSelectionDiv").html("<div style='float:right; color:#ffffff; font-weight:bold;'><a href='#' title='Close' style='font-weight:bold; float:right; color:#ff0000;' onclick=\"$('div#brapiDataSelectionDiv').remove(); BRAPI_V1_URL_ENDPOINT = null;\">X</a><div style='margin-top:20px;'>Select map and study<br/>then submit again</div></div>" + mapListSelect + "<br/>" + studyListSelect + ($("#skipMonomorphic").is(":checked") ? "<div class='margin-top-md bold' style='color:#ff6600;'>BrAPI import doesn't support skipping monomorphic variants!</div>" : ""));
	 	}, 1);
	 	return;
	}
 
	brapiParameters = {studyDbId:$("select#brapiStudyList").val(), mapDbId:$("select#brapiMapList").val()};
}

function isGenotypingDataFormValid(showAlerts) {
	$("div#mdModuleZone").show();	// we will hide it if this form is valid (only one module needed for both imports)

    if ($("#moduleExistingG").val() != '- new database -')
   		$("#moduleToImport").val($("#moduleExistingG").val());
    if ($("#projectExisting").val() != null && $("#projectExisting").val() != '- new project -')
   		$("#projectToImport").val($("#projectExisting").val());
    if ($("#runExisting").val() != '- new run -')
   		$("#runToImport").val($("#runExisting").val());

    if (!isValidNewName($("#moduleToImport").val()) || !isValidNewName($("#projectToImport").val()) || !isValidNewName($("#runToImport").val())) {
        alert("Database, project and run names must only consist in digits, accentless letters, dashes and hyphens!");
        $('#progress').modal('hide');
        return false;
    }
    if (!isAdmin && $("#moduleToImport").val() == "")
    	$("#moduleToImport").val(hashCode(token).toString(16) + "O" + hashCode(Date.now()).toString(16));
     
    if (importDropzoneG.getRejectedFiles().length > 0) {
    	if (showAlerts)
        	alert("Please remove any rejected files before submitting!");
        return false;
    }

    if (maxImportSizeInMb != null) {
        var totalDataSize = 0, compressedFileWarning = "";
        for (var i=0; i<importDropzoneG.getAcceptedFiles().length; i++)
        {
        	var decompressionFactor = importDropzoneG.getAcceptedFiles()[i].name.toLowerCase().endsWith(".gz") ? 20 : 1;
        	if (decompressionFactor != 1)
        		compressedFileWarning = "\nNote that bgzipped files are considered to have 20x compression.";
       		totalDataSize += decompressionFactor * importDropzoneG.getAcceptedFiles()[i].size;
        }
        if (totalDataSize > maxImportSizeInMb * 1024 * 1024)
        {
        	if (showAlerts)
                alert("Import size limit (" + maxImportSizeInMb + " Mb) exceeded!" + compressedFileWarning);
            return false;
        }
    }

	var dataFile1 = $("input[name=dataFile1]").val().trim(), dataFile2 = $("input[name=dataFile2]").val().trim(), dataFile3 = $("input[name=dataFile3]").val().trim();
    var totalDataSourceCount = importDropzoneG.getAcceptedFiles().length + (dataFile1 != "" ? 1 : 0) + (dataFile2 != "" ? 1 : 0) + (dataFile3 != "" ? 1 : 0);
    if (totalDataSourceCount == 0)
    	return null;
    if (totalDataSourceCount > importDropzoneG.options.maxFiles) {
    	if (showAlerts)
            alert("You may not provide more than " + importDropzoneG.options.maxFiles + " data-source entries!");
        return false;
    }
    
    var moduleOrProjectMissing = $("#moduleToImport").val() == "" || $("#projectToImport").val() == "";
	if (moduleOrProjectMissing)
	{
    	if (showAlerts)
			alert("You must specify a " + ($("#moduleToImport").val() == "" ? "database!" : "project!"));
        return false;
	}
	
    if (totalDataSourceCount < 1)
    {
   		var projectDescInInterface = $("textarea#projectDesc").val();
    	if (projectDescInInterface == "")
    		projectDescInInterface = null;
    	var descHasChanged = projectDescInInterface != projectDescriptions[$("#projectToImport").val()];
		if (!descHasChanged || (showAlerts && !confirm("Only project description has been specified. Please confirm this is all you want to update.")))
    	{
			if (!descHasChanged && showAlerts)
            	alert("You must provide some data to import or a project description!");
            return false;
    	}
    }
    else if ($("#runToImport").val() == "")
    {
    	if (showAlerts)
           	alert("You must specify a run!");
        return false;
    }

	if (dataFile2.length > 0 && dataFile1.length == 0)
    {
    	if (showAlerts)
          	alert("You may only use the second datasource field along with the first!");
        return false;
    }
	if (dataFile3.length > 0 && dataFile2.length == 0)
    {
    	if (showAlerts)
           	alert("You may only use the third datasource field along with the two first!");
        return false;
    }

	$("#moduleExistingMD").val($("#moduleExistingG").val()).selectpicker('refresh');
	$("div#mdModuleZone").hide();
	return true;
} 
            
function importGenotypes(importMetadataToo) {
	$("#gtFormInvalid").parent().click();
	var dataFile1Input = $("input[name=dataFile1]");
	var dataFile1 = dataFile1Input.val().trim();//, dataFile2 = $("input[name=dataFile2]").val().trim(), dataFile3 = $("input[name=dataFile3]").val().trim();
	var source1Uri = dataFile1.toLowerCase();
	if (source1Uri.startsWith("http") && source1Uri.toLowerCase().indexOf("/brapi/v") != -1)
	{
		if (source1Uri.indexOf("/brapi/v1") > -1 && !(source1Uri.endsWith("/brapi/v1") || source1Uri.endsWith("/brapi/v1/")))
		{
			alert("BrAPI base-url should end with /brapi/v1");
			return;
		}

		BRAPI_V1_URL_ENDPOINT = dataFile1Input.val().trim().replace(/:\/\/.*@/, ":\/\/");
		if (!checkEndPoint())
			return failAndHideBrapiDataSelectionDiv();

		submitBrapiForm();
		if (typeof brapiParameters == 'undefined' || brapiParameters == null)
			return;		// just displayed the selection div
	}

	if (typeof brapiParameters != 'undefined' && brapiParameters != null)
	{
		$('#brapiParameter_mapDbId').val(brapiParameters['mapDbId']);
		$('#brapiParameter_studyDbId').val(brapiParameters['studyDbId']);
		if (brapiGenotypesToken != null)
			$('#brapiParameter_token').val(brapiGenotypesToken);
	}

    $('#progress').modal({backdrop: 'static', keyboard: false, show: true});

    $('#progress').data('error', false);
    var taxonDetailsFieldContents = new Array();
    if ($("#ncbiTaxon").attr('title') != "")
    {
    	taxonDetailsFieldContents.push($("#ncbiTaxon").attr('title'));
        taxonDetailsFieldContents.push($("#ncbiTaxon").val() == $("#ncbiTaxon").attr('species') ? "" : $("#ncbiTaxon").val());
        taxonDetailsFieldContents.push($("#ncbiTaxon").attr('species'));
    }
    
    $('#progressText').html("Please wait...");
    processAborted = false;
    
	if (importMetadataToo) {
		importDropzoneG.options.maxFiles += importDropzoneMD.getAcceptedFiles().length;
		for (var i=0; i<importDropzoneMD.getAcceptedFiles().length; i++) {
			var file = importDropzoneMD.getAcceptedFiles()[i];
			file.accepted = null;	// remove this flag that was for the other DropZone (it needs to be set by this one otherwise it gets confused counting accepted files)
		    var isPhenotypeFile = file.name.endsWith(".phenotype");
		    if (isPhenotypeFile)
				importDropzoneG.options.acceptedFiles += ",.phenotype";
			//console.log("adding " + file.name + " (" + importDropzoneG.options.maxFiles + ")");
		    importDropzoneG.addFile(file);
		    if (isPhenotypeFile)
		    	importDropzoneG.options.acceptedFiles = importDropzoneG.options.acceptedFiles.replace(",.phenotype", "");
	    	else
				file.upload.filename = file.name + ".phenotype"; // this ensures tsv or csv files don't get confused with sample-mapping files on the server-side when importing from both tabs at once
        }
        $("#mixedImport_metadataFile1").val($("#metadataFile1").val());
        $("#mixedImport_metadataType").val($("#metadataType").val());
        
	    if (distinctBrapiMetadataURLs != null && distinctBrapiMetadataURLs.length > 0) {
	        $('#mixedImport_brapiURLs').val("");
	        $('#mixedImport_brapiTokens').val("");
	        distinctBrapiMetadataURLs.forEach(function(brapiMetadataUrl) {
				if (!brapiMetadataUrl.endsWith("/"))
					brapiMetadataUrl += "/";

				var brapiMetadataToken = null;
				if (brapiMetadataUrl == BRAPI_V1_URL_ENDPOINT && brapiGenotypesToken != null)
					brapiMetadataToken = brapiGenotypesToken;	// we already have a token for this endpoint
				else {
		            brapiMetadataToken = prompt("Please enter token for metadata source\n" + brapiMetadataUrl + "\n(leave blank if unneeded, cancel to skip BrAPI metadata source)");
		            if (brapiMetadataToken == null)
		            	return false;
		        }
	            var fFirstEntry = $('#mixedImport_brapiURLs').val() == "";
	            $('#mixedImport_brapiURLs').val($('#mixedImport_brapiURLs').val() + (fFirstEntry ? "" : " ; ") + brapiMetadataUrl);
	            $('#mixedImport_brapiTokens').val($('#mixedImport_brapiTokens').val() + (fFirstEntry ? "" : " ; ") + brapiMetadataToken);
	        });
	    }
	}
    else {
        $("#mixedImport_metadataFile1").val(null);
        $("#mixedImport_metadataType").val(null);
        $("#mixedImport_brapiURLs").val(null);
        $("#mixedImport_brapiTokens").val(null);
    }

	$("#ncbiTaxonIdNameAndSpecies").val(taxonDetailsFieldContents.join(":"));
    if (importDropzoneG.getQueuedFiles().length > 0)
    	importDropzoneG.processQueue();
    else {
        var blob = new Blob();
        blob.upload = { name:"nofiles" };
        importDropzoneG.uploadFile(blob);
    }
}

function checkMetaDataForm(showAlerts) {
	$('span#mdFormValid').hide();
    $('span#mdFormInvalid').hide();
    
    var providedFileCount = importDropzoneMD.getAcceptedFiles().length + ($("#metadataFile1").val().trim() != "" ? 1 : 0) /*+ (dataFile2 != "" ? 1 : 0)*/;
    if (providedFileCount == 0 && $("#brapiMetadataNotice span.metadataToPull-yes").length == 0)
		return null;	// no file provided yet 
		
    if (!$('span#gtFormValid').is(":visible") && $('#moduleExistingMD').val() == "") {
		$('span#mdFormInvalid').show();
		if (showAlerts)
    		alert("Please select a database!");
		return false;
    }
    
    if (importDropzoneMD.getRejectedFiles().length > 0 || importDropzoneMD.getFilesWithStatus(Dropzone.ERROR).length > 0) {
		$('span#mdFormInvalid').show();
		if (showAlerts)
	        alert("Please remove any rejected files before submitting!");
        return false;
    }
    
    if (providedFileCount > 1) {
		$('span#mdFormInvalid').show();
        if (showAlerts)
        	alert("You may not provide more than 1 metadata source!");
        return false;
    }

	$('span#mdFormValid').show();
    return true;
}

function importMetadata() {
	$("#mdFormInvalid").parent().click();
    if (distinctBrapiMetadataURLs != null && distinctBrapiMetadataURLs.length > 0) {
        $('#brapiURLs').val("");
        $('#brapiTokens').val("");
        distinctBrapiMetadataURLs.forEach(function(brapiMetadataUrl) {
			if (!brapiMetadataUrl.endsWith("/"))
				brapiMetadataUrl += "/";
					
            var brapiMetadataToken = prompt("Please enter token for metadata source\n" + brapiMetadataUrl + "\n(leave blank if unneeded, cancel to skip BrAPI metadata source)");
            if (brapiMetadataToken == null)
            	return false;
            var fFirstEntry = $('#brapiURLs').val() == "";
            $('#brapiURLs').val($('#brapiURLs').val() + (fFirstEntry ? "" : " ; ") + brapiMetadataUrl);
            $('#brapiTokens').val($('#brapiTokens').val() + (fFirstEntry ? "" : " ; ") + brapiMetadataToken);
        });
    }
	
    importDropzoneMD.options.url = metadataImportURL;

    $('#progress').data('error', false);
    $('#progress').modal({backdrop: 'static', keyboard: false, show: true});
    if (importDropzoneMD.getQueuedFiles().length > 0)
    	importDropzoneMD.processQueue();
    else {
        var blob = new Blob();
        blob.upload = { name:"nofiles" };
        importDropzoneMD.uploadFile(blob);
    }
}

function isValidKeyForNewName(evt) {
     return isValidCharForNewName((evt.which) ? evt.which : evt.keyCode);
}

function isValidCharForNewName(charCode) {
    return ((charCode >= 48 && charCode <= 57) || (charCode >= 65 && charCode <= 90) || (charCode >= 97 && charCode <= 122) || charCode == 8 || charCode == 9 || charCode == 35 || charCode == 36 || charCode == 37 || charCode == 39 || charCode == 45 || charCode == 46 || charCode == 95);
}

function isValidNewName(newName) {
    for (var i = 0; i < newName.length; i++)
        if (!isValidCharForNewName(newName.charCodeAt(i)))
            return false;
    return true;
}

function loadHost() {
    $.ajax({
        url: hostListUrl,
        type: "GET",
        dataType: "json",
        contentType: "application/json;charset=utf-8",
        headers: {
            "Authorization": "Bearer " + token
        },
        success: function (jsonResult) {
            var option = '';
            for (var host in jsonResult.host) {
                option += '<option>' + jsonResult.host[host] + '</option>';
            }
            $('#host').html(option).selectpicker('refresh');
            $('#host').val(0).selectpicker('refresh');
        },
        error: function (xhr, ajaxOptions, thrownError) {
            handleError(xhr, thrownError);
        }
    });
}

function loadModules() {
    $.ajax({
        url: referenceSetsSearchUrl,
        type: "POST",
        dataType: "json",
        contentType: "application/json;charset=utf-8",
        headers: {
            "Authorization": "Bearer " + token,
            "Writable": true
        },
        data: JSON.stringify({
            "assemblyId": null,
            "md5checksum": null,
            "accession": null,
            "pageSize": null,
            "pageToken": null
        }),
        success: function (jsonResult) {
            $('#moduleExistingG').html("<option>- new database -</option>").selectpicker('refresh');

            var options = "";
            for (var set in jsonResult.referenceSets)
                options += '<option>' + jsonResult.referenceSets[set].name + '</option>';

            $('#moduleExistingG').append(options).selectpicker('refresh');
    		var passedModule = $_GET("module");
    		if (passedModule != null) {
				while (passedModule.endsWith('#'))
					passedModule = passedModule.substring(0, passedModule.length - 1);
                $('#moduleExistingG').val(passedModule).selectpicker('refresh');
                $('#moduleExistingG').change();
			}
        },
        error: function (xhr, ajaxOptions, thrownError) {
            handleError(xhr, thrownError);
        }
    });
    
    $.ajax({
        url: referenceSetsSearchUrl,
        type: "POST",
        dataType: "json",
        contentType: "application/json;charset=utf-8",
        headers: {
            "Authorization": "Bearer " + token
        },
        data: JSON.stringify({
            "assemblyId": null,
            "md5checksum": null,
            "accession": null,
            "pageSize": null,
            "pageToken": null
        }),
        success: function (jsonResult) {
            var options = "";
            for (var set in jsonResult.referenceSets)
                options += '<option>' + jsonResult.referenceSets[set].name + '</option>';
                
            $('#moduleExistingMD').append(options).selectpicker('refresh');

    		var passedModule = $_GET("module");
    		if (passedModule != null) {
    			passedModule = passedModule.replace(new RegExp('#([^\\s]*)', 'g'), '');

            	if (!arrayContains($('#moduleExistingMD option').map((index, option) => option.value), passedModule)) {
	        		$('#moduleExistingMD').append('<option>' + passedModule + '</option>').selectpicker('refresh');
	        		$('#moduleExistingMD').val(passedModule);
    			}
    			
                $('#moduleExistingMD').val(passedModule).selectpicker('refresh');
			}
			$('#moduleExistingMD').change();
			updateBrapiMetadataNotice();
        },
        error: function (xhr, ajaxOptions, thrownError) {
            handleError(xhr, thrownError);
        }
    });
}

function loadProjects(module) {
    $.ajax({
        url: variantSetsSearchUrl,
        async: false,
        type: "POST",
        dataType: "json",
        contentType: "application/json;charset=utf-8",
        headers: {
            "Authorization": "Bearer " + token,
            "Writable": true
        },
        data: JSON.stringify({
            "datasetId": module,
            "pageSize": null,
            "pageToken": null
        }),
        success: function (jsonResult) {
            var option = "";
            for (var set in jsonResult.variantSets) {
            	var project = jsonResult.variantSets[set];
            	for (var mdObjKey in project.metadata)
            		if ("description" == project.metadata[mdObjKey].key)
            		{
            			projectDescriptions[project.name] = project.metadata[mdObjKey].value;
            			break;
            		}
            	var isNewProject = Object.keys(project).length == 0; 
                option += '<option data-id="' + (isNewProject ? "" : project.id) + '">' + (isNewProject ? "- new project -" : project.name) + '</option>';
            }
            $('#projectExisting').html(option).selectpicker('refresh');
            $('#projectExisting').val(0).selectpicker('refresh');
        },
        error: function (xhr, ajaxOptions, thrownError) {
            handleError(xhr, thrownError);
        }
    });
}

function loadRuns() {
    $.ajax({
        url: projectRunUrl + encodeURIComponent($('#projectExisting :selected').data("id")),
        type: "GET",
        dataType: "json",
        contentType: "application/json;charset=utf-8",
        headers: {
            "Authorization": "Bearer " + token
        },
        success: function (jsonResult) {
            var option = "<option>- new run -</option>";
            for (var run in jsonResult.runs) {
                option += '<option>' + jsonResult.runs[run] + '</option>';
            }
            $('#runExisting').html(option).selectpicker('refresh');
            $('#runExisting').val(0).selectpicker('refresh');
        },
        error: function (xhr, ajaxOptions, thrownError) {
            handleError(xhr, thrownError);
        }
    });
}

function clearFields() {
    $('#module').val("");
    $('#project').val("");
    $('#run').val("");
    $('#vcfImportSuccessText').html("");
}