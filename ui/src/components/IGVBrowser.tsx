import { useApi } from "../contexts/Authentication.tsx";
import { useEffect, useState, useRef } from "react";
import IGVMenu from "./IGVMenu";
import { GigwaSearchReader } from "../tools/GigwaSearchReader";
import endpoints from "../endpoints";
import { useParams } from 'react-router-dom';
import { getSuffix, getPrefix, getContigPrefixes, isNumeric } from "../tools/commons";
import "../styles/igv-browser.scss";
import { GroupFilter, VariantFilter } from "../contexts/Filters.tsx";
//import { tr } from "zod/v4/locales";


type Genome = {
  fastaURL?: string;
  id?: string;
  chromAlias?: any;
  chromosomeNames?: string[];
  [key: string]: any;
};

type IGVBrowser = {
  genome: Genome;
};

function addChromAlias(browser: IGVBrowser, alias: string, canonical: string): void {
  const genome = browser.genome;
  const chromAlias = genome.chromAlias;

  // Update flat alias map
  chromAlias[alias] = canonical;

  // Initialize alias record cache if missing
  if (!chromAlias.aliasRecordCache[canonical]) {
    chromAlias.aliasRecordCache[canonical] = {
      aliases: [canonical],
      name: canonical
    };
  }

  // Add alias if not already present
  const record = chromAlias.aliasRecordCache[canonical];
  if (!record.aliases.includes(alias)) {
    record.aliases.push(alias);
  }
}
function IGVBrowser({
  database,
  chromosomes,
  buildSearchQuery,
  groupFilters,
  variantFilters,
  initialLocus = "",
  variantSearchApiUrl = endpoints.IGV_DATA,
  selectedIndividuals = [],
  igvGenomeRefTable = {},
  individualsOptionsNames = [],
  onClose
}: {
  database: string;
  chromosomes: string[];
  buildSearchQuery: (variantFilters:VariantFilter,groupFilters:Record<string, GroupFilter>, usedPagination:boolean) => Record<string, any>;
  groupFilters: any;
  variantFilters: any;
  initialLocus?: string;
  variantSearchApiUrl?: string;
  selectedIndividuals?: string[];
  igvGenomeRefTable?: { [key: string]: string };
  individualsOptionsNames?: string[];
  onClose?: () => void;
}) {

  const { assembly: assemblyParam } = useParams();
  const assembly = assemblyParam ?? "";
  const api = useApi();

  // Load genome from localStorage or fallback to undefined
  const getInitialGenome = () => {
    const stored = localStorage.getItem("selectedGenome::" + database);
    if (stored) {
      try {
        const genome = JSON.parse(stored);
        return genome;
      } catch {
        return undefined;
      }
    }
    return undefined;
  };

  const [genome, setGenome] = useState<Genome | undefined>(getInitialGenome());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const igvContainerRef = useRef<HTMLDivElement | null>(null);
  const igvRef = useRef<any | null>(null);
  const igvGenomeRefTableRef = useRef<{ [key: string]: string }>(igvGenomeRefTable);
  const [igvLoaded, setIgvLoaded] = useState(false);
  const [variantTracks, setVariantTracks] = useState<any[]>([]);
  const variantTracksRef = useRef<any[]>([]);
  const [displayedGenotypes, setDisplayedGenotypes] = useState<string>("none");

  // Dynamically import IGV.js
  useEffect(() => {
    const loadIGV = async () => {
      try {
        const igvModule = await import("igv");
        window.igv = igvModule.default || igvModule;
        setIgvLoaded(true);
      } catch (error) {
        console.error("Failed to load IGV:", error);
        setError("Failed to load IGV library");
      }
    };

    loadIGV();
  }, []);

  // Function to safely destroy the current browser instance
  const destroyBrowser = async () => {
    if (window.igv) await window.igv.removeAllBrowsers();
  };

  // Handle genome changes and variant tracks
  useEffect(() => {
    const handleGenomeUpdate = async () => {
      try {
        await destroyBrowser();
        await createBrowser();
      } catch (error) {
        console.error("Error in genome update:", error);
        setError("Failed to update genome view. Please try again.");
      } finally {
        setLoading(false);
      }
    };

    // Only load if genome is defined
    if (igvLoaded && genome) {
      handleGenomeUpdate();
    }

    return () => {
      destroyBrowser();
    };
  }, [genome, igvLoaded, initialLocus, JSON.stringify(selectedIndividuals)]);

  // Builds the track labels/individuals for the current displayedGenotypes selection.
  // Shared by createBrowser() (so a browser created fresh reflects whatever was already
  // selected, e.g. "All individuals" picked before a genome was even loaded) and the
  // effect below (so changing the selection afterwards updates the existing browser).
  const buildDisplayedGenotypeTracks = (): { labels: string[]; individuals: string[][] } => {
    let trackIndividuals: string[][];
    switch (displayedGenotypes) {
      case "none":
        trackIndividuals = [[]];
        break;
      case "all":
        trackIndividuals = [individualsOptionsNames.map((i: string) => database + '§' + i)];
        break;
      default: {
        let entries = Object.entries(groupFilters);
        if (!isNaN(displayedGenotypes as any))
          entries = entries.filter(([key]) => key == displayedGenotypes); // either all selected together, all each group separate
        trackIndividuals = entries.map(([, group]) => {
          return ((group as Record<string, any>)["selectedIndividuals"].length === 0 ? individualsOptionsNames : (group as Record<string, any>)["selectedIndividuals"]).map((i: string) => database + '§' + i);
        });
        if ("selected" == displayedGenotypes)
          trackIndividuals = [[...new Set(trackIndividuals.flat())]];
        break;
      }
    }
    const radioLabelMap: Record<string, string> = Object.fromEntries(
      Array.from(document.querySelectorAll<HTMLInputElement>('input[name="displayedGenotypes"]'))
        .map(r => [r.value, r.value == 'none' ? 'Variants' : (r.dataset.label ?? r.value)])
    );
    const trackLabels: string[] = trackIndividuals.map((_, idx) =>
      trackIndividuals.length === 1 ? (radioLabelMap[displayedGenotypes] ?? 'Query') : (radioLabelMap[String(idx + 1)] ?? String(idx + 1))
    );
    return { labels: trackLabels, individuals: trackIndividuals };
  };

  // Update variant tracks when displayedGenotypes changes
  useEffect(() => {
    if (igvLoaded && igvRef.current) {
      const { labels, individuals } = buildDisplayedGenotypeTracks();
      updateVariantTracks(labels, individuals);
    }
  }, [displayedGenotypes]);

  // Function to create a new browser instance
  const createBrowser = async () => {
    if (!igvLoaded || !window.igv || !genome) return;

    setLoading(true);
    setError(null);

    if (igvContainerRef.current)
      igvContainerRef.current.innerHTML = "";

    const igvOptions: any = {
      locus: initialLocus,
      tracks: [],
      showSampleNames: true,
    };

    if (typeof genome === "string")
      igvOptions.genome = genome;
    else if (genome && genome.fastaURL)
      igvOptions.reference = genome;

    try {
      console.log(`Creating new browser with options:`, igvOptions);
      const browser = await window.igv.createBrowser(igvContainerRef.current, igvOptions);
      igvRef.current = browser;

      if (igvRef.current.genome) {
        // Build the alias table
        let targetNames = igvRef.current.genome.chromosomeNames;
        let variantPrefix = getPrefix(chromosomes);
        let refNamesForNumberedContigsCount = chromosomes.filter(nm => !isNaN(nm.substring(nm.length - 1))).length;
        let targetPrefixCounts = getContigPrefixes(targetNames);
        let targetPrefix = "";
        for (var pfx in targetPrefixCounts)
          if (pfx.toLowerCase() == "chr" || targetPrefixCounts[pfx] == refNamesForNumberedContigsCount) {
            targetPrefix = pfx;
  // 					console.log("Using " + pfx + " as contig name prefix");
            break;
          }

        let variantSuffix = getSuffix(chromosomes);
        igvGenomeRefTableRef.current = {};
        let variantSuffixRegex = new RegExp(variantSuffix + "$");
        let targetSuffix = getSuffix(targetNames);
        let targetSuffixRegex = new RegExp(targetSuffix + "$");
        let aliasLessContigs = new Set();
        for (let target of targetNames){  // target = chromosome name in the genome file, as used by IGV
          let zeroname = target.replace(targetPrefix, "").replace(targetSuffixRegex, "");
          let basename = zeroname.replace(/^0+/, "");  // Base chromosome name
          zeroname = isNumeric(basename) ? basename.padStart(2, "0") : zeroname  // Zero-padded 2-digits chromosome number
          addChromAlias(igvRef.current, target, zeroname.toLowerCase());
          addChromAlias(igvRef.current, target, basename.toLowerCase());
          if (zeroname.toLowerCase().startsWith("chr"))
            addChromAlias(igvRef.current, target, "chr" + zeroname.toLowerCase());
          if (basename.toLowerCase().startsWith("chr"))
            addChromAlias(igvRef.current, target, "chr" + basename.toLowerCase());
          addChromAlias(igvRef.current, target, (variantPrefix + zeroname).toLowerCase());
          addChromAlias(igvRef.current, target, (variantPrefix + basename).toLowerCase());
          addChromAlias(igvRef.current, target, (variantPrefix + zeroname + variantSuffix).toLowerCase());
          addChromAlias(igvRef.current, target, (variantPrefix + basename + variantSuffix).toLowerCase());

          // Associate the target name to the variants reference name
          let gigwaContigName = chromosomes.find(ref => ref.replace(variantPrefix, "").replace(variantSuffixRegex, "").replace(/^0+/, "") == basename);
          if (gigwaContigName != null)
            igvGenomeRefTableRef.current[target] = gigwaContigName;
          else {
            aliasLessContigs.add(target);
            igvGenomeRefTableRef.current[target] = target;	// couldn't find it, use the provided name (better than nothing)
          }
        }
        if (aliasLessContigs.size > 0)
          console.warn("Unable to find an alias for the following contigs in Gigwa sequences: " + Array.from(aliasLessContigs).join(", "));
      }

      const { labels, individuals } = buildDisplayedGenotypeTracks();
      updateVariantTracks(labels, individuals);
      // console.log(`Browser created successfully:`, browser.genome);
    } catch (error: any) {
      console.error("Error creating IGV browser:", error);
      setError(`Error creating IGV browser: ${error.message || "Unknown error"}`);
    } finally {
      setLoading(false);
    }
  };

const handleAddTrack = async (trackConfig: { url: string; name: string; type: string; format?: string }) => {
  if (!igvRef.current) return;

  try {
    const track = await igvRef.current.loadTrack({
      url: trackConfig.url,
      name: trackConfig.name,
      type: trackConfig.type,
      format: trackConfig.format,
    });
    setVariantTracks((prevTracks) => [...prevTracks, track]);
    // console.log("Track added successfully:", trackConfig);
  } catch (error) {
    console.error("Error adding track:", error);
    setError("Failed to add track. Please try again.");
  }
};

  // Keep ref in sync with variantTracks state for use in callbacks with stale closures
  useEffect(() => { variantTracksRef.current = variantTracks; }, [variantTracks]);

  // Resize existing variant tracks to fill available space (called on container resize)
  const resizeVariantTracks = () => {
    if (!igvRef.current || variantTracksRef.current.length === 0) return;
    const { available: availableHeight, perTrackOverhead } = igvAvailableHeight();
    const n = variantTracksRef.current.length;
    const newHeight = Math.max(50, availableHeight / n - perTrackOverhead);
    const variantTrackSet = new Set(variantTracksRef.current);
    for (const tv of igvRef.current.trackViews as any[]) {
      if (variantTrackSet.has(tv.track)) {
        tv.track.height = newHeight;
      }
    }
    igvRef.current.resize?.();
  };

  // Observe container size changes and resize variant tracks accordingly
  useEffect(() => {
    const el = igvContainerRef.current;
    if (!el) return;
    let timer: ReturnType<typeof setTimeout>;
    const observer = new ResizeObserver(() => {
      clearTimeout(timer);
      timer = setTimeout(resizeVariantTracks, 300);
    });
    observer.observe(el);
    return () => { clearTimeout(timer); observer.disconnect(); };
  }, []);

  // Calculate height available below the existing tracks in the IGV container,
  // and the per-track overhead (header + borders) derived from existing tracks.
  const igvAvailableHeight = (): { available: number; perTrackOverhead: number } => {
    if (!igvContainerRef.current || !igvRef.current) return { available: 600, perTrackOverhead: 0 };
    const containerHeight = igvContainerRef.current.clientHeight;
    if (containerHeight === 0) return { available: 600, perTrackOverhead: 0 };

    const navbar = igvRef.current.navbar.navigation as HTMLElement | null;
    const navbarHeight = navbar ? navbar.offsetHeight : 0;
    const columnContainer = (igvRef.current as any).columnContainer as HTMLElement | null;
    const columnContainerHeight = columnContainer ? columnContainer.offsetHeight : 0;

    const trackViews = igvRef.current.trackViews as any[];
    const logicalTracksHeight = trackViews.reduce((sum, tv) => sum + (tv.track?.height ?? 0), 0);
    const perTrackOverhead = trackViews.length > 0
      ? Math.max(0, (columnContainerHeight - logicalTracksHeight) / trackViews.length)
      : 0;

    return {
      available: Math.max(50, containerHeight - navbarHeight - columnContainerHeight),
      perTrackOverhead,
    };
  };

  // Function to update variant tracks
  const updateVariantTracks = async (trackLabels : string[], trackIndividuals : string[][]) => {
    if (!igvRef.current) return;

    try {
      // Remove existing variant tracks
      for (const track of variantTracks)
        await igvRef.current.removeTrack(track);

      // Make sure sample names remain visible because IGV 3.7.3 disables them when removing the last variant-track
      // igvRef.current.sampleNameControl.setState(true);
      // igvRef.current.showSampleNames = true;

      // Wait for the DOM to settle after track removal before measuring available height
      await new Promise<void>(resolve => requestAnimationFrame(() => resolve()));

      // Add new variant tracks
      if (trackIndividuals) {
        const { available: availableHeight, perTrackOverhead } = igvAvailableHeight();
        const trackHeight = Math.max(50, availableHeight / trackIndividuals.length - perTrackOverhead);
        const newTracks = [];
        let i = 0;
        for (const ti of trackIndividuals) {
          // Create sample names array for this track
          const sampleNames = ti.map((ind: string) => ind.includes('§') ? ind.split('§').pop()! : ind);
          
          const track = await igvRef.current.loadTrack({
            name: trackLabels[i++],
            type: "variant",
            format: "custom",
            sourceType: "file",
            order: Number.MAX_SAFE_INTEGER,
            visibilityWindow: 100000,
            height: trackHeight,
            // Add display options for sample names
            displayMode: "EXPANDED",  // Ensure samples are shown
            showSampleNames: true,     // Explicitly enable sample names for this track
            sampleNames: sampleNames,  // Provide sample names directly
            reader: new GigwaSearchReader(
              buildSearchQuery, 
              groupFilters, 
              variantFilters, 
              assembly, 
              ti, 
              variantSearchApiUrl, 
              igvGenomeRefTableRef.current, 
              api
            ),
          });
          newTracks.push(track);
        }
        setVariantTracks(newTracks);
      }
    } catch (error) {
      console.error("Error updating variant tracks:", error);
      setError("Failed to update variant tracks. Please try again.");
    }
  };

  return (
    <div className="card d-flex flex-column h-100 mb-0 igv-browser-shell">
      <div className="card-header igv-browser-header">
        <h5 className="card-title">Genomic Data Viewer</h5>
        <IGVMenu
          database={database}
          onLoadReferenceGenome={(genomeConfig) => setGenome(genomeConfig)}
          onLoadTrack={handleAddTrack}
          onDisplayedGenotypes={(val) => setDisplayedGenotypes(val)}
          onGenomeChange={(genomeConfig) => setGenome(genomeConfig)}
          groupNames={Object.values(groupFilters).map(group => (group as Record<string, string>).name)}
          displayedGenotypesValue={displayedGenotypes}
          selectedGenomeName={genome ? (typeof genome === "string" ? genome : (genome.name ?? genome.id)) : undefined}
          selectedGenomeId={genome ? (typeof genome === "string" ? genome : genome.id) : undefined}
          onClose={onClose}
        />
      </div>
      <div className="card-body flex-grow-1 overflow-hidden igv-browser-body">
        <div className="position-relative igv-browser-canvas">
          {loading && genome && (
            <div
              className="position-absolute top-0 start-0 w-100 h-100 d-flex align-items-center justify-content-center bg-white bg-opacity-75 igv-browser-loading-overlay"
            >
              <div className="spinner-border text-primary me-2" role="status"/>
              <span>Loading browser for genome {genome.id}...</span>
            </div>
          )}
          {error && (
            <div className="alert alert-danger d-flex align-items-center" role="alert">
              <span className="me-2">⚠️</span>
              <div>
                <strong>Error:</strong> {error}
              </div>
            </div>
          )}
          <div id="igv-container" ref={igvContainerRef} className="w-100 h-100" />
        </div>
      </div>
    </div>
  );
}

export default IGVBrowser;