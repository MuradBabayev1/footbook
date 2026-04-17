package com.example.footbook.config;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.web.server.ConfigurableWebServerFactory;
import org.springframework.boot.web.server.WebServerFactoryCustomizer;
import org.springframework.context.annotation.Configuration;

import java.io.IOException;
import java.net.ServerSocket;

@Configuration
public class ServerPortFallbackConfig implements WebServerFactoryCustomizer<ConfigurableWebServerFactory> {

    private static final Logger logger = LoggerFactory.getLogger(ServerPortFallbackConfig.class);

    @Value("${server.port:8081}")
    private int configuredPort;

    @Override
    public void customize(ConfigurableWebServerFactory factory) {
        if (configuredPort <= 0) {
            return;
        }

        if (!isPortAvailable(configuredPort)) {
            logger.warn("Configured port {} is already in use. Falling back to a random available port.", configuredPort);
            factory.setPort(0);
            return;
        }

        factory.setPort(configuredPort);
    }

    private boolean isPortAvailable(int port) {
        try (ServerSocket ignored = new ServerSocket(port)) {
            return true;
        } catch (IOException ex) {
            return false;
        }
    }
}
