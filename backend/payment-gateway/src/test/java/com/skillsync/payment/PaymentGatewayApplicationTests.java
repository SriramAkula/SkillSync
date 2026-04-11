package com.skillsync.payment;

import org.junit.jupiter.api.Test;
import org.springframework.amqp.rabbit.connection.ConnectionFactory;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.test.context.ActiveProfiles;

@SpringBootTest(properties = {
    "spring.cloud.config.enabled=false",
    "spring.autoconfigure.exclude=org.springframework.boot.autoconfigure.amqp.RabbitAutoConfiguration"
})
@ActiveProfiles("test")
class PaymentGatewayApplicationTests {

    @MockBean
    private ConnectionFactory connectionFactory;

    @Test
    void contextLoads() {
    }
}
