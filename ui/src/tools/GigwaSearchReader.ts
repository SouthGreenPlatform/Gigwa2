import { handleError } from "./commons";

function getSearchMinPosition(): number {
  console.log("getSearchMinPosition is not implemented");
  return -1;
}

function getSearchMaxPosition(): number {
  console.log("getSearchMaxPosition is not implemented");
  return -1;
}

const knownAltBases = new Set(["A", "C", "T", "G"].map((c) => c.charCodeAt(0)));

/**
 * Checks if the given alternate allele is composed of known bases.
 * @param alt - The alternate allele string.
 * @returns True if the allele is valid, false otherwise.
 */
export function isKnownAlt(alt: string): boolean {
  for (let i = 0; i < alt.length; i++) {
    if (!knownAltBases.has(alt.charCodeAt(i))) {
      return false;
    }
  }
  return true;
}

/**
 * Determines the type of a variant based on the reference and alternate alleles.
 * @param ref - The reference allele.
 * @param altAlleles - The alternate alleles as a comma-separated string.
 * @returns The type of the variant.
 */
export function determineType(ref: string, altAlleles?: string): string {
  const refLength = ref.length;

  if (!altAlleles) {
    return "UNKNOWN";
  } else if (altAlleles.trim().length === 0) {
    return "NONVARIANT";
  } else {
    const types = altAlleles.split(",").map((a) => {
      if (refLength === 1 && a.length === 1) {
        return "SNP";
      } else {
        return a === "<NON_REF>" ? "NONVARIANT" : "OTHER";
      }
    });

    const firstType = types[0];
    for (const type of types) {
      if (type !== firstType) {
        return "MIXED";
      }
    }
    return firstType;
  }
}

/**
 * Converts an array to a string with a specified delimiter.
 * @param value - The array or value to convert.
 * @param delim - The delimiter to use (default is ",").
 * @returns The resulting string.
 */
export function arrayToString(value: any, delim: string = ","): string {
  if (Array.isArray(value)) {
    return value.join(delim);
  }
  return String(value);
}

/**
 * Represents a Gigwa variant.
 */
export class GigwaVariant {
  id: string;
  chr: string;
  pos: number;
  referenceBases: string;
  alternateBases: string;
  names: string[];
  info: Record<string, any>;
  calls: any[];
  type?: string;
  heterozygosity?: number;
  start?: number;
  end?: number;
  alleles?: string[];
  isFiltered: Function;
  alleleFreq: Function;

  constructor(
    id: string,
    reference: string,
    position: number,
    refAllele: string,
    altAlleles: string,
    calls: any[],
  ) {
    this.id = id;
    this.chr = reference;
    this.pos = position;
    this.referenceBases = refAllele;
    this.alternateBases = altAlleles;
    this.names = [];
    this.info = {};
    this.calls = calls;
    
    // Set alleles array for IGV to use
    this.alleles = [refAllele, ...altAlleles.split(',').filter(a => a.length > 0)];
    
    this.init(); 
    this.isFiltered = function() {return false;};
    this.alleleFreq = function() {return undefined;};
  }

  /**
   * Initializes the variant by determining its type and genomic range.
   */
  private init(): void {
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

    if (!this.type) {
      this.type = determineType(ref, altBases);
    }

    if (this.type === "NONVARIANT") {
      this.heterozygosity = 0;
    }

    if (this.info["END"]) {
      this.start = this.pos - 1;
      if (this.info["CHR2"] && this.info["CHR2"] !== this.chr) {
        this.end = this.start + 1;
      } else {
        this.end = Number.parseInt(this.info["END"], 10);
      }
    } else {
      this.calculateAlleles(ref, altBases);
    }
  }

  /**
   * Calculates the alleles and genomic range for the variant.
   * @param ref - The reference allele.
   * @param altBases - The alternate alleles as a comma-separated string.
   */
  private calculateAlleles(ref: string, altBases: string): void {
    const altTokens = altBases.split(",").filter((token) => token.length > 0);
    this.start = undefined;
    this.end = undefined;

    for (const alt of altTokens) {
      if (this.type !== "SV" && isKnownAlt(alt)) {
        let altLength = alt.length;
        let refLength = ref.length;
        let s = 0;

        while (
          s < Math.min(altLength, refLength) &&
          ref.charCodeAt(s) === alt.charCodeAt(s)
        ) {
          s++;
          altLength--;
          refLength--;
        }

        const alleleStart = this.pos + s - 1;
        const alleleEnd = alleleStart + refLength;

        this.start =
          this.start === undefined
            ? alleleStart
            : Math.min(this.start, alleleStart);
        this.end =
          this.end === undefined ? alleleEnd : Math.max(this.end, alleleEnd);
      }
    }

    if (this.start === undefined) {
      this.start = this.pos - 1;
      this.end = this.pos;
    }
  }

  /**
   * Generates popup data for the variant.
   * @returns An array of popup data fields.
   */
  popupData() : { name: string; value: string }[] {
    const posString = `${this.pos.toLocaleString()}`;
    const locString =
      this.start === this.end
        ? `${(this.start ?? 0).toLocaleString()} | ${((this.start ?? 0) + 1).toLocaleString()}`
        : `${((this.start ?? 0) + 1).toLocaleString()}-${(this.end ?? 0).toLocaleString()}`;

    const fields = [
      { name: "Chr", value: this.chr },
      { name: "Pos", value: posString },
      { name: "Loc", value: locString },
      { name: "Ref", value: this.referenceBases },
      { name: "Alt", value: this.alternateBases.replace("<", "&lt;") },
    ];

    if (this.heterozygosity !== undefined) {
      fields.push({
        name: "Heterozygosity",
        value: this.heterozygosity.toString(),
      });
    }

    return fields;
  }

  /**
   * Checks if the variant is a reference block.
   * @returns True if the variant is a reference block, false otherwise.
   */
  isRefBlock(): boolean {
    return this.type === "NONVARIANT";
  }
}

// Define types for the input data and header
type DataHeader = {
  callSetIds: string[];
};

/*type ParsedCall = {
  callSetId: string;
  genotype: number[];
  info: Record<string, any>;
};*/

export class GigwaSearchReader {
  private buildSearchQuery: (any,any) => Record<string, any>;
  private groupFilters: any;
  private variantFilters: any;
  private assembly: string;
  private selectedIndividuals: string[];
  private variantSearchURL: string;
  private igvGenomeRefTable: { [key: string]: string };
  private api: any | null;
  private lastRead: Promise<any> | null;
  private lastIGVChromosome: string | null;
  private lastIndex: number;

  constructor(buildSearchQuery: (any,any) => Record<string, any>, groupFilters: any, variantFilters: any, assembly: string, individuals: string[], variantSearchURL: string, igvGenomeRefTable: { [key: string]: string }, api: any) {
    this.buildSearchQuery = buildSearchQuery;
    this.groupFilters = groupFilters;
    this.variantFilters = variantFilters;
    this.assembly = assembly;
    this.selectedIndividuals = individuals;
    this.variantSearchURL = variantSearchURL;
    this.igvGenomeRefTable = igvGenomeRefTable;
    this.api = api;
    this.lastRead = null;
    this.lastIGVChromosome = null;
    this.lastIndex = 0;
  }
  
  /**
   * Reads the header data (callsets) - ALWAYS return fresh data
   */
  async readHeader(): Promise<any> {
    return this.buildHeader();
  }

  private getModuleName() {
    return this.assembly.substring(0, this.assembly.indexOf("§"));
  }

  /**
   * Builds a fresh header every time
   */
  private async buildHeader(): Promise<any> {
    const sampleNameMap = new Map<string, number>();
    
    // Build the sampleNameMap - maps display name to its index
    this.selectedIndividuals.forEach((ind, index) => {
      const displayName = ind.includes("§") ? ind.split("§").pop()! : ind;
      sampleNameMap.set(displayName, index);
    });

    //console.log("Building fresh header with samples:", Array.from(sampleNameMap.keys()));

    const header = {
      sampleNameMap: sampleNameMap,
      callSetIds: this.selectedIndividuals,
      callSets: this.selectedIndividuals.map((ind) => ({
        id: ind,
        name: ind.includes("§") ? ind.split("§")[1] : ind,
      })),
    };

    return header;
  }

  /**
   * Reads features for a given chromosome and range.
   */
  async readFeatures(
    chr: string,
    bpStart: number,
    bpEnd: number,
  ): Promise<any[]> {
    if (chr === "all") {
      return [];
    }

    const header = await this.buildHeader();

    this.lastIndex += 1;

    if (this.lastRead) {
      this.lastRead = this.lastRead.then(
        this.retrieveFeatures(this.lastIndex, chr, bpStart, bpEnd, header)
      );
    } else {
      this.lastRead = this.retrieveFeatures(
        this.lastIndex,
        chr,
        bpStart,
        bpEnd,
        header
      )({
        chr: null,
        start: -1,
        end: -1,
        features: [],
        result: [],
      });
    }

    const result = await this.lastRead;
    return result.result;
  }

  /**
   * Retrieves features with a fresh header
   */
  private retrieveFeatures(
    chainIndex: number,
    igvChr: string,
    bpStart: number,
    bpEnd: number,
    header: any  // Pass header explicitly
  ): (previousResult: any) => Promise<any> {
    const self = this;
    const searchStart = getSearchMinPosition();
    const searchEnd = getSearchMaxPosition();

    let chr: string = self.igvGenomeRefTable[igvChr];
    
    return async function requestChain(previousResult: any): Promise<any> {
      if (self.lastIndex > chainIndex) {
        return {
          chr: previousResult.chr,
          start: previousResult.start,
          end: previousResult.end,
          features: previousResult.features,
          result: [],
        };
      }

      if (!chr) {
        if (self.lastIGVChromosome !== igvChr) {
          console.log(`Sequence ${igvChr} is unknown from Gigwa database`);
        }
        chr = igvChr;
      }

      self.lastIGVChromosome = igvChr;

      bpStart = Math.max(bpStart, searchStart);
      bpEnd = searchEnd < 0 ? bpEnd : Math.min(bpEnd, searchEnd);

      const query = {
        ... self.buildSearchQuery(self.variantFilters, self.groupFilters),
        displayedSequence: chr,
        displayedRangeMin: bpStart,
        displayedRangeMax: bpEnd,
        callSetIds: self.selectedIndividuals,
        referenceName: chr,
      };

      try {
        const response = await self.api.post(self.variantSearchURL, query, {
          headers: {
            "Content-Type": "application/json;charset=utf-8",
            Assembly: self.assembly.split("§")[1],
          },
          responseType: "text",
        });

        // Pass the fresh header to parseFeatures
        const newFeatures = self.parseFeatures(response.data, header, self.lastIGVChromosome);
        return {
          chr: self.lastIGVChromosome,
          start: bpStart,
          end: bpEnd,
          features: newFeatures,
          result: newFeatures,
        };
      } catch (error) {
        handleError(null, error);
        return { chr: self.lastIGVChromosome, start: -1, end: -1, features: [], result: [] };
      }
    };
  }

  private parseFeatures(
    data: string,
    dataHeader: DataHeader,
    igvChromosome?: string
  ): GigwaVariant[] {
    const variants: GigwaVariant[] = [];
    const database = `${this.getModuleName()}§`;

    const rows = data
      .split("\n")
      .filter((row) => row.trim().length > 0)
      .map((row) => row.split("\t"));

    const header = rows.shift();
    if (!header) {
      throw new Error("Invalid data: Missing header row.");
    }

    const cols = new Map<string, number>();
    header.forEach((title, index) => {
      cols.set(title, index);
    });

    // Get the alleles column to understand the allele numbering
    const allelesColIndex = cols.get("alleles");
    if (allelesColIndex === undefined) {
      throw new Error("Missing 'alleles' column in data");
    }

    // Map callSetIds index to TSV column index using the individual name (last part after §)
    const columnToSampleIndex = new Map<number, number>();
    dataHeader.callSetIds.forEach((callsetId, sampleIndex) => {
      const individualId = callsetId.split("§").pop()!;
      const colIndex = cols.get(individualId);
      if (colIndex !== undefined) {
        columnToSampleIndex.set(colIndex, sampleIndex);
      }
    });

    const sampleCount = dataHeader.callSetIds.length;
    console.log(`Parsing features for ${sampleCount} samples`);

    rows.forEach((row, rowIndex) => {
      // Get the alleles string (e.g., "A/G" means ref=A, alt=G)
      const allelesStr = row[allelesColIndex];
      const alleleTokens = allelesStr.split("/");
      const refAllele = alleleTokens[0];
      const altAlleles = alleleTokens.slice(1).join(",");
      
      // Initialize calls array with nulls
      const calls: any[] = new Array(sampleCount).fill(null);
      
      // Fill in the calls based on column data
      for (let colIdx = 0; colIdx < row.length; colIdx++) {
        const sampleIdx = columnToSampleIndex.get(colIdx);
        if (sampleIdx !== undefined) {
          const genotypeStr = row[colIdx];
          if (genotypeStr && genotypeStr.length > 0 && genotypeStr !== './.' && genotypeStr !== '.|.') {
            // Parse genotype string like "0/1" or "1|1"
            const separator = genotypeStr.includes('|') ? '|' : '/';
            const alleleIndices = genotypeStr.split(separator).map(val => {
              const num = parseInt(val, 10);
              return isNaN(num) ? -1 : num;
            });
            
            // IGV expects call objects with a genotype property (array of allele indices)
            // 0 = reference, 1 = first alt, 2 = second alt, etc.
            calls[sampleIdx] = { genotype: alleleIndices };
          }
        }
      }

      // Log first variant's data for debugging
      if (rowIndex === 0) {
        console.log("First variant data:", {
          chr: igvChromosome || row[cols.get("chrom")!],
          pos: parseInt(row[cols.get("pos")!], 10),
          ref: refAllele,
          alt: altAlleles,
          alleles: allelesStr,
          calls: calls,
          sampleNames: dataHeader.callSetIds
        });
      }

      const variant = new GigwaVariant(
        `${database}${row[cols.get("variant")!]}`,
        igvChromosome ? igvChromosome : row[cols.get("chrom")!],
        parseInt(row[cols.get("pos")!], 10),
        refAllele,
        altAlleles,
        calls,
      );

      // Add the alleles array to the variant's info for proper allele display
      variant.info = {
        ...variant.info,
        ALLELES: [refAllele, ...altAlleles.split(',').filter(a => a.length > 0)]
      };

      if (!variant.isRefBlock()) {
        variants.push(variant);
      }
    });

    console.log(`Parsed ${variants.length} variants`);
    return variants;
  }
}
