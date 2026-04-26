package com.skillsync.mentor;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.cache.annotation.EnableCaching;
import org.springframework.cloud.client.discovery.EnableDiscoveryClient;
import org.springframework.cloud.openfeign.EnableFeignClients;
import jakarta.annotation.PostConstruct;
import java.util.TimeZone;
import lombok.extern.slf4j.Slf4j;

/**
 * Mentor Service - Mentor management and approval
 */
@SpringBootApplication
@EnableDiscoveryClient
@EnableFeignClients
@EnableCaching
@Slf4j
public class MentorServiceApplication {

	@PostConstruct
	public void init() {
		TimeZone.setDefault(TimeZone.getTimeZone("Asia/Kolkata"));
		log.info("[TIMEZONE] Mentor Service running in IST (Asia/Kolkata)");
	}

	public static void main(String[] args) {
		SpringApplication.run(MentorServiceApplication.class, args);
		log.info("[OK] Mentor Service Started on port 8084");
	}
}