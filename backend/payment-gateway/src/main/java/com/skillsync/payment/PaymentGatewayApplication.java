package com.skillsync.payment;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.cloud.client.discovery.EnableDiscoveryClient;
import org.springframework.cloud.openfeign.EnableFeignClients;

@SpringBootApplication
@EnableDiscoveryClient
@EnableFeignClients
@lombok.extern.slf4j.Slf4j
public class PaymentGatewayApplication {
    public static void main(String[] args) {
        SpringApplication.run(PaymentGatewayApplication.class, args);
        log.info("[OK] Payment Gateway Started on port 8089");
    }
}
