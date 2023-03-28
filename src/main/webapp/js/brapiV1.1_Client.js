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
const URL_TOKEN = "token";
const URL_CALLS = "calls";
const URL_MAPS = "maps";
const URL_STUDIES = "studies-search";
const URL_MARKER_PROFILES = "markerprofiles";
const URL_ALLELE_MATRIX = "allelematrix-search";

const REQUIRED_CALLS = new Array(/*URL_TOKEN, */URL_MAPS, URL_STUDIES, URL_MARKER_PROFILES, URL_ALLELE_MATRIX);

const TIMEOUT = 10000;

function checkEndPoint()
{
	if (typeof BRAPI_V1_URL_ENDPOINT == 'undefined')
	{
		alert("You must specify an endpoint by setting the BRAPI_V1_URL_ENDPOINT variable!");
		return false;
	}
	
	if (!BRAPI_V1_URL_ENDPOINT.endsWith("/"))
		BRAPI_V1_URL_ENDPOINT += "/";
	
	var errorMsg = null;
	var unimplementedCalls = new Array();
	$.ajax({
	    type:"GET",
		crossDomain:true,
	    async:false,
	    data: {pageSize:1000},
	    url:BRAPI_V1_URL_ENDPOINT + URL_CALLS,
	    traditional:true,
	    timeout:TIMEOUT,
	    success:function(jsonResponse) {
	    	var dataList = getDataList(jsonResponse);
	    	mainLoop: for (var i=0; i<REQUIRED_CALLS.length; i++) {
		    	for (var j=0; j<dataList.length; j++)
		    		if (dataList[j] != null && REQUIRED_CALLS[i] == dataList[j]['call'])
		    			continue mainLoop;
		    	unimplementedCalls.push(REQUIRED_CALLS[i]);
	    	}
	    },
	    error:function(xhr, ajaxOptions, thrownError) {
	    	errorMsg = "No BrAPI source found at " + BRAPI_V1_URL_ENDPOINT + " (error code " + xhr.status + ")"
	    }
	});
	if (errorMsg != null)
	{
    	alert(errorMsg);
    	return false;
	}

	if (unimplementedCalls.length > 0)
	{
		alert("This BrAPI service does not support the following call(s): " + unimplementedCalls.join(", "));
		return false;
	}
	return true;
}

function getDataList(jsonResponse)
{
	if (jsonResponse['result'] == null)
		throw("No 'result' key in jsonResponse!");

	if (jsonResponse['result']['data'] == null)
		throw("No 'data' key in jsonResponse['result']!");

	return jsonResponse['result']['data'];
}

function readMapList()
{
	var dataList;
	$.ajax({
	    type:"GET",
		crossDomain:true,
	    url:BRAPI_V1_URL_ENDPOINT + URL_MAPS,
	    async:false,
	    data: {pageSize:1000},
	    timeout:TIMEOUT,
	    headers: { Authorization:brapiGenotypesToken == null ? null : brapiGenotypesToken },
	    success:function(jsonResponse) {
	    	dataList = getDataList(jsonResponse);
	    },
	    error:function(xhr, ajaxOptions, thrownError) {
			handleError(xhr, ajaxOptions, thrownError);
	    }
	});
	return dataList;
}

function readStudyList(studyType)
{
	var result = new Array();
	$.ajax({
	    type:"GET",
		crossDomain:true,
	    url:BRAPI_V1_URL_ENDPOINT + URL_STUDIES,
	    async:false,
	    data: {pageSize:1000},
	    data: {pageSize:1000, studyType:(studyType == null ? null : studyType)},
	    timeout:TIMEOUT,
	    headers: { Authorization:brapiGenotypesToken == null ? null : brapiGenotypesToken },
	    success:function(jsonResponse) {
	    	var dataList = getDataList(jsonResponse);
	    	for (var j=0; j<dataList.length; j++)
	    		if (studyType == dataList[j]['studyType'])
	    			result.push(dataList[j]);
	    },
	    error:function(xhr, ajaxOptions, thrownError) {
			handleError(xhr, ajaxOptions, thrownError);
	    }
	});
	return result;
}

function readMarkerProfiles(studyDbId)
{
	var parameters = studyDbId == null ? null : {studyDbId:studyDbId};

	var result = new Array();
	$.ajax({
	    type:"GET",
		crossDomain:true,
	    url:BRAPI_V1_URL_ENDPOINT + URL_MARKER_PROFILES,
	    async:false,
	    data:parameters,
	    timeout:TIMEOUT,
	    headers: { Authorization:brapiGenotypesToken == null ? null : brapiGenotypesToken },
	    success:function(jsonResponse) {
	    	var dataList = getDataList(jsonResponse);
	    	for (var j=0; j<dataList.length; j++)
	    		result.push(dataList[j]);
	    },
	    error:function(xhr, ajaxOptions, thrownError) {
			handleError(xhr, ajaxOptions, thrownError);
	    }
	});
	return result;
}

function failAndHideBrapiDataSelectionDiv(message)
{
	if (message != null)
		alert(message);
	$("#importButton").removeAttr('disabled');
	$("div#brapiDataSelectionDiv").remove();
}