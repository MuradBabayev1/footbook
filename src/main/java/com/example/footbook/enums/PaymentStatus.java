package com.example.footbook.enums;

public enum PaymentStatus {
    PENDING("Payment pending"),
    COMPLETED("Payment completed"),
    FAILED("Payment failed"),
    REFUNDED("Payment refunded");

    private final String description;

    PaymentStatus(String description) {
        this.description = description;
    }

    public String getDescription() {
        return description;
    }
}
