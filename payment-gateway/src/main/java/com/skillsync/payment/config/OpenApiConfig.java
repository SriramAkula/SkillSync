package com.skillsync.payment.config;

import io.swagger.v3.oas.models.OpenAPI;
import io.swagger.v3.oas.models.info.Info;
import io.swagger.v3.oas.models.servers.Server;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import java.util.List;

@Configuration
public class OpenApiConfig {

    @Value("${api.gateway.url:http://localhost:9090/api/payment}")
    private String apiGatewayUrl;

    @Bean
    public OpenAPI openAPI() {
        return new OpenAPI()
                .info(new Info()
                        .title("Payment Gateway - Saga Orchestrator")
                        .description("Orchestration-based Saga for session payments via Razorpay")
                        .version("1.0.0"))
                .servers(List.of(
                        new Server()
                                .url(apiGatewayUrl)
                                .description("API Gateway (use this)")
                ));
    }
}
