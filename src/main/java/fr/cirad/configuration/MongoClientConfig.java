package fr.cirad.configuration;

import com.mongodb.ConnectionString;
import com.mongodb.MongoClientSettings;
import com.mongodb.client.MongoClient;
import com.mongodb.client.MongoClients;
import org.springframework.boot.context.properties.EnableConfigurationProperties;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import java.util.LinkedHashMap;
import java.util.Map;

@Configuration
@EnableConfigurationProperties(MongoConfiguration.class)
public class MongoClientConfig {

    @Bean
    public Map<String, MongoClient> mongoClients(MongoConfiguration mongoConfiguration) {
        Map<String, MongoClient> clients = new LinkedHashMap<>();
        mongoConfiguration.getHosts().forEach((name, hostProps) -> {
            MongoClientSettings settings = MongoClientSettings.builder()
                    .applyConnectionString(new ConnectionString(hostProps.getUri()))
                    .applyToConnectionPoolSettings(b -> b.maxSize(hostProps.getMaxPoolSize()))
                    .build();
            clients.put(name, MongoClients.create(settings));
        });
        return clients;
    }
}