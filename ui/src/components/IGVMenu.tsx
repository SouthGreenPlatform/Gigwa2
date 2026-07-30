import { Fragment, useEffect, useState } from "react";
//import { useFullModal } from "../hooks/useFullModal";
import LoadGenomeDialog from "./LoadGenomeDialog";
import AddTrackDialog from "./AddTrackDialog";
import "../styles/igv-menu.scss";
import axios from "axios";
import config from "../config/config";
import endpoints from "../endpoints";
import { proxyConfig } from "../tools/igvProxy";

// --- Module-level cache ---
let genomeListsLoaded = false;
let genomeProvidersCache: any[] = [];

type GenomeProviderConfig = {
  name: string;
  url: string;
};

type GenomeProvider = {
  sourceId: string;
  name: string;
  list: Array<{ id: string; name: string }>;
  fullData: any[];
};

function toAbsoluteGenomeUrl(url: string): string {
  if (/^https?:\/\//i.test(url)) return url;
  const trimmedBase = config.INSTANCE_URL.endsWith("/")
    ? config.INSTANCE_URL.slice(0, -1)
    : config.INSTANCE_URL;
  const trimmedPath = url.startsWith("/") ? url.slice(1) : url;
  return `${trimmedBase}/${trimmedPath}`;
}

async function fetchAndCacheGenomes() {
  if (genomeListsLoaded) return;
  try {
    const providerResp = await axios.get(endpoints.IGV_GENOME_CONFIG_PATH);
    const providerConfigs: GenomeProviderConfig[] = Array.isArray(providerResp.data) ? providerResp.data : [];

    const providerData = await Promise.all(
      providerConfigs.map(async (provider, index) => {
        let fullData: any[] = [];
        try {
          const genomesResp = await axios.get(toAbsoluteGenomeUrl(provider.url));
          fullData = Array.isArray(genomesResp.data) ? genomesResp.data : [];
        } catch (providerError) {
          console.error(`Failed to fetch genomes for provider ${provider.name}:`, providerError);
        }
        return {
          sourceId: `${index}`,
          name: provider.name,
          list: fullData.map((genome: any) => ({
            id: genome.id,
            name: genome.name,
          })),
          fullData,
        } as GenomeProvider;
      })
    );

    genomeProvidersCache = providerData;
    genomeListsLoaded = true;
  } catch (error) {
    console.error("Failed to fetch genome lists:", error);
  }
}

type MenuProps = {
  database: string;
  onLoadReferenceGenome: (genomeConfig: any) => void;
  onLoadTrack: (trackConfig: any) => void;
  onDisplayedGenotypes: (selection: string) => void;
  onGenomeChange: (genomeConfig: any) => void;
  groupNames: string[];
  displayedGenotypesValue?: string;
  selectedGenomeName?: string;
  selectedGenomeId?: string;
  onClose?: () => void;
};


function IGVMenu({ database, onLoadReferenceGenome, onLoadTrack, onDisplayedGenotypes, onGenomeChange, groupNames, displayedGenotypesValue = "none", selectedGenomeName, selectedGenomeId, onClose }: MenuProps) {
  // const { showFullModal, fullModalContent, handleOpenFullModal, handleCloseFullModal } = useFullModal();
  const [showLoadGenomeDialog, setShowLoadGenomeDialog] = useState(false);
  const [showAddTrackDialog, setShowAddTrackDialog] = useState(false);

  // Local state mirrors the global cache
  const [genomeProviders, setGenomeProviders] = useState<GenomeProvider[]>(genomeProvidersCache);

  useEffect(() => {
    if (!genomeListsLoaded) {
      fetchAndCacheGenomes().then(() => {
        setGenomeProviders(genomeProvidersCache);
      });
    }
  }, []);

  const handleGenomeSelection = (genomeId: string, sourceId: string) => {
    const source = genomeProviders.find((provider) => provider.sourceId === sourceId);
    const data = source?.fullData || [];
    const selectedGenome = data.find((genome: any) => genome.id === genomeId);
    if (selectedGenome) {
      const proxied = proxyConfig(selectedGenome);
      localStorage.setItem("selectedGenome::" + database, JSON.stringify(proxied));
      onGenomeChange(proxied);
    } else {
      console.error(`Genome with ID ${genomeId} not found in the source ${sourceId} genome data`);
      onGenomeChange(genomeId);
    }
  };

  return (
    <div className="mb-3">
      <div className="btn-toolbar align-items-center" role="toolbar" aria-label="IGV Browser Toolbar">
        <div className="btn-group me-2" role="group" aria-label="IGV Actions">
          <div className="dropdown">
            <button
              className="btn btn-outline-primary dropdown-toggle"
              type="button"
              id="referenceGenomeDropdown"
              data-bs-toggle="dropdown"
              aria-expanded="false"
            >
              Reference Genome
            </button>
            <ul className="dropdown-menu" aria-labelledby="referenceGenomeDropdown">
              <li>
                <button
                  className="dropdown-item btn btn-primary"
                  onClick={() => setShowLoadGenomeDialog(true)}
                  // onClick={() =>
                  //   handleOpenModal({
                  //     component: (
                  //       <LoadGenome
                  //         show={true}
                  //         onClose={handleCloseFullModal}
                  //         onLoadReferenceGenome={onLoadReferenceGenome}
                  //       />
                  //     ),
                  //   })
                  // }
                >
                  Load your own genome
                </button>
              </li>
              <li>
                <hr className="dropdown-divider" />
              </li>
              {genomeProviders.map((provider) => (
                <Fragment key={`provider-${provider.sourceId}`}>
                  <li className="dropdown-item fst-italic fw-bold">{provider.name}</li>
                  {provider.list.map((genome) => (
                    <li key={`${provider.sourceId}-${genome.id}`}>
                      <button
                        className={"dropdown-item btn btn-primary" + (genome.id === selectedGenomeId ? " active" : "")}
                        onClick={() => handleGenomeSelection(genome.id, provider.sourceId)}
                      >
                        {genome.id === selectedGenomeId && <span className="me-2">✓</span>}{genome.name}
                      </button>
                    </li>
                  ))}
                </Fragment>
              ))}
            </ul>
          </div>
          <div className="dropdown">
            <button
              className="btn btn-outline-primary"
              type="button"
              onClick={() => setShowAddTrackDialog(true)}
            >
              Add track to current view
            </button>
          </div>
          <div className="dropdown">
            <button
              className="btn btn-outline-primary dropdown-toggle"
              type="button"
              id="referenceGenomeDropdown"
              data-bs-toggle="dropdown"
              aria-expanded="false"
            >
              Displayed genotypes
            </button>
            <ul className="dropdown-menu" aria-labelledby="referenceGenomeDropdown">
              <li>
                <div className="igv-menu-dropdown-item">
                    <input type="radio" name="displayedGenotypes" value="none" data-label="None" checked={displayedGenotypesValue === "none"} onChange={() => onDisplayedGenotypes("none")} />&nbsp;None
                    <div className="igv-menu-option-gap">
                      <input type="radio" name="displayedGenotypes" value="all" data-label="All individuals" checked={displayedGenotypesValue === "all"} onChange={() => onDisplayedGenotypes("all")} />&nbsp;All individuals
                    </div>
                    { groupNames.length > 1 && (
                      <>
                          <div className="igv-menu-option-gap">
                            <input type="radio" name="displayedGenotypes" value="selected" data-label="All selected bio-entities" checked={displayedGenotypesValue === "selected"} onChange={() => onDisplayedGenotypes("selected")} />&nbsp;All selected bio-entities
                          </div>
                          <div className="igv-menu-option-gap">
                            <input type="radio" name="displayedGenotypes" value="separate" data-label={`All ${groupNames.length} groups`} checked={displayedGenotypesValue === "separate"} onChange={() => onDisplayedGenotypes("separate")} />&nbsp;All {groupNames.length} groups
                          </div>
                      </>
                    )}
                    { groupNames.map((name, idx) => {
                      const i = idx + 1;
                      return (
                        <div key={i} className="igv-menu-option-gap">
                          <input type="radio" name="displayedGenotypes" value={String(i)} data-label={name} checked={displayedGenotypesValue === String(i)} onChange={() => onDisplayedGenotypes(String(i))} />&nbsp;{name}
                        </div>
                      );
                    })}
                </div>
              </li>
            </ul>
          </div>
        </div>
        {selectedGenomeName && (
          <span className="ms-3 text-muted small align-self-center">{selectedGenomeName}</span>
        )}
      </div>
      {onClose && (
        <button type="button" className="btn-close igv-menu-close-btn" aria-label="Close" onClick={onClose} />
      )}

      {/* Add Track Dialog */}
      <AddTrackDialog
        show={showAddTrackDialog}
        onClose={() => setShowAddTrackDialog(false)}
        onAddTrack={(trackConfig) => onLoadTrack(trackConfig)}
      />

      <LoadGenomeDialog
        show={showLoadGenomeDialog}
        onClose={() => setShowLoadGenomeDialog(false)}
        onLoadGenome={(genomeConfig) => onLoadReferenceGenome(genomeConfig)}
      />
    </div>
  );
}

export default IGVMenu;

function useModal(): { showModal: any; modalContent: any; handleOpenModal: any; handleCloseModal: any; } {
  throw new Error("Function not implemented.");
}
