

const knownAltBases = new Set(["A", "C", "T", "G"].map(c => c.charCodeAt(0)))


// Object compatible with the IGV's Variant object, to work around the exports
class GigwaVariant {
	/**
	 * id : Variant unique id (in the form module§project§variant)
	 * reference : Chromosome the variant is on
	 * position : Position of the variant on the chromosome
	 * refAllele : Reference allele
	 * altAlleles : Alternate alleles, as a comma-separated string
	 * calls : Dictionary of callSetId => {callSetId, genotype, info}
	 */
	constructor(id, reference, position, refAllele, altAlleles, calls) {
		let self = this;
		self.id = id;
		self.chr = reference;
		self.pos = position;
		
		self.referenceBases = refAllele;
		self.alternateBases = altAlleles;
		self.names = [];
		
		self.info = {};
		self.calls = calls;
		self.init();
	}

	init() {
		const ref = this.referenceBases;
		const altBases = this.alternateBases;

		if (this.info) {
			if (this.info["VT"]) {
				this.type = this.info["VT"];
			} else if (this.info["SVTYPE"]) {
				this.type = "SV";
			} else if (this.info["PERIOD"]) {
				this.type = "STR";
			}
		}
		if (this.type === undefined) {
			this.type = determineType(ref, altBases);
		}
		if (this.type === "NONVARIANT") {
			this.heterozygosity = 0;
		}

		// Determine start/end coordinates -- these are the coordinates representing the actual variant,
		// not the leading or trailing reference
		if (this.info["END"]) {
			this.start = this.pos - 1;
			if (this.info["CHR2"] && this.info["CHR2"] !== this.chr) {
				this.end = this.start + 1;
			} else {
				this.end = Number.parseInt(this.info["END"]);
			}
		} else {
			if (this.type === "NONVARIANT") {
				this.start = this.pos - 1;	  // convert to 0-based coordinate convention
				this.end = this.start + ref.length;
			} else {

				const altTokens = altBases.split(",").filter(token => token.length > 0);
				this.alleles = [];
				this.start = undefined;
				this.end = undefined;

				for (let alt of altTokens) {

					this.alleles.push(alt);

					// We don't yet handle  SV and other special alt representations
					if ("SV" !== this.type && isKnownAlt(alt)) {

						let altLength = alt.length;
						let lengthOnRef = ref.length;
						const lmin = Math.min(altLength, lengthOnRef);

						// Trim off matching bases.  Try first match, then right -> left,  then any remaining left -> right
						let s = 0;

						while (s < lmin && (ref.charCodeAt(s) === alt.charCodeAt(s))) {
							s++;
							altLength--;
							lengthOnRef--;
						}

						// right -> left from end
						while (altLength > 0 && lengthOnRef > 0) {
							const altIdx = s + altLength - 1;
							const refIdx = s + lengthOnRef - 1;
							if (alt.charCodeAt(altIdx) === ref.charCodeAt(refIdx)) {
								altLength--;
								lengthOnRef--;
							} else {
								break;
							}
						}

						// if any remaining, left -> right
						while (altLength > 0 && lengthOnRef > 0) {
							const altIdx = s;
							const refIdx = s;
							if (alt.charCodeAt(altIdx) === ref.charCodeAt(refIdx)) {
								s++;
								altLength--;
								lengthOnRef--;
							} else {
								break;
							}
						}

						const alleleStart = this.pos + s - 1;	  // -1 for zero based coordinates
						const alleleEnd = alleleStart + lengthOnRef;
						this.start = this.start === undefined ? alleleStart : Math.min(this.start, alleleStart);
						this.end = this.end === undefined ? alleleEnd : Math.max(this.end, alleleEnd);
					}
				}

				// Default to single base representation @ position for variant types not otherwise handled
				if (this.start === undefined) {
					this.start = this.pos - 1;
					this.end = this.pos;
				}
			}
		}
	}


	popupData(genomicLocation, genomeId) {
		let self = this;
		const posString = `${this.pos.toLocaleString()}`;
		const locString = this.start === this.end ?
			`${this.start.toLocaleString()} | ${(this.start + 1).toLocaleString()}` :
			`${(this.start + 1).toLocaleString()}-${this.end.toLocaleString()}`;
		const fields = [
			{name: "Chr", value: this.chr},
			{name: "Pos", value: posString},
			{name: "Loc", value: locString},
			//{name: "Names", value: this.names ? this.names : ""},
			{name: "Ref", value: this.referenceBases},
			{name: "Alt", value: this.alternateBases.replace("<", "&lt;")},
			//{name: "Qual", value: this.quality},
			//{name: "Filter", value: this.filter},
			{html: ' <a href="#" onclick="variantId=\'' + self.id + '\';loadVariantAnnotationData();">More info</a>'},
		];

		/*if ("SNP" === this.type) {
			let ref = this.referenceBases;
			if (ref.length === 1) {
				for (let alt of this.alternateBases) {
					if (alt.length === 1) {
						let l = TrackBase.getCravatLink(this.chr, this.pos, ref, alt, genomeId)
						if (l) {
							fields.push('<hr/>');
							fields.push({html: l});
						}
					}
				}
			}
		}*/

		if (this.hasOwnProperty("heterozygosity")) {
			fields.push({name: "Heterozygosity", value: this.heterozygosity});
		}

		// No info in this service
		/*if (this.info) {
			fields.push({html: '<hr style="border-top: dotted 1px;border-color: #c9c3ba" />'});
			for (let key of Object.keys(this.info)) {
				fields.push({name: key, value: arrayToString(decodeURIComponent(this.info[key]))});
			}
		}*/

		return fields;

	};

	isRefBlock() {
		return "NONVARIANT" === this.type;
	}

}


function isKnownAlt(alt) {
	for (let i = 0; i < alt.length; i++) {
		if (!knownAltBases.has(alt.charCodeAt(i))) {
			return false;
		}
	}
	return true;
}


function determineType(ref, altAlleles) {
	const refLength = ref.length;
	if (altAlleles === undefined) {
		return "UNKNOWN";
	} else if (altAlleles.trim().length === 0) {
		return "NONVARIANT";
	} else {
		const types = altAlleles.split(",").map(function (a) {
			if (refLength === 1 && a.length === 1) {
				return "SNP";
			} else {
				return "<NON_REF>" === a ? "NONVARIANT" : "OTHER";
			}
		});
		let type = types[0];
		for (let t of types) {
			if (t !== type) {
				return "MIXED";
			}
		}
		return type;
	}
}

function arrayToString(value, delim) {

	if (delim === undefined) delim = ",";

	if (!(Array.isArray(value))) {
		return value;
	}
	return value.join(delim);
}


// Implementation of the IGV Reader interface for the Gigwa's igvData service
class GigwaSearchReader {
	constructor(individuals, token, variantSearch) {
		this.selectedIndividuals = individuals;
		this.variantSearch = variantSearch;
		this.token = token;
	}
	
	readHeader() {
		if (!this.header){
			return this.updateHeader();
		} else {
			return Promise.resolve(this.header);
		}
	}
	
	// Retrieve the "header" data (the callsets)
	async updateHeader(){
		this.header = {};
		this.header.callSets = igvCallSets.filter(callset => (this.selectedIndividuals.includes(callset.name) || this.selectedIndividuals.length == 0));
		this.header.callSetIds = this.header.callSets.map(callset => callset.id);
		
		this.header.callSets.sort(function (a, b){
			if (a.id < b.id) return -1;
			if (a.id > b.id) return 1;
			return 0;
		});
		return this.header;
	}
	
	// Read features on chr from bpStart to bpEnd
	readFeatures(chr, bpStart, bpEnd){
		let self = this;
		return self.readHeader().then(function(header){
			// let query = buildSearchQuery(2, 0);
			let searchStart = getSearchMinPosition();
			let searchEnd = getSearchMaxPosition();
			
			let query = {
				variantSetId: getProjectId(),
				referenceName: igvGenomeRefTable[chr],
				start: Math.max(parseInt(bpStart), searchStart),
				end: searchEnd < 0 ? parseInt(bpEnd) : Math.min(parseInt(bpEnd), searchEnd),  // searchEnd = -1 -> all
				callSetIds: self.header.callSetIds,
			};
			
			return $.ajax({
				url: self.variantSearch,
				type: "POST",
				dataType: "text",
				contentType: "application/json;charset=utf-8",
				headers: {
					"Authorization": "Bearer " + self.token,
				},
				data: JSON.stringify(query),
				error: function (xhr, ajaxOptions, thrownError) {
					handleError(xhr, thrownError);
				}
			}).then(function (data){
				let variants = [];
				let projectId = getProjectId() + "§";
				
				// Split the tabular data in rows and columns, filtering out the empty lines
				let rows = data.split("\n").filter(row => row.trim().length > 0).map(row => row.split("\t"));
				let header = rows.shift();
				
				// Associate column titles to indices
				let cols = {};
				header.forEach(function (title, index){
					cols[title] = index;
				});
				
				let individualCols = {};
				self.header.callSets.forEach(function (callset){
					individualCols[callset.id] = cols[callset.name];
				})
				
				// Parse the actual data
				rows.forEach(function (row){
					// Build the calls object (parse the genotypes)
					let calls = {};
					self.header.callSetIds.forEach(function (id){
						let genotype = row[individualCols[id]];
						if (genotype.length > 0){
							calls[id] = {
								callSetId: id,
								genotype: genotype.split("/").map(val => parseInt(val)),
								info: {},
							};
						}
					});
					
					let alleles = row[cols.alleles].split("/");
					let refAllele = alleles.shift();
					let variant = new GigwaVariant(projectId + row[cols.variant], row[cols.chrom], parseInt(row[cols.pos]), refAllele, alleles.join(","), calls);
					if (!variant.isRefBlock()){
						variants.push(variant);
					}
				});
				
				return variants;
			});
		});
	}
};