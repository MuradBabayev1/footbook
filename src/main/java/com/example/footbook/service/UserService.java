package com.example.footbook.service;

import com.example.footbook.dto.UserRequestDto;
import com.example.footbook.entity.User;
import com.example.footbook.repository.BookingRepository;
import com.example.footbook.repository.UserRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Optional;

@Service
@Transactional
public class UserService {

    private final UserRepository userRepository;
    private final BookingRepository bookingRepository;

    public UserService(UserRepository userRepository, BookingRepository bookingRepository) {
        this.userRepository = userRepository;
        this.bookingRepository = bookingRepository;
    }

    public List<User> getAllUsers() {
        return userRepository.findAll();
    }

    public Optional<User> getUserById(Long id) {
        return userRepository.findById(id);
    }

    public Optional<User> getUserByEmail(String email) {
        return userRepository.findByEmail(email);
    }

    public User createUser(UserRequestDto requestDto) {
        if (requestDto.getFullName() == null || requestDto.getFullName().isBlank()) {
            throw new IllegalArgumentException("fullName is required");
        }
        if (requestDto.getEmail() == null || requestDto.getEmail().isBlank()) {
            throw new IllegalArgumentException("email is required");
        }
        if (requestDto.getPhoneNumber() == null || requestDto.getPhoneNumber().isBlank()) {
            throw new IllegalArgumentException("phoneNumber is required");
        }

        if (userRepository.existsByEmail(requestDto.getEmail())) {
            throw new IllegalArgumentException("Email already exists");
        }

        User user = new User();
        user.setFullName(requestDto.getFullName());
        user.setEmail(requestDto.getEmail());
        user.setPhoneNumber(requestDto.getPhoneNumber());

        return userRepository.save(user);
    }

    public Optional<User> updateUser(Long id, UserRequestDto requestDto) {
        return userRepository.findById(id).map(user -> {
            if (requestDto.getFullName() != null && !requestDto.getFullName().isBlank()) {
                user.setFullName(requestDto.getFullName());
            }
            if (requestDto.getEmail() != null && !requestDto.getEmail().isBlank()) {
                if (!user.getEmail().equals(requestDto.getEmail()) && userRepository.existsByEmail(requestDto.getEmail())) {
                    throw new IllegalArgumentException("Email already exists");
                }
                user.setEmail(requestDto.getEmail());
            }
            if (requestDto.getPhoneNumber() != null && !requestDto.getPhoneNumber().isBlank()) {
                user.setPhoneNumber(requestDto.getPhoneNumber());
            }
            return userRepository.save(user);
        });
    }

    public boolean deleteUser(Long id) {
        if (userRepository.existsById(id)) {
            // Remove dependent bookings first to satisfy FK constraints.
            bookingRepository.deleteByUserId(id);
            userRepository.deleteById(id);
            return true;
        }
        return false;
    }
}
