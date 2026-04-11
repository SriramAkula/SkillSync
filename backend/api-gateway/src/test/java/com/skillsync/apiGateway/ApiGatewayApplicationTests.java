package com.skillsync.apiGateway;

import org.junit.jupiter.api.Test;
import org.springframework.boot.test.context.SpringBootTest;

@SpringBootTest(properties = {
		"spring.cloud.config.enabled=false",
		"eureka.client.enabled=false",
		"spring.cloud.discovery.enabled=false",
		"spring.cloud.compatibility-verifier.enabled=false",
		"jwt.secret=DummySecretForTestingPurposeOnly12345678"
})
@org.springframework.test.context.ActiveProfiles("test")
class ApiGatewayApplicationTests {

	@Test
	void contextLoads() {
	}

}
