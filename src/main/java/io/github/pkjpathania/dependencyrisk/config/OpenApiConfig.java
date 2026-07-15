package io.github.pkjpathania.dependencyrisk.config;

import io.swagger.v3.oas.annotations.OpenAPIDefinition;
import io.swagger.v3.oas.annotations.info.Info;
import org.springframework.context.annotation.Configuration;

@Configuration
@OpenAPIDefinition(
    info =
        @Info(
            title = "Dependency Risk Graph API",
            version = "v1",
            description =
                "OpenAPI documentation for the Dependency Risk Graph service and its REST endpoints."))
public class OpenApiConfig {}
