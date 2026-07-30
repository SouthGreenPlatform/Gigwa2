import React, { useEffect, useRef, useState } from 'react';
import Plot from 'react-plotly.js';
import endpoints from '../endpoints';
import { Alert, Dropdown, OverlayTrigger, Tooltip } from 'react-bootstrap';
import { useApi, useAuth } from '../contexts/Authentication';
import ProgressDialog from './ProgressDialog';
import '../styles/chart-modal.scss';

import SmartColorMultiSelect from './SmartColorMultiSelect';
import MultiSelectDropdown from './MultiSelect';

interface ChartModalProps {
  show: boolean;
  onClose: () => void;
  sequences: any[];       // [{referenceName: string, ...}]
  variantTypes: string[];
  allIndividualNames?: string[];
  project?: string;       // full variantSetId e.g. "DB§1"
  assembly?: string;      // e.g. "something§something§assemblyName"
  database?: string;      // just the DB name
  groupFilters: any;      // from Investigate context
  variantFilters: any;    // from Investigate context
  distinctMetadata?: Record<string, string[]>; // metadata field → distinct values (for grouping selector)
}

type ChartType = 'density' | 'maf' | 'fst' | 'tajimad' | 'missingdata' | 'heterozygosity';

const CHART_TYPE_LABELS: Record<ChartType, string> = {
  density: 'Density',
  maf: 'MAF distribution',
  fst: 'Fst',
  tajimad: "Tajima's D",
  missingdata: 'Missing data',
  heterozygosity: 'Heterozygosity rate',
};

const COLORS = ['#396AB1', '#DA7C30', '#3E9651', '#CC2529', '#535154', '#6B4C9A'];
const BASE_CHART_WIDTH_PX = 1000;
const Y_AXIS_GRID_COLOR = '#d9d9d9';

function chartEndpointUrl(type: ChartType): string {
  switch (type) {
    case 'density':        return endpoints.DENSITY_DATA_URL;
    case 'fst':            return endpoints.FST_DATA_URL;
    case 'maf':            return endpoints.MAF_DATA_URL;
    case 'tajimad':        return endpoints.TAJIMA_D_DATA_URL;
    case 'missingdata':    return endpoints.MISSING_DATA_PATH;
    case 'heterozygosity': return endpoints.HETZ_DATA_PATH;
  }
}

async function computeHash(obj: any): Promise<string> {
  const str = JSON.stringify(obj);
  if (crypto?.subtle) {
    const data = new TextEncoder().encode(str);
    const buf = await crypto.subtle.digest('SHA-256', data);
    return Array.from(new Uint8Array(buf)).map(b => b.toString(16).padStart(2, '0')).join('');
  }
  // Fallback: adler32
  const MOD = 65521;
  let a = 1, b = 0;
  for (let i = 0; i < str.length; i++) {
    a = (a + str.charCodeAt(i)) % MOD;
    b = (b + a) % MOD;
  }
  return String((b << 16) | a);
}

function toFiniteNumber(value: unknown): number | null {
  if (value === null || value === undefined) return null;

  if (typeof value === 'number') {
    return Number.isFinite(value) ? value : null;
  }

  if (typeof value === 'string') {
    const trimmed = value.trim();
    if (!trimmed || trimmed.toLowerCase() === 'nan') return null;
    const normalized = trimmed.replace(',', '.');
    const parsed = Number.parseFloat(normalized);
    return Number.isFinite(parsed) ? parsed : null;
  }

  return null;
}

function computeAxisRange(
  values: number[],
  options?: { includeZero?: boolean; fallback?: [number, number] }
): [number, number] {
  const includeZero = options?.includeZero ?? false;
  const fallback = options?.fallback ?? [0, 1];

  if (values.length === 0) return fallback;

  let min = Math.min(...values);
  let max = Math.max(...values);

  if (!Number.isFinite(min) || !Number.isFinite(max)) return fallback;

  if (includeZero) {
    min = Math.min(0, min);
  }

  if (min === max) {
    const delta = min === 0 ? 1 : Math.max(Math.abs(min) * 0.1, 0.01);
    min -= delta;
    max += delta;
    if (includeZero) {
      min = Math.min(0, min);
    }
  }

  const padding = (max - min) * 0.08;
  return [min - padding, max + padding];
}

function normalizeRange(range: [number, number], fallback: [number, number] = [0, 1]): [number, number] {
  let [min, max] = range;

  if (!Number.isFinite(min) || !Number.isFinite(max)) {
    return fallback;
  }

  if (min > max) {
    [min, max] = [max, min];
  }

  if (min === max) {
    const delta = min === 0 ? 1 : Math.max(Math.abs(min) * 0.1, 0.01);
    min -= delta;
    max += delta;
  }

  return [min, max];
}

function ensureZeroInRange(range: [number, number]): [number, number] {
  const [baseMin, baseMax] = normalizeRange(range, [-1, 1]);
  const min = Math.min(baseMin, 0);
  const max = Math.max(baseMax, 0);

  if (min === max) return [-1, 1];
  return [min, max];
}

function clampZeroRatio(value: number): number {
  return Math.min(0.95, Math.max(0.05, value));
}

function computeZeroRatio(range: [number, number]): number | null {
  const [min, max] = normalizeRange(range, [-1, 1]);
  const span = max - min;
  if (!Number.isFinite(span) || span <= 0) return null;

  const ratio = -min / span;
  if (!Number.isFinite(ratio)) return null;
  return clampZeroRatio(ratio);
}

function alignRangesOnSharedZero(
  ranges: Array<[number, number]>,
  preferredZeroRatio?: number
): Array<[number, number]> {
  if (ranges.length <= 1) {
    return ranges.map((range) => normalizeRange(range));
  }

  const normalized = ranges.map((range) => ensureZeroInRange(range));

  let zeroRatio = preferredZeroRatio;
  if (!(typeof zeroRatio === 'number' && Number.isFinite(zeroRatio) && zeroRatio > 0 && zeroRatio < 1)) {
    const globalMin = Math.min(...normalized.map((range) => range[0]));
    const globalMax = Math.max(...normalized.map((range) => range[1]));
    const globalSpan = globalMax - globalMin;
    zeroRatio = globalSpan > 0 ? -globalMin / globalSpan : 0.5;
  }

  const ratio = clampZeroRatio(zeroRatio);

  return normalized.map(([min, max]) => {
    const spanForMin = -min / ratio;
    const spanForMax = max / (1 - ratio);
    const span = Math.max(spanForMin, spanForMax, 1e-6);
    return [-ratio * span, (1 - ratio) * span];
  });
}

function buildXAxisTicks(values: number[], effectiveWidthPx: number): { tickvals: number[]; ticktext: string[] } {
  if (values.length === 0) {
    return { tickvals: [], ticktext: [] };
  }

  // Labels are rotated −55°: horizontal footprint = charCount×charWidthPx×cos(55°) + lineHeightPx×sin(55°)
  // charWidthPx ≈ 7, lineHeightPx ≈ 14, cos(55°) ≈ 0.574, sin(55°) ≈ 0.819 → footprint ≈ chars×4 + 12
  const longestLabelChars = values.reduce(
    (max, value) => Math.max(max, value.toLocaleString().length),
    1,
  );
  const baseMinLabelSpacingPx = Math.max(30, Math.round(longestLabelChars * 4 + 20));
  const minLabelSpacingPx = Math.max(10, Math.round(baseMinLabelSpacingPx / 3));
  const targetLabelCount = Math.max(2, Math.floor(effectiveWidthPx / minLabelSpacingPx));
  const tickStep = Math.max(1, Math.ceil(values.length / targetLabelCount));
  const tickvals = values.filter((_, index) => index % tickStep === 0);

  const lastValue = values[values.length - 1];
  if (tickvals[tickvals.length - 1] !== lastValue) {
    const prevValue = tickvals[tickvals.length - 1];
    const valueSpan = Math.max(1, lastValue - values[0]);
    const minValueGapForLabel = (valueSpan * minLabelSpacingPx) / Math.max(1, effectiveWidthPx);

    // Keep the final label visible without forcing two overlapping labels at the end.
    if (lastValue - prevValue < minValueGapForLabel && tickvals.length > 0) {
      tickvals[tickvals.length - 1] = lastValue;
    } else {
      tickvals.push(lastValue);
    }
  }

  return {
    tickvals,
    ticktext: tickvals.map(value => value.toLocaleString()),
  };
}

const ChartModal: React.FC<ChartModalProps> = ({
  show, onClose, variantTypes,
  allIndividualNames = [],
  project, assembly, database,
  groupFilters, variantFilters,
  distinctMetadata = {},
}) => {
  const api = useApi();
  const { token } = useAuth();
  const baseProgressToken = token ?? "";

  // ── All state/refs before any conditional return ──────────────────────────
  const [selectedSequence, setSelectedSequence]   = useState('');
  const [localSequences, setLocalSequences]       = useState<string[]>([]);
  const [chartTitle, setChartTitle]               = useState('');
  const [chartSubtitle, setChartSubtitle]         = useState('');
  const [selectedVariantType, setSelectedVariantType] = useState('');
  const [chartType, setChartType]                 = useState<ChartType>('density');
  const [intervalCount, setIntervalCount]         = useState<number>(() => {
    const stored = localStorage.getItem('intervalCount');
    if (stored) {
      const parsed = Number(stored);
      if (Number.isFinite(parsed) && parsed >= 50 && parsed <= 5000) return parsed;
    }
    return 1000;
  });
  const [widthMultiplier, setWidthMultiplier]     = useState(1);
  const [intervalError, setIntervalError]         = useState<string | null>(null);
  const [isLoading, setIsLoading]                 = useState(false);
  const [showChartProgress, setShowChartProgress] = useState(false);
  const [progressTokens, setProgressTokens]       = useState<string[]>([]);
  const [isFetching, setIsFetching]               = useState(false);
  const [plotData, setPlotData]                   = useState<any[]>([]);
  const [plotLayout, setPlotLayout]               = useState<any>({});
  const [prevRanges, setPrevRanges]               = useState<Array<[number | null, number | null]>>([]);
  const [localMin, setLocalMin]                   = useState<number | null>(null);
  const [localMax, setLocalMax]                   = useState<number | null>(null);
  const [openDropdown, setOpenDropdown]           = useState<string | null>(null);
  const [selectedChartGroupIds, setSelectedChartGroupIds] = useState<Set<string>>(new Set());
  const [showFstThreshold, setShowFstThreshold]   = useState(false);
  const [fstThreshold, setFstThreshold]           = useState(0.1);

  // ── Customisation panel state ─────────────────────────────────────────────
  const [vcfFields, setVcfFields]                 = useState<string[]>([]);
  const [activeVcfFields, setActiveVcfFields]     = useState<Set<string>>(new Set());
  const activeVcfFieldsRef                        = useRef<Set<string>>(new Set());
  const vcfFieldDataRef                           = useRef<Record<string, any>>({});
  // groupingMode: '__' = investigated groups, otherwise a metadata field name
  const [groupingMode, setGroupingMode]           = useState('__');
  const [metadataValues, setMetadataValues]       = useState<string[]>([]);
  const [metadataValueGroups, setMetadataValueGroups] = useState<string[][]>([]); // output of SmartColorMultiSelect
  const [metadataCallSets, setMetadataCallSets]   = useState<{ callSetIds: string[]; additionalCallSetIds: string[][] } | null>(null);

  const modalBodyRef       = useRef<HTMLDivElement>(null);
  const plotViewportRef    = useRef<HTMLDivElement>(null);
  const rebuildPlotRef     = useRef<(() => void) | null>(null);
  const isModalOpenRef     = useRef<boolean>(show);
  const cachedResults      = useRef<Record<string, any>>({});
  const vcfCachedResults   = useRef<Record<string, any>>({});
  const lastResult         = useRef<any>(null);
  const lastRMin           = useRef<number | null>(null);
  const lastRMax           = useRef<number | null>(null);
  const currentHashRef     = useRef<string | null>(null);
  const currentVcfHashesRef = useRef<string[]>([]);

  const purgeChartData = () => {
    cachedResults.current = {};
    vcfCachedResults.current = {};
    vcfFieldDataRef.current = {};
    currentHashRef.current = null;
    currentVcfHashesRef.current = [];
    lastResult.current = null;
    lastRMin.current = null;
    lastRMax.current = null;
    activeVcfFieldsRef.current = new Set();

    setActiveVcfFields(new Set());
    setPlotData([]);
    setPlotLayout({});
    setChartTitle('');
    setChartSubtitle('');
    setPrevRanges([]);
    setLocalMin(null);
    setLocalMax(null);
    setProgressTokens([]);
    setShowChartProgress(false);
    setIsLoading(false);
    setIsFetching(false);
  };

  // Fetch sequences for this project from the API
  useEffect(() => {
    if (!show || !project) return;
    api.get(endpoints.DISTINCT_SELECTED_SEQUENCES_URL + '/' + encodeURIComponent(project), {
      headers: { assembly: assembly?.split('§')[1] ?? '' },
    }).then(resp => {
      const list: string[] = Array.isArray(resp.data) ? resp.data : [];
      setLocalSequences(list);
    }).catch(() => {});
  }, [show, project]);

  // Keep selectedSequence in sync with the filtered list
  useEffect(() => {
    const filtered = (variantFilters?.selectedSequences?.length ?? 0) > 0
      ? localSequences.filter((s: string) => variantFilters.selectedSequences.includes(s))
      : localSequences;
    if (filtered.length > 0 && !filtered.includes(selectedSequence)) {
      setSelectedSequence(filtered[0]);
    } else if (filtered.length > 0 && !selectedSequence) {
      setSelectedSequence(filtered[0]);
    }
  }, [localSequences, variantFilters?.selectedSequences]);

  // Persist intervalCount to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem('intervalCount', String(intervalCount));
  }, [intervalCount]);

  // Purge cache whenever any query-shaping parameter changes
  useEffect(() => {
    cachedResults.current = {};
    vcfCachedResults.current = {};
    lastResult.current = null;
    currentHashRef.current = null;
    currentVcfHashesRef.current = [];
  }, [chartType, project, selectedSequence, selectedVariantType, intervalCount]);

  // Sync chart group selection with investigation groups; switch away from '__' if no groups left
  const groupFilterKeysStr = Object.keys(groupFilters).join(',');
  const metadataKeysStr = Object.keys(distinctMetadata ?? {}).sort().join(',');
  useEffect(() => {
    const keys = Object.keys(groupFilters);
    setSelectedChartGroupIds(new Set(keys));
    if (keys.length === 0) {
      setGroupingMode(prev => {
        if (prev !== '__') return prev; // already in metadata mode, keep it
        const firstMeta = Object.keys(distinctMetadata ?? {}).sort()[0];
        return firstMeta ?? '__';
      });
    }
  }, [groupFilterKeysStr, metadataKeysStr]);

  // Fetch available VCF annotation fields for this project
  useEffect(() => {
    if (!show || !project) return;
    api.get(`${endpoints.SEARCHABLE_ANNOTATION_FIELDS_URL}/${project}`, {
      headers: { accept: 'application/json' },
    }).then(resp => setVcfFields(Array.isArray(resp.data) ? resp.data : []))
      .catch(() => {});
  }, [show, project]);

  // Keep VCF field selection across chart type/sequence changes, but drop
  // field data so stale overlays are not reused for a different query context.
  useEffect(() => {
    vcfFieldDataRef.current = {};
  }, [chartType, project, selectedSequence]);

  // When groupingMode changes to a metadata field, load its distinct values
  useEffect(() => {
    if (!show || groupingMode === '__' || !database || !project) return;
    const projNum = project.split('§').pop()!;
    api.post(
      `${endpoints.DISTINCT_INDIVIDUAL_METADATA}/${database}?projIDs=${projNum}`,
      {},
      { headers: { 'Content-Type': 'application/json', accept: 'application/json' } },
    ).then(resp => {
      const vals: string[] = (resp.data?.[groupingMode] ?? []).slice().sort();
      setMetadataValues(vals);
      // metadataValueGroups will be reset by SmartColorMultiSelect when metadataValues changes
    }).catch(() => {});
  }, [groupingMode, show]);

  // When metadataValueGroups changes in metadata mode, resolve each group to callSets
  useEffect(() => {
    if (groupingMode === '__' || metadataValueGroups.length === 0 || !database || !project) {
      setMetadataCallSets(null);
      return;
    }
    const projNum = project.split('§').pop()!;
    Promise.all(
      metadataValueGroups.map(group =>
        api.post(
          `${endpoints.DATABASE_METADATA_URL}/${database}?projIDs=${projNum}`,
          { [groupingMode]: group },
          { headers: { 'Content-Type': 'application/json', accept: 'application/json' } },
        ).then(resp => (resp.data ?? []).map((cs: any) => `${database}§${cs.id ?? cs}`))
      )
    ).then(groups => {
      setMetadataCallSets({
        callSetIds: groups[0] ?? [],
        additionalCallSetIds: groups.slice(1),
      });
    }).catch(() => {});
  }, [JSON.stringify(metadataValueGroups)]);

  // Re-render plot when display-only settings change (without refetching)
  useEffect(() => {
    if (lastResult.current !== null) {
      buildPlotFromResult(lastResult.current, lastRMin.current, lastRMax.current);
    }
  }, [showFstThreshold, fstThreshold, widthMultiplier, activeVcfFields]);

  useEffect(() => {
    isModalOpenRef.current = show;
    if (!show) {
      purgeChartData();
    }
  }, [show]);

  // Keep a live callback for resize handling to avoid stale closures.
  useEffect(() => {
    rebuildPlotRef.current = () => {
      if (lastResult.current !== null) {
        buildPlotFromResult(lastResult.current, lastRMin.current, lastRMax.current);
      }
    };
  });

  // Re-render ticks on window resize so label density matches the new chart width.
  useEffect(() => {
    if (!show) return;

    let resizeFrame: number | null = null;
    const handleResize = () => {
      if (resizeFrame !== null) {
        window.cancelAnimationFrame(resizeFrame);
      }
      resizeFrame = window.requestAnimationFrame(() => {
        rebuildPlotRef.current?.();
        resizeFrame = null;
      });
    };

    window.addEventListener('resize', handleResize);
    return () => {
      if (resizeFrame !== null) {
        window.cancelAnimationFrame(resizeFrame);
      }
      window.removeEventListener('resize', handleResize);
    };
  }, [show]);

  // Keep ref in sync so async callbacks always see the latest activeVcfFields
  activeVcfFieldsRef.current = activeVcfFields;

  // ── Conditional return (after all hooks) ─────────────────────────────────
  if (!show) return null;

  // Sequences available in the dropdown: constrained to those selected in the main UI (mirrors charts.js getChartDistinctSequenceList)
  const displayedSequences = (variantFilters?.selectedSequences?.length ?? 0) > 0
    ? localSequences.filter((s: string) => variantFilters.selectedSequences.includes(s))
    : localSequences;

  // ── Helpers ───────────────────────────────────────────────────────────────

  const groupEntries = Object.entries(groupFilters);

  const getInvestigatedGroupDisplayName = (id: string, group: any): string => {
    const rawName = typeof group?.name === 'string'
      ? group.name
      : (typeof group?.names === 'string' ? group.names : '');
    const trimmedName = rawName.trim();
    // Mirror main UI default when no custom label has been entered.
    return trimmedName || `Group${id}`;
  };

  const investigatedGroupSelectorOptions = groupEntries.map(([id, group]: [string, any]) => ({
    id,
    label: getInvestigatedGroupDisplayName(id, group),
  }));
  const investigatedGroupValues = investigatedGroupSelectorOptions.map((option) => option.label);

  const getEffectiveIndividuals = (group: any): string[] => {
    const selectedIndividuals = group?.selectedIndividuals ?? [];
    return selectedIndividuals.length > 0 ? selectedIndividuals : allIndividualNames;
  };

  const handleBiologicalEntitySelectionChange = (groups: string[][]) => {
    if (groupingMode === '__') {
      const selectedLabels = new Set(groups.flat());
      const selectedIds = investigatedGroupSelectorOptions
        .filter((option) => selectedLabels.has(option.label))
        .map((option) => option.id);
      setSelectedChartGroupIds(new Set(selectedIds));
      return;
    }

    setMetadataValueGroups(groups);
  };

  const buildPayload = (displayedSequence: string, rMin: number | null, rMax: number | null) => {
    let callSetIds: string[] = [];
    let additionalCallSetIds: string[][] = [];
    const shouldApplyBiologicalEntitySelection = chartType !== 'density' || activeVcfFieldsRef.current.size > 0;

    if (!shouldApplyBiologicalEntitySelection) {
      if (database) {
        callSetIds = allIndividualNames.map((id: string) => `${database}§${id}`);
      }
    } else if (groupingMode !== '__' && metadataCallSets) {
      // Metadata-based grouping: each selected value is its own group
      callSetIds = metadataCallSets.callSetIds;
      additionalCallSetIds = metadataCallSets.additionalCallSetIds;
    } else {
      // Standard: use investigated groups from main UI
      const selectedGroups = groupEntries.filter(([id]) => selectedChartGroupIds.has(id));
      if (groupEntries.length === 0 && database) {
        callSetIds = allIndividualNames.map((id: string) => `${database}§${id}`);
      } else if (selectedGroups.length > 0 && database) {
        callSetIds = getEffectiveIndividuals(selectedGroups[0][1])
          .map((id: string) => `${database}§${id}`);
        additionalCallSetIds = selectedGroups.slice(1).map(([, g]: [string, any]) =>
          getEffectiveIndividuals(g).map((id: string) => `${database}§${id}`)
        );
      }
    }

    return {
      variantSetId: project,
      discriminate: groupingMode === '__'
        ? Object.values(groupFilters).map((g: any) =>
            g.discriminateGroups === 'null' ? null : (g.discriminateGroups ?? null)
          )
        : metadataValueGroups.map(() => null),
      displayedSequence,
      displayedVariantType: selectedVariantType || null,
      displayedRangeMin: rMin,
      displayedRangeMax: rMax,
      displayedRangeIntervalCount: intervalCount,
      callSetIds,
      additionalCallSetIds,
      start: variantFilters?.selectedStart ?? -1,
      end:   variantFilters?.selectedEnd   ?? -1,
      annotationFieldThresholds: Object.values(groupFilters).map(
        (g: any) => g.searchableAnnotationsFilter ?? {}
      ),
    };
  };

  const fetchVcfFieldData = async (
    fieldName: string,
    displayedSequence: string,
    rMin: number | null,
    rMax: number | null,
    progressTokenOverride?: string,
  ) => {
    try {
      const payload = { ...buildPayload(displayedSequence, rMin, rMax), vcfField: fieldName };
      const vcfFieldEndpoint = progressTokenOverride
        ? `${endpoints.VCF_FIELD_PLOT_DATA_PATH}?progressToken=${encodeURIComponent(progressTokenOverride)}`
        : endpoints.VCF_FIELD_PLOT_DATA_PATH;
      const resp = await api.post(vcfFieldEndpoint, payload, {
        headers: {
          'Content-Type': 'application/json',
          accept: 'application/json',
          assembly: assembly?.split('§')[1] ?? '',
        },
      });
      const data = resp.data;
      if (!data || Object.keys(data).length === 0) return null;
      return data;
    } catch (e) {
      console.error('VCF field overlay fetch error:', e);
      return null;
    }
  };

  const buildPlotFromResult = (result: any, rMin: number | null, rMax: number | null) => {
    // result: {pos: val, ...}  OR  [{pos: val}, {pos: val}]  (tajimad)
    const isTwoSeries = Array.isArray(result);
    const firstData   = isTwoSeries ? result[0] : result;
    const keys        = Object.keys(firstData)
      .map(Number)
      .filter((k) => Number.isFinite(k))
      .sort((a, b) => a - b);
    if (keys.length === 0) return;

    const intervalSize = keys.length > 1 ? keys[1] - keys[0] : 0;
    const xVals = keys;
    const yVals = keys.map((k) => toFiniteNumber(firstData[k]));
    const primaryY = yVals.filter((v): v is number => v !== null);

    const renderedPlotWidthPx = plotViewportRef.current?.clientWidth;
    const fallbackWidthPx = (modalBodyRef.current?.clientWidth ?? BASE_CHART_WIDTH_PX) * Math.max(1, widthMultiplier);
    const effectiveWidthPx = Math.max(200, Math.round(renderedPlotWidthPx ?? fallbackWidthPx));
    const { tickvals, ticktext } = buildXAxisTicks(xVals, effectiveWidthPx);

    const totalVariantCount = chartType === 'density'
      ? primaryY.reduce((s: number, v: number) => s + v, 0)
      : 0;

    const titleText = (() => {
      const seq = selectedSequence;
      const vt  = selectedVariantType || '';
      switch (chartType) {
        case 'density':
          return `Distribution of ${totalVariantCount.toLocaleString()} ${vt} variants on sequence ${seq}`;
        case 'maf':
          return `MAF values for ${vt} variants on sequence ${seq}`;
        case 'fst':
          return `Fst value for ${vt} variants on sequence ${seq}`;
        case 'tajimad':
          return `Tajima's D values for ${vt} variants on sequence ${seq}`;
        case 'missingdata':
          return `Missing data rate for ${vt} variants on sequence ${seq}`;
        case 'heterozygosity':
          return `Heterozygosity rate for ${vt} variants on sequence ${seq}`;
      }
    })();

    const subtitleText = intervalSize > 0 ? (() => {
      switch (chartType) {
        case 'density':
          return `The value provided for a position is the number of variants around it in an interval of size ${intervalSize.toLocaleString()}`;
        case 'maf':
          return `MAF values calculated in an interval of size ${intervalSize.toLocaleString()} around each point (excluding missing and multi-allelic variants)`;
        case 'fst':
          return `Weir and Cockerham Fst estimate calculated between selected groups in an interval of size ${intervalSize.toLocaleString()} around each point`;
        case 'tajimad':
          return `Tajima's D values calculated in an interval of size ${intervalSize.toLocaleString()} around each point (excluding missing and multi-allelic variants)`;
        case 'missingdata':
          return `Rate of missing data calculated in an interval of size ${intervalSize.toLocaleString()} around each point`;
        case 'heterozygosity':
          return `Heterozygosity rate calculated in an interval of size ${intervalSize.toLocaleString()} around each point`;
      }
    })() : '';

    const mode: any = chartType === 'density' ? 'lines' : 'markers';
    const isTajima = chartType === 'tajimad';

    const seriesName = (() => {
      switch (chartType) {
        case 'density':       return 'Variants in interval';
        case 'maf':           return 'MAF * 100';
        case 'fst':           return 'Fst estimate';
        case 'tajimad':       return "Tajima's D";
        case 'missingdata':   return 'Missing data rate';
        case 'heterozygosity':return 'Heterozygosity rate';
      }
    })();

    const primaryHoverTemplate = isTajima
      ? `Tajima's D: %{y}<extra></extra>`
      : `%{x:,d}<br>${seriesName}: %{y}<extra></extra>`;

    const fstOpacity = chartType === 'fst'
      ? yVals.map((value) => (value !== null && value < 0 ? 0.25 : 1))
      : undefined;

    // For marker-only charts, strip null y-values so Plotly's hover engine never
    // snaps to an empty position and reports the nearest visible point's value.
    // Density uses lines+markers where nulls create intentional line breaks — keep them.
    const keepNulls = chartType === 'density';
    const traceX        = keepNulls ? xVals     : xVals.filter((_, i) => yVals[i] !== null);
    const traceY        = keepNulls ? yVals     : yVals.filter(v => v !== null);
    const traceFstOpacity = fstOpacity && !keepNulls
      ? fstOpacity.filter((_, i) => yVals[i] !== null)
      : fstOpacity;

    const primaryTrace: any = {
      x: traceX,
      y: traceY,
      type: 'scatter',
      mode,
      name: seriesName,
      line: { color: COLORS[0], width: 2 },
      marker: {
        size: chartType === 'density' ? 4 : 6,
        color: COLORS[0],
        ...(traceFstOpacity ? { opacity: traceFstOpacity } : {}),
      },
      hovertemplate: primaryHoverTemplate,
      legendrank: 1,
    };

    const newData: any[] = [];
    let secondaryValues: number[] = [];

    // Tajima's D second series (segregating sites)
    if (isTwoSeries && result[1]) {
      const keys2 = Object.keys(result[1])
        .map(Number)
        .filter((k) => Number.isFinite(k))
        .sort((a, b) => a - b);
      const yVals2Raw = keys2.map((k) => toFiniteNumber((result[1] as any)[k]));
      // Drop zero-segregating-site positions — they carry no information and cause phantom hover entries
      const nonZeroMask2 = yVals2Raw.map(v => v !== null && v !== 0);
      const keys2Filtered = keys2.filter((_, i) => nonZeroMask2[i]);
      const yVals2 = yVals2Raw.filter((_, i) => nonZeroMask2[i]);
      secondaryValues = yVals2.filter((v): v is number => typeof v === 'number' && Number.isFinite(v));
      newData.push({
        x: keys2Filtered,
        y: yVals2,
        type: 'scatter',
        mode,
        name: 'Segregating sites',
        yaxis: 'y2',
        line: { color: COLORS[1], width: 1 },
        marker: { size: 6, color: COLORS[1], symbol: 'diamond' },
        hovertemplate: `Segregating sites: %{y}<extra></extra>`,
        legendrank: 2,
      });
    }

    // FST threshold line
    if (chartType === 'fst' && showFstThreshold) {
      newData.push({
        x: [xVals[0], xVals[xVals.length - 1]],
        y: [fstThreshold, fstThreshold],
        type: 'scatter',
        mode: 'lines',
        name: `Threshold (${fstThreshold})`,
        line: { color: '#CC0000', width: 0.5, dash: 'dash' },
        hoverinfo: 'skip',
        legendrank: 3,
      });
    }

    const xRange = [rMin ?? xVals[0], rMax ?? xVals[xVals.length - 1]];
    const primaryRange = computeAxisRange(primaryY, {
      includeZero: chartType !== 'tajimad',
      fallback: chartType === 'tajimad' ? [-1, 1] : [0, 1],
    });

    const yAxisRangesById: Record<string, [number, number]> = {
      yaxis: primaryRange,
    };

    setChartTitle(titleText);
    setChartSubtitle(subtitleText);

    const extraRightAxisCount = activeVcfFieldsRef.current.size + (isTwoSeries ? 1 : 0);

    // ── Dynamic legend / margin ───────────────────────────────────────────
    const leftMarginPx            = 60;
    const rightMarginPx           = 40 + extraRightAxisCount * 55;
    const plotHeightPx            = Math.max(100, plotViewportRef.current?.clientHeight ?? 400);
    const longestTickLabelChars   = ticktext.reduce((max, label) => Math.max(max, String(label).length), 1);
    // Estimate rotated-label vertical footprint (tickangle -55°) + safe padding.
    const xAxisLabelSpacePx       = Math.max(62, Math.round(longestTickLabelChars * 5.2 + 20));
    const legendGapAbovePx        = 10; // fixed spacing between x labels and legend block
    const legendItemWidthPx       = 160;
    const legendRowHeightPx       = 24;
    const legendBottomPaddingPx   = 8;
    const tracesInLegend = 1
      + (isTwoSeries ? 1 : 0)
      + (chartType === 'fst' && showFstThreshold ? 1 : 0)
      + activeVcfFieldsRef.current.size;
    const innerWidthPx            = Math.max(150, effectiveWidthPx - leftMarginPx - rightMarginPx);
    const itemsPerRow             = Math.max(1, Math.floor(innerWidthPx / legendItemWidthPx));
    const legendRows              = Math.max(1, Math.ceil(tracesInLegend / itemsPerRow));
    const legendHeightPx          = legendRows * legendRowHeightPx;
    const legendTopOffsetPx       = xAxisLabelSpacePx + legendGapAbovePx;
    const bMargin                 = legendTopOffsetPx + legendHeightPx + legendBottomPaddingPx;
    const legendY                 = -legendTopOffsetPx / plotHeightPx;

    const layout: any = {
      xaxis: {
        tickmode: 'array',
        tickvals,
        ticktext,
        tickangle: -55,
        tickfont: { size: 10 },
        automargin: false,
        showgrid: false,
        range: xRange,
        fixedrange: false,
      },
      yaxis: {
        fixedrange: true,
        linecolor: COLORS[0],
        linewidth: 3,
        range: primaryRange,
        tickformat: chartType === 'density' ? '~s' : '.4~g',
        showgrid: true,
        gridcolor: Y_AXIS_GRID_COLOR,
        gridwidth: 1,
        zeroline: false,
      },
      hovermode: isTajima ? 'x unified' : 'closest',
      legend: { orientation: 'h', y: legendY, x: 0, xanchor: 'left', yanchor: 'top' },
      margin: { t: 20, b: bMargin, l: leftMarginPx, r: rightMarginPx },
      autosize: true,
    };

    if (isTwoSeries) {
      yAxisRangesById.yaxis2 = computeAxisRange(secondaryValues, { includeZero: true, fallback: [0, 1] });
      layout.yaxis2 = {
        fixedrange: true,
        anchor: 'free',
        overlaying: 'y',
        side: 'right',
        position: 1,
        autoshift: true,
        linecolor: COLORS[1],
        linewidth: 3,
        range: yAxisRangesById.yaxis2,
        tickformat: '.4~g',
        showgrid: false,
        zeroline: false,
      };
    }

    // Append active VCF overlay series (each on its own secondary y-axis)
    let extraAxisIdx = isTwoSeries ? 2 : 1;  // yaxis, yaxis2 are already used
    activeVcfFieldsRef.current.forEach(fieldName => {
      const fieldData = vcfFieldDataRef.current[fieldName];
      if (!fieldData) return;
      extraAxisIdx++;
      const fKeys = Object.keys(fieldData).map(Number).filter(n => isFinite(n)).sort((a, b) => a - b);
      const fVals = fKeys.map(k => toFiniteNumber(fieldData[k]));
      const numericFVals = fVals.filter((v): v is number => v !== null);
      const col   = COLORS[extraAxisIdx % COLORS.length];
      const traceAxisId  = `y${extraAxisIdx}`;
      const layoutAxisId = `yaxis${extraAxisIdx}`;
      yAxisRangesById[layoutAxisId] = computeAxisRange(numericFVals, { includeZero: true, fallback: [0, 1] });
      newData.push({
        x: fKeys, y: fVals,
        type: 'scatter', mode: 'lines',
        name: `Average ${fieldName}`,
        yaxis: traceAxisId,
        line: { color: col, width: 1 },
        marker: { size: 3, color: col },
        hovertemplate: `%{x:,d}<br>Average ${fieldName}: %{y}<extra></extra>`,
        legendrank: 10 + extraAxisIdx,
      });
      layout[layoutAxisId] = {
        anchor: 'free',
        overlaying: 'y',
        side: 'right',
        position: 1,
        autoshift: true,
        fixedrange: true,
        linecolor: col, linewidth: 2, tickformat: '.4~g',
        range: yAxisRangesById[layoutAxisId],
       // title: { text: `Avg ${fieldName}`, font: { color: col, size: 11 } },
        showgrid: false,
        zeroline: false,
      };
    });

    const yAxisIds = Object.keys(yAxisRangesById).sort((a, b) => {
      const toOrder = (axisId: string) => axisId === 'yaxis' ? 1 : Number.parseInt(axisId.replace('yaxis', ''), 10);
      return toOrder(a) - toOrder(b);
    });

    if (yAxisIds.length > 1) {
      const preferredRatio = computeZeroRatio(ensureZeroInRange(yAxisRangesById.yaxis));
      const alignedRanges = alignRangesOnSharedZero(
        yAxisIds.map((axisId) => yAxisRangesById[axisId]),
        preferredRatio ?? undefined,
      );

      yAxisIds.forEach((axisId, index) => {
        if (layout[axisId]) {
          layout[axisId].range = alignedRanges[index];
        }
      });
    }

    // Render main trace last so it remains visible above secondary overlay traces.
    newData.push(primaryTrace);

    setLocalMin(rMin ?? xVals[0]);
    setLocalMax(rMax ?? xVals[xVals.length - 1]);
    setPlotData(newData);
    setPlotLayout(layout);
  };

  const fetchAndDisplay = async (rMin: number | null, rMax: number | null): Promise<boolean> => {
    if (!project || !selectedSequence || !isModalOpenRef.current) return false;

    const payload = buildPayload(selectedSequence, rMin, rMax);
    const mainChartProgressToken = baseProgressToken
      ? `${Date.now()}-main_chart_${baseProgressToken}`
      : '';
    const vcfFieldList = Array.from(activeVcfFields);
    const vcfFieldProgressTokens = vcfFieldList.map((fieldName) =>
      baseProgressToken ? `${Date.now()}-vcfField_${fieldName}_${baseProgressToken}` : ''
    );

    // Compute main hash + all VCF hashes in parallel
    const [hash, ...vcfHashes] = await Promise.all([
      computeHash(payload),
      ...vcfFieldList.map(f => computeHash({ ...payload, vcfField: f })),
    ]);
    currentHashRef.current = hash;
    currentVcfHashesRef.current = vcfHashes;

    const mainIsCached = !!cachedResults.current[hash];
    const vcfCacheStatus = vcfHashes.map(h => !!vcfCachedResults.current[h]);

    // Show the progress dialog only for non-cached backend calls.
    const activeProgressTokens = [
      ...(!mainIsCached && mainChartProgressToken ? [mainChartProgressToken] : []),
      ...vcfFieldProgressTokens.filter((tokenValue, i) => !vcfCacheStatus[i] && !!tokenValue),
    ];
    const hasPendingCalls = activeProgressTokens.length > 0;
    setProgressTokens(activeProgressTokens);
    setIsLoading(true);
    setShowChartProgress(hasPendingCalls);

    try {
      // Main chart: resolve from cache or fetch.
      const mainFetch: Promise<any> = mainIsCached
        ? Promise.resolve(cachedResults.current[hash])
        : api.post(
            mainChartProgressToken
              ? `${chartEndpointUrl(chartType)}?progressToken=${encodeURIComponent(mainChartProgressToken)}`
              : chartEndpointUrl(chartType),
            payload,
            {
            headers: { 'Content-Type': 'application/json', accept: 'application/json', assembly: assembly?.split('§')[1] ?? '' },
            },
          ).then(resp => resp.data);

      // VCF overlay fetches — serve from cache when available, fetch otherwise
      const vcfFetches = vcfFieldList.map((fieldName, index) => {
        const vcfHash = vcfHashes[index];
        if (vcfCachedResults.current[vcfHash]) {
          return Promise.resolve([fieldName, vcfCachedResults.current[vcfHash]] as const);
        }
        return fetchVcfFieldData(
          fieldName,
          selectedSequence,
          rMin,
          rMax,
          vcfFieldProgressTokens[index]
        ).then(data => [fieldName, data] as const);
      });

      const [mainData, ...vcfResults] = await Promise.all([mainFetch, ...vcfFetches]);

      if (!isModalOpenRef.current) {
        return false;
      }

      // Store new VCF results in cache
      vcfResults.forEach(([, data], index) => {
        if (data !== null) vcfCachedResults.current[vcfHashes[index]] = data;
      });

      vcfFieldDataRef.current = Object.fromEntries(
        vcfResults.filter(([, d]) => d !== null)
      );

      const isEmpty = !mainData || (
        Array.isArray(mainData)
          ? Object.keys(mainData[0] ?? {}).length === 0
          : Object.keys(mainData).length === 0
      );

      if (isEmpty) {
        // Keep the previous display (if any), e.g. when a zoom fetch was aborted.
        if (lastResult.current === null) {
          setPlotData([]);
        }
        return false;
      } else {
        if (!mainIsCached) cachedResults.current[hash] = mainData;
        lastResult.current = mainData;
        lastRMin.current   = rMin;
        lastRMax.current   = rMax;
        buildPlotFromResult(mainData, rMin, rMax);
        return true;
      }
    } catch (err) {
      console.error('Chart fetch error:', err);
      // Keep the previous display (if any), e.g. when a zoom fetch was aborted.
      if (lastResult.current === null) {
        setPlotData([]);
      }
      return false;
    } finally {
      setIsLoading(false);
      // Keep polling progress URL until backend reports complete/aborted.
      if (!hasPendingCalls) {
        setShowChartProgress(false);
        setProgressTokens([]);
      }
    }
  };

  const handleShow = () => {
    cachedResults.current = {};
    vcfCachedResults.current = {};
    currentVcfHashesRef.current = [];
    lastResult.current = null;
    setPrevRanges([]);
    setLocalMin(null);
    setLocalMax(null);
    fetchAndDisplay(null, null);
  };

  const handleRelayout = async (event: any) => {
    if (isFetching || isLoading) return;
    if (!plotData[0]?.x?.length) return;
    if (event.autosize === true) return;

    // Ignore relayout events that come from resize/responsive updates.
    if (event.width !== undefined || event.height !== undefined) return;

    if (event['xaxis.range[0]'] !== undefined && event['xaxis.range[1]'] !== undefined) {
      const xMin = Math.round(event['xaxis.range[0]']);
      const xMax = Math.round(event['xaxis.range[1]']);
      if (isNaN(xMin) || isNaN(xMax)) return;

      const defaultMin = Math.round(plotData[0].x[0]);
      const defaultMax = Math.round(plotData[0].x[plotData[0].x.length - 1]);
      const currentMin = localMin ?? defaultMin;
      const currentMax = localMax ?? defaultMax;
      if (xMin === currentMin && xMax === currentMax) return;

      const previousRanges = prevRanges;
      let pushedPreviousRange = false;
      if (lastResult.current !== null) {
        pushedPreviousRange = true;
        setPrevRanges(prev => [...prev, [lastRMin.current, lastRMax.current]]);
      }
      setIsFetching(true);
      const didUpdate = await fetchAndDisplay(xMin, xMax);
      if (!didUpdate && pushedPreviousRange) {
        setPrevRanges(previousRanges);
      }
      setIsFetching(false);
    } else if (event['xaxis.autorange'] === true) {
      setPrevRanges([]);
      await fetchAndDisplay(null, null);
    }
  };

  const handleZoomOut = async () => {
    if (prevRanges.length === 0) return;
    // Evict the range we're leaving so it doesn't occupy cache indefinitely
    if (currentHashRef.current) {
      delete cachedResults.current[currentHashRef.current];
    }
    currentVcfHashesRef.current.forEach(h => { delete vcfCachedResults.current[h]; });
    currentVcfHashesRef.current = [];
    const newRanges = [...prevRanges];
    const prev = newRanges.pop()!;
    setPrevRanges(newRanges);
    await fetchAndDisplay(prev[0], prev[1]);
  };

  const handleReset = async () => {
    // Keep only the root (null, null) query in cache; discard all zoomed entries
    const rootPayload = buildPayload(selectedSequence, null, null);
    const [rootHash, ...rootVcfHashes] = await Promise.all([
      computeHash(rootPayload),
      ...Array.from(activeVcfFields).map(f => computeHash({ ...rootPayload, vcfField: f })),
    ]);
    const rootData = cachedResults.current[rootHash];
    cachedResults.current = rootData ? { [rootHash]: rootData } : {};
    const newVcfCache: Record<string, any> = {};
    rootVcfHashes.forEach(h => { if (vcfCachedResults.current[h]) newVcfCache[h] = vcfCachedResults.current[h]; });
    vcfCachedResults.current = newVcfCache;
    currentHashRef.current = null;
    currentVcfHashesRef.current = [];
    setPrevRanges([]);
    await fetchAndDisplay(null, null);
  };

  const toggleVcfField = async (fieldName: string, checked: boolean) => {
    if (!checked) {
      delete vcfFieldDataRef.current[fieldName];
      setActiveVcfFields(prev => { const s = new Set(prev); s.delete(fieldName); return s; });
      // Remove this field's hash from currentVcfHashesRef so zoom-out doesn't evict its cache entry
      const payload = buildPayload(selectedSequence, localMin, localMax);
      const vcfHash = await computeHash({ ...payload, vcfField: fieldName });
      currentVcfHashesRef.current = currentVcfHashesRef.current.filter(h => h !== vcfHash);
      return;
    }
    setActiveVcfFields(prev => new Set([...prev, fieldName]));
    if (!lastResult.current) return;

    const payload = buildPayload(selectedSequence, localMin, localMax);
    const vcfHash = await computeHash({ ...payload, vcfField: fieldName });

    let data: any;
    if (vcfCachedResults.current[vcfHash]) {
      data = vcfCachedResults.current[vcfHash];
    } else {
      const progressToken = baseProgressToken
        ? `${Date.now()}-vcfField_${fieldName}_${baseProgressToken}`
        : '';
      setProgressTokens([progressToken]);
      setIsLoading(true);
      setShowChartProgress(true);
      try {
        data = await fetchVcfFieldData(fieldName, selectedSequence, localMin, localMax, progressToken);
        if (data) vcfCachedResults.current[vcfHash] = data;
      } finally {
        setIsLoading(false);
        // Keep polling progress URL until backend reports complete/aborted.
      }
    }
    if (!data) return;
    if (!isModalOpenRef.current) return;

    // Track this hash so zoom-out can evict it alongside the other current-range entries
    if (!currentVcfHashesRef.current.includes(vcfHash)) {
      currentVcfHashesRef.current = [...currentVcfHashesRef.current, vcfHash];
    }
    vcfFieldDataRef.current[fieldName] = data;
    // Sync ref before calling buildPlotFromResult — the React state update from
    // setActiveVcfFields at the top of this function may not have committed yet.
    activeVcfFieldsRef.current = new Set([...activeVcfFieldsRef.current, fieldName]);
    buildPlotFromResult(lastResult.current, lastRMin.current, lastRMax.current);
  };

  // Count of distinct biological entities currently selected for chart
  const indSelectionCount = (() => {
    if (groupingMode !== '__' && metadataCallSets) {
      const all = new Set([...metadataCallSets.callSetIds, ...metadataCallSets.additionalCallSetIds.flat()]);
      return all.size;
    }
    const selectedGroups = groupEntries.filter(([id]) => selectedChartGroupIds.has(id));
    if (selectedGroups.length === 0) return allIndividualNames.length;
    const all = new Set(selectedGroups.flatMap(([, g]) => getEffectiveIndividuals(g)));
    return all.size;
  })();

  const exportCSV = () => {
    if (!plotData[0]?.x?.length) { alert('No chart data to export.'); return; }
    const rows = plotData[0].x.map((x: any, i: number) => `${x};${plotData[0].y[i]}`);
    const csv  = `Positions on selected sequence;${plotData[0].name}\n${rows.join('\n')}`;
    triggerDownload(csv, `${selectedSequence}.csv`, 'text/csv');
  };

  const exportXLS = () => {
    if (!plotData[0]?.x?.length) { alert('No chart data to export.'); return; }
    const rows = plotData[0].x.map((x: any, i: number) => `${x}\t${plotData[0].y[i]}`);
    const xls  = `Positions on selected sequence\t${plotData[0].name}\n${rows.join('\n')}`;
    triggerDownload(xls, `${selectedSequence}.xls`, 'application/vnd.ms-excel');
  };

  const triggerDownload = (content: string, filename: string, mime: string) => {
    const a = document.createElement('a');
    a.href = URL.createObjectURL(new Blob([content], { type: mime }));
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  const copyXAxis = () => {
    if (!plotData[0]?.x?.length) return;
    const x = plotData[0].x;
    navigator.clipboard.writeText(`${x[0]}-${x[x.length - 1]}`);
  };

  const exportImage = (format: 'png' | 'svg') => {
    const el = document.querySelector('.js-plotly-plot') as HTMLElement | null;
    if (el && (window as any).Plotly) {
      const chartWidth = plotViewportRef.current?.clientWidth ?? 1200;
      (window as any).Plotly.downloadImage(el, { format, filename: `${selectedSequence}`, width: chartWidth, height: 800 });
    }
  };

  const handleCloseModal = () => {
    purgeChartData();
    onClose();
  };

  const handleProgressDialogHide = () => {
    setShowChartProgress(false);
    setProgressTokens([]);
  };

  // Validation: FST needs ≥2 groups (either main UI groups or metadata values)
  const fstGroupCount = groupingMode === '__'
    ? selectedChartGroupIds.size
    : metadataValueGroups.length;
  const canShow = !!selectedSequence && (
    chartType !== 'fst' || fstGroupCount >= 2
  );
  const shouldShowBiologicalEntityControls = chartType !== 'density' || activeVcfFields.size > 0;

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <>
    <div
      className="modal fade show chart-modal-overlay"
      tabIndex={-1}
    >
      <div className="chart-modal-shell">
        <div className="modal-content chart-modal-content">

          {/* ── Header / Controls ──────────────────────────────────────── */}
          <div className="modal-header d-flex flex-wrap align-items-center gap-2 chart-modal-header">

            {/* Left: required selectors */}
            <div className="d-flex align-items-center gap-2 flex-wrap">

              {/* Chart type */}
              <Dropdown show={openDropdown === 'type'} onToggle={o => setOpenDropdown(o ? 'type' : null)}>
                <Dropdown.Toggle variant="secondary" size="sm">
                  {CHART_TYPE_LABELS[chartType]}
                </Dropdown.Toggle>
                <Dropdown.Menu>
                  {(Object.entries(CHART_TYPE_LABELS) as [ChartType, string][]).map(([k, label]) => (
                    <Dropdown.Item key={k} active={chartType === k}
                      onClick={() => { setChartType(k); setOpenDropdown(null); }}>
                      {label}
                    </Dropdown.Item>
                  ))}
                </Dropdown.Menu>
              </Dropdown>

              {/* Sequence */}
              <Dropdown show={openDropdown === 'seq'} onToggle={o => setOpenDropdown(o ? 'seq' : null)}>
                <Dropdown.Toggle variant="secondary" size="sm">
                  Sequence: {selectedSequence || '—'}
                </Dropdown.Toggle>
                <Dropdown.Menu className="chart-modal-menu-scroll">
                  {displayedSequences.map((name, i) => (
                    <Dropdown.Item key={i} active={selectedSequence === name}
                      onClick={() => { setSelectedSequence(name); setOpenDropdown(null); }}>
                      {name}
                    </Dropdown.Item>
                  ))}
                </Dropdown.Menu>
              </Dropdown>

              {/* Variant type */}
              <Dropdown show={openDropdown === 'vtype'} onToggle={o => setOpenDropdown(o ? 'vtype' : null)}>
                <Dropdown.Toggle variant="secondary" size="sm">
                  {selectedVariantType || 'Variant type: ANY'}
                </Dropdown.Toggle>
                <Dropdown.Menu>
                  <Dropdown.Item active={selectedVariantType === ''}
                    onClick={() => { setSelectedVariantType(''); setOpenDropdown(null); }}>
                    ANY
                  </Dropdown.Item>
                  {variantTypes.map(t => (
                    <Dropdown.Item key={t} active={selectedVariantType === t}
                      onClick={() => { setSelectedVariantType(t); setOpenDropdown(null); }}>
                      {t}
                    </Dropdown.Item>
                  ))}
                </Dropdown.Menu>
              </Dropdown>

              {/* Intervals */}
              <OverlayTrigger placement="bottom" show={!!intervalError}
                overlay={intervalError ? <Tooltip id="iv-tip">{intervalError}</Tooltip> : <></>}>
                <div className="d-flex align-items-center gap-1 chart-modal-font-14">
                  <span>Intervals:</span>
                  <input
                    type="number" min={50} max={5000}
                    value={intervalCount}
                    onChange={e => {
                      const v = Number(e.target.value);
                      setIntervalCount(v);
                      setIntervalError(v < 50 || v > 5000 ? 'Must be between 50 and 5000' : null);
                    }}
                    onBlur={e => {
                      let v = Number(e.target.value);
                      if (isNaN(v) || v < 50) v = 50;
                      if (v > 5000) v = 5000;
                      setIntervalCount(v);
                      setIntervalError(null);
                    }}
                    className={`chart-modal-input-interval${intervalError ? ' chart-modal-input-interval-error' : ''}`}
                  />
                </div>
              </OverlayTrigger>

              {/* Width multiplier */}
              <div className="d-flex align-items-center gap-1 chart-modal-font-14">
                <span>Width:</span>
                <select
                  value={widthMultiplier}
                  onChange={e => setWidthMultiplier(Number(e.target.value))}
                  className="chart-modal-select-small"
                >
                  {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(v => (
                    <option key={v} value={v}>{v}x</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Divider */}
            <div className="chart-modal-divider" />

            {/* Centre: optional / grouping controls */}
            <div className="d-flex align-items-center gap-2 flex-wrap chart-modal-grow">

              {/* FST-specific: threshold */}
              {chartType === 'fst' && (
                <div className="d-flex align-items-center gap-1 chart-modal-font-13">
                  <input type="checkbox" id="fst-thresh"
                    checked={showFstThreshold}
                    onChange={e => setShowFstThreshold(e.target.checked)} />
                  <label htmlFor="fst-thresh" className="chart-modal-label-reset">Threshold:</label>
                  <input
                    type="number" min={0} max={1} step={0.01}
                    value={fstThreshold}
                    onChange={e => setFstThreshold(parseFloat(e.target.value))}
                    className="chart-modal-input-fst"
                    disabled={!showFstThreshold}
                  />
                </div>
              )}

              {/* Export / actions */}
              <Dropdown show={openDropdown === 'export'} onToggle={o => setOpenDropdown(o ? 'export' : null)}>
                <Dropdown.Toggle variant="light" size="sm">Export / Actions</Dropdown.Toggle>
                <Dropdown.Menu>
                  <Dropdown.Item onClick={() => exportImage('png')}>Export as PNG</Dropdown.Item>
                  <Dropdown.Item onClick={() => exportImage('svg')}>Export as SVG</Dropdown.Item>
                  <Dropdown.Item onClick={exportCSV}>Export as CSV</Dropdown.Item>
                  <Dropdown.Item onClick={exportXLS}>Export as XLS</Dropdown.Item>
                  <Dropdown.Divider />
                  <Dropdown.Item onClick={copyXAxis}>Copy X-axis range to clipboard</Dropdown.Item>
                </Dropdown.Menu>
              </Dropdown>
            </div>

            {/* Right: show / close */}
            <div className="d-flex align-items-center gap-2">
              {prevRanges.length > 0 && (
                <>
                  <button className="btn btn-sm btn-outline-secondary" onClick={handleZoomOut}>
                    Zoom out
                  </button>
                  <button className="btn btn-sm btn-outline-danger" onClick={handleReset}>
                    Reset zoom
                  </button>
                </>
              )}
              <button
                className="btn btn-success btn-sm"
                onClick={handleShow}
                disabled={!canShow || !!intervalError}
              >
                {isLoading ? 'Loading…' : 'Show'}
              </button>
              <button type="button" className="btn-close" aria-label="Close" onClick={handleCloseModal} />
            </div>

          </div>

          {/* ── Body / Chart ───────────────────────────────────────────── */}
          <div ref={modalBodyRef} className="modal-body chart-modal-body">
            {/* Title stays outside the scroll container so it's always visible */}
            {plotData.length > 0 && (
              <div className="chart-modal-title-wrap">
                <div className="chart-modal-title">{chartTitle}</div>
                {chartSubtitle && <div className="chart-modal-subtitle">{chartSubtitle}</div>}
              </div>
            )}
            {plotData.length === 0 ? (
              <div className="chart-modal-empty-state">
                <div>Select options and click <strong>Show</strong> to display the chart.</div>
                {chartType === 'fst' && fstGroupCount < 2 && (
                  <div className="chart-modal-warning-text">
                    {groupingMode === '__'
                      ? 'FST requires at least 2 investigation groups with individuals selected.'
                      : 'FST requires at least 2 metadata values to be selected.'}
                  </div>
                )}
              </div>
            ) : (
              <div className="chart-modal-plot-scroll">
                <div ref={plotViewportRef} className={`chart-modal-viewport chart-modal-viewport-${widthMultiplier}x`}>
                  <Plot
                    data={plotData}
                    layout={plotLayout}
                    useResizeHandler
                    className="chart-modal-plot-fill"
                    config={{
                      scrollZoom: false,
                      displayModeBar: true,
                      modeBarButtonsToRemove: ['zoom2d', 'pan2d', 'select2d', 'lasso2d', 'zoomIn2d', 'zoomOut2d', 'autoScale2d', 'resetScale2d', 'toImage'],
                    }}
                    onRelayout={handleRelayout}

                    onHover={(e) => {
                      const drag = (e.event.target as Element).closest('.js-plotly-plot')?.querySelector('.nsewdrag') as SVGElement | null;
                      if (drag) drag.style.cursor = 'default';
                    }}
                    onUnhover={(e) => {
                      const drag = (e.event.target as Element).closest('.js-plotly-plot')?.querySelector('.nsewdrag') as SVGElement | null;
                      if (drag) drag.style.cursor = '';
                    }}
                  />
                </div>
              </div>
            )}
            {plotData.length > 0 && (
              <div className="chart-modal-x-label">
                Positions on selected sequence
              </div>
            )}
          </div>

          {/* ── Customisation panel ────────────────────────────────────── */}
          <div className="chart-modal-options-panel">
            <div className="chart-modal-options-title">Customisation options</div>
            <div className="chart-modal-options-grid">

              {/* VCF metadata overlay series */}
              {vcfFields.length > 0 && (
                <div>
                  <div className="chart-modal-subsection-title">Additional series based on VCF genotype metadata:</div>
                  {vcfFields.map((field) => (
                    <div key={field} className="chart-modal-inline-check-row">
                      <input
                        type="checkbox"
                        id={`vcf-series-${field}`}
                        checked={activeVcfFields.has(field)}
                        onChange={e => toggleVcfField(field, e.target.checked)}
                      />
                      <label htmlFor={`vcf-series-${field}`} className="chart-modal-inline-check-label">
                        Average {field}
                      </label>
                    </div>
                  ))}
                </div>
              )}

              {shouldShowBiologicalEntityControls && (
                <>
                  {/* Biological entities grouping mode */}
                  <div>
                    <div className="chart-modal-subsection-title">Biological entities accounted for:</div>
                    <select
                      value={groupingMode}
                      onChange={e => { setGroupingMode(e.target.value); setMetadataValueGroups([]); setMetadataCallSets(null); }}
                      className="chart-modal-select-small"
                    >
                      {groupEntries.length > 0 && <option value="__">— Investigated groups —</option>}
                      {Object.keys(distinctMetadata).sort().map(field => (
                        <option key={field} value={field}>{field}</option>
                      ))}
                    </select>
                    <div className="chart-modal-help-text">
                      ({indSelectionCount} biological {indSelectionCount === 1 ? 'entity' : 'entities'} selected)
                    </div>
                  </div>

                  {/* Selection values: investigated groups or metadata values */}
                  <div>
                    <div className="chart-modal-subsection-title">
                      {groupingMode === '__' ? 'Select investigated groups:' : '… refine if you wish:'}
                    </div>
                    {(groupingMode === '__' ? investigatedGroupValues.length > 0 : metadataValues.length > 0) ? (
                      <SmartColorMultiSelect
                        values={groupingMode === '__' ? investigatedGroupValues : metadataValues}
                        onChange={handleBiologicalEntitySelectionChange}
                        allowAdvanced={groupingMode !== '__' && chartType === 'fst'}
                      />
                    ) : (
                      <div className="chart-modal-muted-text">
                        {groupingMode === '__' ? 'No investigated groups available.' : 'No metadata values available.'}
                      </div>
                    )}
                  </div>
                </>
              )}

            </div>
          </div>

        </div>
      </div>
    </div>

    <ProgressDialog
      progressToken={baseProgressToken}
      progressTokens={progressTokens}
      show={showChartProgress}
      onHide={handleProgressDialogHide}
      autoClose={true}
      title="Computing chart data…"
      showAbort={true}
      onAbort={() => {}}
      nbMin={2}
      renderOnError={(msg) => (
        <Alert variant="danger" className="mt-3 mb-0">
          <p><strong>Chart computation failed</strong></p>
          <p className="mb-0">{msg}</p>
        </Alert>
      )}
    />
    </>
  );
};

export default ChartModal;
