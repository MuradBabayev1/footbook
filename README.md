# Footbook

Footbook is a Spring Boot application for football stadium booking with role-based access control and a built-in frontend.

## Tech Stack

- Java 21
- Spring Boot 4.0.5
- Spring Data JPA (MySQL)
- Spring Cache + Redis
- Maven

## Features

- Stadium management for owners
- Booking creation and status updates
- User management
- Redis-backed caching for high-read stadium endpoints
- Static frontend pages served from `src/main/resources/static/frontend`

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

### Redis Cache

- `REDIS_HOST` (default: `localhost`)
- `REDIS_PORT` (default: `6379`)

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

### Bookings

- `GET /api/bookings`
- `GET /api/bookings/{id}`
- `POST /api/bookings`
- `PATCH /api/bookings/{id}/status`
- `DELETE /api/bookings/{id}`

### Users

- `GET /api/users`
- `GET /api/users/{id}`
- `POST /api/users`
- `PUT /api/users/{id}`
- `DELETE /api/users/{id}`

### Owner Promotion

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

## Project Structure

- `src/main/java/com/example/footbook`
  - `controller` REST controllers
  - `service` business logic
  - `repository` Spring Data repositories
  - `entity` JPA entities
  - `config` application configuration
- `src/main/resources/static/frontend`
  - HTML/CSS/JS frontend pages

## Known Operational Notes

- Deleting a user removes dependent bookings first to satisfy FK constraints.
- Booking cancellation should use status update endpoint (`PATCH /api/bookings/{id}/status`) with `CANCELLED` rather than hard deletion.

## License

No license specified.
