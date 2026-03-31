package com.skillsync.authservice;

import org.junit.jupiter.api.Test;
import org.springframework.amqp.rabbit.connection.ConnectionFactory;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.test.context.ActiveProfiles;
import com.skillsync.authservice.publisher.AuthEventPublisher;
import com.skillsync.authservice.client.UserServiceClient;
import com.skillsync.authservice.config.DataInitializer;
import org.springframework.mail.javamail.JavaMailSender;

@SpringBootTest
@ActiveProfiles("test")
class AuthServiceApplicationTests {

	@MockBean AuthEventPublisher authEventPublisher;
	@MockBean UserServiceClient userServiceClient;
	@MockBean JavaMailSender javaMailSender;
	@MockBean ConnectionFactory connectionFactory;
	@MockBean DataInitializer dataInitializer;

	@Test
	void contextLoads() {
	}

}
