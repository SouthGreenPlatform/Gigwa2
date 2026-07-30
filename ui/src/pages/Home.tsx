import "../styles/home.scss";

import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { getConfigParam } from "../tools/commons";
import { useTermsOfUseContext } from "../contexts/TermsOfUse";

const Home = () => {
  const [adminEmail, setAdminEmail] = useState<string | undefined>(undefined);
  const imgBasePath = `${import.meta.env.BASE_URL}img/`;
  const { openTermsOfUse } = useTermsOfUseContext();

  useEffect(() => {
    getConfigParam("adminEmail").then(setAdminEmail);
  }, []);

  return (
    <div id="welcome">
      <h3>Welcome to Gigwa</h3>
      <p>
      Gigwa, which stands for “Genotype Investigator for Genome-Wide Analyses”, is an application that provides an easy and intuitive way to explore large amounts of genotyping data by filtering it not only on the basis of variant features, including functional annotations, but also matching genotype patterns. It is a fairly lightweight, web-based, platform-independent solution that may be deployed on a workstation or as a data portal. It allows to feed a MongoDB database from various data formats with up to tens of billions of genotypes, and provides a user-friendly interface to filter data in real time.
      </p>
      <p>
      The system embeds various online visualization features that are easy to operate. Gigwa also provides the means to export filtered data into several popular formats and features connectivity not only with online genomic tools, but also with standalone software such as FlapJack or IGV. Additionnally, Gigwa-hosted datasets are interoperable via two standard REST APIs: GA4GH and BrAPI.
      </p>
      <p className="margin-top bold home-float-left">
        Project homepage: <a href="https://southgreen.fr/content/gigwa" target="_blank">http://southgreen.fr/content/gigwa</a>
        <br />
        GitHub: <a href="https://github.com/SouthGreenPlatform/Gigwa2" target="_blank">https://github.com/SouthGreenPlatform/Gigwa2</a>
      </p>
      <div id="summaryTable" className="bold home-summary-table">
        <Link to="/instanceContents">Click here to view a summary of instance contents</Link>
      </div>
		
      { adminEmail && <p className="margin-top text-center">For any inquiries please contact <a href={`mailto:${adminEmail}`}>{adminEmail}</a></p> }  
		
      <div className="margin-top home-logo-row" id="logoRow">
        <a href="http://www.southgreen.fr/" target="_blank"><img alt="southgreen" height="28" src={`${imgBasePath}logo-southgreen.png`} /></a>
        <a href="http://www.cirad.fr/" target="_blank" className="margin-left"><img alt="cirad" height="28" src={`${imgBasePath}logo-cirad.png`} /></a>
        <a href="http://www.ird.fr/" target="_blank" className="margin-left"><img alt="ird" height="28" src={`${imgBasePath}logo-ird.png`} /></a>
        <a href="http://www.inrae.fr/" target="_blank" className="margin-left"><img alt="inra" height="20" src={`${imgBasePath}logo-inrae.png`} /></a>
        <a href="https://alliancebioversityciat.org/" target="_blank" className="margin-left"><img alt="bioversity intl" height="35" src={`${imgBasePath}logo-bioversity.png`} /></a>
        <a href="http://www.arcad-project.org/" target="_blank" className="margin-left"><img alt="arcad" height="25" src={`${imgBasePath}logo-arcad.png`} /></a>
      </div>
            
      <div id="ref">
        Please cite Gigwa as follows:<br/>
        Guilhem Sempéré, Adrien Pétel, Mathieu Rouard, Julien Frouin, Yann Hueber, Fabien De Bellis, Pierre Larmande,
        Gigwa v2—Extended and improved genotype investigator, GigaScience, Volume 8, Issue 5, May 2019, giz051,
        https://doi.org/10.1093/gigascience/giz051
      </div>

      <div className="margin-top text-center">
        <button type="button" className="btn btn-link p-0 terms-of-use-link" onClick={openTermsOfUse}>
          Terms of use &amp; cookies
        </button>
      </div>
	</div>
  );
};

export default Home;