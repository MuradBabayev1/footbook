package com.example.footbook.enums;

public enum UserRole {
    ADMIN("Administrator"),
    USER("Regular User"),
    STADIUM_MANAGER("Stadium Manager");

    private final String description;

    UserRole(String description) {
        this.description = description;
    }

    public String getDescription() {
        return description;
    }
}
