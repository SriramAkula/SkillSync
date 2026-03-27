package com.skillsync.mentor;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.cache.annotation.EnableCaching;
import org.springframework.cloud.client.discovery.EnableDiscoveryClient;
import org.springframework.cloud.openfeign.EnableFeignClients;

/**
 * Mentor Service - Mentor management and approval
 * 
 * Manages:
 * - Mentor applications
 * - Mentor approvals (admin)
 * - Mentor profiles and ratings
 * - Mentor availability
 */
@SpringBootApplication
@EnableDiscoveryClient
@EnableFeignClients
@EnableCaching
public class MentorServiceApplication {

	public static void main(String[] args) {
		SpringApplication.run(MentorServiceApplication.class, args);
		System.out.println("✓ Mentor Service Started on port 8084");
	}
}
	