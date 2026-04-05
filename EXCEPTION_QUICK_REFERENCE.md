# Exception Package Quick Reference

## Creating and Throwing Exceptions

### 404 - Resource Not Found
```java
throw new ResourceNotFoundException("User", "id", 123);
// Message: "User not found with id: '123'"

throw new ResourceNotFoundException("Stadium", userId);
// Shorthand for id lookups
```

### 400 - Bad Request
```java
throw new BadRequestException("Invalid booking date format");

throw new BadRequestException("attendees", "must be positive");
// Field-specific error
```

### 400 - Validation Error
```java
ValidationException ex = new ValidationException("User registration validation failed");
ex.addError("email", "Email is already registered");
ex.addError("password", "Password must be at least 8 characters");
throw ex;
```

### 409 - Conflict
```java
throw new ConflictException("Stadium", "name", "Central Park Stadium");
// Message: "Stadium already exists with name: 'Central Park Stadium'"
```

### 401 - Unauthorized
```java
throw UnauthorizedException.invalidCredentials();
throw UnauthorizedException.tokenExpired();
throw UnauthorizedException.tokenInvalid();
throw UnauthorizedException.userNotAuthenticated();
```

### 403 - Forbidden
```java
throw ForbiddenException.insufficientPermissions();
throw ForbiddenException.adminOnlyOperation();
throw ForbiddenException.ownerOnlyOperation();
```

### Booking Errors
```java
throw BookingException.slotNotAvailable(123L, "2026-04-05");
throw BookingException.invalidTimeRange();
throw BookingException.pastDateBooking();
throw BookingException.invalidStatus("PENDING");
throw BookingException.cannotCancelConfirmedBooking();
throw BookingException.bookingAlreadyExists(userId, stadiumId, "2026-04-05");
```

### Stadium Errors
```java
throw StadiumException.invalidStadiumType("OUTDOOR");
throw StadiumException.capacityExceeded(1000, 1500);
throw StadiumException.invalidCapacity();
throw StadiumException.duplicateStadium("Stadium Name");
throw StadiumException.stadiumNotAvailable(123L);
```

### User Errors
```java
throw UserException.emailAlreadyExists("user@example.com");
throw UserException.invalidEmail("invalid-email");
throw UserException.invalidPhoneNumber("123");
throw UserException.passwordTooWeak();
throw UserException.userAlreadyExists("username");
throw UserException.cannotDeleteUser();
throw UserException.invalidUserRole("SUPERADMIN");
```

### Payment Errors
```java
throw PaymentException.invalidAmount(-100);
throw PaymentException.paymentFailed("Card declined");
throw PaymentException.paymentGatewayError();
throw PaymentException.invalidPaymentMethod("CRYPTO");
throw PaymentException.paymentAlreadyProcessed("TXN123456");
throw PaymentException.insufficientFunds();
throw PaymentException.invalidPaymentStatus("UNKNOWN");
```

### Internal Server Error
```java
throw new InternalServerException("Database connection failed");
throw InternalServerException.databaseError(sqlException);
throw InternalServerException.processingError("Email sending");
```

## Common Response Formats

### Successful Response (2xx)
```json
{
  "status": 200,
  "message": "Success",
  "data": { ... }
}
```

### Error Response (4xx/5xx)
```json
{
  "timestamp": "2026-04-05T10:30:00",
  "status": 400,
  "code": "ERROR_CODE",
  "error": "Error Type",
  "message": "Error description",
  "path": "/api/endpoint"
}
```

### Validation Error Response (400)
```json
{
  "timestamp": "2026-04-05T10:30:00",
  "status": 400,
  "code": "VALIDATION_ERROR",
  "error": "Validation Failed",
  "message": "Validation failed",
  "errors": {
    "email": "Email is already registered",
    "password": "Password must be at least 8 characters"
  },
  "path": "/api/users/register"
}
```

## Service Method Examples

### User Service
```java
@Service
public class UserService {
    
    public UserResponseDto getUserById(Long id) {
        return userRepository.findById(id)
            .map(u -> modelMapper.map(u, UserResponseDto.class))
            .orElseThrow(() -> new ResourceNotFoundException("User", id));
    }
    
    public UserResponseDto createUser(UserRequestDto dto) {
        if (userRepository.existsByEmail(dto.getEmail())) {
            throw new ConflictException("User", "email", dto.getEmail());
        }
        
        User user = modelMapper.map(dto, User.class);
        user.setPassword(passwordEncoder.encode(dto.getPassword()));
        
        User saved = userRepository.save(user);
        return modelMapper.map(saved, UserResponseDto.class);
    }
}
```

### Booking Service
```java
@Service
public class BookingService {
    
    public BookingResponseDto createBooking(BookingRequestDto dto) {
        // Validate time range
        if (dto.getEndTime().isBefore(dto.getStartTime())) {
            throw BookingException.invalidTimeRange();
        }
        
        // Check past dates
        if (dto.getBookingDate().isBefore(LocalDate.now())) {
            throw BookingException.pastDateBooking();
        }
        
        // Check availability
        boolean available = isStadiumAvailable(
            dto.getStadiumId(), 
            dto.getBookingDate(), 
            dto.getStartTime(), 
            dto.getEndTime()
        );
        
        if (!available) {
            throw BookingException.slotNotAvailable(dto.getStadiumId(), dto.getBookingDate().toString());
        }
        
        // Create booking
        Booking booking = modelMapper.map(dto, Booking.class);
        booking.setStatus(BookingStatus.PENDING);
        
        Booking saved = bookingRepository.save(booking);
        return modelMapper.map(saved, BookingResponseDto.class);
    }
}
```

### Controller Error Handling
```java
@RestController
@RequestMapping("/api/auth")
public class AuthenticationController {
    
    @PostMapping("/login")
    public ResponseEntity<?> login(@Valid @RequestBody LoginRequest request) {
        User user = userRepository.findByEmail(request.getEmail())
            .orElseThrow(UnauthorizedException::invalidCredentials);
        
        if (!passwordEncoder.matches(request.getPassword(), user.getPassword())) {
            throw UnauthorizedException.invalidCredentials();
        }
        
        String token = jwtTokenProvider.generateToken(user.getId(), user.getEmail());
        return ResponseEntity.ok(new LoginResponse(token, user.getId(), user.getEmail(), user.getFullName()));
    }
    
    @PostMapping("/register")
    public ResponseEntity<?> register(@Valid @RequestBody RegisterRequest request) {
        if (userRepository.existsByEmail(request.getEmail())) {
            throw new ConflictException("User", "email", request.getEmail());
        }
        
        User user = new User();
        user.setEmail(request.getEmail());
        user.setFullName(request.getFullName());
        user.setPhoneNumber(request.getPhoneNumber());
        user.setPassword(passwordEncoder.encode(request.getPassword()));
        
        User saved = userRepository.save(user);
        String token = jwtTokenProvider.generateToken(saved.getId(), saved.getEmail());
        
        return ResponseEntity.status(HttpStatus.CREATED)
            .body(new LoginResponse(token, saved.getId(), saved.getEmail(), saved.getFullName()));
    }
}
```

## HTTP Status Code Mapping

| Status | Meaning | Exception |
|--------|---------|-----------|
| 400 | Bad Request | BadRequestException, ValidationException |
| 401 | Unauthorized | UnauthorizedException |
| 403 | Forbidden | ForbiddenException |
| 404 | Not Found | ResourceNotFoundException |
| 409 | Conflict | ConflictException |
| 500 | Internal Server Error | InternalServerException |

## Testing with Exceptions

### JUnit 5 Example
```java
@Test
void testUserNotFound() {
    Long userId = 999L;
    
    ResourceNotFoundException ex = assertThrows(
        ResourceNotFoundException.class,
        () -> userService.getUserById(userId)
    );
    
    assertEquals("RESOURCE_NOT_FOUND", ex.getCode());
    assertEquals(404, ex.getStatusCode());
}

@Test
void testDuplicateEmail() {
    UserRequestDto dto = new UserRequestDto();
    dto.setEmail("existing@example.com");
    
    ConflictException ex = assertThrows(
        ConflictException.class,
        () -> userService.createUser(dto)
    );
    
    assertEquals("CONFLICT", ex.getCode());
    assertEquals(409, ex.getStatusCode());
}
```

## Exception Handling in @RestController

```java
@RestController
@RequestMapping("/api/bookings")
public class BookingController {
    
    @GetMapping("/{id}")
    public ResponseEntity<BookingResponseDto> getBooking(@PathVariable Long id) {
        // ResourceNotFoundException is thrown if not found
        // GlobalExceptionHandler catches and returns 404
        return ResponseEntity.ok(bookingService.getBookingById(id));
    }
    
    @PostMapping
    public ResponseEntity<BookingResponseDto> createBooking(@Valid @RequestBody BookingRequestDto dto) {
        // Can throw multiple exceptions:
        // - BadRequestException: validation failures
        // - BookingException: business logic errors
        // - ConflictException: duplicate booking
        BookingResponseDto booking = bookingService.createBooking(dto);
        return ResponseEntity.status(HttpStatus.CREATED).body(booking);
    }
}
```
