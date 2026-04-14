package com.example.footbook.controller;

import com.example.footbook.entity.User;
import com.example.footbook.entity.Owner;
import com.example.footbook.enums.UserRole;
import com.example.footbook.repository.OwnerRepository;
import com.example.footbook.repository.UserRepository;
import com.example.footbook.security.JwtTokenProvider;
import com.example.footbook.security.LoginRequest;
import com.example.footbook.security.LoginResponse;
import com.example.footbook.security.RegisterRequest;
import com.example.footbook.security.ResendVerificationRequest;
import com.example.footbook.security.VerifyEmailRequest;
import com.example.footbook.service.EmailService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import jakarta.validation.Valid;
import java.security.SecureRandom;
import java.time.Duration;
import java.time.Instant;
import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/api/auth")
public class AuthenticationController {

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private OwnerRepository ownerRepository;

    @Autowired
    private JwtTokenProvider jwtTokenProvider;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @Autowired
    private EmailService emailService;

    @Value("${footbook.verification.code-exp-minutes:15}")
    private long verificationCodeExpiryMinutes;

    private final SecureRandom secureRandom = new SecureRandom();

    /**
     * Login endpoint
     */
    @PostMapping("/login")
    public ResponseEntity<?> login(@Valid @RequestBody LoginRequest loginRequest) {
        // Check if user exists
        return userRepository.findByEmail(loginRequest.getEmail())
                .map(user -> {
                    if (Boolean.FALSE.equals(user.getEmailVerified())) {
                        Map<String, String> error = new HashMap<>();
                        error.put("error", "Email not verified. Please verify your email before logging in.");
                        return ResponseEntity.status(HttpStatus.FORBIDDEN).body(error);
                    }
                    // Validate password
                    if (passwordEncoder.matches(loginRequest.getPassword(), user.getPassword())) {
                        // Generate JWT token
                        String token = jwtTokenProvider.generateToken(user.getId(), user.getEmail());
                        LoginResponse response = new LoginResponse(token, user.getId(), user.getEmail(), user.getFullName());
                        response.setRole(user.getRole() != null ? user.getRole().name() : "USER");
                        return ResponseEntity.ok(response);
                    } else {
                        Map<String, String> error = new HashMap<>();
                        error.put("error", "Invalid email or password");
                        return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(error);
                    }
                })
                .orElse(ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                        .body(new HashMap<String, String>() {{
                            put("error", "User not found");
                        }}));
    }

    /**
     * Register endpoint
     */
    @PostMapping("/register")
    public ResponseEntity<?> register(@Valid @RequestBody RegisterRequest registerRequest) {
        // Check if email already exists
        if (userRepository.existsByEmail(registerRequest.getEmail())) {
            Map<String, String> error = new HashMap<>();
            error.put("error", "Email already registered");
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(error);
        }

        // Create new user
        User user = new User();
        user.setFullName(registerRequest.getFullName());
        user.setEmail(registerRequest.getEmail());
        user.setPhoneNumber(registerRequest.getPhoneNumber());
        user.setPassword(passwordEncoder.encode(registerRequest.getPassword()));
        user.setEmailVerified(false);
        if (registerRequest.getAccountType() == null || registerRequest.getAccountType().isBlank()) {
            Map<String, String> error = new HashMap<>();
            error.put("error", "Account type is required. Please choose User or Owner.");
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(error);
        }

        String accountType = registerRequest.getAccountType().trim().toUpperCase();
        if (!"USER".equals(accountType) && !"OWNER".equals(accountType)) {
            Map<String, String> error = new HashMap<>();
            error.put("error", "Invalid account type");
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(error);
        }
        user.setRole("OWNER".equals(accountType) ? UserRole.OWNER : UserRole.USER);
        String verificationCode = generateVerificationCode();
        user.setEmailVerificationCode(verificationCode);
        user.setEmailVerificationExpiresAt(Instant.now().plus(Duration.ofMinutes(verificationCodeExpiryMinutes)));

        User savedUser = userRepository.save(user);

        try {
            emailService.sendVerificationCode(savedUser.getEmail(), verificationCode, verificationCodeExpiryMinutes);
        } catch (IllegalStateException ex) {
            Map<String, String> error = new HashMap<>();
            error.put("error", "Account created but verification email could not be sent. Please try again later.");
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(error);
        }

        if (savedUser.getRole() == UserRole.OWNER) {
            Owner owner = new Owner();
            owner.setUser(savedUser);
            ownerRepository.save(owner);
        }

        Map<String, Object> response = new HashMap<>();
        response.put("message", "Account created successfully. Check your email for the verification code.");
        response.put("userId", savedUser.getId());
        response.put("role", savedUser.getRole().name());
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    /**
     * Resend email verification code
     */
    @PostMapping("/resend-verification")
    public ResponseEntity<?> resendVerification(@Valid @RequestBody ResendVerificationRequest request) {
        return userRepository.findByEmail(request.getEmail())
                .map(user -> {
                    if (Boolean.TRUE.equals(user.getEmailVerified())) {
                        Map<String, String> response = new HashMap<>();
                        response.put("message", "Email is already verified.");
                        return ResponseEntity.ok(response);
                    }

                    String verificationCode = generateVerificationCode();
                    user.setEmailVerificationCode(verificationCode);
                    user.setEmailVerificationExpiresAt(Instant.now().plus(Duration.ofMinutes(verificationCodeExpiryMinutes)));
                    userRepository.save(user);

                    try {
                        emailService.sendVerificationCode(user.getEmail(), verificationCode, verificationCodeExpiryMinutes);
                    } catch (IllegalStateException ex) {
                        Map<String, String> error = new HashMap<>();
                        error.put("error", "Verification email could not be sent. Please try again later.");
                        return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(error);
                    }

                    Map<String, String> response = new HashMap<>();
                    response.put("message", "Verification code resent.");
                    return ResponseEntity.ok(response);
                })
                .orElse(ResponseEntity.status(HttpStatus.NOT_FOUND)
                        .body(new HashMap<String, String>() {{
                            put("error", "User not found");
                        }}));
    }

    /**
     * Verify email with a 6-digit code
     */
    @PostMapping("/verify-email")
    public ResponseEntity<?> verifyEmail(@Valid @RequestBody VerifyEmailRequest request) {
        return userRepository.findByEmail(request.getEmail())
                .map(user -> {
                    if (Boolean.TRUE.equals(user.getEmailVerified())) {
                        Map<String, String> response = new HashMap<>();
                        response.put("message", "Email is already verified.");
                        return ResponseEntity.ok(response);
                    }

                    String storedCode = user.getEmailVerificationCode();
                    Instant expiresAt = user.getEmailVerificationExpiresAt();
                    if (storedCode == null || expiresAt == null) {
                        Map<String, String> error = new HashMap<>();
                        error.put("error", "Verification code not found. Please request a new code.");
                        return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(error);
                    }

                    if (Instant.now().isAfter(expiresAt)) {
                        Map<String, String> error = new HashMap<>();
                        error.put("error", "Verification code has expired. Please request a new code.");
                        return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(error);
                    }

                    if (!storedCode.equals(request.getCode())) {
                        Map<String, String> error = new HashMap<>();
                        error.put("error", "Invalid verification code.");
                        return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(error);
                    }

                    user.setEmailVerified(true);
                    user.setEmailVerificationCode(null);
                    user.setEmailVerificationExpiresAt(null);
                    userRepository.save(user);

                    Map<String, String> response = new HashMap<>();
                    response.put("message", "Email verified successfully.");
                    return ResponseEntity.ok(response);
                })
                .orElse(ResponseEntity.status(HttpStatus.NOT_FOUND)
                        .body(new HashMap<String, String>() {{
                            put("error", "User not found");
                        }}));
    }

    private String generateVerificationCode() {
        int code = secureRandom.nextInt(1_000_000);
        return String.format("%06d", code);
    }

    /**
     * Logout endpoint (can be used to invalidate tokens on client side)
     */
    @PostMapping("/logout")
    public ResponseEntity<?> logout() {
        Map<String, String> response = new HashMap<>();
        response.put("message", "Logged out successfully");
        return ResponseEntity.ok(response);
    }
}
