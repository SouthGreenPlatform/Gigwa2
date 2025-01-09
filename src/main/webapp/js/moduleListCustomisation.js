var taxonCellIndex = null;

function getNcbiTaxonDetails(ncbiTaxonId, retrying)
{
    var failed = false, result = $.ajax({
        async:false,
        type:"GET",
        url:"https://eutils.ncbi.nlm.nih.gov/entrez/eutils/esummary.fcgi?db=taxonomy&retmode=json&id=" + ncbiTaxonId,
        error:function(xhr, ajaxOptions, thrownError) {
			failed = true;
		}
    });
    
    if (!failed)
    return result['responseJSON']['result'][ncbiTaxonId];

	if (retrying)
		return null;

	console.log("Retrying to fetch taxon from ID " + ncbiTaxonId);
	return getNcbiTaxonDetails(ncbiTaxonId, true);
}

function grabNcbiTaxon(inputObj, taxonId)
{
	if (taxonId == null)
		return false;

	if (taxonId == "" || isNaN(taxonId)) {
		$(inputObj).removeAttr('data-id');
		$(inputObj).removeAttr('data-species');
		if (typeof setDirty != 'undefined' && $(inputObj).val() != taxonId)
			setDirty($(inputObj).closest("tr").attr("id").substring(4), true);
		$(inputObj).val(taxonId).attr('title', taxonId + '\n(Click to change selection)');
		return;
	}

	try {
	    var taxonDetails = getNcbiTaxonDetails(taxonId), taxonName = taxonDetails['scientificname'], genus = taxonDetails['genus'], species = taxonDetails['species'];
	    if (taxonName != null && taxonName != '')
	        $(inputObj).attr('data-id', taxonId);
        $(inputObj).attr('data-species', species != null && species != '' ? (genus + " " + species) : null);
	
		if (typeof setDirty != 'undefined' && $(inputObj).val() != taxonId)
			setDirty($(inputObj).closest("tr").attr("id").substring(4), true);
	    $(inputObj).val(taxonName).attr('title', taxonName + '\n(Click to change selection)');
	}
	catch(error) {
		alert("Unable to fetch NCBI taxon info for ID " + taxonId);
	}
}

function customizeModuleList() {
	let cell = $("#moduleTable thead th").filter(function() {
        return $(this).text().trim() === "Category";
    });
    
    if (cell.length == 0)
    	return;
    	
	cell.text("Taxon");
	taxonCellIndex = cell.index() + 1;

    $("#moduleTable tbody tr td:nth-child(" + taxonCellIndex + ")").each(function() {
		updateTaxonCell(this);
	})
	if ($("#moduleTable tbody tr td:nth-child(" + taxonCellIndex + ") input").length > 0)
		cell.append('<span style="font-weight:normal; margin-left:50px; color:black;">Find NCBI IDs&nbsp;<a href="https://www.ncbi.nlm.nih.gov/Taxonomy/Browser/wwwtax.cgi" target="_blank"><img id="igvTooltip" style="cursor:pointer; cursor:hand;" src="../images/magnifier.gif" title="Click to find out taxon id. Specifying an id is preferred because it avoids typos."></a></span>');
}

function updateTaxonCell(taxonCell) {
	let idTaxonSpecies = $(taxonCell).text().split(":"), inputVal = idTaxonSpecies.length < 3 ? idTaxonSpecies[0] : (idTaxonSpecies[1] != '' ? idTaxonSpecies[1]: idTaxonSpecies[2]);
	if (isAdmin || permissions.has($(taxonCell).parent().attr("id").substring(4) + supervisorRole)) {
		$(taxonCell).html("<input type='text' readonly='true' value=\"" + inputVal + "\" data-id='" + idTaxonSpecies[0] + "' title='" + inputVal + "\n(Click to change selection)' />");
		$(taxonCell).find("input").css("width", "200px").css("font-style", "italic").css("text-align", "center").css("border", "none").css("background-color", "inherit !important").css("cursor", "pointer").on("click", function() {
			grabNcbiTaxon($(this).get(), prompt("Please specify NCBI taxon, preferrably by ID\n(enter blank string to clear out)"));
		});
	}
	else
		$(taxonCell).html("<i>" + inputVal + "</i>").css("background-color", "lightgrey");
}

saveChanges = function(moduleName) {	// override default function so we can account for the taxon field
	let itemRow = $("#row_" + moduleName);
	let setToPublic = itemRow.find(".flagCol1").prop("checked");
	let setToHidden = itemRow.find(".flagCol2").prop("checked");
    var taxonDetailsFieldContents = new Array();
	let taxonInput = itemRow.find("td:nth-child(" + taxonCellIndex + ") input");
    if (taxonInput.attr('data-id') != "")
    {
    	taxonDetailsFieldContents.push(taxonInput.attr('data-id'));
        taxonDetailsFieldContents.push(taxonInput.val() == taxonInput.attr('data-species') ? "" : taxonInput.val());
        taxonDetailsFieldContents.push(taxonInput.attr('data-species'));
    }
	$.getJSON(moduleDetailsURL, { module:moduleName,public:setToPublic,hidden:setToHidden,category:taxonDetailsFieldContents.join(":") }, function(updated){
		if (!updated)
			alert("Unable to apply changes for " + moduleName);
		else
		{
			moduleData[moduleName][modulePublicFieldName] = setToPublic;
			moduleData[moduleName][moduleHiddenFieldName] = setToHidden;
			setDirty(moduleName, false);
		}
	}).error(function(xhr) { handleError(xhr); });
}

resetFlags = function(moduleName) {		// override default function so we can account for the taxon field
	let itemRow = $("#row_" + moduleName);
	itemRow.find(".flagCol1").prop("checked", moduleData[moduleName][modulePublicFieldName]);
	itemRow.find(".flagCol2").prop("checked", moduleData[moduleName][moduleHiddenFieldName]);
	let taxonCell = itemRow.find("td:nth-child(" + taxonCellIndex + ")");
	taxonCell.text(moduleData[moduleName]["category"]);
	updateTaxonCell(taxonCell.get());
	setDirty(moduleName, false);
}