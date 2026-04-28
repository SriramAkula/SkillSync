package com.skillsync.messaging;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.cloud.client.discovery.EnableDiscoveryClient;
import org.springframework.cloud.openfeign.EnableFeignClients;
import jakarta.annotation.PostConstruct;
import java.util.TimeZone;
import lombok.extern.slf4j.Slf4j;

@SpringBootApplication
@EnableDiscoveryClient
@EnableFeignClients
@Slf4j
public class MessagingServiceApplication {

    @PostConstruct
    public void init() {
        TimeZone.setDefault(TimeZone.getTimeZone("Asia/Kolkata"));
        log.info("[TIMEZONE] Messaging Service running in IST (Asia/Kolkata)");
    }

    public static void main(String[] args) {
        SpringApplication.run(MessagingServiceApplication.class, args);
        log.info("[OK] Messaging Service Started on port 8089");
    }
}
