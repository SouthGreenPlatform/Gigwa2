import "./styles/App.scss";
import { AuthGate, AuthProvider } from "./contexts/Authentication";
import Login from "./pages/Login";
import { Routes, Route, HashRouter as Router } from "react-router-dom";
import NavigationBar from "./components/NavigationBar";
import Home from "./pages/Home";
import InstanceContent from "./pages/InstanceContents";

import ImportWizard from "./Import/ImportWizard";
import ImportDataAccordion from "./Import/ImportDataAccordion.tsx";
import ImportMetadata from "./Import/ImportMetadata.tsx";

import Investigate from "./pages/Investigate";
import { FiltersProvider } from "./contexts/Filters";
import { TermsOfUseProvider } from "./contexts/TermsOfUse";

function App() {
  return (
    <AuthProvider>
      <AuthGate>
      <Router>
        <TermsOfUseProvider>
        <div className="app-shell">
        <NavigationBar />
        <div className="app-content-scroll">
        <Routes>
          <Route path="/" element={<Home/>} />
          {/* <Route path="/Search" element={<DatasetSelection/>} /> */}
          <Route path="/login" element={<Login/>} />
          <Route path="/resetPassword.do" element={<Login resetOnMount />} />
          <Route path="/instanceContents" element={<InstanceContent/>} />
          <Route path="/investigate/:taxon?/:dbOrProjects?/:assembly?" element={<FiltersProvider><Investigate/></FiltersProvider>} />
          <Route path="/importDataWizard" element={<ImportWizard/>} />
          <Route path="/importDataAccordion" element={<ImportDataAccordion/>} />
          <Route path="/importMetadata" element={<ImportMetadata/>} />
          {/* <Route path="/investigate" element={<FiltersProvider><Investigate/></FiltersProvider>} /> */}
        </Routes>
        </div>
        </div>
        </TermsOfUseProvider>
      </Router>
      </AuthGate>
    </AuthProvider>
  );
}

export default App;