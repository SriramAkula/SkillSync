package com.skillsync.session;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.cache.annotation.EnableCaching;
import org.springframework.cloud.client.discovery.EnableDiscoveryClient;
import org.springframework.cloud.openfeign.EnableFeignClients;

@SpringBootApplication
@EnableDiscoveryClient
@EnableCaching
@EnableFeignClients
@lombok.extern.slf4j.Slf4j
public class SessionServiceApplication {
	public static void main(String[] args) {
		SpringApplication.run(SessionServiceApplication.class, args);
		log.info("[OK] Session Service Started on port 8085");
	}
}
