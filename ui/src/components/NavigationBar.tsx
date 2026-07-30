import { Navbar, Nav, Button, NavDropdown } from "react-bootstrap";
import { useLocation, matchPath, Link, useNavigate, useParams, useMatch } from "react-router-dom";
import { useAuth } from "../contexts/Authentication.tsx";
import endpoints from "../endpoints";
import { useFullModal } from "../hooks/useFullModal.tsx";
import FullModal from "./FullModal.tsx";
import DatasetSelection from "../pages/DatasetSelection.tsx";
import { useEffect, useState, useRef } from "react";
import { useCustomLogo } from "../hooks/useCustomLogo";
import "../styles/navbar.scss";

const NavigationBar = () => {
  const { isAuthenticated, username, logout } = useAuth();
  const { logoUrl: customLogoUrl, logoHref: customLogoHref } = useCustomLogo();
  const [dsKey, setDsKey] = useState(0);
  const dsRef = useRef<any>(null);
  const isFirstAuthMount = useRef(true);
  const dsResetRef = useRef(false);
  const { showFullModal, fullModalContent, handleOpenFullModal, handleCloseFullModal } = useFullModal();
  const navigate = useNavigate();
  const match = useMatch("/investigate/:taxon?/:dbOrProjects?/:assembly?");
  const { taxon, dbOrProjects, assembly } = match?.params || {};
  const database = dbOrProjects?.includes('§') ? dbOrProjects.split(',')[0].split('§')[0] : (dbOrProjects || "");
  const projects = dbOrProjects?.includes('§') ? dbOrProjects : "";
  useEffect(() => {
    if (isFirstAuthMount.current) { isFirstAuthMount.current = false; return; }
    setDsKey(k => k + 1);
  }, [isAuthenticated]);

  useEffect(() => {
    dsResetRef.current = false;
  }, [dsKey]);

  const handleLogout = () => {
    logout();
    const returnTo = new URL('./', document.baseURI).href;
    window.location.href = `${endpoints.LOGOUT_URL}?returnTo=${encodeURIComponent(returnTo)}`;
  };

  const location = useLocation();
  const showDatasetSelection = location.pathname === "/" || matchPath("/investigate/:taxon?/:dbOrProjects?/:assembly?", location.pathname);
  return (
    <>
      <Navbar bg="success" expand="sm" className="navbar-horizontal-padding">
      <Navbar.Brand
        style={{"textDecorationLine":"none"}}
        className="navbar-brand-margin"
        as={Link}
        to="/"
        onClick={e => {
          e.preventDefault();
          dsResetRef.current = true;
          setDsKey(k => k + 1); // Force remount DatasetSelection
          navigate("/");        // Go to root
        }}
      >
        Gigwa
      </Navbar.Brand>
      {customLogoUrl && (
        customLogoHref ? (
          <a
            href={customLogoHref}
            target="_blank"
            rel="noopener noreferrer"
            className="navbar-custom-logo-link"
          >
            <img src={customLogoUrl} alt="" className="navbar-custom-logo" />
          </a>
        ) : (
          <img src={customLogoUrl} alt="" className="navbar-custom-logo" />
        )
      )}
        <Nav>
          {showDatasetSelection && <DatasetSelection key={dsKey} ref={dsRef} initialAssembly={dsResetRef.current ? "" : assembly} initialDatabase={dsResetRef.current ? "" : database} initialProjects={dsResetRef.current ? "" : projects} initialTaxon={dsResetRef.current ? "Any taxon" : taxon} />}
        </Nav>
        <Navbar.Toggle aria-controls="basic-navbar-nav" />
        <Navbar.Collapse id="basic-navbar-nav">
          <Nav className="ms-auto">
            <Nav.Link as={Link} to="/">Home</Nav.Link>
            <NavDropdown title="Manage data">
              <NavDropdown.Item as={Link} to="/importDataWizard">Import Data Wizard</NavDropdown.Item>
              <NavDropdown.Item as={Link} to="/importDataAccordion">Import Data Accordion </NavDropdown.Item>
              <NavDropdown.Item as={Link} to="/importMetadata">Import Metadata</NavDropdown.Item>
            </NavDropdown>
            <Nav.Link onClick={() => handleOpenFullModal({ url: endpoints.SWAGGER_URL, title: "Rest APIs"})}>Rest APIs</Nav.Link>
            <Nav.Link onClick={() => handleOpenFullModal({ url: endpoints.DOCS_URL, title: "Documentation" })}>Docs</Nav.Link>
          </Nav>
          <Nav>
            {isAuthenticated ? (
              <Button
                title={`Log out ${username}`}
                variant="outline-danger"
                onClick={handleLogout}
              >
                Log out
              </Button>
            ) : (
              <Nav.Link as={Link} to="/login">
                Login
              </Nav.Link>
            )}
          </Nav>
        </Navbar.Collapse>
      </Navbar>

      <FullModal
        show={showFullModal}
        onClose={handleCloseFullModal}
        title={fullModalContent?.title || ""}
      >
        {fullModalContent?.url ? (
          <iframe
            src={fullModalContent.url}
            className="full-modal-iframe"
          />
        ) : ""
      }
      </FullModal>
    </>
  );
};

export default NavigationBar;