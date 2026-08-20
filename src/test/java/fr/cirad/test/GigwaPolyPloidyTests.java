package fr.cirad.test;
import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertTrue;

import java.io.File;
import java.net.MalformedURLException;
import java.net.URL;
import java.util.*;
import java.util.stream.Collectors;

import fr.cirad.mgdb.importing.parameters.VCFParameters;
import org.apache.avro.AvroRemoteException;
import org.ga4gh.methods.GAException;
import org.ga4gh.models.Variant;
import org.junit.jupiter.api.AfterAll;
import org.junit.jupiter.api.BeforeAll;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.TestInstance;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.DynamicPropertyRegistry;
import org.springframework.test.context.DynamicPropertySource;
import org.testcontainers.containers.MongoDBContainer;
import org.testcontainers.junit.jupiter.Testcontainers;
import org.testcontainers.utility.DockerImageName;
import org.testcontainers.junit.jupiter.Container;

import fr.cirad.mgdb.importing.VcfImport;
import fr.cirad.mgdb.model.mongo.maintypes.Assembly;
import fr.cirad.mgdb.service.GigwaGa4ghServiceImpl;
import fr.cirad.model.MgdbSearchVariantsRequest;
import fr.cirad.model.GigwaSearchVariantsResponse;
import fr.cirad.tools.mongo.MongoTemplateManager;

@SpringBootTest
@TestInstance(TestInstance.Lifecycle.PER_CLASS)
public class GigwaPolyPloidyTests {

    private static final List<String> ALL_INDIVIDUALS = Arrays.asList(
            "testModule§1§IND_A",
            "testModule§1§IND_B",
            "testModule§1§IND_C",
            "testModule§1§IND_D",
            "testModule§1§IND_E",
            "testModule§1§IND_F"
    );

    @Container
    static MongoDBContainer mongo = new MongoDBContainer(DockerImageName.parse("mongo:4.4"));

    @DynamicPropertySource
    static void mongoProps(DynamicPropertyRegistry registry) {
        registry.add("mongo.hosts.defaultMongoHost.uri",
                TestMongoContainer.get()::getReplicaSetUrl);
    }

    @BeforeAll
    public static void setUpBeforeClass() throws MalformedURLException, Exception {
        // Import the 3 VCF files into the SAME project, as 3 different runs.
        // Gigwa will compute the consensus genotype per (individual, variant)
        // via the "most frequent wins, tie = null" rule.
        importVcf("testModule", "testProject", "run1",
                new File("test/polyploid.vcf").toURI().toURL(), 0);

        Assembly.setThreadAssembly(0);
    }

    private static void importVcf(String module, String project, String run,
                                  URL fileUrl, int importMode) throws Exception {
        VCFParameters params = new VCFParameters(
                module, project, run, "testTechnology",
                null, null, null,
                false, importMode, false,
                fileUrl
        );
        new VcfImport().importToMongo(params);
    }

    @AfterAll
    public static void tearDownAfterClass() throws Exception {
        Assembly.cleanupThreadAssembly();
        MongoTemplateManager.get("testModule").getDb().drop();
        //MongoTemplateManager.closeApplicationContextIfOffline();
    }

    /* ============================================================
     * Missing-data filter tests
     * 8 variants have 0% missing, 2 variants (VAR_005, VAR_007)
     * have 33.33% missing after consensus consolidation.
     * ============================================================ */

    /** Sanity check: no filter → all 10 variants. */
    @Test
    public void test00_noFilter_countAll() throws GAException, AvroRemoteException {
        MgdbSearchVariantsRequest svr = baseRequest();
        long count = new GigwaGa4ghServiceImpl().searchVariants(svr).getCount();
        System.out.println(">>> No filter — count: " + count);
        assertTrue(count == 10);
    }

    /* ============================================================
     * Heterozygosity filter tests
     *
     *  VAR | Het%   |  VAR | Het%
     *  001 |   0    |  006 | 33.33
     *  002 |   0    |  007 |  50
     *  003 |  66.67 |  008 | 33.33
     *  004 |  33.33 |  009 |   0
     *  005 |  50    |  010 |  66.67
     * ============================================================ */

    /** minHeZ > 0% → 7 variants (excludes the 3 fully-homozygous ones). */
    @Test
    public void test04_someHeterozygous() throws GAException, AvroRemoteException {
        MgdbSearchVariantsRequest svr = baseRequest();
        svr.setCallSetIds(new ArrayList<>(ALL_INDIVIDUALS));
        svr.setMinHeZWithIndex(0.01f, 0);

        long count = new GigwaGa4ghServiceImpl().searchVariants(svr).getCount();
        System.out.println(">>> minHeZ>0% — count: " + count);
        assertTrue(count == 7);
    }

    /** maxHeZ = 0% → only fully homozygous variants → 3 (VAR_001, VAR_002, VAR_009). */
    @Test
    public void test05_noHeterozygosity() throws GAException, AvroRemoteException {
        MgdbSearchVariantsRequest svr = baseRequest();
        svr.setCallSetIds(new ArrayList<>(ALL_INDIVIDUALS));
        svr.setMaxHeZWithIndex(0f, 0);

        long count = new GigwaGa4ghServiceImpl().searchVariants(svr).getCount();
        System.out.println(">>> maxHeZ=0% — count: " + count);
        assertTrue(count == 3);
    }

    /** minHeZ >= 60% → VAR_003 (66.67%) and VAR_010 (66.67%) → 2 variants. */
    @Test
    public void test06_mostlyHeterozygous() throws GAException, AvroRemoteException {
        MgdbSearchVariantsRequest svr = baseRequest();
        svr.setCallSetIds(new ArrayList<>(ALL_INDIVIDUALS));
        svr.setMinHeZWithIndex(60f, 0);

        long count = new GigwaGa4ghServiceImpl().searchVariants(svr).getCount();
        System.out.println(">>> minHeZ>=60% — count: " + count);
        assertTrue(count == 2);
    }

    /** 83% <=minHeZ <= 84% → VAR_003 */
    @Test
    public void test_83PercentHeterozygous() throws GAException, AvroRemoteException {
        MgdbSearchVariantsRequest svr = baseRequest();
        svr.setCallSetIds(new ArrayList<>(ALL_INDIVIDUALS));
        svr.setMinHeZWithIndex(83f, 0);
        svr.setMaxHeZWithIndex(84f, 0);
        svr.setSearchMode(3);

        GigwaSearchVariantsResponse gsvr = new GigwaGa4ghServiceImpl().searchVariants(svr);

        long count = gsvr.getCount();
        System.out.println(">>> 83% <=minHeZ <= 84% — count: " + count);
        java.util.List<org.ga4gh.models.Variant> variants = gsvr.getVariants();

        System.out.println("Only variant ID: " + variants.iterator().next().getId() );

        assertEquals("testModule§VAR_003", variants.iterator().next().getId());
        assertTrue(count == 1);
    }

    /** minHeZ = 100% → no variant is fully het → 0 variants. */
    @Test
    public void test07_allHeterozygous() throws GAException, AvroRemoteException {
        MgdbSearchVariantsRequest svr = baseRequest();
        svr.setCallSetIds(new ArrayList<>(ALL_INDIVIDUALS));
        svr.setMinHeZWithIndex(100f, 0);

        long count = new GigwaGa4ghServiceImpl().searchVariants(svr).getCount();
        System.out.println(">>> minHeZ=100% — count: " + count);
        assertTrue(count == 0);
    }

    /* ============================================================
     * MAF (Minor Allele Frequency) filter tests
     *
     *  VAR | MAF      | VAR | MAF
     *  001 |   0      | 006 |  33.33
     *  002 |   0      | 007 |  25
     *  003 |  33.33   | 008 |  33.33
     *  004 |  16.67   | 009 |  16.67
     *  005 |  50      | 010 |  50
     * ============================================================ */

    /** minMaf > 0% → 8 polymorphic variants (excludes VAR_001, VAR_002). */
    @Test
    public void test08_polymorphic() throws GAException, AvroRemoteException {
        MgdbSearchVariantsRequest svr = baseRequest();
        svr.setCallSetIds(new ArrayList<>(ALL_INDIVIDUALS));
        svr.setMinMafWithIndex(1f, 0);

        long count = new GigwaGa4ghServiceImpl().searchVariants(svr).getCount();
        System.out.println(">>> minMaf>=1% — count: " + count);
        assertTrue(count == 8);
    }

    /** maxMaf <= 20% → rare variants: 0% and 16.67% MAF → 4 variants. */
    @Test
    public void test09_rareVariants() throws GAException, AvroRemoteException {
        MgdbSearchVariantsRequest svr = baseRequest();
        svr.setCallSetIds(new ArrayList<>(ALL_INDIVIDUALS));
        svr.setMaxMafWithIndex(20f, 0);

        long count = new GigwaGa4ghServiceImpl().searchVariants(svr).getCount();
        System.out.println(">>> maxMaf<=20% — count: " + count);
        assertTrue(count == 5);
    }

    /** minMaf >= 30% → common variants: 33.33% and 50% MAF → 5 variants. */
    @Test
    public void test10_commonVariants() throws GAException, AvroRemoteException {
        MgdbSearchVariantsRequest svr = baseRequest();
        svr.setCallSetIds(new ArrayList<>(ALL_INDIVIDUALS));
        svr.setMinMafWithIndex(30f, 0);

        long count = new GigwaGa4ghServiceImpl().searchVariants(svr).getCount();
        System.out.println(">>> minMaf>=30% — count: " + count);
        assertTrue(count == 5);
    }

    /** minMaf >= 50% → perfectly balanced variants (50% is the max possible MAF) → 2 variants. */
    @Test
    public void test11_balanced() throws GAException, AvroRemoteException {
        MgdbSearchVariantsRequest svr = baseRequest();
        svr.setCallSetIds(new ArrayList<>(ALL_INDIVIDUALS));
        svr.setMinMafWithIndex(50f, 0);

        long count = new GigwaGa4ghServiceImpl().searchVariants(svr).getCount();
        System.out.println(">>> minMaf>=50% — count: " + count);
        assertTrue(count == 2);
    }

    /** 20% <= MAF <= 40% → mid range: 25% + 33.33% MAF → 4 variants. */
    @Test
    public void test12_midRange() throws GAException, AvroRemoteException {
        MgdbSearchVariantsRequest svr = baseRequest();
        svr.setCallSetIds(new ArrayList<>(ALL_INDIVIDUALS));
        svr.setMinMafWithIndex(20f, 0);
        svr.setMaxMafWithIndex(40f, 0);

        long count = new GigwaGa4ghServiceImpl().searchVariants(svr).getCount();
        System.out.println(">>> 20%<=MAF<=40% — count: " + count);
        assertTrue(count == 4);
    }

    /** 83% <=minHeZ <= 84% → VAR_003 */
    @Test
    public void test_38PercentMaf() throws GAException, AvroRemoteException {
        MgdbSearchVariantsRequest svr = baseRequest();
        svr.setCallSetIds(new ArrayList<>(ALL_INDIVIDUALS));
        svr.setMinMafWithIndex(38f, 0);
        svr.setMaxMafWithIndex(39f, 0);
        svr.setSearchMode(3);

        GigwaSearchVariantsResponse gsvr = new GigwaGa4ghServiceImpl().searchVariants(svr);

        long count = gsvr.getCount();
        System.out.println(">>> 38% <=minHeZ <= 39% — count: " + count);
        List<Variant> variants = gsvr.getVariants();

        assertEquals(2, count);

        Set<String> ids = variants.stream()
                .map(Variant::getId)
                .collect(Collectors.toSet());

        assertTrue(ids.contains("testModule§VAR_003"));
        assertTrue(ids.contains("testModule§VAR_008"));
    }

    /**
     * Combined filter:
     *   maxMissingData = 20%
     *   1% <= heterozygosity <= 70%
     *   20% <= MAF <= 50%
     *
     * Passes:  VAR_003, VAR_006, VAR_008, VAR_010 → 4 variants
     */
    @Test
    public void test13_combinedFilters() throws GAException, AvroRemoteException {
        MgdbSearchVariantsRequest svr = baseRequest();
        svr.setCallSetIds(new ArrayList<>(ALL_INDIVIDUALS));

        svr.setMaxMissingDataWithIndex(20f, 0);

        svr.setMinHeZWithIndex(1f, 0);
        svr.setMaxHeZWithIndex(70f, 0);

        svr.setMinMafWithIndex(20f, 0);
        svr.setMaxMafWithIndex(50f, 0);

        long count = new GigwaGa4ghServiceImpl().searchVariants(svr).getCount();
        System.out.println(">>> Combined filters — count: " + count);
        assertTrue(count == 4);
    }

    /* ---------- helper ---------- */
    private MgdbSearchVariantsRequest baseRequest() {
        MgdbSearchVariantsRequest svr = new MgdbSearchVariantsRequest();
        svr.setApplyMatrixSizeLimit(false);
        svr.setVariantSetId("testModule§1");
        svr.setCallSetIds(new ArrayList<>());
        svr.setGetGT(false);
        svr.setSearchMode(0);  // count only
        return svr;
    }
}