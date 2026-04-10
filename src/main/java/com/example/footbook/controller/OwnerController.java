package com.example.footbook.controller;

import com.example.footbook.entity.Owner;
import com.example.footbook.entity.User;
import com.example.footbook.enums.UserRole;
import com.example.footbook.repository.OwnerRepository;
import com.example.footbook.repository.UserRepository;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/api/owners")
public class OwnerController {

    private final OwnerRepository ownerRepository;
    private final UserRepository userRepository;

    public OwnerController(OwnerRepository ownerRepository, UserRepository userRepository) {
        this.ownerRepository = ownerRepository;
        this.userRepository = userRepository;
    }

    @PostMapping("/promote/{userId}")
    public ResponseEntity<?> promoteToOwner(@PathVariable Long userId) {
        User user = userRepository.findById(userId).orElse(null);
        if (user == null) {
            return ResponseEntity.notFound().build();
        }

        if (ownerRepository.existsByUserId(userId)) {
            Map<String, Object> response = new HashMap<>();
            response.put("message", "User is already an owner");
            response.put("userId", user.getId());
            response.put("email", user.getEmail());
            return ResponseEntity.ok(response);
        }

        user.setRole(UserRole.OWNER);
        userRepository.save(user);

        Owner owner = new Owner();
        owner.setUser(user);
        Owner savedOwner = ownerRepository.save(owner);

        Map<String, Object> response = new HashMap<>();
        response.put("message", "Owner created successfully");
        response.put("ownerId", savedOwner.getId());
        response.put("userId", user.getId());
        response.put("email", user.getEmail());

        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }
}
