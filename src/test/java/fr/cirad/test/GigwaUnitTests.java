package fr.cirad.test;
import static org.junit.Assert.assertTrue;

import java.io.File;
import java.io.FileReader;
import java.io.Reader;
import java.net.MalformedURLException;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.HashMap;
import java.util.Properties;

import org.apache.avro.AvroRemoteException;
import org.ga4gh.methods.GAException;
import org.junit.AfterClass;
import org.junit.BeforeClass;
import org.junit.Test;

import fr.cirad.mgdb.importing.VcfImport;
import fr.cirad.mgdb.model.mongo.maintypes.Assembly;
import fr.cirad.mgdb.model.mongo.maintypes.VariantData;
import fr.cirad.mgdb.service.GigwaGa4ghServiceImpl;
import fr.cirad.model.GigwaSearchVariantsRequest;
import fr.cirad.model.GigwaSearchVariantsResponse;
import fr.cirad.tools.mongo.MongoTemplateManager;

public class GigwaUnitTests {
	
	/* TODO: also use setMinMissingData() */

	@BeforeClass
	public static void setUpBeforeClass() throws MalformedURLException, Exception {
		Reader datasources = new FileReader("src/main/resources/datasources.properties");
		Properties p = new Properties();
		p.load(datasources);
		assertTrue("Tests require a datasource named 'testModule' to be declared in datasources.propperties", p.getProperty("*testModule") != null || p.getProperty("testModule") != null);
		new VcfImport().importToMongo(false, "testModule", "testProject", "testRun", "testTechnology", new File("test/sample.vcf").toURI().toURL(), null, null, false, 0);
		Assembly.setThreadAssembly(0);
	}

	@AfterClass
	public static void tearDownAfterClass() throws Exception {
		MongoTemplateManager.get("testModule").getDb().drop();
	}

//	@Before
//	public void setUp() throws Exception {
//	}
//
//	@After
//	public void tearDown() throws Exception {
//	}
	
	/*test 0/ comptage sans filtre*/
	@Test
	public void test00() throws GAException, AvroRemoteException {
		GigwaSearchVariantsRequest svr = new GigwaSearchVariantsRequest();

		svr.setApplyMatrixSizeLimit(false);
		svr.setVariantSetId("testModule§1");
		svr.setCallSetIds(new ArrayList<>());
		svr.setCallSetIds2(new ArrayList<>());
		svr.setGetGT(false);
		svr.setSearchMode(0);//only count
				
		GigwaGa4ghServiceImpl gigwaGa4ghServiceImpl = new GigwaGa4ghServiceImpl();
		GigwaSearchVariantsResponse gigwaSearchVariantsResponse = gigwaGa4ghServiceImpl.searchVariants(svr);

		assertTrue(gigwaSearchVariantsResponse.getCount() == 807);
	}
	
	/*test 1/ types : INDEL et MIXED, séquences : 29 et MT*/
	@Test
	public void test01() throws GAException, AvroRemoteException {
		GigwaSearchVariantsRequest svr = new GigwaSearchVariantsRequest();

		svr.setSelectedVariantTypes("INDEL;MIXED");
		svr.setReferenceName("29;MT");
		
		svr.setVariantSetId("testModule§1");
		svr.setCallSetIds(new ArrayList<>());
		svr.setCallSetIds2(new ArrayList<>());
		svr.setGetGT(false);
		svr.setSearchMode(0);//only count
		GigwaGa4ghServiceImpl gigwaGa4ghServiceImpl = new GigwaGa4ghServiceImpl();
		GigwaSearchVariantsResponse gigwaSearchVariantsResponse = gigwaGa4ghServiceImpl.searchVariants(svr);

		assertTrue(gigwaSearchVariantsResponse.getCount() == 15);
	}
	
	/*test 2/ nb d'allèles : 3 et 4*/
	@Test
	public void test02() throws GAException, AvroRemoteException {
		GigwaSearchVariantsRequest svr = new GigwaSearchVariantsRequest();

		svr.setAlleleCount("3;4");
		
		svr.setVariantSetId("testModule§1");
		svr.setCallSetIds(new ArrayList<>());
		svr.setCallSetIds2(new ArrayList<>());
		svr.setGetGT(false);
		svr.setSearchMode(0);//only count
		GigwaGa4ghServiceImpl gigwaGa4ghServiceImpl = new GigwaGa4ghServiceImpl();
		GigwaSearchVariantsResponse gigwaSearchVariantsResponse = gigwaGa4ghServiceImpl.searchVariants(svr);
		
		assertTrue(gigwaSearchVariantsResponse.getCount() == 5);
	}
	
	/*test 3/ position entre 1000000 et 2000000 sur séquence 1*/
	@Test
	public void test03() throws GAException, AvroRemoteException {
		GigwaSearchVariantsRequest svr = new GigwaSearchVariantsRequest();

		svr.setReferenceName("1");
		
		svr.setVariantSetId("testModule§1");
		svr.setCallSetIds(new ArrayList<>());
		svr.setCallSetIds2(new ArrayList<>());
		svr.setStart((long) 1000000);
		svr.setEnd((long) 2000000);
		svr.setGetGT(false);
		svr.setSearchMode(0);//only count
		GigwaGa4ghServiceImpl gigwaGa4ghServiceImpl = new GigwaGa4ghServiceImpl();
		GigwaSearchVariantsResponse gigwaSearchVariantsResponse = gigwaGa4ghServiceImpl.searchVariants(svr);

		assertTrue(gigwaSearchVariantsResponse.getCount() == 26);
	}

	/*test 4/ position <= 9000000 et effect = (missense_variant ou 3_prime_UTR_variant)*/
	@Test
	public void test04() throws GAException, AvroRemoteException {
		GigwaSearchVariantsRequest svr = new GigwaSearchVariantsRequest();

		svr.setVariantEffect("3_prime_UTR_variant,missense_variant");

		svr.setVariantSetId("testModule§1");
		svr.setCallSetIds(new ArrayList<>());
		svr.setCallSetIds2(new ArrayList<>());
		svr.setEnd((long) 9000000);
		svr.setGetGT(false);
		svr.setSearchMode(0);//only count
		GigwaGa4ghServiceImpl gigwaGa4ghServiceImpl = new GigwaGa4ghServiceImpl();
		GigwaSearchVariantsResponse gigwaSearchVariantsResponse = gigwaGa4ghServiceImpl.searchVariants(svr);

		assertTrue(gigwaSearchVariantsResponse.getCount() == 6);
	}
	
	/*test 5/ gène impacté = ENSBTAG00000008482 ou ENSBTAG00000012899 ou ENSBTAG00000009899*/
	@Test
	public void test05() throws GAException, AvroRemoteException {
		GigwaSearchVariantsRequest svr = new GigwaSearchVariantsRequest();

		svr.setGeneName("ENSBTAG00000008482,ENSBTAG00000012899,ENSBTAG00000009899");

		svr.setVariantSetId("testModule§1");
		svr.setCallSetIds(new ArrayList<>());
		svr.setCallSetIds2(new ArrayList<>());
		svr.setGetGT(false);
		svr.setSearchMode(0);//only count
		GigwaGa4ghServiceImpl gigwaGa4ghServiceImpl = new GigwaGa4ghServiceImpl();
		GigwaSearchVariantsResponse gigwaSearchVariantsResponse = gigwaGa4ghServiceImpl.searchVariants(svr);

		assertTrue(gigwaSearchVariantsResponse.getCount() == 13);
	}
	
	/*test 6/ séquence = 1 et position <= 4000000 et gène impacté = aucun*/
	@Test
	public void test06() throws GAException, AvroRemoteException {
		GigwaSearchVariantsRequest svr = new GigwaSearchVariantsRequest();

		svr.setReferenceName("1");
		svr.setGeneName("-");
		
		svr.setVariantSetId("testModule§1");
		svr.setCallSetIds(new ArrayList<>());
		svr.setCallSetIds2(new ArrayList<>());
		svr.setEnd((long) 4000000);
		svr.setGetGT(false);
		svr.setSearchMode(0);//only count
		GigwaGa4ghServiceImpl gigwaGa4ghServiceImpl = new GigwaGa4ghServiceImpl();
		GigwaSearchVariantsResponse gigwaSearchVariantsResponse = gigwaGa4ghServiceImpl.searchVariants(svr);

		assertTrue(gigwaSearchVariantsResponse.getCount() == 6);
	}
	
	/*test 7/ nb d'allèles = 3 ou 4 et un au moins gène impacté
	 * (il doit y avoir une qlq chose dans la colonne gene du tableau de résultats)*/
	@Test
	public void test07() throws GAException, AvroRemoteException {
		GigwaSearchVariantsRequest svr = new GigwaSearchVariantsRequest();

		svr.setGeneName("+");

		svr.setAlleleCount("3;4");
		svr.setVariantSetId("testModule§1");
		svr.setCallSetIds(new ArrayList<>());
		svr.setCallSetIds2(new ArrayList<>());
		svr.setGetGT(false);
		svr.setSearchMode(0);//only count
		GigwaGa4ghServiceImpl gigwaGa4ghServiceImpl = new GigwaGa4ghServiceImpl();
		GigwaSearchVariantsResponse gigwaSearchVariantsResponse = gigwaGa4ghServiceImpl.searchVariants(svr);

		assertTrue(gigwaSearchVariantsResponse.getCount() == 5);
	}
	
	
	/* ------------------
	 * (à partir du test 8 jusqu'au 25 on considère que groupe d'individus 1
	 * = tous les individus qui commencent par BO)
	 * ------------------
	 */
	
	
	/*test 8/ sur groupe 1 : Max missing data=20%*/
	@Test
	public void test08() throws GAException, AvroRemoteException {
		GigwaSearchVariantsRequest svr = new GigwaSearchVariantsRequest();

		svr.setCallSetIds(new ArrayList<>(Arrays.asList("testModule§1§BO1", "testModule§1§BO2", "testModule§1§BO4", "testModule§1§BO5", "testModule§1§BO6")));
		svr.setMaxMissingData(20f);

		svr.setVariantSetId("testModule§1");
		svr.setCallSetIds2(new ArrayList<>());
		svr.setGetGT(false);
		svr.setSearchMode(0);//only count
		GigwaGa4ghServiceImpl gigwaGa4ghServiceImpl = new GigwaGa4ghServiceImpl();
		GigwaSearchVariantsResponse gigwaSearchVariantsResponse = gigwaGa4ghServiceImpl.searchVariants(svr);

		assertTrue(gigwaSearchVariantsResponse.getCount() == 695);
	}
	
	/*test 9/ nb d'allèles = 2 et sur groupe 1 : Max missing data=20% et GQ>=50*/
	@SuppressWarnings("serial")
	@Test
	public void test09() throws GAException, AvroRemoteException {
		GigwaSearchVariantsRequest svr = new GigwaSearchVariantsRequest();

		svr.setCallSetIds(new ArrayList<>(Arrays.asList("testModule§1§BO1", "testModule§1§BO2", "testModule§1§BO4", "testModule§1§BO5", "testModule§1§BO6")));
		svr.setAnnotationFieldThresholds(new HashMap<String, Float>(){{put(VariantData.GT_FIELD_GQ, 50f);}});
		svr.setMaxMissingData(20f);

		svr.setAlleleCount("2");
		svr.setVariantSetId("testModule§1");
		svr.setCallSetIds2(new ArrayList<>());
		svr.setGetGT(false);
		svr.setSearchMode(0);//only count
		GigwaGa4ghServiceImpl gigwaGa4ghServiceImpl = new GigwaGa4ghServiceImpl();
		GigwaSearchVariantsResponse gigwaSearchVariantsResponse = gigwaGa4ghServiceImpl.searchVariants(svr);

		assertTrue(gigwaSearchVariantsResponse.getCount() == 179);
	}
	
	/*test 10/ nb d'allèles = 2 et sur groupe 1 : Max missing data=20% et GQ>=50 et MAF = 25%*/
	@SuppressWarnings("serial")
	@Test
	public void test10() throws GAException, AvroRemoteException {
		GigwaSearchVariantsRequest svr = new GigwaSearchVariantsRequest();

		svr.setCallSetIds(new ArrayList<>(Arrays.asList("testModule§1§BO1", "testModule§1§BO2", "testModule§1§BO4", "testModule§1§BO5", "testModule§1§BO6")));
		svr.setAnnotationFieldThresholds(new HashMap<String, Float>(){{put(VariantData.GT_FIELD_GQ, 50f);}});
		svr.setMaxMissingData(20f);
		svr.setMinMaf(25f);
		svr.setMaxMaf(25f);

		svr.setAlleleCount("2");
		svr.setVariantSetId("testModule§1");
		svr.setCallSetIds2(new ArrayList<>());
		svr.setGetGT(false);
		svr.setSearchMode(0);//only count
		GigwaGa4ghServiceImpl gigwaGa4ghServiceImpl = new GigwaGa4ghServiceImpl();
		GigwaSearchVariantsResponse gigwaSearchVariantsResponse = gigwaGa4ghServiceImpl.searchVariants(svr);

		assertTrue(gigwaSearchVariantsResponse.getCount() == 8);
	}
	
	/*test 11/ nb d'allèles = 2 et sur groupe 1 : Max missing data=20% et GQ>=50 et 25%<=MAF<=50%*/
	@SuppressWarnings("serial")
	@Test
	public void test11() throws GAException, AvroRemoteException {
		GigwaSearchVariantsRequest svr = new GigwaSearchVariantsRequest();

		svr.setCallSetIds(new ArrayList<>(Arrays.asList("testModule§1§BO1", "testModule§1§BO2", "testModule§1§BO4", "testModule§1§BO5", "testModule§1§BO6")));
		svr.setAnnotationFieldThresholds(new HashMap<String, Float>(){{put(VariantData.GT_FIELD_GQ, 50f);}});
		svr.setMaxMissingData(20f);
		svr.setMinMaf(25f);
		svr.setMaxMaf(50f);

		svr.setAlleleCount("2");
		svr.setVariantSetId("testModule§1");
		svr.setCallSetIds2(new ArrayList<>());
		svr.setGetGT(false);
		svr.setSearchMode(0);//only count
		GigwaGa4ghServiceImpl gigwaGa4ghServiceImpl = new GigwaGa4ghServiceImpl();
		GigwaSearchVariantsResponse gigwaSearchVariantsResponse = gigwaGa4ghServiceImpl.searchVariants(svr);

		assertTrue(gigwaSearchVariantsResponse.getCount() == 67);
	}
	
	/*test 12/ nb d'allèles = 2 et sur groupe 1 : Max missing data=20% et GQ>=50 et 25%<=MAF<=50%
	 *  et pattern=not all the same*/
	@SuppressWarnings("serial")
	@Test
	public void test12() throws GAException, AvroRemoteException {
		GigwaSearchVariantsRequest svr = new GigwaSearchVariantsRequest();

		svr.setCallSetIds(new ArrayList<>(Arrays.asList("testModule§1§BO1", "testModule§1§BO2", "testModule§1§BO4", "testModule§1§BO5", "testModule§1§BO6")));
		svr.setAnnotationFieldThresholds(new HashMap<String, Float>(){{put(VariantData.GT_FIELD_GQ, 50f);}});
		svr.setMaxMissingData(20f);
		svr.setMinMaf(25f);
		svr.setMaxMaf(50f);
		svr.setGtPattern("Not all the same");

		svr.setAlleleCount("2");
		svr.setVariantSetId("testModule§1");
		svr.setCallSetIds2(new ArrayList<>());
		svr.setGetGT(false);
		svr.setSearchMode(0);//only count
		GigwaGa4ghServiceImpl gigwaGa4ghServiceImpl = new GigwaGa4ghServiceImpl();
		GigwaSearchVariantsResponse gigwaSearchVariantsResponse = gigwaGa4ghServiceImpl.searchVariants(svr);

		assertTrue(gigwaSearchVariantsResponse.getCount() == 47);
	}
	
	/*test 13/ nb d'allèles = 2 et sur groupe 1 : Max missing data=20% et GQ>=50 et 25%<=MAF<=50%
	 *  et pattern=mostly all the same 75%*/
	@SuppressWarnings("serial")
	@Test
	public void test13() throws GAException, AvroRemoteException {
		GigwaSearchVariantsRequest svr = new GigwaSearchVariantsRequest();

		svr.setCallSetIds(new ArrayList<>(Arrays.asList("testModule§1§BO1", "testModule§1§BO2", "testModule§1§BO4", "testModule§1§BO5", "testModule§1§BO6")));
		svr.setAnnotationFieldThresholds(new HashMap<String, Float>(){{put(VariantData.GT_FIELD_GQ, 50f);}});
		svr.setMaxMissingData(20f);
		svr.setMinMaf(25f);
		svr.setMaxMaf(50f);
		svr.setGtPattern("All or mostly the same");
		svr.setMostSameRatio(75);

		svr.setAlleleCount("2");
		svr.setVariantSetId("testModule§1");
		svr.setCallSetIds2(new ArrayList<>());
		svr.setGetGT(false);
		svr.setSearchMode(0);//only count
		GigwaGa4ghServiceImpl gigwaGa4ghServiceImpl = new GigwaGa4ghServiceImpl();
		GigwaSearchVariantsResponse gigwaSearchVariantsResponse = gigwaGa4ghServiceImpl.searchVariants(svr);

		assertTrue(gigwaSearchVariantsResponse.getCount() == 36);
	}
	
	/*test 14/ nb d'allèles = 2 et sur groupe 1 : Max missing data=20% et GQ>=50
	 * et pattern=all homozygous ref*/
	@SuppressWarnings("serial")
	@Test
	public void test14() throws GAException, AvroRemoteException {
		GigwaSearchVariantsRequest svr = new GigwaSearchVariantsRequest();

		svr.setCallSetIds(new ArrayList<>(Arrays.asList("testModule§1§BO1", "testModule§1§BO2", "testModule§1§BO4", "testModule§1§BO5", "testModule§1§BO6")));
		svr.setAnnotationFieldThresholds(new HashMap<String, Float>(){{put(VariantData.GT_FIELD_GQ, 50f);}});
		svr.setMaxMissingData(20f);
		svr.setGtPattern("All Homozygous Ref");
		
		svr.setAlleleCount("2");
		svr.setVariantSetId("testModule§1");
		svr.setCallSetIds2(new ArrayList<>());
		svr.setGetGT(false);
		svr.setSearchMode(0);//only count
		GigwaGa4ghServiceImpl gigwaGa4ghServiceImpl = new GigwaGa4ghServiceImpl();
		GigwaSearchVariantsResponse gigwaSearchVariantsResponse = gigwaGa4ghServiceImpl.searchVariants(svr);

		assertTrue(gigwaSearchVariantsResponse.getCount() == 25);
	}
	
	/*test 15/ nb d'allèles = 2 et sur groupe 1 : Max missing data=20% et GQ>=50 et 25%<=MAF<=50%
	 *  et pattern=some homozygous ref*/
	@SuppressWarnings("serial")
	@Test
	public void test15() throws GAException, AvroRemoteException {
		GigwaSearchVariantsRequest svr = new GigwaSearchVariantsRequest();

		svr.setCallSetIds(new ArrayList<>(Arrays.asList("testModule§1§BO1", "testModule§1§BO2", "testModule§1§BO4", "testModule§1§BO5", "testModule§1§BO6")));
		svr.setAnnotationFieldThresholds(new HashMap<String, Float>(){{put(VariantData.GT_FIELD_GQ, 50f);}});
		svr.setMaxMissingData(20f);
		svr.setMinMaf(25f);
		svr.setMaxMaf(50f);
		svr.setGtPattern("Some Homozygous Ref");

		svr.setAlleleCount("2");
		svr.setVariantSetId("testModule§1");
		svr.setCallSetIds2(new ArrayList<>());
		svr.setGetGT(false);
		svr.setSearchMode(0);//only count
		GigwaGa4ghServiceImpl gigwaGa4ghServiceImpl = new GigwaGa4ghServiceImpl();
		GigwaSearchVariantsResponse gigwaSearchVariantsResponse = gigwaGa4ghServiceImpl.searchVariants(svr);

		assertTrue(gigwaSearchVariantsResponse.getCount() == 40);
	}
	
	/*test 16/ nb d'allèles = 2 et sur groupe 1 : Max missing data=20% et GQ>=50
	 * et pattern=all homozygous var*/
	@SuppressWarnings("serial")
	@Test
	public void test16() throws GAException, AvroRemoteException {
		GigwaSearchVariantsRequest svr = new GigwaSearchVariantsRequest();

		svr.setCallSetIds(new ArrayList<>(Arrays.asList("testModule§1§BO1", "testModule§1§BO2", "testModule§1§BO4", "testModule§1§BO5", "testModule§1§BO6")));
		svr.setAnnotationFieldThresholds(new HashMap<String, Float>(){{put(VariantData.GT_FIELD_GQ, 50f);}});
		svr.setMaxMissingData(20f);
		svr.setGtPattern("All Homozygous Var");

		svr.setAlleleCount("2");
		svr.setVariantSetId("testModule§1");
		svr.setCallSetIds2(new ArrayList<>());
		svr.setGetGT(false);
		svr.setSearchMode(0);//only count
		GigwaGa4ghServiceImpl gigwaGa4ghServiceImpl = new GigwaGa4ghServiceImpl();
		GigwaSearchVariantsResponse gigwaSearchVariantsResponse = gigwaGa4ghServiceImpl.searchVariants(svr);

		assertTrue(gigwaSearchVariantsResponse.getCount() == 20);
	}
	
	/*test 17/ nb d'allèles = 2 et sur groupe 1 : Max missing data=20% et GQ>=50 et 25%<=MAF<=50%
	 * et pattern=some homozygous var*/
	@SuppressWarnings("serial")
	@Test
	public void test17() throws GAException, AvroRemoteException {
		GigwaSearchVariantsRequest svr = new GigwaSearchVariantsRequest();

		svr.setCallSetIds(new ArrayList<>(Arrays.asList("testModule§1§BO1", "testModule§1§BO2", "testModule§1§BO4", "testModule§1§BO5", "testModule§1§BO6")));
		svr.setAnnotationFieldThresholds(new HashMap<String, Float>(){{put(VariantData.GT_FIELD_GQ, 50f);}});
		svr.setMaxMissingData(20f);
		svr.setMinMaf(25f);
		svr.setMaxMaf(50f);
		svr.setGtPattern("Some Homozygous Var");

		svr.setAlleleCount("2");
		svr.setVariantSetId("testModule§1");
		svr.setCallSetIds2(new ArrayList<>());
		svr.setGetGT(false);
		svr.setSearchMode(0);//only count
		GigwaGa4ghServiceImpl gigwaGa4ghServiceImpl = new GigwaGa4ghServiceImpl();
		GigwaSearchVariantsResponse gigwaSearchVariantsResponse = gigwaGa4ghServiceImpl.searchVariants(svr);

		assertTrue(gigwaSearchVariantsResponse.getCount() == 16);
	}
	
	/*test 18/ nb d'allèles = 2 et sur groupe 1 : Max missing data=20% et GQ>=50 et 25%<=MAF<=50%
	 * et pattern=all heterozygous*/
	@SuppressWarnings("serial")
	@Test
	public void test18() throws GAException, AvroRemoteException {
		GigwaSearchVariantsRequest svr = new GigwaSearchVariantsRequest();

		svr.setCallSetIds(new ArrayList<>(Arrays.asList("testModule§1§BO1", "testModule§1§BO2", "testModule§1§BO4", "testModule§1§BO5", "testModule§1§BO6")));
		svr.setAnnotationFieldThresholds(new HashMap<String, Float>(){{put(VariantData.GT_FIELD_GQ, 50f);}});
		svr.setMaxMissingData(20f);
		svr.setMinMaf(25f);
		svr.setMaxMaf(50f);
		svr.setGtPattern("All Heterozygous");

		svr.setAlleleCount("2");
		svr.setVariantSetId("testModule§1");
		svr.setCallSetIds2(new ArrayList<>());
		svr.setGetGT(false);
		svr.setSearchMode(0);//only count
		GigwaGa4ghServiceImpl gigwaGa4ghServiceImpl = new GigwaGa4ghServiceImpl();
		GigwaSearchVariantsResponse gigwaSearchVariantsResponse = gigwaGa4ghServiceImpl.searchVariants(svr);

		assertTrue(gigwaSearchVariantsResponse.getCount() == 20);
	}
	
	/*test 19/ nb d'allèles = 2 et sur groupe 1 : Max missing data=20% et GQ>=50 et 25%<=MAF<=50%
	 * et pattern=some heterozygous*/
	@SuppressWarnings("serial")
	@Test
	public void test19() throws GAException, AvroRemoteException {
		GigwaSearchVariantsRequest svr = new GigwaSearchVariantsRequest();

		svr.setCallSetIds(new ArrayList<>(Arrays.asList("testModule§1§BO1", "testModule§1§BO2", "testModule§1§BO4", "testModule§1§BO5", "testModule§1§BO6")));
		svr.setAnnotationFieldThresholds(new HashMap<String, Float>(){{put(VariantData.GT_FIELD_GQ, 50f);}});
		svr.setMaxMissingData(20f);
		svr.setMinMaf(25f);
		svr.setMaxMaf(50f);
		svr.setGtPattern("Some Heterozygous");

		svr.setAlleleCount("2");
		svr.setVariantSetId("testModule§1");
		svr.setCallSetIds2(new ArrayList<>());
		svr.setGetGT(false);
		svr.setSearchMode(0);//only count
		GigwaGa4ghServiceImpl gigwaGa4ghServiceImpl = new GigwaGa4ghServiceImpl();
		GigwaSearchVariantsResponse gigwaSearchVariantsResponse = gigwaGa4ghServiceImpl.searchVariants(svr);

		assertTrue(gigwaSearchVariantsResponse.getCount() == 65);
	}
	
	/*test 20/ nb d'allèles = 2 et sur groupe 1 : Max missing data=20% et GQ>=50 et 25%<=MAF<=50%
	 * et pattern=without abnormal heterozigosity*/
	@SuppressWarnings("serial")
	@Test
	public void test20() throws GAException, AvroRemoteException {
		GigwaSearchVariantsRequest svr = new GigwaSearchVariantsRequest();

		svr.setCallSetIds(new ArrayList<>(Arrays.asList("testModule§1§BO1", "testModule§1§BO2", "testModule§1§BO4", "testModule§1§BO5", "testModule§1§BO6")));
		svr.setAnnotationFieldThresholds(new HashMap<String, Float>(){{put(VariantData.GT_FIELD_GQ, 50f);}});
		svr.setMaxMissingData(20f);
		svr.setMinMaf(25f);
		svr.setMaxMaf(50f);
		svr.setGtPattern("Without abnormal heterozygosity");

		svr.setAlleleCount("2");
		svr.setVariantSetId("testModule§1");
		svr.setCallSetIds2(new ArrayList<>());
		svr.setGetGT(false);
		svr.setSearchMode(0);//only count
		GigwaGa4ghServiceImpl gigwaGa4ghServiceImpl = new GigwaGa4ghServiceImpl();
		GigwaSearchVariantsResponse gigwaSearchVariantsResponse = gigwaGa4ghServiceImpl.searchVariants(svr);

		assertTrue(gigwaSearchVariantsResponse.getCount() == 9);
	}
	
	/*test 21/ nb d'allèles = 3 ou 4 et sur groupe 1 : all heterozygous*/
	@Test
	public void test21() throws GAException, AvroRemoteException {
		GigwaSearchVariantsRequest svr = new GigwaSearchVariantsRequest();

		svr.setCallSetIds(new ArrayList<>(Arrays.asList("testModule§1§BO1", "testModule§1§BO2", "testModule§1§BO4", "testModule§1§BO5", "testModule§1§BO6")));
		svr.setGtPattern("All Heterozygous");

		svr.setAlleleCount("3;4");
		svr.setVariantSetId("testModule§1");
		svr.setCallSetIds2(new ArrayList<>());
		svr.setGetGT(false);
		svr.setSearchMode(0);//only count
		GigwaGa4ghServiceImpl gigwaGa4ghServiceImpl = new GigwaGa4ghServiceImpl();
		GigwaSearchVariantsResponse gigwaSearchVariantsResponse = gigwaGa4ghServiceImpl.searchVariants(svr);

		assertTrue(gigwaSearchVariantsResponse.getCount() == 1);
	}
	
	/*test 22/ sur groupe 1 : Max missing data=40% et GQ>=5 
	 * et pattern=all different*/
	@SuppressWarnings("serial")
	@Test
	public void test22() throws GAException, AvroRemoteException {
		GigwaSearchVariantsRequest svr = new GigwaSearchVariantsRequest();

		svr.setCallSetIds(new ArrayList<>(Arrays.asList("testModule§1§BO1", "testModule§1§BO2", "testModule§1§BO4", "testModule§1§BO5", "testModule§1§BO6")));
		svr.setAnnotationFieldThresholds(new HashMap<String, Float>(){{put(VariantData.GT_FIELD_GQ, 5f);}});
		svr.setMaxMissingData(40f);
		svr.setGtPattern("All different");

		svr.setVariantSetId("testModule§1");
		svr.setCallSetIds2(new ArrayList<>());
		svr.setGetGT(false);
		svr.setSearchMode(0);//only count
		GigwaGa4ghServiceImpl gigwaGa4ghServiceImpl = new GigwaGa4ghServiceImpl();
		GigwaSearchVariantsResponse gigwaSearchVariantsResponse = gigwaGa4ghServiceImpl.searchVariants(svr);

		assertTrue(gigwaSearchVariantsResponse.getCount() == 6);
	}
	
	/* ------------------
	 * (à partir du test 23 on considère que groupe d'individus 2
	 *  = tous les individus qui commencent par LA)
	 * ------------------
	 */
	
	/*test 23/ nb d'allèles = 2
	 * et sur groupe 1 : Max missing data=20% et GQ>=50 et 25%<=MAF<=50% 
	 * et pattern=some heterozygous
	 * et sur groupe 2 : pattern=without abnormal heterozigosity*/
	@SuppressWarnings("serial")
	@Test
	public void test23() throws GAException, AvroRemoteException {
		GigwaSearchVariantsRequest svr = new GigwaSearchVariantsRequest();

		svr.setCallSetIds(new ArrayList<>(Arrays.asList("testModule§1§BO1", "testModule§1§BO2", "testModule§1§BO4", "testModule§1§BO5", "testModule§1§BO6")));
		svr.setAnnotationFieldThresholds(new HashMap<String, Float>(){{put(VariantData.GT_FIELD_GQ, 50f);}});
		svr.setMaxMissingData(20f);
		svr.setMinMaf(25f);
		svr.setMaxMaf(50f);
		svr.setGtPattern("Some Heterozygous");
		
		svr.setCallSetIds2(new ArrayList<>(Arrays.asList("testModule§1§LA1", "testModule§1§LA2", "testModule§1§LA3", "testModule§1§LA4", "testModule§1§LA5")));
		svr.setGtPattern2("Without abnormal heterozygosity");
		
		svr.setAlleleCount("2");
		svr.setVariantSetId("testModule§1");
		svr.setGetGT(false);
		svr.setSearchMode(0);//only count
		GigwaGa4ghServiceImpl gigwaGa4ghServiceImpl = new GigwaGa4ghServiceImpl();
		GigwaSearchVariantsResponse gigwaSearchVariantsResponse = gigwaGa4ghServiceImpl.searchVariants(svr);

		assertTrue(gigwaSearchVariantsResponse.getCount() == 15);
	}
	
	/*test 24/ nb d'allèles = 2
	 * et sur les 2 groupes : GQ>=15 et max missing data = 20%
	 * et pattern=mostly all the same 75%*/
	@SuppressWarnings("serial")
	@Test
	public void test24() throws GAException, AvroRemoteException {
		GigwaSearchVariantsRequest svr = new GigwaSearchVariantsRequest();

		svr.setCallSetIds(new ArrayList<>(Arrays.asList("testModule§1§BO1", "testModule§1§BO2", "testModule§1§BO4", "testModule§1§BO5", "testModule§1§BO6")));
		svr.setAnnotationFieldThresholds(new HashMap<String, Float>(){{put(VariantData.GT_FIELD_GQ, 15f);}});
		svr.setMaxMissingData(20f);
		svr.setGtPattern("All or mostly the same");
		svr.setMostSameRatio(75);
		
		svr.setCallSetIds2(new ArrayList<>(Arrays.asList("testModule§1§LA1", "testModule§1§LA2", "testModule§1§LA3", "testModule§1§LA4", "testModule§1§LA5")));
		svr.setAnnotationFieldThresholds2(new HashMap<String, Float>(){{put(VariantData.GT_FIELD_GQ, 15f);}});
		svr.setMaxMissingData2(20f);
		svr.setGtPattern2("All or mostly the same");
		svr.setMostSameRatio2(75);
		
		svr.setAlleleCount("2");
		svr.setVariantSetId("testModule§1");
		svr.setGetGT(false);
		svr.setSearchMode(0);//only count
		GigwaGa4ghServiceImpl gigwaGa4ghServiceImpl = new GigwaGa4ghServiceImpl();
		GigwaSearchVariantsResponse gigwaSearchVariantsResponse = gigwaGa4ghServiceImpl.searchVariants(svr);

		assertTrue(gigwaSearchVariantsResponse.getCount() == 258);
	}
	
	/*test 25/ nb d'allèles = 2
	 * et (sur les 2 groupes : GQ>=15 et max missing data = 20%
	 * et pattern=mostly all the same 75%) + Discriminate groups activé*/
	@SuppressWarnings("serial")
	@Test
	public void test25() throws GAException, AvroRemoteException {
		GigwaSearchVariantsRequest svr = new GigwaSearchVariantsRequest();
		
		svr.setCallSetIds(new ArrayList<>(Arrays.asList("testModule§1§BO1", "testModule§1§BO2", "testModule§1§BO4", "testModule§1§BO5", "testModule§1§BO6")));
		svr.setAnnotationFieldThresholds(new HashMap<String, Float>(){{put(VariantData.GT_FIELD_GQ, 15f);}});
		svr.setMaxMissingData(20f);
		svr.setGtPattern("All or mostly the same");
		svr.setMostSameRatio(75);
		
		svr.setCallSetIds2(new ArrayList<>(Arrays.asList("testModule§1§LA1", "testModule§1§LA2", "testModule§1§LA3", "testModule§1§LA4", "testModule§1§LA5")));
		svr.setAnnotationFieldThresholds2(new HashMap<String, Float>(){{put(VariantData.GT_FIELD_GQ, 15f);}});
		svr.setMaxMissingData2(20f);
		svr.setGtPattern2("All or mostly the same");
		svr.setMostSameRatio2(75);
		
		svr.setDiscriminate(true);
		
		svr.setAlleleCount("2");
		svr.setVariantSetId("testModule§1");
		svr.setGetGT(false);
		svr.setSearchMode(0);//only count
		GigwaGa4ghServiceImpl gigwaGa4ghServiceImpl = new GigwaGa4ghServiceImpl();
		GigwaSearchVariantsResponse gigwaSearchVariantsResponse = gigwaGa4ghServiceImpl.searchVariants(svr);

		assertTrue(gigwaSearchVariantsResponse.getCount() == 22);
	}
	
	/*test 26/ pattern=mostly all the same 100%)*/
	@SuppressWarnings("serial")
	@Test
	public void test26() throws GAException, AvroRemoteException {
		GigwaSearchVariantsRequest svr = new GigwaSearchVariantsRequest();
		
		svr.setCallSetIds(new ArrayList<>(Arrays.asList("testModule§1§BO4", "testModule§1§BO5", "testModule§1§BO6", "testModule§1§LA1", "testModule§1§LA2", "testModule§1§LA3", "testModule§1§LA4")));
		svr.setGtPattern("All or mostly the same");
		svr.setVariantSetId("testModule§1");
		svr.setGetGT(false);
		svr.setSearchMode(0);//only count
		GigwaGa4ghServiceImpl gigwaGa4ghServiceImpl = new GigwaGa4ghServiceImpl();
		GigwaSearchVariantsResponse gigwaSearchVariantsResponse = gigwaGa4ghServiceImpl.searchVariants(svr);

		assertTrue(gigwaSearchVariantsResponse.getCount() == 139);
	}
}
