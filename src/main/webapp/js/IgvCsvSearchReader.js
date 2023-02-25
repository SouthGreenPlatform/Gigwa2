

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
			{name: "Ref", value: this.referenceBases},
			{name: "Alt", value: this.alternateBases.replace("<", "&lt;")},
			{html: ' <a href="#" onclick="variantId=\'' + self.id + '\';loadVariantAnnotationData();">More info</a>'},
		];

		if (this.hasOwnProperty("heterozygosity")) {
			fields.push({name: "Heterozygosity", value: this.heterozygosity});
		}

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


function parseFeatures(data, dataHeader){
	let variants = [];
	let projectId = getProjectId() + "§";
	
	// Split the tabular data in rows and columns, filtering out the empty lines
	let rows = data.split("\n").filter(row => row.trim().length > 0).map(row => row.split("\t"));
	let header = rows.shift();
	
	// Associate column titles to indices
	let cols = new Map();
	header.forEach(function (title, index){
		cols.set(title, index);
	});
	
	let individualCols = new Map();
	dataHeader.callSets.forEach(function (callset){
		individualCols.set(callset.id, cols.get(callset.name));
	})
	
	// Parse the actual data
	rows.forEach(function (row){
		// Build the calls object (parse the genotypes)
		let calls = {};
		dataHeader.callSetIds.forEach(function (id){
			let genotype = row[individualCols.get(id)];
			if (genotype.length > 0){
				calls[id] = {
					callSetId: id,
					genotype: genotype.split("/").map(val => parseInt(val)),
					info: {},
				};
			}
		});
		
		let alleles = row[cols.get("alleles")].split("/");
		let refAllele = alleles.shift();
		let variant = new GigwaVariant(projectId + row[cols.get("variant")], row[cols.get("chrom")], parseInt(row[cols.get("pos")]), refAllele, alleles.join(","), calls);
		if (!variant.isRefBlock()){
			variants.push(variant);
		}
	});
	
	return variants;
}


// Implementation of the IGV Reader interface for the Gigwa's igvData service
class GigwaSearchReader {
	constructor(individuals, token, variantSearch) {
		this.selectedIndividuals = individuals;
		this.variantSearch = variantSearch;
		this.token = token;
		this.header = null;
		this.lastRead = null;
		this.lastIGVChromosome = null;
		this.lastIndex = 0;
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
		this.header.callSets = callSetResponse.filter(callset => (this.selectedIndividuals.includes(callset.name) || this.selectedIndividuals.length == 0));
		this.header.callSetIds = this.header.callSets.map(callset => callset.id);
		
		this.header.callSets.sort(function (a, b){
			if (a.id < b.id) return -1;
			if (a.id > b.id) return 1;
			return 0;
		});
		return this.header;
	}
	
	/* Read features on chr from bpStart to bpEnd
	 * This works with a chain of promises. Every new demand by IGV is materialised by a promise added on the chain
	 * Each new promise gets its own parameters, and the results from its predecessor on the chain
	 * This allows to request only the necessary data from the server, and to limit simultaneous, redundant requests
	 */
	async readFeatures(chr, bpStart, bpEnd) {
		if (!self.header) await this.readHeader();
		
		this.lastIndex += 1;
		if (this.lastRead) {
			this.lastRead = this.lastRead.then(this.retrieveFeatures(this.lastIndex, chr, bpStart, bpEnd));
		} else {
			this.lastRead = this.retrieveFeatures(this.lastIndex, chr, bpStart, bpEnd)({chr: null, start: -1, end: -1, features: [], result: []});
		}
		let result = await this.lastRead;
		return result.result;
	}
	
	// Return an async function to chain after the last one
	// A closure is necessary as the chained promise must get the return value from its predecessor and its own parameters
	retrieveFeatures(chainIndex, igvChr, bpStart, bpEnd) {
		let self = this;
		let searchStart = getSearchMinPosition();
		let searchEnd = getSearchMaxPosition();

		let chr = igvGenomeRefTable[igvChr];  // Resolve chromosome aliases
		
		// Limit the request to the searched range
		bpStart = Math.max(parseInt(bpStart), searchStart);
		bpEnd = searchEnd < 0 ? parseInt(bpEnd) : Math.min(parseInt(bpEnd), searchEnd);  // searchEnd = -1 -> all
		
		// Function to chain
		async function requestChain(previousResult){
		    if (self.lastIndex > chainIndex) {  // Not the latest request : pass the cached features to the next promise, do not draw anything for this call
		        return {chr: previousResult.chr, start: previousResult.start, end: previousResult.end, features: previousResult.features, result: []};
		    }
		    
			if (!chr) {  // Chromosome not found, probably because gigwa has no data for it
				if (self.lastIGVChromosome != igvChr) {
					displayMessage("Sequence " + igvChr + " is unknown from Gigwa database");
				}
				return {chr: null, start: -1, end: -1, features: [], result: []};
			}
			self.lastIGVChromosome = igvChr;
			
			let overlap;
			// FIXME : Open / closed intervals ?
			// FIXME : For dezoom, use the cache and make 2 requests or make a whole new request ?
			//		 Currently, does a new request
			if (previousResult.chr != chr || previousResult.start > bpEnd || previousResult.end < bpStart || (previousResult.start > bpStart && previousResult.end < bpEnd)){
				// No overlap at all
				overlap = null;
			} else if (previousResult.start <= bpStart && previousResult.end >= bpEnd) {
				// The new request is a subset of the previous one : just return cached features without making a new request
			    // Optimization : keep the whole superset's features to use the cached features without any new request
			    //   for the whole time we stay within that superset
				return {
					chr: chr,
					start: previousResult.start,
					end: previousResult.end,
					features: previousResult.features,
					result: previousResult.features.filter(feature => (feature.pos >= bpStart && feature.pos <= bpEnd)),
				};
			} else {  // Overlapping range
				overlap = [Math.max(previousResult.start, bpStart), Math.min(previousResult.end, bpEnd)];
			}
			
			
			let query = {
			    ...buildSearchQuery(2, 0),
				variantSetId: getProjectId(),
				displayedSequence: chr,
				callSetIds: self.header.callSetIds,
			};
			
			if (overlap) {
				if (overlap[0] > bpStart) {
					// Shift to the left : only keep the interval left of the overlap
					query.displayedRangeMin = bpStart;
					query.displayedRangeMax = overlap[0];
				} else {
					// Shift to the right : only keep the interval right of the overlap
					query.displayedRangeMin = overlap[1];
					query.displayedRangeMax = bpEnd;
				}
			} else {  // Full request
				query.displayedRangeMin = bpStart;
				query.displayedRangeMax = bpEnd;
			}
						
			let data = await $.ajax({
				url: self.variantSearch,
				type: "POST",
				dataType: "text",
				contentType: "application/json;charset=utf-8",
				headers: buildHeader(token, $('#assembly').val()),
				data: JSON.stringify(query),
				error: function (xhr, ajaxOptions, thrownError) {
					handleError(xhr, thrownError);
				}
			});
			
			let features;
			let newFeatures = parseFeatures(data, self.header);
			
			if (overlap){  // Get the features in the overlapping interval from the previous results
				let cachedFeatures = previousResult.features.filter(feature => (feature.pos >= bpStart && feature.pos <= bpEnd));
				features = newFeatures.concat(cachedFeatures);
			} else {
				features = newFeatures;
			}
			
			// Exploit the retrieved features but do not draw them if there are other promises pending after this one
			return {
				chr: chr,
				start: bpStart,
				end: bpEnd,
				features: features,
				result: (self.lastIndex == chainIndex) ? features : [],
			};
		}
		
		return requestChain;
	}
};
