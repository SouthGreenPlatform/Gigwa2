/*
 * Optional runtime customization for React Database Manager.
 *
 * Usage (project-side):
 * 1) Copy this file to your host app as /js/moduleListCustomisation.react.js
 * 2) Edit hooks as needed.
 * 3) The React app auto-loads it if present.
 *
 * You can also set a custom URL before app startup:
 *   window.roleManagerDatabaseListCustomizationUrl = '/path/to/custom.js'
 */

window.roleManagerDatabaseListCustomization = {
  // Optional: override columns shown in the table.
  // Available default column IDs: database, host, category, visibility, size, dumpStatus
  getColumns(defaultColumns) {
    return defaultColumns.map((column) => {
      if (column.id === 'category') {
        return {
          ...column,
          label: 'Taxon',
          getValue: ({ details }) => details.category || '-',
        };
      }
      return column;
    });
  },

  // Optional: add page-level links or buttons above the database table.
  getPageLinks() {
    return [
      {
        key: 'ncbi-taxonomy-home',
        label: 'NCBI Taxonomy',
        icon: 'bi bi-box-arrow-up-right',
        className: 'btn-outline-primary',
        href: 'https://www.ncbi.nlm.nih.gov/Taxonomy/Browser/wwwtax.cgi',
        target: '_blank',
        title: 'Open the NCBI Taxonomy browser',
      },
    ];
  },

  // Optional: enable taxon-aware parsing + NCBI-assisted category editing.
  // IMPORTANT: if these hooks are omitted, category is treated as plain text (JSP default behavior).
  parseCategoryForEdition({ category, defaults }) {
    const raw = category || '';
    const parts = raw.split(':');
    if (parts.length >= 3 && !Number.isNaN(Number(parts[0]))) {
      const taxonId = parts[0];
      const species = parts[2] || '';
      const label = parts[1] || species;
      return {
        ...defaults,
        categoryLabel: label,
        categoryReadOnly: true,
        categoryTitle: 'Fetch taxon from NCBI',
        taxonId,
        taxonSpecies: species,
      };
    }

    return {
      ...defaults,
      categoryReadOnly: true,
      categoryTitle: 'Fetch taxon from NCBI',
      taxonId: '',
      taxonSpecies: '',
      categoryLabel: raw,
    };
  },

  buildCategoryForSave({ edit, defaultCategoryValue }) {
    if (!edit?.taxonId) {
      return defaultCategoryValue;
    }

    const species = edit.taxonSpecies || '';
    const label = edit.categoryLabel || '';
    const middle = species && label === species ? '' : label;
    return `${edit.taxonId}:${middle}:${species}`;
  },

  async onCategoryFieldClick({ edit }) {
    const userInput = window.prompt('Please provide NCBI taxon ID (blank to clear).');
    if (userInput === null) {
      return null;
    }

    const value = userInput.trim();
    if (!value) {
      return {
        taxonId: '',
        taxonSpecies: '',
        categoryLabel: '',
      };
    }

    if (Number.isNaN(Number(value))) {
      throw new Error('Taxon ID must be numeric.');
    }

    const response = await fetch(
      `https://eutils.ncbi.nlm.nih.gov/entrez/eutils/esummary.fcgi?db=taxonomy&retmode=json&id=${encodeURIComponent(value)}`
    );
    if (!response.ok) {
      throw new Error(`NCBI request failed (${response.status})`);
    }

    const data = await response.json();
    const details = data?.result?.[value] || null;
    if (!details?.scientificname) {
      throw new Error(`No NCBI taxon found for ID ${value}`);
    }

    const species = details.species && details.genus ? `${details.genus} ${details.species}` : details.scientificname;
    return {
      ...edit,
      taxonId: value,
      taxonSpecies: species,
      categoryLabel: details.scientificname,
    };
  },

  // Optional: transform each row before rendering.
  mapRow(row) {
    return row;
  },

  // Optional: add custom action buttons per row.
  // Action object: { key, label, icon, className, title, onClick, refreshAfterAction }
  getRowActions() {
    return [];
  },

  // Optional callback when DB data is loaded.
  onDataLoaded(databaseMap) {
    void databaseMap;
  },
};
