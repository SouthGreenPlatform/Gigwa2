import { Form } from "react-bootstrap";
import { useState, useEffect } from 'react';
// import api from "../ApiService";
import { useApi } from "../contexts/Authentication.tsx";
import endpoints from '../endpoints';

interface ReferenceSet{
  id: string;
  name: string;
  md5checksum: string;
  description: string;
  sourceAccessions: string[];
  isDerived: boolean;
}

interface DatabaseSelectProps {
  value: string | undefined;
  onChange: (value: string) => void;
  newDb?: boolean;
  writable?: boolean;
}

function DatabaseSelect({ value, onChange, newDb = false, writable = false}: DatabaseSelectProps) {
  const [databases, setDatabases] = useState<ReferenceSet[]>([]);
  const api = useApi();

  useEffect(() => {	
    // Fetch databases
    api.post(endpoints.GA4GH_SEARCH_REFERENCESETS_URL,
      {"assemblyId":null,"md5checksum":null,"accession":null,"pageSize":null,"pageToken":null},
      { headers: {
        'Content-Type': 'application/json',
        'writable': writable
      }})
      .then(response => {
      const dbs = response.data.referenceSets;
      if (value && !dbs.some((db: ReferenceSet) => db.id === value)) {
        setDatabases([...dbs, { id: value, name: value } as ReferenceSet]);
      } else {
        setDatabases(dbs);
      }
      // if no user selection then the element which appears selected is well kept when submitting form
      if (!value && dbs.length > 0) {
        onChange(dbs[0].id);
      }
    });
  }, []);

  const handleChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    onChange(event.target.value);
  };
  
  return (
    <Form.Select 
      name="selectedDb"
      aria-label="Default select example"  
      value={value} 
      onChange={handleChange}
    >
      { newDb &&
        <option value="">{newDb ? "- new database -": "- Nothing selected -"}</option>
      }
      {databases.map(db => (
        <option key={db.id} value={db.id}>
        {db.name}
        </option>
      ))}
    </Form.Select>
  )
}

export default DatabaseSelect;