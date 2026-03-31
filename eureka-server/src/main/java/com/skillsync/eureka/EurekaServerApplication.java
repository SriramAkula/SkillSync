package com.skillsync.eureka;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.cloud.netflix.eureka.server.EnableEurekaServer;

/**
 * Eureka Server - Service Registry and Discovery
 * 
 * This server manages service registration and discovery
 * for all microservices in the SkillSync platform.
 */
@SpringBootApplication
@EnableEurekaServer
public class EurekaServerApplication {

	public static void main(String[] args) {
		SpringApplication.run(EurekaServerApplication.class, args);
		System.out.println("[OK] Eureka Server Started on port 8761");
		System.out.println("  Dashboard: http://localhost:8761");
	}

}
