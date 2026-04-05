# Configuration Package Documentation

This document describes the configuration package for the Footbook application.

## Overview

The config package contains Spring Boot configuration classes that set up various application components including web MVC, JSON serialization, HTTP clients, async operations, and exception handling.

## Configuration Classes

### 1. **SecurityConfig** (`../security/SecurityConfig.java`)
- Spring Security configuration
- JWT authentication setup
- CORS configuration
- Endpoint authorization rules
- Password encoding with BCrypt

*See [SECURITY.md](../SECURITY.md) for detailed documentation*

### 2. **WebMvcConfig** (`WebMvcConfig.java`)
- Web MVC customization
- Content negotiation configuration
- Default response type: JSON
- Support for media type parameter negotiation

**Features:**
- Configures content negotiation for API responses
- Sets default content type to `application/json`
- Enables parameter-based media type selection

### 3. **JacksonConfig** (`JacksonConfig.java`)
- ObjectMapper configuration
- JSON serialization/deserialization settings
- Java 8+ date/time support

**Features:**
- Registers `JavaTimeModule` for date/time handling
- ISO 8601 date format for JSON responses
- Automatic timezone handling
- Can be extended for custom serialization

**Example Response Date Format:**
```json
{
  "created": "2026-04-05T10:30:00",
  "updated": "2026-04-05T10:30:00"
}
```

### 4. **RestTemplateConfig** (`RestTemplateConfig.java`)
- HTTP client configuration
- Timeout settings for external API calls
- Connection and read timeout configuration

**Configuration:**
- Connection timeout: 5 seconds
- Read timeout: 10 seconds

**Usage:**
```java
@Autowired
private RestTemplate restTemplate;

public void callExternalApi() {
    restTemplate.getForObject(url, Response.class);
}
```

### 5. **ApplicationConfig** (`ApplicationConfig.java`)
- Async execution configuration
- Scheduling configuration
- Thread pool setup

**Features:**
- Thread pool for async operations
- Core pool size: 2 threads
- Max pool size: 5 threads
- Queue capacity: 100 tasks
- Thread name prefix: `footbook-async-`

**Usage:**
```java
@Async("taskExecutor")
public void asyncMethod() {
    // Long-running operation
}

@Scheduled(fixedDelay = 5000)
public void scheduledTask() {
    // Periodic task
}
```

### 6. **ModelMapperConfig** (`ModelMapperConfig.java`)
- Object mapping configuration
- DTO to Entity conversions
- Entity to DTO conversions

**Features:**
- Strict matching strategy to avoid unintended mappings
- Skip null values during mapping
- Reduces boilerplate code for object conversions

**Usage:**
```java
@Autowired
private ModelMapper modelMapper;

public UserResponseDto convertToDto(User user) {
    return modelMapper.map(user, UserResponseDto.class);
}

public User convertToEntity(UserRequestDto dto) {
    return modelMapper.map(dto, User.class);
}
```

### 7. **GlobalExceptionHandler** (`GlobalExceptionHandler.java`)
- Centralized exception handling
- Consistent error response format
- HTTP status code mapping

**Handled Exceptions:**

#### MethodArgumentNotValidException (400 Bad Request)
- Validation errors from @Valid annotations
- Returns list of validation error messages

```json
{
  "timestamp": "2026-04-05T10:30:00",
  "status": 400,
  "error": "Validation Failed",
  "message": [
    "Email is required",
    "Password must be at least 6 characters"
  ],
  "path": "/api/auth/register"
}
```

#### IllegalArgumentException (400 Bad Request)
- Invalid argument errors
- Custom validation failures

#### RuntimeException (500 Internal Server Error)
- Unhandled runtime exceptions
- Database errors
- Logic errors

```json
{
  "timestamp": "2026-04-05T10:30:00",
  "status": 500,
  "error": "Internal Server Error",
  "message": "Database connection failed",
  "path": "/api/bookings"
}
```

#### Generic Exception (500 Internal Server Error)
- Catch-all for any unexpected errors
- Default error message for security

## Configuration Properties

Add the following to `application.properties`:

```properties
# Jackson Configuration
spring.jackson.default-property-inclusion=non_null
spring.jackson.serialization.write-dates-as-timestamps=false
spring.jackson.serialization.indent-output=false

# Async Configuration
spring.task.execution.pool.core-size=2
spring.task.execution.pool.max-size=5
spring.task.execution.pool.queue-capacity=100
spring.task.execution.thread-name-prefix=footbook-async-

# Scheduling Configuration
spring.task.scheduling.pool.size=2
spring.task.scheduling.thread-name-prefix=footbook-scheduler-

# Web MVC Configuration
spring.web.mvc.content-negotiation.favor-parameter=true
spring.web.mvc.content-negotiation.parameter-name=mediaType
```

## Dependencies Added

```xml
<!-- ModelMapper for Object Mapping -->
<dependency>
  <groupId>org.modelmapper</groupId>
  <artifactId>modelmapper</artifactId>
  <version>3.1.1</version>
</dependency>
```

## Best Practices

### 1. **REST API Response Format**
All API responses follow a consistent format:

**Success Response:**
```json
{
  "status": 200,
  "message": "Success",
  "data": { ... }
}
```

**Error Response:**
```json
{
  "timestamp": "2026-04-05T10:30:00",
  "status": 400,
  "error": "Error Type",
  "message": "Error description",
  "path": "/api/endpoint"
}
```

### 2. **Using ModelMapper**
```java
@Service
public class BookingService {
    @Autowired
    private ModelMapper modelMapper;
    
    public BookingResponseDto getBooking(Long id) {
        Booking booking = bookingRepository.findById(id).orElse(null);
        return modelMapper.map(booking, BookingResponseDto.class);
    }
}
```

### 3. **Async Operations**
```java
@Service
public class EmailService {
    
    @Async("taskExecutor")
    public void sendBookingConfirmation(Booking booking) {
        // Send email without blocking
    }
}
```

### 4. **Scheduled Tasks**
```java
@Component
public class BookingScheduler {
    
    @Scheduled(cron = "0 0 * * * *") // Every hour
    public void cleanupExpiredBookings() {
        // Cleanup logic
    }
}
```

### 5. **Custom Exception Handling**
Extend GlobalExceptionHandler to add custom exception handlers:

```java
@ExceptionHandler(EntityNotFoundException.class)
public ResponseEntity<Map<String, Object>> handleEntityNotFoundException(
        EntityNotFoundException ex,
        WebRequest request) {
    // Custom error response
}
```

## Configuration Loading Order

Spring Boot loads configurations in the following order:

1. `application.properties` - Application settings
2. `SecurityConfig` - Security setup
3. `WebMvcConfig` - Web MVC setup
4. `JacksonConfig` - JSON serialization
5. `RestTemplateConfig` - HTTP client
6. `ModelMapperConfig` - Object mapping
7. `ApplicationConfig` - Async and scheduling
8. `GlobalExceptionHandler` - Error handling

## Testing Configuration

For testing, create `application-test.properties`:

```properties
# Test database configuration
spring.datasource.url=jdbc:h2:mem:testdb
spring.datasource.driver-class-name=org.h2.Driver
spring.jpa.hibernate.ddl-auto=create-drop

# Disable async for deterministic testing
spring.task.execution.pool.max-size=1
spring.task.execution.pool.queue-capacity=1
```

## Monitoring and Debugging

### Enable SQL Logging
```properties
spring.jpa.show-sql=true
spring.jpa.properties.hibernate.format_sql=true
logging.level.org.hibernate.SQL=DEBUG
logging.level.org.hibernate.type.descriptor.sql.BasicBinder=TRACE
```

### Enable Request/Response Logging
```properties
logging.level.org.springframework.web=DEBUG
logging.level.org.springframework.security=DEBUG
```

## Security Considerations

1. **Jackson Configuration**: Ensure sensitive fields are excluded from serialization
2. **Custom Serializers**: Use @JsonIgnore for sensitive data
3. **Exception Messages**: Don't expose internal error details in production
4. **Timeout Settings**: Adjust RestTemplate timeouts based on your use case
5. **Async Limits**: Configure appropriate thread pool sizes to prevent resource exhaustion

## Next Steps

1. Verify all configurations load correctly
2. Test exception handling with invalid requests
3. Configure production-specific settings
4. Set up logging and monitoring
5. Test async operations and scheduled tasks
