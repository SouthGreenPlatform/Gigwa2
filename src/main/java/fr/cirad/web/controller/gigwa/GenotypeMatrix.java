package fr.cirad.web.controller.gigwa;

import com.fasterxml.jackson.annotation.JsonProperty;
import org.brapi.v2.model.AlleleMatrixPagination;

import javax.validation.Valid;
import java.util.List;

public class GenotypeMatrix {
    @JsonProperty("pagination")
    @Valid
    private List<AlleleMatrixPagination> pagination = null;

    @JsonProperty("projects")
    @Valid
    private List<String> projects = null;

    @JsonProperty("variants")
    @Valid
    private List<String> variants = null;

    @JsonProperty("individuals")
    @Valid
    private List<String> individuals = null;

    @JsonProperty("samples")
    @Valid
    private List<String> samples = null;

    @JsonProperty("dataMatrix")
    @Valid
    private List<List<String>> dataMatrix = null;

    @JsonProperty("expandHomozygotes")
    private Boolean expandHomozygotes = null;

    @JsonProperty("aggregateByGermplasm")
    private Boolean aggregateByGermplasm = false;

    public List<AlleleMatrixPagination> getPagination() {
        return pagination;
    }

    public void setPagination(List<AlleleMatrixPagination> pagination) {
        this.pagination = pagination;
    }

    public List<String> getProjects() {
        return projects;
    }

    public void setProjects(List<String> projects) {
        this.projects = projects;
    }

    public List<String> getVariants() {
        return variants;
    }

    public void setVariants(List<String> variants) {
        this.variants = variants;
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

    public List<List<String>> getDataMatrix() {
        return dataMatrix;
    }

    public void setDataMatrix(List<List<String>> dataMatrix) {
        this.dataMatrix = dataMatrix;
    }

    public Boolean getExpandHomozygotes() {
        return expandHomozygotes;
    }

    public void setExpandHomozygotes(Boolean expandHomozygotes) {
        this.expandHomozygotes = expandHomozygotes;
    }

    public Boolean getAggregateByGermplasm() {
        return aggregateByGermplasm;
    }

    public void setAggregateByGermplasm(Boolean aggregateByGermplasm) {
        this.aggregateByGermplasm = aggregateByGermplasm;
    }
}
