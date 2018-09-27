/*******************************************************************************
 * GIGWA - Genotype Investigator for Genome Wide Analyses
 * Copyright (C) 2016, 2018, <CIRAD> <IRD>
 *
 * This program is free software: you can redistribute it and/or modify it under
 * the terms of the GNU Affero General Public License, version 3 as published by
 * the Free Software Foundation.
 *
 * This program is distributed in the hope that it will be useful, but WITHOUT
 * ANY WARRANTY; without even the implied warranty of MERCHANTABILITY or FITNESS
 * FOR A PARTICULAR PURPOSE. See the GNU Affero General Public License for more
 * details.
 *
 * See <http://www.gnu.org/licenses/agpl.html> for details about GNU General
 * Public License V3.
 *******************************************************************************/
package fr.cirad.rest.json;

/**
 * Custom jackson mapper to serialize/deserialize java object to JSON 
 * attributes with null value aren't serialized
 * REQUIRE_GETTER_FOR_SETTER is needed so that avro schema from GA4GH classes is not serialized
 * @author petel
 */
import com.fasterxml.jackson.annotation.JsonInclude;
import org.springframework.http.converter.json.Jackson2ObjectMapperBuilder;
import org.springframework.http.converter.json.MappingJackson2HttpMessageConverter;

import com.fasterxml.jackson.databind.MapperFeature;

public class CustomMappingJackson2HttpMessageConverter extends MappingJackson2HttpMessageConverter {

        public CustomMappingJackson2HttpMessageConverter() {
        	super(Jackson2ObjectMapperBuilder.json().serializationInclusion(JsonInclude.Include.NON_NULL).build().configure(MapperFeature.REQUIRE_SETTERS_FOR_GETTERS, true));
        }

}
