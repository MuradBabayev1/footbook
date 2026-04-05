package com.example.footbook.exception;

import org.springframework.http.HttpStatus;
import java.util.HashMap;
import java.util.Map;

/**
 * Exception thrown when validation of input data fails
 */
public class ValidationException extends AppException {

    private final Map<String, String> errors;

    public ValidationException(String message) {
        super(
                message,
                "VALIDATION_ERROR",
                HttpStatus.BAD_REQUEST.value()
        );
        this.errors = new HashMap<>();
    }

    public ValidationException(String message, Map<String, String> errors) {
        super(
                message,
                "VALIDATION_ERROR",
                HttpStatus.BAD_REQUEST.value()
        );
        this.errors = errors;
    }

    public ValidationException(String fieldName, String errorMessage) {
        super(
                String.format("Validation failed for field '%s': %s", fieldName, errorMessage),
                "VALIDATION_ERROR",
                HttpStatus.BAD_REQUEST.value()
        );
        this.errors = new HashMap<>();
        this.errors.put(fieldName, errorMessage);
    }

    public ValidationException(String message, Throwable cause) {
        super(
                message,
                cause,
                "VALIDATION_ERROR",
                HttpStatus.BAD_REQUEST.value()
        );
        this.errors = new HashMap<>();
    }

    public Map<String, String> getErrors() {
        return errors;
    }

    public void addError(String fieldName, String errorMessage) {
        this.errors.put(fieldName, errorMessage);
    }

    public boolean hasErrors() {
        return !errors.isEmpty();
    }
}
