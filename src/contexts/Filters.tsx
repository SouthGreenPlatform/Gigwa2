import type React from "react"
import { createContext, useContext, useState, type Dispatch, type SetStateAction, type ReactNode } from "react"

// Define types for our filter states
export type VariantFilter = {
  key: string
  geneFilter: boolean
  isCollapsed: boolean
  genesOnly: boolean
  noGene: boolean
  selectedVariantTypes: string[]
  selectedVariantEffects: string[]
  selectedNbAlleles: string[]
  selectedStart: number
  selectedEnd: number
  selectedGeneNames: string[]
  selectedSequences: string[]
  selectedVariantIDs: string[]
  nbGroups: number
}

// Define type for individual group filters
export type GroupFilter = {
  name: string
  selectedIndividuals: string[]
  heterozygosity: [number, number]
  missing: [number, number]
  maf: [number, number]
  genotypePattern: string
  mostSameRatio: string
  discriminateGroups: string
  searchableAnnotationsFilter: Record<string, any>
}

// Define the context type
type FiltersContextType = {
  // Variant filter states and setters
  variantFilters: VariantFilter
  setKey: (value: string) => void
  setGeneFilter: (value: boolean) => void
  setIsCollapsed: (value: boolean) => void
  setGenesOnly: (value: boolean) => void
  setNoGene: (value: boolean) => void
  setSelectedVariantTypes: (value: string[]) => void
  setSelectedVariantEffects: (value: string[]) => void
  setSelectedNbAlleles: (value: string[]) => void
  setSelectedStart: (value: number) => void
  setSelectedEnd: (value: number) => void
  setSelectedGeneNames: (value: string[]) => void
  setSelectedVariantIDs: (value: string[]) => void
  setSelectedSequences: (value: string[]) => void
  setNbGroups: (value: number) => void
  setVariantFilters: Dispatch<SetStateAction<VariantFilter>>

  // Group filters - stored by groupId
  groupFilters: Record<string, GroupFilter>
  setGroupFilters: Dispatch<SetStateAction<Record<string, GroupFilter>>>
  updateGroupFilter: (groupId: string, updates: Partial<GroupFilter>) => void
  resetGroupFilter: (groupId: string) => void
  setName: (groupId: string, value: string) => void
  setSelectedIndividuals: (groupId: string, value: string[]) => void
  setHeterozygosity: (groupId: string, value: [string | number, string | number]) => void
  setMissing: (groupId: string, value: [string | number, string | number]) => void
  setMaf: (groupId: string, value: [string | number, string | number]) => void
  setGenotypePattern: (groupId: string, value: string) => void
  setMostSameRatio: (GroupId: string, value: string) => void
  setDiscriminateGroups: (groupId: string, value: string) => void
  addGroup: (groupId: string) => void
  deleteGroup: (groupId: string) => void
  resetAllGroups: () => void

  // Reset all filters
  resetAllFilters: () => void
  setSearchableAnnotationsFilter: (groupId: string, annotationKey: string, value: any) => void
  resetAnnotationFilter: (groupId: string, annotationKey: string) => void
}

// Create the context with a default undefined value
const FiltersContext = createContext<FiltersContextType | undefined>(undefined)

// Default values for variant filters
const defaultVariantFilters: VariantFilter = {
  key: "filters",
  geneFilter: false,
  isCollapsed: false,
  genesOnly: false,
  noGene: false,
  selectedVariantTypes: [],
  selectedVariantEffects: [],
  selectedNbAlleles: [],
  selectedStart: -1,
  selectedEnd: -1,
  selectedGeneNames: [],
  selectedVariantIDs: [],
  selectedSequences: [],
  nbGroups: 0,
}

// Default values for group filters
const defaultGroupFilter: GroupFilter = {
  name:"",
  selectedIndividuals: [],
  heterozygosity: [0, 100],
  missing: [0, 100],
  maf: [0, 50],
  genotypePattern: "Any",
  mostSameRatio: "100",
  discriminateGroups: "null",
  searchableAnnotationsFilter: {},
}

const cloneGroupFilter = (group: GroupFilter): GroupFilter => ({
  ...group,
  selectedIndividuals: [...group.selectedIndividuals],
  heterozygosity: [...group.heterozygosity] as [number, number],
  missing: [...group.missing] as [number, number],
  maf: [...group.maf] as [number, number],
  searchableAnnotationsFilter: { ...(group.searchableAnnotationsFilter || {}) },
})

const createDefaultGroupFilter = (): GroupFilter => cloneGroupFilter(defaultGroupFilter)

const toInteger = (value: unknown, fallback = -1): number => {
  const parsed = Number.parseInt(String(value), 10)
  return Number.isNaN(parsed) ? fallback : parsed
}

const isDefaultGroupName = (name: string | undefined, groupId: string): boolean => {
  const trimmed = (name || "").trim()
  return trimmed === "" || trimmed === `Group${groupId}`
}

const normalizeGroupFilters = (groups: Record<string, GroupFilter>): Record<string, GroupFilter> => {
  const sortedEntries = Object.entries(groups).sort((a, b) => Number(a[0]) - Number(b[0]))
  const idMap: Record<string, string> = {}

  sortedEntries.forEach(([oldId], index) => {
    idMap[oldId] = String(index + 1)
  })

  const normalized: Record<string, GroupFilter> = {}
  sortedEntries.forEach(([oldId, group], index) => {
    const nextId = String(index + 1)
    const discriminateGroups =
      group.discriminateGroups && group.discriminateGroups !== "null" && group.discriminateGroups !== "none"
        ? (idMap[group.discriminateGroups] || "null")
        : "null"

    const shouldAutoRename = isDefaultGroupName(group.name, oldId)
    const nextName = shouldAutoRename ? `Group${nextId}` : group.name

    normalized[nextId] = {
      ...cloneGroupFilter(group),
      name: nextName,
      discriminateGroups,
    }
  })

  return normalized
}

// Provider component
export const FiltersProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  // State for variant filters
  const [variantFilters, setVariantFilters] = useState<VariantFilter>(defaultVariantFilters)

  // State for group filters - using an object with groupId as keys
  const [groupFilters, setGroupFilters] = useState<Record<string, GroupFilter>>({})

  // Setters for variant filters
  const setKey = (value: string) => setVariantFilters((prev) => ({ ...prev, key: value }))

  const setGeneFilter = (value: boolean) => setVariantFilters((prev) => ({ ...prev, geneFilter: value }))

  const setIsCollapsed = (value: boolean) => setVariantFilters((prev) => ({ ...prev, isCollapsed: value }))

  const setGenesOnly = (value: boolean) => setVariantFilters((prev) => ({ ...prev, genesOnly: value }))

  const setNoGene = (value: boolean) => setVariantFilters((prev) => ({ ...prev, noGene: value }))

  const setSelectedVariantTypes = (value: string[]) =>
    setVariantFilters((prev) => ({ ...prev, selectedVariantTypes: value }))

  const setSelectedVariantEffects = (value: string[]) =>
    setVariantFilters((prev) => ({ ...prev, selectedVariantEffects: value }))

  const setSelectedNbAlleles = (value: string[]) => setVariantFilters((prev) => ({ ...prev, selectedNbAlleles: value }))

  const setSelectedStart = (value: number) =>
    setVariantFilters((prev) => ({ ...prev, selectedStart: toInteger(value) }))

  const setSelectedEnd = (value: number) =>
    setVariantFilters((prev) => ({ ...prev, selectedEnd: toInteger(value) }))

  const setSelectedGeneNames = (value: string[]) => setVariantFilters((prev) => ({ ...prev, selectedGeneNames: value }))
  const setSelectedVariantIDs = (value: string[]) => setVariantFilters((prev) => ({ ...prev, selectedVariantIDs: value }))

  const setSelectedSequences = (value: string[]) => setVariantFilters((prev) => ({ ...prev, selectedSequences: value }))

  // FIXED: Improved setNbGroups function
  const setNbGroups = (value: number) => {
    const parsedValue = typeof value === "string" ? Number.parseInt(value, 10) : value
    const numValue = Number.isFinite(parsedValue) ? Math.max(0, parsedValue) : 0

    setVariantFilters((prev) => ({ ...prev, nbGroups: numValue }))

    setGroupFilters((prev) => {
      const normalized = normalizeGroupFilters(prev)
      const nextGroups: Record<string, GroupFilter> = {}

      for (let i = 1; i <= numValue; i++) {
        const key = i.toString()
        nextGroups[key] = normalized[key] ? cloneGroupFilter(normalized[key]) : createDefaultGroupFilter()
      }

      return nextGroups
    })
  }

  // Update a specific group filter
  const updateGroupFilter = (groupId: string, updates: Partial<GroupFilter>) => {
    console.log(groupId)
    setGroupFilters((prev) => {
      const currentGroupFilter = prev[groupId] ? cloneGroupFilter(prev[groupId]) : createDefaultGroupFilter()
      return {
        ...prev,
        [groupId]: {
          ...currentGroupFilter,
          ...updates,
        },
      }
    })
  }

  // Reset a specific group filter
  const resetGroupFilter = (groupId: string) => {
    setGroupFilters((prev) => ({
      ...prev,
      [groupId]: createDefaultGroupFilter(),
    }))
  }

  // Add a new group filter
  const addGroup = (_groupId: string) => {
    setGroupFilters((prev) => {
      const normalized = normalizeGroupFilters(prev)
      const nextId = (Object.keys(normalized).length + 1).toString()
      return {
        ...normalized,
        [nextId]: createDefaultGroupFilter(),
      }
    })
  }

  // Delete a specific group filter
  const deleteGroup = (groupId: string) => {
    setGroupFilters((prev) => {
      const { [groupId]: _, ...remainingGroups } = prev
      const normalizedGroups = normalizeGroupFilters(remainingGroups)

      // Update nbGroups to reflect the deletion
      const remainingCount = Object.keys(normalizedGroups).length
      setVariantFilters((variantPrev) => ({
        ...variantPrev,
        nbGroups: remainingCount,
      }))

      return normalizedGroups
    })
  }

  // FIXED: New function to reset all groups
  const resetAllGroups = () => {
    setGroupFilters({})
    setVariantFilters((prev) => ({ ...prev, nbGroups: 0 }))
  }

  // Update individual annotation fields without overwriting others
  const setSearchableAnnotationsFilter = (groupId: string, annotationKey: string, value: any) => {
    setGroupFilters((prev) => {
      const currentGroupFilter = prev[groupId] ? cloneGroupFilter(prev[groupId]) : createDefaultGroupFilter()
      const currentAnnotations = currentGroupFilter.searchableAnnotationsFilter || {}

      return {
        ...prev,
        [groupId]: {
          ...currentGroupFilter,
          searchableAnnotationsFilter: {
            ...currentAnnotations,
            [annotationKey]: value,
          },
        },
      }
    })
  }

  // Reset a specific annotation filter
  const resetAnnotationFilter = (groupId: string, annotationKey: string) => {
    setGroupFilters((prev) => {
      const currentGroupFilter = prev[groupId] ? cloneGroupFilter(prev[groupId]) : createDefaultGroupFilter()
      const currentAnnotations = { ...currentGroupFilter.searchableAnnotationsFilter }

      // Remove the specific annotation key
      delete currentAnnotations[annotationKey]

      return {
        ...prev,
        [groupId]: {
          ...currentGroupFilter,
          searchableAnnotationsFilter: currentAnnotations,
        },
      }
    })
  }

  // Reset all filters
  const resetAllFilters = () => {
    setVariantFilters(defaultVariantFilters)
    setGroupFilters({})
  }
  const setName = (groupId: string, value: string) => updateGroupFilter(groupId, { name: value })
  const setSelectedIndividuals = (groupId: string, value: string[]) =>
    updateGroupFilter(groupId, { selectedIndividuals: value })

  const setHeterozygosity = (groupId: string, value: [number, number]) =>
    updateGroupFilter(groupId, { heterozygosity: value })

  const setMissing = (groupId: string, value: [number, number]) => updateGroupFilter(groupId, { missing: value })

  const setMaf = (groupId: string, value: [number, number]) => updateGroupFilter(groupId, { maf: value })

  const setGenotypePattern = (groupId: string, value: string) => updateGroupFilter(groupId, { genotypePattern: value })

  const setMostSameRatio = (groupId: string, value: string) => updateGroupFilter(groupId, { mostSameRatio: value })

  const setDiscriminateGroups = (groupId: string, value: string) =>
    updateGroupFilter(groupId, { discriminateGroups: value })

  const value = {
    variantFilters,
    setVariantFilters,
    setKey,
    setGeneFilter,
    setIsCollapsed,
    setGenesOnly,
    setNoGene,
    setSelectedVariantTypes,
    setSelectedVariantEffects,
    setSelectedNbAlleles,
    setSelectedStart,
    setSelectedEnd,
    setSelectedGeneNames,
    setSelectedVariantIDs,
    setSelectedSequences,
    setNbGroups,
    groupFilters,
    setGroupFilters,
    updateGroupFilter,
    resetGroupFilter,
    setName,
    setSelectedIndividuals,
    setHeterozygosity,
    setMissing,
    setMaf,
    setGenotypePattern,
    setMostSameRatio,
    setDiscriminateGroups,
    resetAllFilters,
    addGroup,
    deleteGroup,
    resetAllGroups,
    setSearchableAnnotationsFilter,
    resetAnnotationFilter,
  }

  return <FiltersContext.Provider value={value}>{children}</FiltersContext.Provider>
}

// Custom hook to use the filters context
export const useFilters = () => {
  const context = useContext(FiltersContext)
  if (context === undefined) {
    throw new Error("useFilters must be used within a FiltersProvider")
  }
  return context
}
