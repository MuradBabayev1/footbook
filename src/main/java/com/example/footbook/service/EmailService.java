package com.example.footbook.service;

import jakarta.mail.MessagingException;
import jakarta.mail.internet.MimeMessage;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.stereotype.Service;

import java.io.UnsupportedEncodingException;

@Service
public class EmailService {

    private final JavaMailSender mailSender;
    private final String fromAddress;
    private final String fromName;
    private final String verificationSubject;

    public EmailService(JavaMailSender mailSender,
                        @Value("${footbook.mail.from-address:${MAIL_USERNAME:}}") String fromAddress,
                        @Value("${footbook.mail.from-name:Footbook}") String fromName,
                        @Value("${footbook.mail.verification-subject:Footbook verification code}") String verificationSubject) {
        this.mailSender = mailSender;
        this.fromAddress = fromAddress;
        this.fromName = fromName;
        this.verificationSubject = verificationSubject;
    }

    public void sendVerificationCode(String to, String code, long expiresMinutes) {
        if (fromAddress == null || fromAddress.isBlank()) {
            throw new IllegalStateException("Mail sender address is not configured. Set MAIL_USERNAME or MAIL_FROM_ADDRESS.");
        }

        String body = "Your Footbook verification code is: " + code + "\n\n" +
                "This code expires in " + expiresMinutes + " minutes.";

        try {
            MimeMessage message = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, "UTF-8");
            if (fromName != null && !fromName.isBlank()) {
                helper.setFrom(fromAddress, fromName);
            } else {
                helper.setFrom(fromAddress);
            }
            helper.setTo(to);
            helper.setSubject(verificationSubject);
            helper.setText(body, false);
            mailSender.send(message);
        } catch (MessagingException | UnsupportedEncodingException ex) {
            throw new IllegalStateException("Failed to send verification email", ex);
        }
    }
}
