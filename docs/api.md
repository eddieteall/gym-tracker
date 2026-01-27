# Gym Tracker API Documentation

> **Documentation approach**
> This API documentation was created using Postman to design, test, and validate all endpoints, ensuring that request and response examples accurately reflect the implemented API.

---

## Overview

This API supports the **Gym Tracker** web application. It provides endpoints for managing exercises and workout logs, allowing users to record, view, update, and delete gym activity.

The API follows a REST‑style design using **HTTP methods**, **JSON request and response bodies**, and standard **HTTP status codes**.

The backend is implemented using **Node.js** and **Express**, with data stored in a local JSON file.

---

## Base URL

```
http://localhost:3000
```

All endpoints described below are relative to this base URL.

---

## Content Type

All requests and responses use JSON unless stated otherwise.

```
Content-Type: application/json
```

---

## HTTP Status Codes

The API uses the following status codes:

* **200 OK** – Request completed successfully
* **201 Created** – A new resource was successfully created
* **400 Bad Request** – Invalid or missing request data
* **404 Not Found** – The requested resource does not exist

---

## Endpoint Index

### Health

* `GET /api/health`

### Exercises

* `GET /api/exercises`
* `GET /api/exercises/:id`
* `POST /api/exercises`
* `POST /api/exercises/:id`

### Logs

* `GET /api/logs`
* `GET /api/logs/:id`
* `POST /api/logs`
* `POST /api/logs/:id`
* `POST /api/logs/:id/delete`

---

## Health

### GET `/api/health`

Checks whether the API server is running.

**Response – 200 OK**

```json
{ "status": "ok" }
```

---

## Exercises

### GET `/api/exercises`

Returns a list of all exercises. This endpoint is used to populate the exercise list in the client interface.

**Response – 200 OK**

```json
[
  { "id": "e1", "name": "Bench Press", "muscleGroup": "Chest" },
  { "id": "e2", "name": "Squat", "muscleGroup": "Legs" }
]
```

---

### GET `/api/exercises/:id`

Returns details of a single exercise, including all associated workout logs.

**URL Parameters**

* `id` (string) – Exercise identifier

**Response – 200 OK**

```json
{
  "id": "e1",
  "name": "Bench Press",
  "muscleGroup": "Chest",
  "logs": [
    {
      "id": "l1",
      "exerciseId": "e1",
      "date": "2026-01-20",
      "weightKg": 80,
      "reps": 6
    }
  ]
}
```

**Errors**

* `404 Not Found` – Unknown exercise id

---

### POST `/api/exercises`

Creates a new exercise.

**Request Body**

```json
{
  "name": "Deadlift",
  "muscleGroup": "Back"
}
```

**Validation Rules**

* `name` must be a non‑empty string
* `muscleGroup` must be a non‑empty string

**Response – 201 Created**

```json
{
  "id": "e3",
  "name": "Deadlift",
  "muscleGroup": "Back"
}
```

**Errors**

* `400 Bad Request` – Missing or invalid fields

---

### POST `/api/exercises/:id`

Updates an existing exercise.

**URL Parameters**

* `id` (string) – Exercise identifier

**Request Body**

```json
{
  "name": "Incline Bench Press",
  "muscleGroup": "Upper Chest"
}
```

At least one field must be provided.

**Response – 200 OK**

```json
{
  "id": "e1",
  "name": "Incline Bench Press",
  "muscleGroup": "Upper Chest"
}
```

**Errors**

* `400 Bad Request` – Invalid field values
* `404 Not Found` – Unknown exercise id

---

## Logs

### GET `/api/logs`

Returns all workout logs across all exercises.

**Response – 200 OK**

```json
[
  {
    "id": "l1",
    "exerciseId": "e1",
    "date": "2026-01-20",
    "weightKg": 80,
    "reps": 6
  }
]
```

---

### GET `/api/logs/:id`

Returns a single workout log.

**URL Parameters**

* `id` (string) – Log identifier

**Response – 200 OK**

```json
{
  "id": "l1",
  "exerciseId": "e1",
  "date": "2026-01-20",
  "weightKg": 80,
  "reps": 6
}
```

**Errors**

* `404 Not Found` – Unknown log id

---

### POST `/api/logs`

Creates a new workout log for an exercise.

**Request Body**

```json
{
  "exerciseId": "e1",
  "date": "2026-01-20",
  "weightKg": 80,
  "reps": 6
}
```

**Validation Rules**

* `exerciseId` must reference an existing exercise
* `date` must be in `YYYY-MM-DD` format
* `weightKg` must be a positive number
* `reps` must be a positive number

**Response – 201 Created**

```json
{
  "id": "l2",
  "exerciseId": "e1",
  "date": "2026-01-20",
  "weightKg": 80,
  "reps": 6
}
```

**Errors**

* `400 Bad Request` – Invalid or missing fields
* `404 Not Found` – Unknown exercise id

---

### POST `/api/logs/:id`

Updates an existing workout log.

**Request Body**

```json
{
  "date": "2026-01-21",
  "weightKg": 82.5,
  "reps": 5
}
```

All fields are required.

**Response – 200 OK**

```json
{
  "id": "l1",
  "exerciseId": "e1",
  "date": "2026-01-21",
  "weightKg": 82.5,
  "reps": 5
}
```

**Errors**

* `400 Bad Request` – Invalid input values
* `404 Not Found` – Unknown log id

---

### POST `/api/logs/:id/delete`

Deletes a workout log.

**URL Parameters**

* `id` (string) – Log identifier

**Response – 200 OK**

```json
{ "id": "l1" }
```

**Errors**

* `404 Not Found` – Unknown log id

---

## Notes

* This documentation was generated and structured using **Postman**, ensuring clarity and consistency without requiring access to the source code.
* All data is stored locally in a JSON file.
* Authentication and authorisation are not implemented as this API is intended for educational use.
