package com.skillsync.review;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.cache.annotation.EnableCaching;
import org.springframework.cloud.client.discovery.EnableDiscoveryClient;
import org.springframework.cloud.openfeign.EnableFeignClients;

@SpringBootApplication
@EnableDiscoveryClient
@EnableFeignClients
@EnableCaching
public class ReviewServiceApplication {
	public static void main(String[] args) {
		SpringApplication.run(ReviewServiceApplication.class, args);
		System.out.println("✓ Review Service Started on port 8087");
	}
}
