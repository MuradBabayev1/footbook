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
- React frontend served from Spring Boot build output

## Prerequisites

- Java 21+
- Maven (or use `./mvnw`)
- Node.js 18+
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

3. Install frontend dependencies:

```bash
cd frontend-react
npm install
```

4. Development mode (run frontend and backend together):

Run only Spring Boot (frontend auto-starts):

```bash
./mvnw spring-boot:run
```

By default, Spring Boot now auto-starts the React dev server on port `3000` when `footbook.frontend.auto-start=true`.
Disable with `FRONTEND_AUTO_START=false` when needed.

Single command (recommended):

```bash
./run-dev.sh
```

Notes:

- `run-dev.sh` requires backend port `8080` and frontend port `3000` to be free.
- If either port is already in use, the script exits with a clear message so proxy/API calls do not run in a broken state.
- If backend is already running (for example from IDE), use:

```bash
USE_EXISTING_BACKEND=1 ./run-dev.sh
```

Alternative from project root:

```bash
npm run dev
```

Alternative from `frontend-react`:

```bash
npm run dev:full
```

Manual mode (two terminals):

Terminal 1 (backend):

```bash
./mvnw spring-boot:run
```

Terminal 2 (frontend):

```bash
cd frontend-react
npm start
```

The React dev server runs on `http://localhost:3000` and proxies `/api/*` calls to `http://localhost:8080` using `frontend-react/package.json`.

5. Production-style mode (Spring serves React build):

```bash
cd frontend-react
npm run build
find ../src/main/resources/static -mindepth 1 -delete
cp -R build/* ../src/main/resources/static/
cd ..
./mvnw spring-boot:run
```

Open app:

- Backend base URL: `http://localhost:8080`
- React app (served by Spring): `http://localhost:8080/`

Port can be overridden with `SERVER_PORT`.
If the configured port is already in use, the app falls back to a random free port and prints it in startup logs.

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
- `frontend-react`
  - React UI (build output served from `src/main/resources/static`)

## Known Operational Notes

- Deleting a user removes dependent bookings first to satisfy FK constraints.
- Booking cancellation should use status update endpoint (`PATCH /api/bookings/{id}/status`) with `CANCELLED` rather than hard deletion.

## License

No license specified.
