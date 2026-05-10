package com.skillsync.apiGateway.config;

import io.swagger.v3.oas.models.OpenAPI;
import io.swagger.v3.oas.models.info.Info;
import io.swagger.v3.oas.models.info.Contact;
import io.swagger.v3.oas.models.servers.Server;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import java.util.List;

@Configuration
public class OpenApiConfig {

    @Bean
    public OpenAPI customOpenAPI() {
        return new OpenAPI()
                .info(new Info()
                        .title("SkillSync API Gateway")
                        .version("1.0.0")
                        .description("API Gateway - Single entry point for all SkillSync microservices")
                        .contact(new Contact()
                                .name("SkillSync Team")
                                .email("support@skillsync.com")))
                .servers(List.of(
                        new Server().url("http://localhost:9090").description("Local Development Server (Gateway)"),
                        new Server().url("https://api.skillssync.me").description("Production Server (Azure VM)")
                ));
    }
}
