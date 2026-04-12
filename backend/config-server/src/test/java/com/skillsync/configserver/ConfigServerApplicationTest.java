package com.skillsync.configserver;

import org.junit.jupiter.api.Test;
import org.springframework.boot.test.context.SpringBootTest;

import static org.junit.jupiter.api.Assertions.assertDoesNotThrow;

@SpringBootTest(properties = {
    "spring.profiles.active=native",
    "spring.cloud.config.server.native.search-locations=file:./target/test-classes/config",
    "eureka.client.enabled=false"
})
class ConfigServerApplicationTest {

    @Test
    void contextLoads() {
        // Test that the application context starts successfully
    }

    @Test
    void mainMethodTest() {
        // Execute main method for instruction coverage
        // Pass arguments to override the default GIT behavior
        assertDoesNotThrow(() -> ConfigServerApplication.main(new String[]{
            "--spring.profiles.active=native",
            "--spring.cloud.config.server.native.search-locations=file:./target/test-classes/config",
            "--server.port=0",
            "--eureka.client.enabled=false"
        }));
    }
}
