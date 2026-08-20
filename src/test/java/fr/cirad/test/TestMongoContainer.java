package fr.cirad.test;

import org.testcontainers.containers.MongoDBContainer;
import org.testcontainers.utility.DockerImageName;

public final class TestMongoContainer {

    private static final MongoDBContainer CONTAINER =
            new MongoDBContainer(DockerImageName.parse("mongo:4.4"));

    public static MongoDBContainer get() {
        if (!CONTAINER.isRunning()) {
            CONTAINER.start();
            System.out.println(">>> Test MongoDB at " + CONTAINER.getConnectionString());
        }
        return CONTAINER;
    }

    private TestMongoContainer() {}
}