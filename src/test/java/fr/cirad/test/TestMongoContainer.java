package fr.cirad.test;

import org.testcontainers.containers.MongoDBContainer;
import org.testcontainers.utility.DockerImageName;

public final class TestMongoContainer {

    private static final MongoDBContainer CONTAINER =
            new MongoDBContainer(DockerImageName.parse("mongo:4.4"));

    static {
        CONTAINER.start();

        System.setProperty("test.mongo.host", CONTAINER.getHost());
        System.setProperty(
                "test.mongo.port",
                String.valueOf(CONTAINER.getFirstMappedPort())
        );

        System.out.println(
                ">>> Test MongoDB at "
                        + CONTAINER.getHost()
                        + ":"
                        + CONTAINER.getFirstMappedPort()
        );
    }

    public static MongoDBContainer get() {
        return CONTAINER;
    }

    private TestMongoContainer() {
    }
}