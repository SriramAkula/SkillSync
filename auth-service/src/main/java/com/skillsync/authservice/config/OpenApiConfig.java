package com.skillsync.authservice.config;

import io.swagger.v3.oas.models.OpenAPI;
import io.swagger.v3.oas.models.info.Info;
import io.swagger.v3.oas.models.security.SecurityScheme;
import io.swagger.v3.oas.models.security.SecurityRequirement;
import io.swagger.v3.oas.models.servers.Server;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

@Configuration
public class OpenApiConfig {
    
    private static final Logger logger = LoggerFactory.getLogger(OpenApiConfig.class);

    @Bean
    public OpenAPI customOpenAPI() {
        try {
            logger.info("Initializing OpenAPI configuration");
            return new OpenAPI()
                    .info(new Info()
                            .title("Auth Service API")
                            .version("1.0.0")
                            .description("User authentication and JWT token management"))
                    .addServersItem(new Server().url("http://localhost:9090/api").description("API Gateway"))
                    .addSecurityItem(new SecurityRequirement().addList("bearerAuth"))
                    .components(new io.swagger.v3.oas.models.Components()
                            .addSecuritySchemes("bearerAuth",
                                    new SecurityScheme()
                                            .type(SecurityScheme.Type.HTTP)
                                            .scheme("bearer")
                                            .bearerFormat("JWT")
                                            .description("JWT Bearer token")));
        } catch (Exception e) {
            logger.error("Error initializing OpenAPI config", e);
            // Return minimal config if there's an error
            return new OpenAPI()
                    .info(new Info()
                            .title("Auth Service API")
                            .version("1.0.0")
                            .description("User authentication and JWT token management"));
        }
    }
}
