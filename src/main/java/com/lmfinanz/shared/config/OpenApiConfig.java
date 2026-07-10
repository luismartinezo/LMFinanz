package com.lmfinanz.shared.config;

import io.swagger.v3.oas.models.Components;
import io.swagger.v3.oas.models.OpenAPI;
import io.swagger.v3.oas.models.info.Contact;
import io.swagger.v3.oas.models.info.Info;
import io.swagger.v3.oas.models.info.License;
import io.swagger.v3.oas.models.security.SecurityRequirement;
import io.swagger.v3.oas.models.security.SecurityScheme;
import io.swagger.v3.oas.models.servers.Server;
import java.util.List;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class OpenApiConfig {

    private static final String BEARER_AUTH = "bearerAuth";

    @Bean
    OpenAPI lmFinanzOpenApi() {
        return new OpenAPI()
                .info(new Info()
                        .title("LMFinanz API")
                        .version("0.1.0")
                        .description("REST API for personal finance management: authentication, accounts, categories, transactions, reports, debts, savings goals, assets, reference data, and admin user management.")
                        .contact(new Contact()
                                .name("Luis Martinez")
                                .email("lmartinezocoro@gmail.com"))
                        .license(new License()
                                .name("Private project")))
                .servers(List.of(new Server()
                        .url("http://localhost:8080")
                        .description("Local development server")))
                .components(new Components()
                        .addSecuritySchemes(BEARER_AUTH, new SecurityScheme()
                                .name(BEARER_AUTH)
                                .type(SecurityScheme.Type.HTTP)
                                .scheme("bearer")
                                .bearerFormat("JWT")))
                .addSecurityItem(new SecurityRequirement().addList(BEARER_AUTH));
    }
}
