package com.example.footbook.exception;

import org.springframework.http.HttpStatus;

/**
 * Exception thrown for internal server errors
 */
public class InternalServerException extends AppException {

    public InternalServerException(String message) {
        super(
                message,
                "INTERNAL_SERVER_ERROR",
                HttpStatus.INTERNAL_SERVER_ERROR.value()
        );
    }

    public InternalServerException(String message, Throwable cause) {
        super(
                message,
                cause,
                "INTERNAL_SERVER_ERROR",
                HttpStatus.INTERNAL_SERVER_ERROR.value()
        );
    }

    public static InternalServerException databaseError(Throwable cause) {
        return new InternalServerException("Database operation failed", cause);
    }

    public static InternalServerException processingError(String operation) {
        return new InternalServerException("Failed to process: " + operation);
    }
}
