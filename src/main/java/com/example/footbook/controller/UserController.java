package com.example.footbook.controller;

import com.example.footbook.dto.UserRequestDto;
import com.example.footbook.dto.UserResponseDto;
import com.example.footbook.entity.User;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.atomic.AtomicLong;

@RestController
@RequestMapping("/api/users")
public class UserController {

    private final Map<Long, User> users = new ConcurrentHashMap<>();
    private final AtomicLong sequence = new AtomicLong(1);

    @GetMapping
    public List<UserResponseDto> getAllUsers() {
        return users.values().stream()
                .map(UserResponseDto::fromEntity)
                .toList();
    }

    @GetMapping("/{id}")
    public ResponseEntity<UserResponseDto> getUserById(@PathVariable Long id) {
        User existingUser = users.get(id);
        if (existingUser == null) {
            return ResponseEntity.notFound().build();
        }
        return ResponseEntity.ok(UserResponseDto.fromEntity(existingUser));
    }

    @PostMapping
    public ResponseEntity<?> createUser(@RequestBody UserRequestDto payload) {
        if (payload.getFullName() == null || payload.getFullName().isBlank()) {
            return ResponseEntity.badRequest().body("fullName is required");
        }
        if (payload.getEmail() == null || payload.getEmail().isBlank()) {
            return ResponseEntity.badRequest().body("email is required");
        }
        if (payload.getPhoneNumber() == null || payload.getPhoneNumber().isBlank()) {
            return ResponseEntity.badRequest().body("phoneNumber is required");
        }

        User user = new User();
        user.setFullName(payload.getFullName());
        user.setEmail(payload.getEmail());
        user.setPhoneNumber(payload.getPhoneNumber());

        long id = sequence.getAndIncrement();
        user.setId(id);
        users.put(id, user);

        return ResponseEntity.status(HttpStatus.CREATED).body(UserResponseDto.fromEntity(user));
    }

    @PutMapping("/{id}")
    public ResponseEntity<?> updateUser(@PathVariable Long id, @RequestBody UserRequestDto payload) {
        User existing = users.get(id);
        if (existing == null) {
            return ResponseEntity.notFound().build();
        }

        if (payload.getFullName() != null && !payload.getFullName().isBlank()) {
            existing.setFullName(payload.getFullName());
        }
        if (payload.getEmail() != null && !payload.getEmail().isBlank()) {
            existing.setEmail(payload.getEmail());
        }
        if (payload.getPhoneNumber() != null && !payload.getPhoneNumber().isBlank()) {
            existing.setPhoneNumber(payload.getPhoneNumber());
        }

        users.put(id, existing);
        return ResponseEntity.ok(UserResponseDto.fromEntity(existing));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteUser(@PathVariable Long id) {
        User removed = users.remove(id);
        if (removed == null) {
            return ResponseEntity.notFound().build();
        }
        return ResponseEntity.noContent().build();
    }
}
