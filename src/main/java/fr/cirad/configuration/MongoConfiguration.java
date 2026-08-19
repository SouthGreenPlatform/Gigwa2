package fr.cirad.configuration;

import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.context.annotation.Configuration;

import java.util.HashMap;
import java.util.Map;

@Configuration
@ConfigurationProperties(prefix = "mongo")
public class MongoConfiguration {
    private Map<String, HostProperties> hosts = new HashMap<>();

    public Map<String, HostProperties> getHosts() {
        return hosts;
    }

    public void setHosts(Map<String, HostProperties> hosts) {
        this.hosts = hosts;
    }

    public static class HostProperties {

        private String uri;
        private int maxPoolSize = 100;

        public String getUri() {
            return uri;
        }

        public void setUri(String uri) {
            this.uri = uri;
        }

        public int getMaxPoolSize() {
            return maxPoolSize;
        }

        public void setMaxPoolSize(int maxPoolSize) {
            this.maxPoolSize = maxPoolSize;
        }
    }

}
