package fr.cirad;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.context.annotation.ImportResource;

@SpringBootApplication(scanBasePackages = {
        "fr.cirad.mgdb",
        "fr.cirad.web.controller",
        "fr.cirad.manager",
        "fr.cirad.configuration",
        "org.brapi.v2.api",
        "fr.cirad.service",
        "fr.cirad.security",
        "fr.cirad.tools"
})
//@ImportResource("classpath:applicationContext-data.xml")
public class GigwaApplication {
    public static void main(String[] args) {
        SpringApplication.run(GigwaApplication.class, args);
    }
}