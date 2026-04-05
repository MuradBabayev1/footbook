package com.example.footbook.config;

import org.springframework.context.annotation.Configuration;

@Configuration
public class JacksonConfig {
    
    /**
     * Jackson configuration for JSON serialization/deserialization
     * 
     * The following is configured automatically by Spring Boot:
     * - Support for Java 8+ date/time types via jackson-datatype-jsr310
     * - ISO 8601 date format for JSON responses
     * - Pretty printing can be controlled via:
     *   spring.jackson.serialization.indent-output=true
     */
}

