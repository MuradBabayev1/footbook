package com.example.footbook.exception;

import org.springframework.http.HttpStatus;

/**
 * Exception thrown when a resource conflict occurs (e.g., duplicate entry)
 */
public class ConflictException extends AppException {

    public ConflictException(String message) {
        super(
                message,
                "CONFLICT",
                HttpStatus.CONFLICT.value()
        );
    }

    public ConflictException(String resourceName, String fieldName, Object fieldValue) {
        super(
                String.format("%s already exists with %s: '%s'", resourceName, fieldName, fieldValue),
                "CONFLICT",
                HttpStatus.CONFLICT.value()
        );
    }

    public ConflictException(String message, Throwable cause) {
        super(
                message,
                cause,
                "CONFLICT",
                HttpStatus.CONFLICT.value()
        );
    }
}
