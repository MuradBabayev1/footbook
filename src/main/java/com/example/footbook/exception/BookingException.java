package com.example.footbook.exception;

import org.springframework.http.HttpStatus;

/**
 * Exception thrown for booking-related errors
 */
public class BookingException extends AppException {

    public BookingException(String message) {
        super(
                message,
                "BOOKING_ERROR",
                HttpStatus.BAD_REQUEST.value()
        );
    }

    public BookingException(String message, Throwable cause) {
        super(
                message,
                cause,
                "BOOKING_ERROR",
                HttpStatus.BAD_REQUEST.value()
        );
    }

    public static BookingException slotNotAvailable(Long stadiumId, String date) {
        return new BookingException(String.format("Stadium %d is not available on %s", stadiumId, date));
    }

    public static BookingException invalidTimeRange() {
        return new BookingException("End time must be after start time");
    }

    public static BookingException pastDateBooking() {
        return new BookingException("Cannot book for past dates");
    }

    public static BookingException invalidStatus(String status) {
        return new BookingException("Invalid booking status: " + status);
    }

    public static BookingException cannotCancelConfirmedBooking() {
        return new BookingException("Cannot cancel a confirmed booking");
    }

    public static BookingException bookingAlreadyExists(Long userId, Long stadiumId, String date) {
        return new BookingException(
                String.format("User %d already has a booking for stadium %d on %s", userId, stadiumId, date)
        );
    }
}
