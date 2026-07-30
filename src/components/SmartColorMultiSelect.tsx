import React, { useEffect, useState } from 'react';
import '../styles/smart-color-multiselect.scss';

export const SCMS_COLORS = ['#e74c3c', '#f1c40f', '#7f8c8d', '#3498db', '#49b049'];

const SCMS_COLOR_CLASS: Record<string, string> = {
  '#e74c3c': 'scms-color-red',
  '#f1c40f': 'scms-color-yellow',
  '#7f8c8d': 'scms-color-gray',
  '#3498db': 'scms-color-blue',
  '#49b049': 'scms-color-green',
};

export interface SmartColorMultiSelectProps {
  values: string[];
  /** Called with an array of groups whenever the selection changes.
   *  Normal mode: each selected value is its own single-element group.
   *  Advanced mode: values sharing the same color are pooled into one group. */
  onChange: (groups: string[][]) => void;
  /** Height of the items list (px). Defaults to 160. */
  listHeight?: number;
  /** Minimum width of the control (px). Defaults to 165. */
  minWidth?: number;
  /** Number of rows shown in normal-mode native select. Defaults to 7. */
  selectSize?: number;
  /** Whether the advanced color-grouping mode can be enabled. Defaults to true. */
  allowAdvanced?: boolean;
}

const SmartColorMultiSelect: React.FC<SmartColorMultiSelectProps> = ({
  values,
  onChange,
  listHeight = 160,
  minWidth = 180,
  selectSize = 7,
  allowAdvanced = true,
}) => {
  const [advanced, setAdvanced]             = useState(false);
  const [activeColor, setActiveColor]       = useState<string | null>(SCMS_COLORS[0]);
  const [itemColors, setItemColors]         = useState<Record<string, string>>({});
  const [selectedNormal, setSelectedNormal] = useState<string[]>([]);

  // Reset when the values list is replaced (e.g. different metadata field selected)
  const valuesKey = values.join('\0');
  useEffect(() => {
    setItemColors({});
    setSelectedNormal(values); // select all by default
  }, [valuesKey]);

  useEffect(() => {
    if (!allowAdvanced && advanced) {
      const coloredValues = Object.keys(itemColors);
      if (coloredValues.length > 0) {
        setSelectedNormal(coloredValues);
      }
      setAdvanced(false);
    }
  }, [allowAdvanced, advanced, itemColors]);

  // Notify parent whenever groups change
  useEffect(() => {
    if (!advanced) {
      onChange(selectedNormal.map(v => [v]));
    } else {
      const byColor: Record<string, string[]> = {};
      Object.entries(itemColors).forEach(([v, c]) => {
        if (!byColor[c]) byColor[c] = [];
        byColor[c].push(v);
      });
      onChange(SCMS_COLORS.map(c => byColor[c] ?? []).filter(g => g.length > 0));
    }
  }, [advanced, selectedNormal, itemColors]);

  const handleItemClick = (value: string) => {
    setItemColors(prev => {
      const cur = prev[value];
      if (cur) {
        if (!activeColor || cur === activeColor) {
          const next = { ...prev }; delete next[value]; return next;
        }
        return { ...prev, [value]: activeColor };
      }
      return activeColor ? { ...prev, [value]: activeColor } : prev;
    });
  };

  const clearAll = () => { setItemColors({}); setSelectedNormal([]); };
  const rootStyle: React.CSSProperties = {
    ["--scms-width" as string]: `${minWidth}px`,
    ["--scms-list-height" as string]: `${listHeight}px`,
  };

  return (
    <div className="scms-root" style={rootStyle}>
      {allowAdvanced && (
        <button
          type="button"
          title="Advanced mode: group values by color"
          onClick={() => setAdvanced(a => !a)}
          className="scms-advanced-toggle"
        >⚙️</button>
      )}

      {!advanced ? (
        <select
          multiple size={selectSize}
          className="scms-select"
          value={selectedNormal}
          onChange={e => setSelectedNormal(Array.from(e.target.selectedOptions, o => o.value))}
        >
          {values.map(v => <option key={v} value={v}>{v}</option>)}
        </select>
      ) : (
        <div className="scms-advanced-panel">
          <div className="scms-toolbar">
            <div>
              {SCMS_COLORS.map(c => (
                <span key={c} title={`Group color ${c}`}
                  onClick={() => setActiveColor(ac => ac === c ? null : c)}
                  className={`scms-color-dot ${SCMS_COLOR_CLASS[c]}${activeColor === c ? ' scms-color-dot-active' : ''}`}
                />
              ))}
            </div>
            <button type="button" onClick={clearAll}
              className="scms-clear-btn"
            >Clear</button>
          </div>
          <ul className="scms-list">
            {values.map(v => {
              const color = itemColors[v];
              const colorClass = color ? SCMS_COLOR_CLASS[color] : '';
              return (
                <li key={v} onClick={() => handleItemClick(v)}
                  className={`scms-list-item${colorClass ? ` ${colorClass} scms-list-item-colored` : ''}`}
                >{v}</li>
              );
            })}
          </ul>
        </div>
      )}
    </div>
  );
};

export default SmartColorMultiSelect;
