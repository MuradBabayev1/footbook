package com.example.footbook.controller;

import com.example.footbook.dto.BookingRequestDto;
import com.example.footbook.dto.BookingResponseDto;
import com.example.footbook.dto.BookingStatusUpdateRequestDto;
import com.example.footbook.entity.Booking;
import com.example.footbook.enums.BookingStatus;
import com.example.footbook.repository.UserRepository;
import com.example.footbook.service.BookingService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;

@RestController
@RequestMapping("/api/bookings")
public class BookingController {

    private final BookingService bookingService;
    private final UserRepository userRepository;

    public BookingController(BookingService bookingService, UserRepository userRepository) {
        this.bookingService = bookingService;
        this.userRepository = userRepository;
    }

    @GetMapping
    public List<BookingResponseDto> getAllBookings(@RequestParam(required = false) Long userId,
                                                   @RequestParam(required = false) Long stadiumId) {
        List<Booking> bookings;
        if (isAdmin()) {
            if (userId != null && stadiumId != null) {
                bookings = bookingService.getBookingsByUserIdAndStadiumId(userId, stadiumId);
            } else if (userId != null) {
                bookings = bookingService.getBookingsByUserId(userId);
            } else if (stadiumId != null) {
                bookings = bookingService.getBookingsByStadiumId(stadiumId);
            } else {
                bookings = bookingService.getAllBookings();
            }
            return bookings.stream().map(BookingResponseDto::fromEntity).toList();
        }

        Long currentUserId = getCurrentUserId();
        if (userId != null && !userId.equals(currentUserId)) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Cannot view other users' bookings");
        }

        bookings = stadiumId != null
                ? bookingService.getBookingsByUserIdAndStadiumId(currentUserId, stadiumId)
                : bookingService.getBookingsByUserId(currentUserId);

        return bookings.stream().map(BookingResponseDto::fromEntity).toList();
    }

    @GetMapping("/{id}")
    public ResponseEntity<BookingResponseDto> getBookingById(@PathVariable Long id) {
        return bookingService.getBookingById(id)
                .map(booking -> {
                    if (!isAdmin() && !booking.getUserId().equals(getCurrentUserId())) {
                        throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Cannot view other users' bookings");
                    }
                    return ResponseEntity.ok(BookingResponseDto.fromEntity(booking));
                })
                .orElse(ResponseEntity.notFound().build());
    }

    @PostMapping
    public ResponseEntity<?> createBooking(@RequestBody BookingRequestDto payload) {
        try {
            if (!isAdmin()) {
                Long currentUserId = getCurrentUserId();
                if (payload.getUserId() != null && !payload.getUserId().equals(currentUserId)) {
                    throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Cannot create booking for another user");
                }
                payload.setUserId(currentUserId);
            }

            Booking booking = bookingService.createBooking(payload);
            return ResponseEntity.status(HttpStatus.CREATED).body(BookingResponseDto.fromEntity(booking));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    @PatchMapping("/{id}/status")
    public ResponseEntity<?> updateBookingStatus(@PathVariable Long id,
                                                 @RequestBody BookingStatusUpdateRequestDto payload) {
        if (payload.getStatus() == null) {
            return ResponseEntity.badRequest().body("status is required");
        }

        return bookingService.getBookingById(id)
                .map(existing -> {
                    if (!isAdmin()) {
                        if (!existing.getUserId().equals(getCurrentUserId())) {
                            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Cannot update other users' bookings");
                        }
                        if (payload.getStatus() != BookingStatus.CANCELLED) {
                            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Only cancellation is allowed");
                        }
                    }

                    return bookingService.updateBookingStatus(id, payload.getStatus())
                            .map(booking -> ResponseEntity.ok(BookingResponseDto.fromEntity(booking)))
                            .orElse(ResponseEntity.notFound().build());
                })
                .orElse(ResponseEntity.notFound().build());
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteBooking(@PathVariable Long id) {
        if (!isAdmin()) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Only admins can delete bookings");
        }

        if (bookingService.deleteBooking(id)) {
            return ResponseEntity.noContent().build();
        }
        return ResponseEntity.notFound().build();
    }

    private boolean isAdmin() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication == null) {
            return false;
        }

        return authentication.getAuthorities().stream()
                .anyMatch(authority -> "ROLE_ADMIN".equals(authority.getAuthority()));
    }

    private Long getCurrentUserId() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication == null || authentication.getName() == null) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Authentication required");
        }

        String email = authentication.getName();
        return userRepository.findByEmail(email)
                .map(user -> user.getId())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Authenticated user not found"));
    }
}
