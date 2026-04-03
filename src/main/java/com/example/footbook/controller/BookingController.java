package com.example.footbook.controller;

import com.example.footbook.entity.Booking;
import com.example.footbook.entity.BookingStatus;
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

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.atomic.AtomicLong;

@RestController
@RequestMapping("/api/bookings")
public class BookingController {

    private final Map<Long, Booking> bookings = new ConcurrentHashMap<>();
    private final AtomicLong sequence = new AtomicLong(1);

    @GetMapping
    public List<Booking> getAllBookings(@RequestParam(required = false) Long userId,
                                        @RequestParam(required = false) Long stadiumId) {
        return bookings.values().stream()
                .filter(booking -> userId == null || booking.getUserId().equals(userId))
                .filter(booking -> stadiumId == null || booking.getStadiumId().equals(stadiumId))
                .toList();
    }

    @GetMapping("/{id}")
    public ResponseEntity<Booking> getBookingById(@PathVariable Long id) {
        Booking booking = bookings.get(id);
        if (booking == null) {
            return ResponseEntity.notFound().build();
        }
        return ResponseEntity.ok(booking);
    }

    @PostMapping
    public ResponseEntity<?> createBooking(@RequestBody Booking payload) {
        if (payload.getUserId() == null || payload.getUserId() <= 0) {
            return ResponseEntity.badRequest().body("userId must be greater than zero");
        }
        if (payload.getStadiumId() == null || payload.getStadiumId() <= 0) {
            return ResponseEntity.badRequest().body("stadiumId must be greater than zero");
        }
        if (payload.getMatchTitle() == null || payload.getMatchTitle().isBlank()) {
            return ResponseEntity.badRequest().body("matchTitle is required");
        }
        if (payload.getBookingDate() == null) {
            return ResponseEntity.badRequest().body("bookingDate is required");
        }
        if (payload.getStartTime() == null || payload.getEndTime() == null) {
            return ResponseEntity.badRequest().body("startTime and endTime are required");
        }
        if (!payload.getEndTime().isAfter(payload.getStartTime())) {
            return ResponseEntity.badRequest().body("endTime must be after startTime");
        }
        if (payload.getAttendees() == null || payload.getAttendees() <= 0) {
            return ResponseEntity.badRequest().body("attendees must be greater than zero");
        }

        long id = sequence.getAndIncrement();
        payload.setId(id);
        payload.setCreatedAt(LocalDateTime.now());
        if (payload.getStatus() == null) {
            payload.setStatus(BookingStatus.PENDING);
        }

        bookings.put(id, payload);
        return ResponseEntity.status(HttpStatus.CREATED).body(payload);
    }

    @PatchMapping("/{id}/status")
    public ResponseEntity<?> updateBookingStatus(@PathVariable Long id,
                                                 @RequestParam BookingStatus status) {
        Booking booking = bookings.get(id);
        if (booking == null) {
            return ResponseEntity.notFound().build();
        }

        booking.setStatus(status);
        bookings.put(id, booking);
        return ResponseEntity.ok(booking);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteBooking(@PathVariable Long id) {
        Booking removed = bookings.remove(id);
        if (removed == null) {
            return ResponseEntity.notFound().build();
        }
        return ResponseEntity.noContent().build();
    }
}
