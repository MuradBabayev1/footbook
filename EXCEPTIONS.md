# Exception Package Documentation

This document describes the exception handling framework for the Footbook application.

## Overview

The exception package provides a hierarchical structure of custom exceptions for handling various error scenarios in the application. All exceptions inherit from a base `AppException` class and are handled by a centralized `GlobalExceptionHandler` in the config package.

## Exception Hierarchy

```
AppException (base exception)
├── ResourceNotFoundException
├── BadRequestException
├── ValidationException
├── ConflictException
├── UnauthorizedException
├── ForbiddenException
├── InternalServerException
├── BookingException
├── StadiumException
├── UserException
└── PaymentException
```

## Exception Classes

### 1. **AppException** (Base Class)
Abstract base class for all application-specific exceptions.

**Properties:**
- `code`: Error code for identification
- `statusCode`: HTTP status code
- `message`: Error message

**Usage:**
```java
// Should not be used directly, extend it instead
public class CustomException extends AppException {
    public CustomException(String message) {
        super(message, "CUSTOM_ERROR", HttpStatus.BAD_REQUEST.value());
    }
}
```

### 2. **ResourceNotFoundException** (404 Not Found)
Thrown when a requested resource doesn't exist.

**HTTP Status:** 404

**Constructors:**
```java
new ResourceNotFoundException("User", "id", 123);
// Message: "User not found with id: '123'"

new ResourceNotFoundException("Booking", 456);
// Message: "Booking not found with id: '456'"

new ResourceNotFoundException("Custom message");
```

**Usage Example:**
```java
@Service
public class UserService {
    @Autowired
    private UserRepository userRepository;
    
    public UserResponseDto getUserById(Long id) {
        User user = userRepository.findById(id)
            .orElseThrow(() -> new ResourceNotFoundException("User", id));
        return modelMapper.map(user, UserResponseDto.class);
    }
}
```

### 3. **BadRequestException** (400 Bad Request)
Thrown when the request data is invalid or malformed.

**HTTP Status:** 400

**Usage Example:**
```java
public void updateBooking(Long id, BookingRequestDto request) {
    if (request.getAttendees() <= 0) {
        throw new BadRequestException("attendees", "must be greater than zero");
    }
}
```

### 4. **ValidationException** (400 Bad Request)
Thrown when validation of input data fails with field-level errors.

**HTTP Status:** 400

**Usage Example:**
```java
public void validateUserDto(UserRequestDto dto) {
    ValidationException exception = new ValidationException("User validation failed");
    
    if (dto.getEmail() == null || dto.getEmail().isEmpty()) {
        exception.addError("email", "Email is required");
    }
    
    if (dto.getPassword().length() < 6) {
        exception.addError("password", "Password must be at least 6 characters");
    }
    
    if (exception.hasErrors()) {
        throw exception;
    }
}
```

**Response:**
```json
{
  "timestamp": "2026-04-05T10:30:00",
  "status": 400,
  "code": "VALIDATION_ERROR",
  "error": "Validation Failed",
  "message": "User validation failed",
  "errors": {
    "email": "Email is required",
    "password": "Password must be at least 6 characters"
  },
  "path": "/api/users"
}
```

### 5. **ConflictException** (409 Conflict)
Thrown when a resource already exists or conflicts with existing data.

**HTTP Status:** 409

**Usage Example:**
```java
public void registerUser(UserRequestDto dto) {
    if (userRepository.existsByEmail(dto.getEmail())) {
        throw new ConflictException("User", "email", dto.getEmail());
        // Message: "User already exists with email: 'user@example.com'"
    }
}
```

### 6. **UnauthorizedException** (401 Unauthorized)
Thrown when authentication fails or user is not authenticated.

**HTTP Status:** 401

**Static Factory Methods:**
```java
UnauthorizedException.invalidCredentials()      // "Invalid email or password"
UnauthorizedException.tokenExpired()            // "Authentication token has expired"
UnauthorizedException.tokenInvalid()            // "Authentication token is invalid"
UnauthorizedException.userNotAuthenticated()    // "User is not authenticated"
```

**Usage Example:**
```java
@PostMapping("/login")
public ResponseEntity<?> login(@RequestBody LoginRequest request) {
    Optional<User> user = userRepository.findByEmail(request.getEmail());
    
    if (user.isEmpty()) {
        throw UnauthorizedException.invalidCredentials();
    }
    
    if (!passwordEncoder.matches(request.getPassword(), user.get().getPassword())) {
        throw UnauthorizedException.invalidCredentials();
    }
    
    // Generate token
}
```

### 7. **ForbiddenException** (403 Forbidden)
Thrown when user lacks permission to access a resource.

**HTTP Status:** 403

**Static Factory Methods:**
```java
ForbiddenException.insufficientPermissions()    // "You don't have permission to access this resource"
ForbiddenException.adminOnlyOperation()         // "This operation requires administrator privileges"
ForbiddenException.ownerOnlyOperation()         // "You can only modify your own resources"
```

**Usage Example:**
```java
@PutMapping("/users/{id}")
public ResponseEntity<?> updateUser(@PathVariable Long id, @RequestBody UserRequestDto dto) {
    Long currentUserId = getCurrentUserId(); // From security context
    
    if (!id.equals(currentUserId)) {
        throw ForbiddenException.ownerOnlyOperation();
    }
    
    // Update user
}
```

### 8. **BookingException** (400 Bad Request)
Thrown for booking-related errors.

**HTTP Status:** 400

**Static Factory Methods:**
```java
BookingException.slotNotAvailable(stadiumId, date)
BookingException.invalidTimeRange()             // "End time must be after start time"
BookingException.pastDateBooking()              // "Cannot book for past dates"
BookingException.invalidStatus(status)
BookingException.cannotCancelConfirmedBooking() // "Cannot cancel a confirmed booking"
BookingException.bookingAlreadyExists(userId, stadiumId, date)
```

**Usage Example:**
```java
@PostMapping("/bookings")
public ResponseEntity<?> createBooking(@RequestBody BookingRequestDto request) {
    if (request.getEndTime().isBefore(request.getStartTime())) {
        throw BookingException.invalidTimeRange();
    }
    
    if (request.getBookingDate().isBefore(LocalDate.now())) {
        throw BookingException.pastDateBooking();
    }
    
    // Create booking
}
```

### 9. **StadiumException** (400 Bad Request)
Thrown for stadium-related errors.

**HTTP Status:** 400

**Static Factory Methods:**
```java
StadiumException.invalidStadiumType(type)
StadiumException.capacityExceeded(maxCapacity, requested)
StadiumException.invalidCapacity()
StadiumException.duplicateStadium(name)
StadiumException.stadiumNotAvailable(id)
```

**Usage Example:**
```java
@PostMapping("/stadiums")
public ResponseEntity<?> createStadium(@RequestBody StadiumRequestDto request) {
    if (request.getCapacity() <= 0) {
        throw StadiumException.invalidCapacity();
    }
    
    if (stadiumRepository.existsByName(request.getName())) {
        throw StadiumException.duplicateStadium(request.getName());
    }
    
    // Create stadium
}
```

### 10. **UserException** (400 Bad Request)
Thrown for user-related errors.

**HTTP Status:** 400

**Static Factory Methods:**
```java
UserException.emailAlreadyExists(email)
UserException.invalidEmail(email)
UserException.invalidPhoneNumber(phone)
UserException.passwordTooWeak()
UserException.userAlreadyExists(identifier)
UserException.cannotDeleteUser()
UserException.invalidUserRole(role)
```

### 11. **PaymentException** (400 Bad Request)
Thrown for payment-related errors.

**HTTP Status:** 400

**Static Factory Methods:**
```java
PaymentException.invalidAmount(amount)
PaymentException.paymentFailed(reason)
PaymentException.paymentGatewayError()
PaymentException.invalidPaymentMethod(method)
PaymentException.paymentAlreadyProcessed(transactionId)
PaymentException.insufficientFunds()
PaymentException.invalidPaymentStatus(status)
```

### 12. **InternalServerException** (500 Internal Server Error)
Thrown for unexpected internal errors.

**HTTP Status:** 500

**Static Factory Methods:**
```java
InternalServerException.databaseError(cause)
InternalServerException.processingError(operation)
```

## Global Exception Handler

The `GlobalExceptionHandler` in the config package provides centralized exception handling.

### Features:

1. **Consistent Response Format** - All errors return the same JSON structure
2. **HTTP Status Mapping** - Correct HTTP status codes for each exception type
3. **Error Codes** - Unique codes for programmatic error handling
4. **Field-level Errors** - Support for validation errors with field details
5. **Request Path Tracking** - Returns the endpoint path that caused the error
6. **Timestamp** - Records when the error occurred

### Error Response Format

```json
{
  "timestamp": "2026-04-05T10:30:00",
  "status": 400,
  "code": "ERROR_CODE",
  "error": "Error Type",
  "message": "Detailed error message",
  "errors": { },           // Only present for ValidationException
  "path": "/api/endpoint"
}
```

## Exception Handler Priority

Spring processes exception handlers in the following order:

1. Most specific exception handler
2. Parent class exception handler
3. Generic `Exception` handler (catch-all)

**Order:**
```
ResourceNotFoundException → AppException → Exception
BadRequestException → AppException → Exception
etc.
```

## Best Practices

### 1. **Use Appropriate Exception Types**
```java
// Good
if (user == null) {
    throw new ResourceNotFoundException("User", userId);
}

// Avoid - too generic
if (user == null) {
    throw new Exception("User not found");
}
```

### 2. **Use Static Factory Methods**
```java
// Good - readable and maintainable
throw UnauthorizedException.invalidCredentials();

// Less readable
throw new UnauthorizedException("Invalid email or password");
```

### 3. **Include Context in Error Messages**
```java
// Good
throw BookingException.slotNotAvailable(123L, "2026-04-05");

// Vague
throw new BookingException("Slot not available");
```

### 4. **Validate Early**
```java
// Good
@PostMapping("/bookings")
public ResponseEntity<?> createBooking(@RequestBody BookingRequestDto request) {
    // Validate immediately
    if (request.getStartTime() == null) {
        throw new BadRequestException("startTime", "is required");
    }
    // Process
}
```

### 5. **Chain Exceptions for Debugging**
```java
// Good - preserves stack trace
try {
    // Database operation
} catch (SQLException ex) {
    throw new InternalServerException.databaseError(ex);
}
```

### 6. **Don't Expose Internal Details in Production**
```java
// In GlobalExceptionHandler
@ExceptionHandler(Exception.class)
public ResponseEntity<?> handleGenericException(Exception ex) {
    // Good - generic message
    return error("An unexpected error occurred");
    
    // Bad - exposes internal details
    return error(ex.getMessage());
}
```

## Testing Exceptions

### Unit Test Example:
```java
@Test
public void testResourceNotFound() {
    Long userId = 999L;
    
    assertThrows(ResourceNotFoundException.class, () -> {
        userService.getUserById(userId);
    });
}

@Test
public void testValidationError() {
    UserRequestDto invalidUser = new UserRequestDto();
    invalidUser.setEmail("");
    
    ValidationException ex = assertThrows(ValidationException.class, () -> {
        userService.registerUser(invalidUser);
    });
    
    assertTrue(ex.hasErrors());
    assertTrue(ex.getErrors().containsKey("email"));
}
```

## Error Codes Reference

| Exception | Code | Status |
|-----------|------|--------|
| ResourceNotFoundException | RESOURCE_NOT_FOUND | 404 |
| BadRequestException | BAD_REQUEST | 400 |
| ValidationException | VALIDATION_ERROR | 400 |
| ConflictException | CONFLICT | 409 |
| UnauthorizedException | UNAUTHORIZED | 401 |
| ForbiddenException | FORBIDDEN | 403 |
| BookingException | BOOKING_ERROR | 400 |
| StadiumException | STADIUM_ERROR | 400 |
| UserException | USER_ERROR | 400 |
| PaymentException | PAYMENT_ERROR | 400 |
| InternalServerException | INTERNAL_SERVER_ERROR | 500 |

## Integration with Controllers

### Example Controller Using Exceptions:

```java
@RestController
@RequestMapping("/api/users")
public class UserController {
    
    @Autowired
    private UserService userService;
    
    @GetMapping("/{id}")
    public ResponseEntity<UserResponseDto> getUserById(@PathVariable Long id) {
        UserResponseDto user = userService.getUserById(id);
        return ResponseEntity.ok(user);
        // If user not found, ResourceNotFoundException is thrown
        // GlobalExceptionHandler catches it and returns 404 response
    }
    
    @PostMapping
    public ResponseEntity<UserResponseDto> createUser(@RequestBody UserRequestDto dto) {
        UserResponseDto user = userService.createUser(dto);
        return ResponseEntity.status(HttpStatus.CREATED).body(user);
        // If email exists, ConflictException is thrown
        // If validation fails, ValidationException is thrown
    }
}
```

## Production Considerations

1. **Logging** - Ensure all exceptions are logged for debugging
2. **Monitoring** - Track error rates and patterns
3. **Error Codes** - Use error codes for client-side error handling
4. **API Documentation** - Document possible exceptions for each endpoint
5. **Security** - Don't expose sensitive information in error messages
6. **Consistency** - Maintain consistent error response format
