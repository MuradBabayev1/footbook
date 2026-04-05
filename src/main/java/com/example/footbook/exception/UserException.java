package com.example.footbook.exception;

import org.springframework.http.HttpStatus;

/**
 * Exception thrown for user-related errors
 */
public class UserException extends AppException {

    public UserException(String message) {
        super(
                message,
                "USER_ERROR",
                HttpStatus.BAD_REQUEST.value()
        );
    }

    public UserException(String message, Throwable cause) {
        super(
                message,
                cause,
                "USER_ERROR",
                HttpStatus.BAD_REQUEST.value()
        );
    }

    public static UserException emailAlreadyExists(String email) {
        return new UserException("Email '" + email + "' is already registered");
    }

    public static UserException invalidEmail(String email) {
        return new UserException("Invalid email format: " + email);
    }

    public static UserException invalidPhoneNumber(String phone) {
        return new UserException("Invalid phone number: " + phone);
    }

    public static UserException passwordTooWeak() {
        return new UserException("Password must be at least 6 characters long");
    }

    public static UserException userAlreadyExists(String identifier) {
        return new UserException("User with identifier '" + identifier + "' already exists");
    }

    public static UserException cannotDeleteUser() {
        return new UserException("This user cannot be deleted");
    }

    public static UserException invalidUserRole(String role) {
        return new UserException("Invalid user role: " + role);
    }
}
