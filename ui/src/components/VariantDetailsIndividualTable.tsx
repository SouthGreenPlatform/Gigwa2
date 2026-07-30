import React, { use, useEffect, useMemo, useState } from "react";
import { Table, Form } from "react-bootstrap";
import "../styles/investigate.scss";
interface VariantDetilasIndivudalTableProps {
  show: boolean;
  calls: any[];
  headersParsed: string[];
  allelicGenotypes: { id: string; allelicGenotype: string[] }[];
  referenceBases: string;
  groups: string[][];
  groupFilters: Record<string, any>;
  workwithSamples: boolean;
  getGroupsForId: (id: string) => number[];
  generateBackgroundStyle: (groupIndices: number[]) => React.CSSProperties;
  missingDataInformation:object;
  regroupedCallsById:object;
  askGenotypesDisplay:boolean;
  showAllCalls:boolean;

}

const VariantDetailsIndividualTable: React.FC<VariantDetilasIndivudalTableProps> = ({
  show,
  calls,
  headersParsed,
  allelicGenotypes,
  referenceBases,
  groups,
  groupFilters,
  workwithSamples,
  getGroupsForId,
  generateBackgroundStyle,
  missingDataInformation,
  regroupedCallsById,
  showAllCalls,
  askGenotypesDisplay
  
}) => {

const HEADERS_ORDER = workwithSamples ? ["sample", "Genotype", "callSet", "Individual", "project", "run"] : ["Individual", "Genotype", "callSet", "sample", "project", "run"];

const sortedHeaders = useMemo(() => {
  return [...headersParsed].sort((a, b) => {
    const ai = HEADERS_ORDER.indexOf(a);
    const bi = HEADERS_ORDER.indexOf(b);
    if (ai === -1 && bi === -1) return 0;
    if (ai === -1) return 1;
    if (bi === -1) return -1;
    return ai - bi;
  });
}, [headersParsed]);

const filteredRegroupedCalls:Record<string,any[]> = useMemo(() => {
  console.log("show all calls: ", showAllCalls, "ask genotype display: ", askGenotypesDisplay)
  if (showAllCalls || !askGenotypesDisplay || groups.length === 0) {
    return regroupedCallsById;
  }

  const totalKeys = Object.keys(regroupedCallsById).length;

  let filtered = {};

Object.entries(regroupedCallsById).forEach(([key, value]) => {
  const individualId = key;

  if (!individualId) return;

  if (!workwithSamples) {
    const isValid = groups.some((group) => {
      return (
        group.length === 0 ||
        group.length === totalKeys ||
        group.includes(individualId)
      );
    });

    if (isValid) {
      filtered[key] = value;
    }

  } else {

    const filteredValue = value.filter((callset) => {
      const sampleId = callset?.info?.sample?.[0];

      return groups.some((group) => {
        return (
          group.length === 0 ||
          group.length === totalKeys ||
          group.includes(sampleId)
        );
      });
    });

    if (filteredValue.length > 0) {
      filtered[key] = filteredValue;
    }
  }
});
  return filtered;
}, [regroupedCallsById, groups, showAllCalls, askGenotypesDisplay]);



  let lastUsedId = null;
  let isStriped = false;

  return (
    <>
      <Table bordered hover>
        <thead className="sticky-header">
          <tr>
            {sortedHeaders.map((h, index) => (
              <th key={index}>{h}</th>
            ))}
          </tr>
        </thead>

        <tbody>
  {
  Object.entries(filteredRegroupedCalls).map(([indOrSpId, callsArrays]) => {


    return callsArrays.map((callsArray, i) => {

      const individualId = callsArray.callSetId.split("§")[1];
      const sampleId = callsArray.info?.sample?.[0];
      const usedId = workwithSamples ? sampleId : individualId;
      const callSet = callsArray.info.callSet[0];
      const groupsContaining = getGroupsForId(usedId);
      const bgStyle = generateBackgroundStyle(groupsContaining);
      if (usedId !== lastUsedId) {
        isStriped = !isStriped;
        lastUsedId = usedId;
      }

      const genotypeEntry = allelicGenotypes.find(
        (g) => g.id === callSet
      );

      return (
        <tr key={indOrSpId + "-" + i}>
          {sortedHeaders.map((header, headerIndex) => {

            const isRed =
              missingDataInformation[callSet]?.some(a => a.includes(header)) ?? false;
              

      if (header === "Individual") {
        const individualCellStyle = workwithSamples ? (isStriped ? {backgroundColor: "lightgray"} : undefined) : bgStyle;
        const individualCellClass = workwithSamples ? undefined : "fw-bold";
        return (
          <td
            key={headerIndex}
            style={individualCellStyle}
            className={individualCellClass}
          >
            {individualId}
          </td>
        );
      }

            if (header === "Genotype") {
                return (
                  <td
                    key={headerIndex}
                    style={{
                      backgroundColor:
                        isRed && genotypeEntry?.allelicGenotype?.length > 0
                          ? "red"
                          : undefined,
                    }}
                  >
                    {genotypeEntry?.allelicGenotype?.map((allele, index) => (
                      <span
                        key={index}
                        className={`investigate-allele-badge ${
                          allele === referenceBases
                            ? "investigate-allele-ref"
                            : "investigate-allele-alt"
                        }`}
                      >
                        {allele}
                      </span>
                    ))}
                  </td>
                );
              }

            return (
              
              <td
                key={headerIndex}
                style={{
                  ...(workwithSamples && header === "sample"
                    ? bgStyle
                    : isRed && callsArray.info?.[header]
                    ? { backgroundColor: "red" }
                    : {backgroundColor: isStriped ? "lightgray" : ""}),
                  fontWeight:
                    workwithSamples && header === "sample" ? "bold" : "",
                }}
              >
                {callsArray.info?.[header] || ""}
              </td>
            );
          })}
        </tr>
      );
    });
  })}
</tbody>
      </Table>
    </>
  );
};

export default VariantDetailsIndividualTable;
