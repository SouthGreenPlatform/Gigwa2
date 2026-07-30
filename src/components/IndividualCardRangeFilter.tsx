import React from "react";
import { Row, Col, InputGroup, Form } from "react-bootstrap";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faLessThanEqual } from "@fortawesome/free-solid-svg-icons";

interface IndividualCardRangeFilterProps {
  label: string;
  filterKey: string;
  groupID: string | number;
  groupFilters: Record<string, any>;
  defaultMin?: number;
  defaultMax?: number;
  setter: (groupId: string, range: [number | string, number | string]) => void;
}

const IndividualCardRangeFilter: React.FC<IndividualCardRangeFilterProps> = ({
  label,
  filterKey,
  groupID,
  groupFilters,
  defaultMin = 0,
  defaultMax = 100,
  setter,
}) => {
  const currentMin = groupFilters[groupID]?.[filterKey][0] ?? defaultMin;
  const currentMax = groupFilters[groupID]?.[filterKey][1] ?? defaultMax;

  return (
    <Row>
      <Col>
        <InputGroup className="individual-card-inputgroup">
          <Form.Control
            className="individual-card-control-sm"
            value={currentMin}
            type="number"
            min={defaultMin}
            max={defaultMax}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
              setter(groupID.toString(), [
                e.currentTarget.value ? Number(e.currentTarget.value) : "",
                currentMax,
              ]);
            }}
            onBlur={(e: React.FocusEvent<HTMLInputElement>) => {
              if (e.target.value === "") {
                setter(groupID.toString(), [defaultMin, currentMax]);
              }
              else if (Number(e.target.value) > defaultMax || Number(e.target.value) < defaultMin) {
                setter(groupID.toString(), [defaultMin, currentMax]);
              }
            }}
          />
          <InputGroup.Text className="individual-card-group-badge">
            <FontAwesomeIcon icon={faLessThanEqual} />
          </InputGroup.Text>
        </InputGroup>
      </Col>
      <Col>
        <Form.Label>{label}</Form.Label>
      </Col>
      <Col>
        <InputGroup className="individual-card-inputgroup">
          <InputGroup.Text className="individual-card-group-badge">
            <FontAwesomeIcon icon={faLessThanEqual} />
          </InputGroup.Text>
          <Form.Control
            className="individual-card-control-sm"
            value={currentMax}
            type="number"
            min={defaultMin}
            max={defaultMax}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
              setter(groupID.toString(), [
                currentMin,
                e.target.value ? Number(e.target.value) : "",
              ]);
            }}
            onBlur={(e: React.FocusEvent<HTMLInputElement>) => {
              if (e.target.value === "") {
                setter(groupID.toString(), [currentMin, defaultMax]);
              }
              else if (Number(e.target.value) > defaultMax || Number(e.target.value) < defaultMin) {
                setter(groupID.toString(), [currentMin, defaultMax]);
              }  
            }}
          />
        </InputGroup>
      </Col>
    </Row>
  );
};

export default IndividualCardRangeFilter;