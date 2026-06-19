package fr.cirad.web.controller.gigwa;

import com.fasterxml.jackson.annotation.JsonProperty;
import io.swagger.v3.oas.annotations.media.Schema;
import org.brapi.v2.model.AlleleMatrixSearchRequestPagination;
import org.springframework.validation.annotation.Validated;

import javax.validation.Valid;
import java.util.ArrayList;
import java.util.List;

@Validated
public class GenotypeMatrixRequest {
    @JsonProperty("database")
    @Valid
    private String database = null;

    @JsonProperty("project")
    @Valid
    private String project = null;

    @JsonProperty("individuals")
    @Valid
    private List<String> individuals = null;

    @JsonProperty("samples")
    @Valid
    private List<String> samples = null;

    @JsonProperty("variants")
    @Valid
    private List<String> variants = null;

    @JsonProperty("pagination")
    @Valid
    private List<AlleleMatrixSearchRequestPagination> pagination = new ArrayList<>();

    @JsonProperty("expandHomozygotes")
    @Valid
    private Boolean expandHomozygotes = null;

    @JsonProperty("aggregateByIndividual")
    @Valid
    private Boolean aggregateByIndividual = false;

    @JsonProperty("vcfStyleGenotypes")
    @Valid
    private Boolean vcfStyleGenotypes = null;

    public String getDatabase() {
        return database;
    }

    public void setDatabase(String database) {
        this.database = database;
    }

    public String getProject() {
        return project;
    }

    public void setProject(String project) {
        this.project = project;
    }

    public List<String> getIndividuals() {
        return individuals;
    }

    public void setIndividuals(List<String> individuals) {
        this.individuals = individuals;
    }

    public List<String> getSamples() {
        return samples;
    }

    public void setSamples(List<String> samples) {
        this.samples = samples;
    }

    public List<String> getVariants() {
        return variants;
    }

    public void setVariants(List<String> variants) {
        this.variants = variants;
    }

    /**
     * Pagination for the matrix
     * @return pagination
     **/
    @Schema(example = "[{\"dimension\":\"variants\",\"page\":0,\"pageSize\":500},{\"dimension\":\"columns\",\"page\":4,\"pageSize\":1000}]", description = "Pagination for the matrix")
    @Valid
    public List<AlleleMatrixSearchRequestPagination> getPagination() {
        return pagination;
    }

    public void setPagination(List<AlleleMatrixSearchRequestPagination> pagination) {
        this.pagination = pagination;
    }

    public Boolean getExpandHomozygotes() {
        return expandHomozygotes;
    }

    public void setExpandHomozygotes(Boolean expandHomozygotes) {
        this.expandHomozygotes = expandHomozygotes;
    }

    @Schema(example = "false", description = "Default Value = false <br/> If 'aggregateByIndividual' is set to true, returns “synthetic” genotype corresponding to the majority genotype found across all runs for this individual")

    public Boolean getAggregateByIndividual() {
        return aggregateByIndividual;
    }

    public void setAggregateByIndividual(Boolean aggregateByIndividual) {
        this.aggregateByIndividual = aggregateByIndividual;
    }

    @Schema(example = "false", description = "Default Value = false <br/> If 'vcfStyleGenotypes' is set to true, returns genotypes as 0/1 instead of ATGC")

    public Boolean getVcfStyleGenotypes() {
        return vcfStyleGenotypes;
    }

    public void setVcfStyleGenotypes(Boolean vcfStyleGenotypes) {
        this.vcfStyleGenotypes = vcfStyleGenotypes;
    }
}
