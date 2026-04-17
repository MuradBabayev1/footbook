package com.example.footbook.config;

import java.io.IOException;
import java.net.InetSocketAddress;
import java.net.Socket;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.time.Duration;
import java.util.List;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.DisposableBean;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.stereotype.Component;

@Component
public class FrontendDevServerRunner implements ApplicationRunner, DisposableBean {

    private static final Logger log = LoggerFactory.getLogger(FrontendDevServerRunner.class);

    private final boolean autoStart;
    private final int frontendPort;
    private Process frontendProcess;

    public FrontendDevServerRunner(
            @Value("${footbook.frontend.auto-start:false}") boolean autoStart,
            @Value("${footbook.frontend.port:3000}") int frontendPort) {
        this.autoStart = autoStart;
        this.frontendPort = frontendPort;
    }

    @Override
    public void run(ApplicationArguments args) {
        if (!autoStart) {
            return;
        }

        if (isPortOpen(frontendPort)) {
            log.info("Frontend already running on port {}. Skipping auto-start.", frontendPort);
            return;
        }

        Path frontendDir = findFrontendDirectory();
        if (frontendDir == null) {
            log.warn("Frontend auto-start is enabled but frontend-react directory was not found. Skipping.");
            return;
        }

        try {
            ProcessBuilder builder = new ProcessBuilder("npm", "start");
            builder.directory(frontendDir.toFile());
            builder.environment().putIfAbsent("PORT", String.valueOf(frontendPort));
            builder.redirectErrorStream(true);
            builder.redirectOutput(ProcessBuilder.Redirect.INHERIT);
            frontendProcess = builder.start();

            log.info("Started frontend dev server from {} on port {}.", frontendDir, frontendPort);
        } catch (IOException ex) {
            log.warn("Failed to auto-start frontend dev server: {}", ex.getMessage());
        }
    }

    @Override
    public void destroy() {
        if (frontendProcess == null) {
            return;
        }

        if (frontendProcess.isAlive()) {
            frontendProcess.destroy();
            try {
                if (!frontendProcess.waitFor(Duration.ofSeconds(5).toMillis(), java.util.concurrent.TimeUnit.MILLISECONDS)) {
                    frontendProcess.destroyForcibly();
                }
            } catch (InterruptedException ex) {
                Thread.currentThread().interrupt();
                frontendProcess.destroyForcibly();
            }
        }
    }

    private static boolean isPortOpen(int port) {
        try (Socket socket = new Socket()) {
            socket.connect(new InetSocketAddress("127.0.0.1", port), 250);
            return true;
        } catch (IOException ex) {
            return false;
        }
    }

    private static Path findFrontendDirectory() {
        List<Path> candidates = List.of(
                Paths.get(System.getProperty("user.dir"), "frontend-react"),
                Paths.get(System.getProperty("user.dir"), "..", "frontend-react"));

        for (Path candidate : candidates) {
            Path packageJson = candidate.resolve("package.json");
            if (Files.exists(packageJson)) {
                return candidate.normalize().toAbsolutePath();
            }
        }

        return null;
    }
}
