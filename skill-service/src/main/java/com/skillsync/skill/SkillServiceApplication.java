package com.skillsync.skill;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.cache.annotation.EnableCaching;
import org.springframework.cloud.client.discovery.EnableDiscoveryClient;

/**
 * Skill Service - Skill management and tagging
 * 
 * Manages:
 * - Skills (CRUD)
 * - Skill categories
 * - Skill popularity tracking
 * 
 * Features:
 * - Redis caching for frequently accessed skills
 * - Search and filtering
 */
@SpringBootApplication
@EnableDiscoveryClient
@EnableCaching
public class SkillServiceApplication {

	public static void main(String[] args) {
		SpringApplication.run(SkillServiceApplication.class, args);
		System.out.println("✓ Skill Service Started on port 8083");
	}

}
