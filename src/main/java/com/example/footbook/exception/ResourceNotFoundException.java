package com.example.footbook.exception;

import org.springframework.http.HttpStatus;

/**
 * Exception thrown when a requested resource is not found
 */
public class ResourceNotFoundException extends AppException {

    public ResourceNotFoundException(String resourceName, String fieldName, Object fieldValue) {
        super(
                String.format("%s not found with %s: '%s'", resourceName, fieldName, fieldValue),
                "RESOURCE_NOT_FOUND",
                HttpStatus.NOT_FOUND.value()
        );
    }

    public ResourceNotFoundException(String resourceName, Long id) {
        this(resourceName, "id", id);
    }

    public ResourceNotFoundException(String message) {
        super(
                message,
                "RESOURCE_NOT_FOUND",
                HttpStatus.NOT_FOUND.value()
        );
    }

    public ResourceNotFoundException(String message, Throwable cause) {
        super(
                message,
                cause,
                "RESOURCE_NOT_FOUND",
                HttpStatus.NOT_FOUND.value()
        );
    }
}
