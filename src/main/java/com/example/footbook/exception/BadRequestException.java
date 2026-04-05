package com.example.footbook.exception;

import org.springframework.http.HttpStatus;

/**
 * Exception thrown when validation fails or bad request is made
 */
public class BadRequestException extends AppException {

    public BadRequestException(String message) {
        super(
                message,
                "BAD_REQUEST",
                HttpStatus.BAD_REQUEST.value()
        );
    }

    public BadRequestException(String message, Throwable cause) {
        super(
                message,
                cause,
                "BAD_REQUEST",
                HttpStatus.BAD_REQUEST.value()
        );
    }

    public BadRequestException(String fieldName, String reason) {
        super(
                String.format("Invalid %s: %s", fieldName, reason),
                "BAD_REQUEST",
                HttpStatus.BAD_REQUEST.value()
        );
    }
}
