package com.skillsync.apiGateway.config;

import io.swagger.v3.oas.models.OpenAPI;
import io.swagger.v3.oas.models.info.Info;
import io.swagger.v3.oas.models.info.Contact;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

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
                                .email("support@skillsync.com")));
    }
}
