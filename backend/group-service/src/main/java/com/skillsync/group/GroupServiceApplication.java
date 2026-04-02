package com.skillsync.group;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.cache.annotation.EnableCaching;
import org.springframework.cloud.client.discovery.EnableDiscoveryClient;
import org.springframework.cloud.openfeign.EnableFeignClients;

@SpringBootApplication
@EnableDiscoveryClient
@EnableCaching
@EnableFeignClients
public class GroupServiceApplication {
	public static void main(String[] args) {
		SpringApplication.run(GroupServiceApplication.class, args);
		System.out.println("[OK] Group Service Started on port 8086");
	}
}
