package com.example.footbook.controller;

import com.example.footbook.dto.BookingRequestDto;
import com.example.footbook.dto.BookingResponseDto;
import com.example.footbook.dto.BookingStatusUpdateRequestDto;
import com.example.footbook.entity.Booking;
import com.example.footbook.enums.BookingStatus;
import com.example.footbook.service.BookingService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/bookings")
public class BookingController {

    private final BookingService bookingService;

    public BookingController(BookingService bookingService) {
        this.bookingService = bookingService;
    }

    @GetMapping
    public List<BookingResponseDto> getAllBookings(@RequestParam(required = false) Long userId,
                                                   @RequestParam(required = false) Long stadiumId) {
        List<Booking> bookings;
        
        if (userId != null && stadiumId != null) {
            bookings = bookingService.getAllBookings().stream()
                    .filter(b -> b.getUserId().equals(userId) && b.getStadiumId().equals(stadiumId))
                    .toList();
        } else if (userId != null) {
            bookings = bookingService.getBookingsByUserId(userId);
        } else if (stadiumId != null) {
            bookings = bookingService.getBookingsByStadiumId(stadiumId);
        } else {
            bookings = bookingService.getAllBookings();
        }
        
        return bookings.stream()
                .map(BookingResponseDto::fromEntity)
                .toList();
    }

    @GetMapping("/{id}")
    public ResponseEntity<BookingResponseDto> getBookingById(@PathVariable Long id) {
        return bookingService.getBookingById(id)
                .map(booking -> ResponseEntity.ok(BookingResponseDto.fromEntity(booking)))
                .orElse(ResponseEntity.notFound().build());
    }

    @PostMapping
    public ResponseEntity<?> createBooking(@RequestBody BookingRequestDto payload) {
        try {
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
        
        return bookingService.updateBookingStatus(id, payload.getStatus())
                .map(booking -> ResponseEntity.ok(BookingResponseDto.fromEntity(booking)))
                .orElse(ResponseEntity.notFound().build());
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteBooking(@PathVariable Long id) {
        if (bookingService.deleteBooking(id)) {
            return ResponseEntity.noContent().build();
        }
        return ResponseEntity.notFound().build();
    }
}
