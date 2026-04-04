package com.example.footbook.enums;

public enum BookingStatus {
    PENDING("Booking pending confirmation"),
    CONFIRMED("Booking confirmed"),
    CANCELLED("Booking cancelled");

    private final String description;

    BookingStatus(String description) {
        this.description = description;
    }

    public String getDescription() {
        return description;
    }
}
