package com.skillsync.user;

import org.junit.jupiter.api.Test;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.ActiveProfiles;

import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.amqp.rabbit.connection.ConnectionFactory;
import org.springframework.amqp.rabbit.listener.RabbitListenerContainerFactory;
import com.skillsync.user.listener.UserProfileEventListener;

@SpringBootTest(properties = {
    "spring.cloud.config.enabled=false",
    "spring.autoconfigure.exclude=org.springframework.boot.autoconfigure.amqp.RabbitAutoConfiguration",
    "jwt.secret=test-secret-32-chars-long-for-security-reasons"
})
@ActiveProfiles("test")
class UserServiceApplicationTests {

    @MockBean ConnectionFactory connectionFactory;
    @MockBean RabbitListenerContainerFactory<?> rabbitListenerContainerFactory;
    @MockBean UserProfileEventListener userProfileEventListener;

    @Test
    void contextLoads() {
    }
}
