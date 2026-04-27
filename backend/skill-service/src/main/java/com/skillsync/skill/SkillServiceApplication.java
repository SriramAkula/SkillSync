package com.skillsync.skill;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.cache.annotation.EnableCaching;
import org.springframework.cloud.client.discovery.EnableDiscoveryClient;
import jakarta.annotation.PostConstruct;
import java.util.TimeZone;
import lombok.extern.slf4j.Slf4j;

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
@Slf4j
public class SkillServiceApplication {

	@PostConstruct
	public void init() {
		TimeZone.setDefault(TimeZone.getTimeZone("Asia/Kolkata"));
		log.info("[TIMEZONE] Skill Service running in IST (Asia/Kolkata)");
	}

	public static void main(String[] args) {
		SpringApplication.run(SkillServiceApplication.class, args);
		log.info("[OK] Skill Service Started on port 8083");
	}

}
