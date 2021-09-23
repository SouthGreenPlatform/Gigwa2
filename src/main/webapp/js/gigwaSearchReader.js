

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
        var order = 0, id;
        if (data.calls) {
            data.calls.forEach(function (call) {
                id = call.callSetId;
                self.calls[id] = call;
                order++;

            })
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
	constructor(variantSearch, callsetSearch, token) {
		this.variantSearch = variantSearch;
		this.callsetSearch = callsetSearch;
		this.token = token;
	}
	
	readHeader() {
		if (!this.header){
			return this.updateHeader();
		} else {
			return Promise.resolve(this.header);
		}
	}
	
	updateHeader(){
		let self = this;
		self.header = {};
		
		let query = {
			variantSetId: $('#project :selected').data("id"),
			pageSize: 10000,
		};
		
		return $.ajax({
            url: self.callsetSearch,
            type: "POST",
            dataType: "json",
            contentType: "application/json;charset=utf-8",
            headers: {
                "Authorization": "Bearer " + self.token,
            },
            data: JSON.stringify(query),
            success: function(data) {
                self.header.callSets = [];
                self.header.callSetIds = [];
                let selectedIndividuals = getSelectedIndividuals(1, false);  // FIXME : Add group 2 ? 
                data.callSets.forEach(function (callset){
                	// Filter for the selected individuals. `getSelectedIndividuals` returns an empty array if all of them are selected
                	if (selectedIndividuals.includes(callset.name) || selectedIndividuals.length == 0){
	                	self.header.callSets.push(callset);
	                	self.header.callSetIds.push(callset.name);
                	}
                });
                
                self.header.callSets.sort(function (a, b){
                	if (a.name < b.name) return -1;
                	if (a.name > b.name) return 1;
                	else return 0;
                });
                return self.header.callSets;
            },
            error: function(xhr, ajaxOptions, thrownError) {
                handleError(xhr, thrownError);
            }
        }).then(function (callsets){
        	return self.header;
        });
	}
	
	readFeatures(chr, bpStart, bpEnd){
		let self = this;
		return this.readHeader().then(function(header){
			let query = buildSearchQuery(2, 0);
			query.referenceName = chr;
			query.start = Math.max(parseInt(bpStart), query.start);
			query.end = query.end < 0 ? parseInt(bpEnd) : Math.min(parseInt(bpEnd), query.end);
			query.pageSize = 2147483647;  // FIXME : ?
			query.getGT = true;
			
			return $.ajax({
	            url: self.variantSearch,
	            type: "POST",
	            dataType: "json",
	            contentType: "application/json;charset=utf-8",
	            headers: {
	                "Authorization": "Bearer " + self.token,
	            },
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