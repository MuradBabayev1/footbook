package com.example.footbook.exception;

import org.springframework.http.HttpStatus;

/**
 * Exception thrown when user doesn't have permission to access a resource
 */
public class ForbiddenException extends AppException {

    public ForbiddenException(String message) {
        super(
                message,
                "FORBIDDEN",
                HttpStatus.FORBIDDEN.value()
        );
    }

    public ForbiddenException(String message, Throwable cause) {
        super(
                message,
                cause,
                "FORBIDDEN",
                HttpStatus.FORBIDDEN.value()
        );
    }

    public static ForbiddenException insufficientPermissions() {
        return new ForbiddenException("You don't have permission to access this resource");
    }

    public static ForbiddenException adminOnlyOperation() {
        return new ForbiddenException("This operation requires administrator privileges");
    }

    public static ForbiddenException ownerOnlyOperation() {
        return new ForbiddenException("You can only modify your own resources");
    }
}
