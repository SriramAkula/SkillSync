package com.skillsync.user;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.cache.annotation.EnableCaching;
import org.springframework.cloud.client.discovery.EnableDiscoveryClient;

/**
 * User Service - Profile and account management
 * 
 * Manages:
 * - User profiles
 * - Profile information (name, bio, skills)
 * - Profile images
 * - User information updates
 */
@SpringBootApplication
@EnableDiscoveryClient
@EnableCaching
public class UserServiceApplication {

	public static void main(String[] args) {
		SpringApplication.run(UserServiceApplication.class, args);
		System.out.println("✓ User Service Started on port 8082");
	}

}
