package fr.cirad.configuration;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import org.apache.avro.specific.SpecificRecordBase;
import org.springframework.boot.jackson.autoconfigure.JsonMapperBuilderCustomizer;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class JacksonConfig {

    @JsonIgnoreProperties({"schema", "specificData"})
    public abstract static class AvroMixIn {}

    @Bean
    public JsonMapperBuilderCustomizer jacksonCustomizer() {
        return builder -> builder.addMixIn(SpecificRecordBase.class, AvroMixIn.class);
    }

}