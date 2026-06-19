package fr.cirad.web.controller.gigwa;

import com.fasterxml.jackson.annotation.JsonProperty;
import io.swagger.v3.oas.annotations.media.Schema;
import org.brapi.v2.model.Metadata;

import javax.validation.Valid;
import javax.validation.constraints.NotNull;

public class GenotypeMatrixResponse {
    @JsonProperty("metadata")
    private Metadata metadata = null;

    @JsonProperty("result")
    private GenotypeMatrix result = null;

    /**
     * Get metadata
     * @return metadata
     **/
    @Schema(required = true, description = "")
    @NotNull

    @Valid
    public Metadata getMetadata() {
        return metadata;
    }

    public void setMetadata(Metadata metadata) {
        this.metadata = metadata;
    }

    /**
     * Get result
     * @return result
     **/
    @Schema(required = true, description = "")
    @NotNull

    @Valid
    public GenotypeMatrix getResult() {
        return result;
    }

    public void setResult(GenotypeMatrix result) {
        this.result = result;
    }

}
