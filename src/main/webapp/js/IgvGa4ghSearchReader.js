

const knownAltBases = new Set(["A", "C", "T", "G"].map(c => c.charCodeAt(0)))


class GigwaVariant {
    constructor(data) {
    	let self = this;
    	self.chr = data.referenceName;
    	self.pos = data.start;
    	self.start = data.start;
    	self.end = data.end;
    	self.names = data.names;
    	self.referenceBases = data.referenceBases;
        self.alternateBases = arrayToString(data.alternateBases);
        self.quality = data.quality;
        self.filter = data.filter;
        let info = {}
        if (data.info) {
            Object.keys(data.info).forEach(function (key) {
                var value,
                    valueArray = data.info[key];

                if (Array.isArray(valueArray)) {
                    value = valueArray.join(",");
                } else {
                    value = valueArray;
                }
                info[key] = value;
            });
        }
        self.info = info;
        
        self.calls = {};
        if (data.calls) {
            data.calls.forEach(function (call) {
            	if (call.genotype.length > 0){  // Filter out missing data
            		self.calls[call.callSetId] = call;
            	}
            });
        }
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
                this.start = this.pos - 1;      // convert to 0-based coordinate convention
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

                        const alleleStart = this.pos + s - 1;      // -1 for zero based coordinates
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
        const posString = `${this.pos.toLocaleString()}`;
        const locString = this.start === this.end ?
            `${this.start.toLocaleString()} | ${(this.start + 1).toLocaleString()}` :
            `${(this.start + 1).toLocaleString()}-${this.end.toLocaleString()}`;
        const fields = [
            {name: "Chr", value: this.chr},
            {name: "Pos", value: posString},
            {name: "Loc", value: locString},
            {name: "Names", value: this.names ? this.names : ""},
            {name: "Ref", value: this.referenceBases},
            {name: "Alt", value: this.alternateBases.replace("<", "&lt;")},
            {name: "Qual", value: this.quality},
            {name: "Filter", value: this.filter}
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

        if (this.info) {
            fields.push({html: '<hr style="border-top: dotted 1px;border-color: #c9c3ba" />'});
            for (let key of Object.keys(this.info)) {
                fields.push({name: key, value: arrayToString(decodeURIComponent(this.info[key]))});
            }
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
	
	async updateHeader(){
		this.header = {};
		this.header.callSets = igvCallSets.filter(callset => (this.selectedIndividuals.includes(callset.name) || this.selectedIndividuals.length == 0));
		this.header.callSetIds = this.header.callSets.map(callset => callset.name);
		
		this.header.callSets.sort(function (a, b){
        	if (a.name < b.name) return -1;
        	if (a.name > b.name) return 1;
        	return 0;
        });
		return this.header;
	}
	
	readFeatures(chr, bpStart, bpEnd){
		let self = this;
		return this.readHeader().then(function(header){
			// let query = buildSearchQuery(2, 0);
			let searchStart = getSearchMinPosition();
			let searchEnd = getSearchMaxPosition();
			
			let query = {
				variantSetId: getProjectId(),
		        searchMode: 2,
		        getGT: true,
		        pageSize: 2147483647,  // FIXME ?
				referenceName: igvGenomeRefTable[chr],
				start: Math.max(parseInt(bpStart), searchStart),
				end: searchEnd < 0 ? parseInt(bpEnd) : Math.min(parseInt(bpEnd), searchEnd),  // searchEnd = -1 -> all
				callSetIds: self.header.callSetIds,
			};
			
			return $.ajax({
	            url: self.variantSearch,
	            type: "POST",
	            dataType: "json",
	            contentType: "application/json;charset=utf-8",
	            headers: buildHeader(token, $('#assembly').val()),
	            data: JSON.stringify(query),
	            error: function(xhr, ajaxOptions, thrownError) {
	                handleError(xhr, thrownError);
	            }
	        }).then(function (data){
	        	let variants = [];
                data.variants.forEach(function(jsonVariant){
                	let variant = new GigwaVariant(jsonVariant);
                	if (!variant.isRefBlock()){
                		variants.push(variant);
                	}
                });
            	return variants;
	        });
		})
	}
};