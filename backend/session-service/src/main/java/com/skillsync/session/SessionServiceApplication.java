package com.skillsync.session;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.cache.annotation.EnableCaching;
import org.springframework.cloud.client.discovery.EnableDiscoveryClient;

@SpringBootApplication
@EnableDiscoveryClient
@EnableCaching
public class SessionServiceApplication {
	public static void main(String[] args) {
		SpringApplication.run(SessionServiceApplication.class, args);
		System.out.println("[OK] Session Service Started on port 8085");
	}
}
