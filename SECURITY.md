# Security Package Documentation

This document describes the security package implemented for the Footbook application.

## Overview

The security package implements JWT (JSON Web Token) authentication for the Footbook REST API. It provides the following functionality:

- User registration and login with JWT token generation
- JWT token validation and expiration
- Authentication filter for protecting endpoints
- Spring Security configuration for endpoint authorization
- User details service for loading user information

## Components

### 1. **JwtTokenProvider** (`JwtTokenProvider.java`)
- Generates JWT tokens for authenticated users
- Validates JWT tokens
- Extracts user information (ID, email) from tokens
- Handles token expiration

**Key Methods:**
- `generateToken(Long userId, String email)` - Creates a new JWT token
- `validateToken(String token)` - Validates token signature and expiration
- `getUserIdFromToken(String token)` - Extracts user ID
- `getEmailFromToken(String token)` - Extracts user email

### 2. **JwtAuthenticationFilter** (`JwtAuthenticationFilter.java`)
- OncePerRequestFilter that intercepts HTTP requests
- Extracts JWT token from "Authorization: Bearer <token>" header
- Validates tokens and sets authentication in SecurityContext
- Allows requests with valid tokens to proceed

### 3. **CustomUserDetailsService** (`CustomUserDetailsService.java`)
- Implements Spring Security's UserDetailsService
- Loads user information from the database
- Returns UserDetails for authentication and authorization
- Supports loading by email and user ID

### 4. **SecurityConfig** (`SecurityConfig.java`)
- Main Spring Security configuration class
- Configures HTTP security, authentication, and authorization
- Defines password encoder (BCrypt)
- Sets up CORS configuration
- Configures endpoint access rules:
  - Public endpoints: `/api/auth/**`, `/api/stadiums/**` (GET only)
  - Protected endpoints: `/api/bookings/**`, `/api/users/**`
  - Admin endpoints: Stadium create/update/delete operations

### 5. **JwtAuthenticationEntryPoint** (`JwtAuthenticationEntryPoint.java`)
- Custom entry point for authentication errors
- Returns JSON error response for unauthorized requests
- HTTP 401 status with error details

### 6. **DTOs (Data Transfer Objects)**

#### LoginRequest (`LoginRequest.java`)
```json
{
  "email": "user@example.com",
  "password": "password123"
}
```

#### LoginResponse (`LoginResponse.java`)
```json
{
  "token": "eyJhbGciOiJIUzUxMiJ9...",
  "type": "Bearer",
  "userId": 1,
  "email": "user@example.com",
  "fullName": "John Doe"
}
```

#### RegisterRequest (`RegisterRequest.java`)
```json
{
  "fullName": "John Doe",
  "email": "user@example.com",
  "phoneNumber": "1234567890",
  "password": "password123"
}
```

### 7. **AuthenticationController** (`AuthenticationController.java`)
- REST endpoints for authentication operations
- Endpoints:
  - `POST /api/auth/login` - User login
  - `POST /api/auth/register` - User registration
  - `POST /api/auth/logout` - Logout (client-side token removal)

## Configuration

Add the following to `application.properties`:

```properties
# JWT Configuration
jwt.secret=your-secret-key-should-be-at-least-32-characters-long-for-security
jwt.expiration=86400000

# JPA Configuration
spring.jpa.hibernate.ddl-auto=update
spring.jpa.show-sql=false
spring.jpa.properties.hibernate.dialect=org.hibernate.dialect.MySQL8Dialect
```

## Database Schema Changes

The `User` entity has been updated with a `password` field:

```sql
ALTER TABLE users ADD COLUMN password VARCHAR(255) NOT NULL;
```

## Usage Flow

### 1. User Registration
```bash
POST /api/auth/register
Content-Type: application/json

{
  "fullName": "John Doe",
  "email": "john@example.com",
  "phoneNumber": "1234567890",
  "password": "securePassword123"
}

Response (201 Created):
{
  "token": "eyJhbGciOiJIUzUxMiJ9...",
  "type": "Bearer",
  "userId": 1,
  "email": "john@example.com",
  "fullName": "John Doe"
}
```

### 2. User Login
```bash
POST /api/auth/login
Content-Type: application/json

{
  "email": "john@example.com",
  "password": "securePassword123"
}

Response (200 OK):
{
  "token": "eyJhbGciOiJIUzUxMiJ9...",
  "type": "Bearer",
  "userId": 1,
  "email": "john@example.com",
  "fullName": "John Doe"
}
```

### 3. Accessing Protected Resources
```bash
GET /api/bookings
Authorization: Bearer eyJhbGciOiJIUzUxMiJ9...

Response: Booking data
```

## Dependencies Added

The following dependencies have been added to `pom.xml`:

```xml
<dependency>
  <groupId>io.jsonwebtoken</groupId>
  <artifactId>jjwt-api</artifactId>
  <version>0.12.3</version>
</dependency>
<dependency>
  <groupId>io.jsonwebtoken</groupId>
  <artifactId>jjwt-impl</artifactId>
  <version>0.12.3</version>
  <scope>runtime</scope>
</dependency>
<dependency>
  <groupId>io.jsonwebtoken</groupId>
  <artifactId>jjwt-jackson</artifactId>
  <version>0.12.3</version>
  <scope>runtime</scope>
</dependency>
```

## Security Features

- Password encryption using BCrypt
- JWT tokens with HS512 algorithm
- Configurable token expiration (default: 24 hours)
- Token validation on each request
- Stateless session management
- CORS configuration for cross-origin requests
- Endpoint-level authorization

## Next Steps

1. **Update Database**: Run migrations to add the `password` field to the `users` table
2. **Configure JWT Secret**: Change the `jwt.secret` property to a strong, unique value for production
3. **Test Endpoints**: Use the provided authentication flows to test login and registration
4. **Secure CORS**: Update CORS allowed origins for production environment
5. **Add Roles**: Implement role-based access control using the `UserRole` enum

## Error Handling

### 401 Unauthorized
- Missing or invalid JWT token
- Expired token
- Token signature verification failed

### 400 Bad Request
- Invalid credentials (wrong password)
- User not found
- Email already registered
- Validation errors in request body

### 403 Forbidden
- User lacks required permissions for endpoint

## Technologies Used

- Spring Security 6.x
- JWT (JSON Web Tokens) with JJWT library
- BCrypt for password hashing
- Jakarta EE (Servlet, Validation)
