package com.skillsync.user;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.cache.annotation.EnableCaching;
import org.springframework.cloud.client.discovery.EnableDiscoveryClient;
import org.springframework.cloud.openfeign.EnableFeignClients;
import jakarta.annotation.PostConstruct;
import java.util.TimeZone;
import lombok.extern.slf4j.Slf4j;

/**
 * User Service - Profile and account management
 */
@SpringBootApplication
@EnableDiscoveryClient
@EnableFeignClients
@EnableCaching
@Slf4j
public class UserServiceApplication {

	@PostConstruct
	public void init() {
		TimeZone.setDefault(TimeZone.getTimeZone("Asia/Kolkata"));
		log.info("[TIMEZONE] User Service running in IST (Asia/Kolkata)");
	}

	public static void main(String[] args) {
		SpringApplication.run(UserServiceApplication.class, args);
		log.info("[OK] User Service Started on port 8082");
	}

}
