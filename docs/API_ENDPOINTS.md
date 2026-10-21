# 🌐 API Endpoints Reference

Complete reference for all REST endpoints exposed by the HR Management API.

> **Base URL (dev):** `http://localhost:3000`
> **Interactive docs:** `http://localhost:3000/api` (Swagger)
>
> Protected endpoints require the header: `Authorization: Bearer <access_token>`

- [Authentication](#-authentication)
- [Users](#-users)
- [Departments](#-departments)
- [Employees](#-employees)
- [Time Entries](#-time-entries)
- [Access Control Summary](#-access-control-summary)
- [Pagination](#-pagination)
- [Error Responses](#-error-responses)

---

## 🔐 Authentication

All `/auth` endpoints except `/auth/me` are **public**.

| Method | Endpoint         | Auth    | Description                                        |
| ------ | ---------------- | ------- | -------------------------------------------------- |
| POST   | `/auth/register` | Public  | Register a new user (self-registration always creates role `user`) |
| POST   | `/auth/login`    | Public  | Login, returns access + refresh tokens             |
| POST   | `/auth/refresh`  | Public  | Exchange a refresh token for new tokens            |
| GET    | `/auth/me`       | Bearer  | Get the currently authenticated user               |

### POST /auth/register

```json
{
  "email": "user@example.com",
  "password": "SecurePass123!",
  "name": "Jane Doe"
}
```

> The `role` field is ignored on self-registration — new users always get the `user` role. Admins can assign `admin` via `POST /users`.

### POST /auth/login

```json
{
  "email": "admin@example.com",
  "password": "Admin1234!"
}
```

**Response:**

```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIs...",
  "refresh_token": "eyJhbGciOiJIUzI1NiIs...",
  "user": { "id": 1, "email": "admin@example.com", "role": "admin" }
}
```

### POST /auth/refresh

```json
{ "refresh_token": "eyJhbGciOiJIUzI1NiIs..." }
```

Returns a new `access_token` **and** a new `refresh_token` (rotation).

---

## 👤 Users

| Method | Endpoint    | Roles          | Description                                            |
| ------ | ----------- | -------------- | ------------------------------------------------------ |
| POST   | `/users`    | Admin          | Create a user (can assign any role)                     |
| GET    | `/users`    | Admin          | List users (paginated)                                  |
| GET    | `/users/me` | Authenticated  | Get own profile                                         |
| GET    | `/users/:id`| Authenticated  | Get user by ID (any authent. user may read own profile) |
| PATCH  | `/users/:id`| Self or Admin  | Self: `name` + `password` only · Admin: all fields       |
| DELETE | `/users/:id`| Admin          | Delete user                                             |

### PATCH /users/:id

```json
{ "name": "Updated Name", "password": "NewSecurePass123!" }
```

---

## 🏢 Departments

| Method | Endpoint                     | Roles | Description                                    |
| ------ | ---------------------------- | ----- | ---------------------------------------------- |
| GET    | `/departments`               | Any   | List departments (paginated)                   |
| GET    | `/departments/employee-count`| Any   | List departments with employee counts (paginated) |
| GET    | `/departments/:id`           | Any   | Get a single department                        |
| POST   | `/departments`               | Admin | Create a department                            |
| PATCH  | `/departments/:id`           | Admin | Update a department                            |
| DELETE | `/departments/:id`           | Admin | Delete (blocked if employees are assigned)     |

---

## 👨‍💼 Employees

| Method | Endpoint                          | Roles | Description                                        |
| ------ | --------------------------------- | ----- | -------------------------------------------------- |
| GET    | `/employees`                      | Any   | List employees (paginated, filterable)              |
| GET    | `/employees/stats/overview`       | Admin | Aggregate stats (total, active, per department)     |
| GET    | `/employees/department/:departmentId` | Any | List employees of one department (paginated)    |
| GET    | `/employees/:id`                  | Any   | Get one employee                                    |
| GET    | `/employees/:id/department`       | Any   | Get employee including the department object        |
| GET    | `/employees/:id/subordinates`     | Any   | List the employee's direct subordinates (paginated) |
| POST   | `/employees`                      | Admin | Create an employee                                  |
| PATCH  | `/employees/:id`                  | Admin | Update an employee                                  |
| DELETE | `/employees/:id`                  | Admin | Delete an employee                                  |

### List filters

```http
GET /employees?departmentId=1&status=active&page=1&limit=20
```

---

## ⏱️ Time Entries

| Method | Endpoint                            | Roles | Description                                     |
| ------ | ----------------------------------- | ----- | ------------------------------------------------ |
| GET    | `/time-entries`                     | Any   | List all entries (paginated)                     |
| GET    | `/time-entries/stats/overview`      | Admin | Statistics by data-quality status                |
| GET    | `/time-entries/export/template`     | Any   | Download the Excel import template (`.xlsx`)     |
| GET    | `/time-entries/date-range`          | Any   | List entries in a date range (paginated)         |
| GET    | `/time-entries/employee/:employeeId`| Any   | List entries for one employee (paginated)        |
| POST   | `/time-entries`                     | Admin | Create a single entry                            |
| POST   | `/time-entries/import/excel`        | Admin | Bulk import from an Excel "pointeuse" file (multipart, transactional, per-row error report) |
| PUT    | `/time-entries/:id`                 | Admin | Update an entry                                  |
| DELETE | `/time-entries/bulk`                | Admin | Delete many entries by IDs                       |
| DELETE | `/time-entries/:id`                 | Admin | Delete an entry                                  |

### GET /time-entries/date-range

```http
GET /time-entries/date-range?startDate=2025-10-01&endDate=2025-10-31
```

Dates must use the `YYYY-MM-DD` format.

### POST /time-entries/import/excel

`multipart/form-data` with a `file` field containing the filled-in Excel template. The import is transactional; the response reports per-row validation errors.

### DELETE /time-entries/bulk

```json
{ "ids": [1, 2, 3] }
```

---

## 🛡️ Access Control Summary

| Capability                          | Admin | User          |
| ----------------------------------- | ----- | ------------- |
| Auth (register / login / refresh)   | ✅    | ✅            |
| Read departments / employees / time entries | ✅ | ✅ (read-only) |
| Create / update / delete departments, employees, time entries (incl. import & bulk) | ✅ | ❌ |
| List users, create users, delete users | ✅ | ❌ |
| `PATCH /users/:id` on own profile (name + password) | ✅ | ✅ |
| `PATCH /users/:id` on other users   | ✅    | ❌            |

---

## 📄 Pagination

List endpoints use [nestjs-paginate](https://www.npmjs.com/package/nestjs-paginate).

| Parameter | Type   | Default | Description                       |
| --------- | ------ | ------- | --------------------------------- |
| `page`    | number | 1       | Page number (min: 1)              |
| `limit`   | number | 10      | Items per page (min: 1, max: 100) |

**Response envelope:**

```json
{
  "data": [ ... ],
  "meta": {
    "page": 2,
    "limit": 20,
    "total": 150,
    "totalPages": 8,
    "hasNextPage": true,
    "hasPreviousPage": true
  },
  "links": { ... }
}
```

---

## ❌ Error Responses

| Status      | When                                                                    |
| ----------- | ----------------------------------------------------------------------- |
| `400`       | Validation failed (class-validator), invalid date format, bad payload   |
| `401`       | Missing/invalid/expired access token, wrong credentials, bad refresh token |
| `403`       | Role restrictions (a `user` calling an admin-only endpoint)              |
| `404`       | Resource not found (employee, department, entry, user)                   |
| `409`       | Duplicate email / conflicting database constraint                        |

---

*Generated: October 2026 — may drift from code; the Swagger UI at `/api` is always the source of truth.*
