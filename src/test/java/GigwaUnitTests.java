import static org.junit.Assert.*;

import java.io.File;
import java.io.FileInputStream;
import java.io.FileReader;
import java.io.Reader;
import java.net.MalformedURLException;
import java.util.ArrayList;
import java.util.List;
import java.util.Properties;

import javax.servlet.http.HttpServletRequest;

import org.apache.avro.AvroRemoteException;
import org.ga4gh.methods.GAException;
import org.ga4gh.methods.SearchVariantsRequest;
import org.junit.After;
import org.junit.AfterClass;
import org.junit.Before;
import org.junit.BeforeClass;
import org.junit.Test;
import org.springframework.data.mongodb.core.MongoTemplate;

import fr.cirad.mgdb.importing.VcfImport;
import fr.cirad.mgdb.service.GigwaGa4ghServiceImpl;
import fr.cirad.model.GigwaSearchVariantsRequest;
import fr.cirad.model.GigwaSearchVariantsResponse;
import fr.cirad.tools.mongo.MongoTemplateManager;

public class importVcf {
	private static FileInputStream vcfFileInputStream;
	@BeforeClass
	public static void setUpBeforeClass() throws MalformedURLException, Exception {
		Reader datasources = new FileReader("src/main/resources/datasources.properties");
		Properties p = new Properties();
		p.load(datasources);
		assertNotNull("testModule not enable in datasources.porperties",p.getProperty("testModule"));
		new VcfImport().importToMongo(false, "testModule", "testProject", "testRun", "testTechnology", new File("test/sample.vcf").toURI().toURL(), 0);
	}

	@AfterClass
	public static void tearDownAfterClass() throws Exception {
		MongoTemplateManager.get("testModule").getDb().dropDatabase();
	}

//	@Before
//	public void setUp() throws Exception {
//	}
//
//	@After
//	public void tearDown() throws Exception {
//	}
	

	
	
	/*test 1/ types : INDEL et MIXED, séquences : 29 et MT*/
	@Test
	public void test1() throws GAException, AvroRemoteException {
		GigwaSearchVariantsRequest svr = new GigwaSearchVariantsRequest();
		svr.setVariantSetId("testModule§1");
		svr.setReferenceName("29;MT");
		svr.setSelectedVariantTypes("INDEL;MIXED");
		svr.setCallSetIds(new ArrayList<>());
		svr.setCallSetIds2(new ArrayList<>());
		svr.setStart((long) -1);svr.setEnd((long) -1);
		svr.setPageSize(100);svr.setPageToken("0");
		svr.setGetGT(false);
		svr.setSearchMode(0);//only count
		GigwaGa4ghServiceImpl gigwaGa4ghServiceImpl = new GigwaGa4ghServiceImpl();
		GigwaSearchVariantsResponse gigwaSearchVariantsResponse = gigwaGa4ghServiceImpl.searchVariants(svr);

		assertTrue(gigwaSearchVariantsResponse.getCount()==15);
	}
	
	/*test 2/ nb d'allèles : 3 et 4*/
	@Test
	public void test2() throws GAException, AvroRemoteException {
		GigwaSearchVariantsRequest svr = new GigwaSearchVariantsRequest();
		svr.setAlleleCount("3;4");
		svr.setVariantSetId("testModule§1");
		svr.setCallSetIds(new ArrayList<>());
		svr.setCallSetIds2(new ArrayList<>());
		svr.setStart((long) -1);svr.setEnd((long) -1);
		svr.setPageSize(100);svr.setPageToken("0");
		svr.setGetGT(false);
		svr.setSearchMode(0);//only count
		GigwaGa4ghServiceImpl gigwaGa4ghServiceImpl = new GigwaGa4ghServiceImpl();
		GigwaSearchVariantsResponse gigwaSearchVariantsResponse = gigwaGa4ghServiceImpl.searchVariants(svr);
		
		assertTrue(gigwaSearchVariantsResponse.getCount()==5);
	}
	
	/*test 3/ position entre 1000000 et 2000000 sur séquence 1*/
	@Test
	public void test3() throws GAException, AvroRemoteException {
		GigwaSearchVariantsRequest svr = new GigwaSearchVariantsRequest();
		svr.setReferenceName("1");
		svr.setVariantSetId("testModule§1");
		svr.setCallSetIds(new ArrayList<>());
		svr.setCallSetIds2(new ArrayList<>());
		svr.setStart((long) 1000000);svr.setEnd((long) 2000000);
		svr.setPageSize(100);svr.setPageToken("0");
		svr.setGetGT(false);
		svr.setSearchMode(0);//only count
		GigwaGa4ghServiceImpl gigwaGa4ghServiceImpl = new GigwaGa4ghServiceImpl();
		GigwaSearchVariantsResponse gigwaSearchVariantsResponse = gigwaGa4ghServiceImpl.searchVariants(svr);

		assertTrue(gigwaSearchVariantsResponse.getCount()==26);
	}

	/*test 4/ position <= 9000000 et effect = (missense_variant ou 3_prime_UTR_variant)*/
	@Test
	public void test4() throws GAException, AvroRemoteException {
		GigwaSearchVariantsRequest svr = new GigwaSearchVariantsRequest();
		svr.setVariantEffect("3_prime_UTR_variant,missense_variant");
		svr.setApplyMatrixSizeLimit(false);
		svr.setReferenceName("");
		svr.setVariantSetId("testModule§1");
		svr.setCallSetIds(new ArrayList<>());
		svr.setCallSetIds2(new ArrayList<>());
		svr.setStart((long) -1);svr.setEnd((long) 9000000);
		svr.setPageSize(100);svr.setPageToken("0");
		svr.setGetGT(false);
		svr.setSearchMode(0);//only count
		GigwaGa4ghServiceImpl gigwaGa4ghServiceImpl = new GigwaGa4ghServiceImpl();
		GigwaSearchVariantsResponse gigwaSearchVariantsResponse = gigwaGa4ghServiceImpl.searchVariants(svr);

		assertTrue(gigwaSearchVariantsResponse.getCount()==6);
	}
	
	
	/*test 5/ gène impacté = ENSBTAG00000008482 ou ENSBTAG00000012899 ou ENSBTAG00000009899*/
	@Test
	public void test5() throws GAException, AvroRemoteException {
		GigwaSearchVariantsRequest svr = new GigwaSearchVariantsRequest();
		svr.setGeneName("ENSBTAG00000008482,ENSBTAG00000012899,ENSBTAG00000009899");
		svr.setApplyMatrixSizeLimit(false);
		svr.setReferenceName("");
		svr.setVariantSetId("testModule§1");
		svr.setCallSetIds(new ArrayList<>());
		svr.setCallSetIds2(new ArrayList<>());
		svr.setStart((long) -1);svr.setEnd((long) -1);
		svr.setPageSize(100);svr.setPageToken("0");
		svr.setGetGT(false);
		svr.setSearchMode(0);//only count
		GigwaGa4ghServiceImpl gigwaGa4ghServiceImpl = new GigwaGa4ghServiceImpl();
		GigwaSearchVariantsResponse gigwaSearchVariantsResponse = gigwaGa4ghServiceImpl.searchVariants(svr);

		assertTrue(gigwaSearchVariantsResponse.getCount()==13);
	}
}
