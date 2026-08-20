package fr.cirad.test;

import fr.cirad.mgdb.importing.VcfImport;
import fr.cirad.mgdb.importing.parameters.VCFParameters;
import fr.cirad.mgdb.model.mongo.maintypes.Assembly;
import fr.cirad.tools.mongo.MongoTemplateManager;
import jakarta.ejb.ObjectNotFoundException;
import org.brapi.v2.api.*;
import org.brapi.v2.model.*;
import org.junit.jupiter.api.AfterAll;
import org.junit.jupiter.api.BeforeAll;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.TestInstance;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.test.context.DynamicPropertyRegistry;
import org.springframework.test.context.DynamicPropertySource;
import org.testcontainers.containers.MongoDBContainer;
import org.testcontainers.junit.jupiter.Container;
import org.testcontainers.junit.jupiter.Testcontainers;
import org.testcontainers.utility.DockerImageName;

import java.io.File;
import java.util.*;

import static org.junit.jupiter.api.Assertions.*;

@SpringBootTest
@TestInstance(TestInstance.Lifecycle.PER_CLASS) //allows to inject AlleleMatrixController
public class BrAPITests {

    @Autowired
    private AllelematrixApiController allelematrixApi;

    @Autowired
    private ServerinfoApiController serverinfoApi;

    @Autowired
    private ProgramsApiController programApi;

    @Autowired
    private GermplasmApiController germplasmApi;

    @Autowired
    private SamplesApiController sampleApi;

    @DynamicPropertySource
    static void mongoProps(DynamicPropertyRegistry registry) {
        registry.add("mongo.hosts.defaultMongoHost.uri",
                TestMongoContainer.get()::getReplicaSetUrl);
    }

    @BeforeAll
    void setUpBeforeClass() throws Exception {
        Map<String, String> sampleToIndividualMap = Map.of(
                "SP_1", "IND_A",
                "SP_2", "IND_A",
                "SP_3", "IND_B",
                "SP_4", "IND_B",
                "SP_5", "IND_C",
                "SP_6", "IND_C"
        );

        VCFParameters params = new VCFParameters(
                "testModule",
                "testProject",
                "run1",
                "testTechnology",
                null, //ploidy
                null,
                sampleToIndividualMap,
                false,
                0, //importMode
                false,
                new File("test/run1_samples.vcf").toURI().toURL()
        );
        new VcfImport().importToMongo(params);
        VCFParameters params2 = new VCFParameters(
                "testModule",
                "testProject",
                "run2",
                "testTechnology",
                null, //ploidy
                null,
                sampleToIndividualMap,
                false,
                0, //importMode
                false,
                new File("test/run2_samples.vcf").toURI().toURL()
        );
        new VcfImport().importToMongo(params2);
        Assembly.setThreadAssembly(0);
    }

    @AfterAll
    public static void tearDownAfterClass() throws Exception {
        Assembly.cleanupThreadAssembly();
        MongoTemplateManager.get("testModule").getDb().drop();
        //MongoTemplateManager.closeApplicationContextIfOffline();
    }

    /* test 00: serverInfo */
    @Test
    public void test00_getServerInfo() {
        ResponseEntity<CallsResponse> resp = serverinfoApi.serverinfoGet(null, null);
        assertEquals(HttpStatus.OK, resp.getStatusCode());
    }

    /* test 01: search programs by name */
    @Test
    public void test01_searchProgramsByName() {
        ProgramSearchRequest req = new ProgramSearchRequest();
        req.addProgramNamesItem("testModule");
        ResponseEntity<ProgramListResponse> resp = programApi.searchProgramsPost(null, req);
        assertEquals(HttpStatus.OK, resp.getStatusCode());
        assertEquals("testModule", resp.getBody().getResult().getData().get(0).getProgramDbId());
    }

    /* test 02: search germplasm by study name */
    @Test
    public void test02_searchGermplasmByStudyName() throws Exception {
        GermplasmSearchRequest req = new GermplasmSearchRequest();
        req.addProgramDbIdsItem("testModule");
        req.addStudyNamesItem("testProject");
        ResponseEntity<GermplasmListResponse> resp = germplasmApi.searchGermplasmPost(req, null);
        assertEquals(HttpStatus.OK, resp.getStatusCode());
        assertEquals(3, resp.getBody().getResult().getData().size());
    }

    /* test 03: search sample by study name */
    @Test
    public void test03_searchSamplesByStudyName() throws Exception {
        SampleSearchRequest req = new SampleSearchRequest();
        req.addProgramDbIdsItem("testModule");
        req.addStudyNamesItem("testProject");
        ResponseEntity<SampleListResponse> resp = sampleApi.searchSamplesPost(req, null);
        assertEquals(HttpStatus.OK, resp.getStatusCode());
        assertEquals(6, resp.getBody().getResult().getData().size());
    }

    /* test 04: search sample by germplasm names */
    @Test
    public void test04_searchSamplesByGermplasmNames() throws Exception {
        SampleSearchRequest req = new SampleSearchRequest();
        req.addProgramDbIdsItem("testModule");
        req.addGermplasmNamesItem("IND_B");
        ResponseEntity<SampleListResponse> resp = sampleApi.searchSamplesPost(req, null);
        assertEquals(HttpStatus.OK, resp.getStatusCode());
        assertEquals(2, resp.getBody().getResult().getData().size());
    }

    /* test 0: allelematrix on studyDbId */
    @Test
    public void test05_searchByStudyDbId() throws InterruptedException, ObjectNotFoundException {
        AlleleMatrixSearchRequest req = new AlleleMatrixSearchRequest();
        req.setStudyDbIds(List.of("testModule§1"));
        req.addDataMatrixAbbreviationsItem("GT");

        ResponseEntity<AlleleMatrixResponse> response = allelematrixApi.searchAllelematrixPost("Bearer azerty", req);

        assertEquals(HttpStatus.OK, response.getStatusCode());
        assertNotNull(response.getBody());
        List<String> variantSetDbIds = response.getBody().getResult().getVariantSetDbIds();
        List<String> variantDbIds = response.getBody().getResult().getVariantDbIds();
        List<String> callSetDbIds = response.getBody().getResult().getCallSetDbIds();
        List<String> sampleDbIds = response.getBody().getResult().getSampleDbIds();
        List<String> germplasmDbIds = response.getBody().getResult().getGermplasmDbIds();

        assertEquals(2, variantSetDbIds.size());
        assertEquals(10, variantDbIds.size());
        assertEquals(12, callSetDbIds.size());
        assertEquals(6, sampleDbIds.size());
        assertEquals(3, germplasmDbIds.size());
    }

    /* test 6: allelematrix on variantSetDbId */
    @Test
    public void test06_searchByVariantSetDbId() throws InterruptedException, ObjectNotFoundException {
        AlleleMatrixSearchRequest req = new AlleleMatrixSearchRequest();
        req.addVariantSetDbIdsItem("testModule§1§run1");
        req.addDataMatrixAbbreviationsItem("GT");

        ResponseEntity<AlleleMatrixResponse> response = allelematrixApi.searchAllelematrixPost("Bearer azerty", req);

        assertEquals(HttpStatus.OK, response.getStatusCode());
        assertNotNull(response.getBody());
        List<String> variantSetDbIds = response.getBody().getResult().getVariantSetDbIds();
        List<String> variantDbIds = response.getBody().getResult().getVariantDbIds();
        List<String> callSetDbIds = response.getBody().getResult().getCallSetDbIds();
        List<String> sampleDbIds = response.getBody().getResult().getSampleDbIds();
        List<String> germplasmDbIds = response.getBody().getResult().getGermplasmDbIds();

        assertEquals(1, variantSetDbIds.size());
        assertEquals(10, variantDbIds.size());
        assertEquals(6, callSetDbIds.size());
        assertEquals(6, sampleDbIds.size());
        assertEquals(3, germplasmDbIds.size());
    }

    /* test 7: allelematrix on variantSetDbId */
    @Test
    public void test07_searchByVariantDbId() throws InterruptedException, ObjectNotFoundException {
        AlleleMatrixSearchRequest req = new AlleleMatrixSearchRequest();
        req.addVariantDbIdsItem("testModule§VAR_010");
        req.addDataMatrixAbbreviationsItem("GT");

        ResponseEntity<AlleleMatrixResponse> response = allelematrixApi.searchAllelematrixPost("Bearer azerty", req);

        assertEquals(HttpStatus.OK, response.getStatusCode());
        assertNotNull(response.getBody());
        List<String> variantSetDbIds = response.getBody().getResult().getVariantSetDbIds();
        List<String> variantDbIds = response.getBody().getResult().getVariantDbIds();
        List<String> callSetDbIds = response.getBody().getResult().getCallSetDbIds();
        List<String> sampleDbIds = response.getBody().getResult().getSampleDbIds();
        List<String> germplasmDbIds = response.getBody().getResult().getGermplasmDbIds();

        assertEquals(2, variantSetDbIds.size());
        assertEquals(1, variantDbIds.size());
        assertEquals(12, callSetDbIds.size());
        assertEquals(6, sampleDbIds.size());
        assertEquals(3, germplasmDbIds.size());
    }

    /* test 8: allelematrix on sampleDbId */
    @Test
    public void test08_searchByVariantDbId() throws InterruptedException, ObjectNotFoundException {
        AlleleMatrixSearchRequest req = new AlleleMatrixSearchRequest();
        req.addVariantDbIdsItem("testModule§VAR_010");
        req.addDataMatrixAbbreviationsItem("GT");

        ResponseEntity<AlleleMatrixResponse> response = allelematrixApi.searchAllelematrixPost("Bearer azerty", req);

        assertEquals(HttpStatus.OK, response.getStatusCode());
        assertNotNull(response.getBody());
        List<String> variantSetDbIds = response.getBody().getResult().getVariantSetDbIds();
        List<String> variantDbIds = response.getBody().getResult().getVariantDbIds();
        List<String> callSetDbIds = response.getBody().getResult().getCallSetDbIds();
        List<String> sampleDbIds = response.getBody().getResult().getSampleDbIds();
        List<String> germplasmDbIds = response.getBody().getResult().getGermplasmDbIds();

        assertEquals(2, variantSetDbIds.size());
        assertEquals(1, variantDbIds.size());
        assertEquals(12, callSetDbIds.size());
        assertEquals(6, sampleDbIds.size());
        assertEquals(3, germplasmDbIds.size());
    }
}