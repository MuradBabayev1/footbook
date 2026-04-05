package com.example.footbook.controller;

import com.example.footbook.entity.User;
import com.example.footbook.repository.UserRepository;
import com.example.footbook.security.JwtTokenProvider;
import com.example.footbook.security.LoginRequest;
import com.example.footbook.security.LoginResponse;
import com.example.footbook.security.RegisterRequest;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
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
                        // Generate JWT token
                        String token = jwtTokenProvider.generateToken(user.getId(), user.getEmail());
                        LoginResponse response = new LoginResponse(token, user.getId(), user.getEmail(), user.getFullName());
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

        User savedUser = userRepository.save(user);

        // Generate JWT token
        String token = jwtTokenProvider.generateToken(savedUser.getId(), savedUser.getEmail());
        LoginResponse response = new LoginResponse(token, savedUser.getId(), savedUser.getEmail(), savedUser.getFullName());

        return ResponseEntity.status(HttpStatus.CREATED).body(response);
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
