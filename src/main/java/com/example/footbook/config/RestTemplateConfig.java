package com.example.footbook.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.client.RestTemplate;

@Configuration
public class RestTemplateConfig {

    /**
     * Configure RestTemplate bean for HTTP operations
     * 
     * Note: Timeout configuration can be set via application.properties:
     * spring.httpclient.connect-timeout=5000
     * spring.httpclient.read-timeout=10000
     */
    @Bean
    public RestTemplate restTemplate() {
        return new RestTemplate();
    }
}

