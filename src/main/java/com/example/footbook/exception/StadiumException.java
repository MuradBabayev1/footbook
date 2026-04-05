package com.example.footbook.exception;

import org.springframework.http.HttpStatus;

/**
 * Exception thrown for stadium-related errors
 */
public class StadiumException extends AppException {

    public StadiumException(String message) {
        super(
                message,
                "STADIUM_ERROR",
                HttpStatus.BAD_REQUEST.value()
        );
    }

    public StadiumException(String message, Throwable cause) {
        super(
                message,
                cause,
                "STADIUM_ERROR",
                HttpStatus.BAD_REQUEST.value()
        );
    }

    public static StadiumException invalidStadiumType(String type) {
        return new StadiumException("Invalid stadium type: " + type);
    }

    public static StadiumException capacityExceeded(int maxCapacity, int requested) {
        return new StadiumException(
                String.format("Stadium capacity exceeded. Max: %d, Requested: %d", maxCapacity, requested)
        );
    }

    public static StadiumException invalidCapacity() {
        return new StadiumException("Stadium capacity must be greater than zero");
    }

    public static StadiumException duplicateStadium(String name) {
        return new StadiumException("Stadium with name '" + name + "' already exists");
    }

    public static StadiumException stadiumNotAvailable(Long id) {
        return new StadiumException("Stadium " + id + " is not available");
    }
}
