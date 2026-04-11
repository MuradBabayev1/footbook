# Footbook

Footbook is a Spring Boot application for football stadium booking with role-based access control and a built-in frontend.

## Tech Stack

- Java 21
- Spring Boot 4.0.5
- Spring Security + JWT
- Spring Data JPA (MySQL)
- Spring Cache + Redis
- Maven

## Features

- JWT authentication (`/api/auth/login`, `/api/auth/register`)
- Role-based authorization (`ADMIN`, `OWNER`, `USER`)
- Stadium management for owners and admins
- Booking creation and status updates
- User management for admins
- Redis-backed caching for high-read stadium endpoints
- Static frontend pages served from `src/main/resources/static/frontend`

## Roles and Access

- `USER`
  - Can create and view own bookings
  - Can cancel own bookings
- `OWNER`
  - Can create stadiums
  - Can manage only own stadiums (`/api/stadiums/owner/**`)
- `ADMIN`
  - Can manage all users
  - Can update/delete any stadium
  - Can promote users to owner

## Prerequisites

- Java 21+
- Maven (or use `./mvnw`)
- MySQL 8+
- Redis 7+

## Configuration

The app uses environment-variable-friendly defaults in `src/main/resources/application.properties`.

### Database

- `DB_URL` (default: `jdbc:mysql://localhost:3306/footbook`)
- `DB_USERNAME` (default: `root`)
- `DB_PASSWORD` (default from properties file)

### JWT

- `JWT_SECRET` (set a strong value in non-dev environments)
- `JWT_EXPIRATION` (default: `86400000`, milliseconds)

### Redis Cache

- `REDIS_HOST` (default: `localhost`)
- `REDIS_PORT` (default: `6379`)

### Bootstrap Admin

- `ADMIN_BOOTSTRAP_ENABLED` (default: `true`)
- `ADMIN_FULL_NAME` (default: `Footbook Admin`)
- `ADMIN_EMAIL` (default: `admin@footbook.com`)
- `ADMIN_PHONE` (default: `+10000000000`)
- `ADMIN_PASSWORD` (default: `admin123456`)
- `ADMIN_RESET_PASSWORD` (default: `true`)

## Run Locally

1. Create database:

```sql
CREATE DATABASE footbook;
```

2. Start MySQL and Redis.

3. Run application:

```bash
./mvnw spring-boot:run
```

4. Open app:

- Backend base URL: `http://localhost:8080`
- Frontend page: `http://localhost:8080/frontend/index.html`

## Build and Test

```bash
./mvnw clean verify
```

Compile only:

```bash
./mvnw -DskipTests compile
```

## API Overview

### Auth

- `POST /api/auth/register`
- `POST /api/auth/login`
- `POST /api/auth/logout`

### Stadiums

Public reads:

- `GET /api/stadiums`
- `GET /api/stadiums/{id}`
- `GET /api/stadiums/available?city=...`

Owner operations:

- `POST /api/stadiums`
- `GET /api/stadiums/owner/mine`
- `PUT /api/stadiums/owner/{id}`
- `DELETE /api/stadiums/owner/{id}`

Admin operations:

- `PUT /api/stadiums/{id}`
- `DELETE /api/stadiums/{id}`

### Bookings

- `GET /api/bookings` (authenticated; scoped to current user unless admin)
- `GET /api/bookings/{id}`
- `POST /api/bookings`
- `PATCH /api/bookings/{id}/status`
- `DELETE /api/bookings/{id}` (admin only)

### Users (admin only)

- `GET /api/users`
- `GET /api/users/{id}`
- `POST /api/users`
- `PUT /api/users/{id}`
- `DELETE /api/users/{id}`

### Owner Promotion (admin only)

- `POST /api/owners/promote/{userId}`

## Redis Caching Details

Caching is enabled at application level and currently targets stadium-heavy read paths.

- Cached reads:
  - all stadiums
  - stadium by id
  - available stadium lists
  - owner stadium list
- Eviction is triggered on stadium create, update, and delete flows to prevent stale data.

If Redis is unavailable, caching calls can fail at runtime. Keep Redis running in local/dev environments when cache type is set to Redis.

## Security Notes

- JWT is required for protected endpoints.
- Passwords are hashed with BCrypt.
- Set a strong `JWT_SECRET` in production.
- Restrict CORS origins in production.

## Project Structure

- `src/main/java/com/example/footbook`
  - `controller` REST controllers
  - `service` business logic
  - `repository` Spring Data repositories
  - `entity` JPA entities
  - `security` JWT and security config
  - `config` application configuration
- `src/main/resources/static/frontend`
  - HTML/CSS/JS frontend pages

## Known Operational Notes

- Deleting a user removes dependent bookings first to satisfy FK constraints.
- Booking cancellation should use status update endpoint (`PATCH /api/bookings/{id}/status`) with `CANCELLED` rather than hard deletion.

## License

No license specified.
