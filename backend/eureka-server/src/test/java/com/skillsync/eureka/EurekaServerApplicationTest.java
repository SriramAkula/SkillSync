package com.skillsync.eureka;

import org.junit.jupiter.api.Test;
import org.springframework.boot.test.context.SpringBootTest;

import static org.junit.jupiter.api.Assertions.assertDoesNotThrow;

@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.RANDOM_PORT, properties = {
    "eureka.client.register-with-eureka=false",
    "eureka.client.fetch-registry=false"
})
class EurekaServerApplicationTest {

    @Test
    void contextLoads() {
    }

    @Test
    void mainMethodTest() {
        assertDoesNotThrow(() -> EurekaServerApplication.main(new String[]{
            "--server.port=0",
            "--eureka.client.register-with-eureka=false",
            "--eureka.client.fetch-registry=false"
        }));
    }
}
