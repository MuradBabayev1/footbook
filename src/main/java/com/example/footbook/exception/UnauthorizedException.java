package com.example.footbook.exception;

import org.springframework.http.HttpStatus;

/**
 * Exception thrown when user is not authenticated or authentication fails
 */
public class UnauthorizedException extends AppException {

    public UnauthorizedException(String message) {
        super(
                message,
                "UNAUTHORIZED",
                HttpStatus.UNAUTHORIZED.value()
        );
    }

    public UnauthorizedException(String message, Throwable cause) {
        super(
                message,
                cause,
                "UNAUTHORIZED",
                HttpStatus.UNAUTHORIZED.value()
        );
    }

    public static UnauthorizedException invalidCredentials() {
        return new UnauthorizedException("Invalid email or password");
    }

    public static UnauthorizedException tokenExpired() {
        return new UnauthorizedException("Authentication token has expired");
    }

    public static UnauthorizedException tokenInvalid() {
        return new UnauthorizedException("Authentication token is invalid");
    }

    public static UnauthorizedException userNotAuthenticated() {
        return new UnauthorizedException("User is not authenticated");
    }
}
