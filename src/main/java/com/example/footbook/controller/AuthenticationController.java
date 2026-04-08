package com.example.footbook.controller;

import com.example.footbook.entity.User;
import com.example.footbook.repository.UserRepository;
import com.example.footbook.security.JwtTokenProvider;
import com.example.footbook.security.LoginRequest;
import com.example.footbook.security.LoginResponse;
import com.example.footbook.security.RegisterRequest;
import com.example.footbook.service.EmailVerificationService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import jakarta.validation.Valid;
import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/api/auth")
public class AuthenticationController {

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private JwtTokenProvider jwtTokenProvider;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @Autowired
    private EmailVerificationService emailVerificationService;

    /**
     * Login endpoint
     */
    @PostMapping("/login")
    public ResponseEntity<?> login(@Valid @RequestBody LoginRequest loginRequest) {
        // Check if user exists
        return userRepository.findByEmail(loginRequest.getEmail())
                .map(user -> {
                    // Validate password
                    if (passwordEncoder.matches(loginRequest.getPassword(), user.getPassword())) {
                        if (!Boolean.TRUE.equals(user.getEmailVerified())) {
                            Map<String, String> error = new HashMap<>();
                            error.put("error", "Please verify your email before logging in");
                            return ResponseEntity.status(HttpStatus.FORBIDDEN).body(error);
                        }

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

        User savedUser = userRepository.save(user);
        String verificationToken = emailVerificationService.issueVerificationToken(savedUser);
        emailVerificationService.sendVerificationEmail(savedUser, verificationToken);

        Map<String, Object> response = new HashMap<>();
        response.put("message", "Account created. Please verify your email before logging in.");
        // Exposed for local/dev environments where SMTP may not be configured.
        response.put("verificationLink", emailVerificationService.buildVerificationLink(verificationToken));

        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    @GetMapping("/verify-email")
    public ResponseEntity<?> verifyEmail(@RequestParam String token) {
        return emailVerificationService.verifyToken(token)
                .map(user -> {
                    Map<String, Object> response = new HashMap<>();
                    response.put("message", "Email verified successfully. You can now log in.");
                    response.put("email", user.getEmail());
                    return ResponseEntity.ok(response);
                })
                .orElseGet(() -> {
                    Map<String, Object> response = new HashMap<>();
                    response.put("error", "Invalid or expired verification link");
                    return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(response);
                });
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
