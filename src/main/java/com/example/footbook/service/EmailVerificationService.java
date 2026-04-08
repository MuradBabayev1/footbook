package com.example.footbook.service;

import com.example.footbook.entity.User;
import com.example.footbook.repository.UserRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.ObjectProvider;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import java.time.LocalDateTime;
import java.util.Optional;
import java.util.UUID;
import java.util.concurrent.ThreadLocalRandom;

@Service
@Transactional
public class EmailVerificationService {

    private static final Logger log = LoggerFactory.getLogger(EmailVerificationService.class);

    private final UserRepository userRepository;
    private final ObjectProvider<JavaMailSender> mailSenderProvider;

    @Value("${footbook.backend.base-url:http://localhost:8080}")
    private String backendBaseUrl;

    @Value("${footbook.frontend.base-url:http://localhost:8080/frontend}")
    private String frontendBaseUrl;

    @Value("${footbook.mail.from:no-reply@footbook.local}")
    private String mailFrom;

    public EmailVerificationService(UserRepository userRepository,
                                    ObjectProvider<JavaMailSender> mailSenderProvider) {
        this.userRepository = userRepository;
        this.mailSenderProvider = mailSenderProvider;
    }

    public String issueVerificationToken(User user) {
        String token = String.format("%06d", ThreadLocalRandom.current().nextInt(100000, 1000000));
        user.setEmailVerified(false);
        user.setEmailVerificationToken(token);
        user.setEmailVerificationTokenExpiry(LocalDateTime.now().plusMinutes(30));
        userRepository.save(user);
        return token;
    }

    public Optional<User> verifyToken(String token) {
        if (token == null || token.isBlank()) {
            return Optional.empty();
        }

        return userRepository.findByEmailVerificationToken(token)
                .filter(user -> user.getEmailVerificationTokenExpiry() != null
                        && user.getEmailVerificationTokenExpiry().isAfter(LocalDateTime.now()))
                .map(user -> {
                    user.setEmailVerified(true);
                    user.setEmailVerificationToken(null);
                    user.setEmailVerificationTokenExpiry(null);
                    return userRepository.save(user);
                });
    }

    public String buildVerificationLink(String token) {
        String encoded = URLEncoder.encode(token, StandardCharsets.UTF_8);
        return frontendBaseUrl + "/verify-email.html?code=" + encoded;
    }

    public void sendVerificationEmail(User user, String token) {
        String verificationLink = buildVerificationLink(token);
        JavaMailSender mailSender = mailSenderProvider.getIfAvailable();

        if (mailSender == null) {
            log.info("Mail sender is not configured. Verification link for {}: {}", user.getEmail(), verificationLink);
            return;
        }

        try {
            SimpleMailMessage message = new SimpleMailMessage();
            message.setFrom(mailFrom);
            message.setTo(user.getEmail());
            message.setSubject("Your Footbook verification code");
            message.setText("Welcome to Footbook!\n\nYour verification code is: "
                    + token
                    + "\n\nEnter this 6-digit code on the verification page to activate your account.\n"
                    + "You can also open this link: "
                    + verificationLink
                    + "\n\nThis code expires in 30 minutes.");
            mailSender.send(message);
        } catch (Exception ex) {
            log.warn("Failed to send verification email to {}. Verification link: {}", user.getEmail(), verificationLink, ex);
        }
    }
}
