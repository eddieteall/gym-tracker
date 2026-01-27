# Gym Tracker API Documentation

## Overview

The **Gym Tracker API** provides a REST-style JSON interface for a dynamic single-page web application that allows users to:

* Create and manage **exercises**
* Log **workout sessions** (reps, weight, date) linked to exercises

The API is implemented using **Node.js and Express** and is designed to be consumed via **AJAX (Fetch API)** from a static HTML client.

This documentation is written in the style of the **ChatGPT API documentation**, listing each endpoint with its parameters, request body, responses, and error conditions.

> **Note on AI usage:**
> Parts of this API documentation were refined with assistance from **ChatGPT (OpenAI, GPT-5.2)** to improve clarity and structure. All code functionality was written, tested, and understood by the author.

---

## Base URL

All endpoints are relative to:

```
http://localhost:3000
```

---

## Data Format

* All request and response bodies are **JSON**
* Clients must send the following header when including a request body:

```
Content-Type: application/json
```

---

## HTTP Status Codes

This API uses standard HTTP status codes:

| Code | Meaning                           |
| ---- | --------------------------------- |
| 200  | Request successful                |
| 201  | Resource created successfully     |
| 400  | Invalid or missing request data   |
| 404  | Requested resource does not exist |

---

## Entity Models

### Exercise

```json
{
  "id": "e1",
  "name": "Bench Press",
  "muscleGroup": "Chest"
}
```

### Log

```json
{
  "id": "l1",
  "exerciseId": "e1",
  "date": "2026-01-20",
  "weightKg": 80,
  "reps": 6
}
```

### Relationships

* Each **Log** belongs to exactly one **Exercise**, referenced by `exerciseId`
* Some endpoints return related entities embedded in the response

---

## Endpoint Summary

### Health

* `GET /api/health`

### Exercises

* `GET /api/exercises`
* `GET /api/exercises/:id`
* `POST /api/exercises`
* `POST /api/exercises/:id`
* `POST /api/exercises/:id/delete`

### Logs

* `GET /api/logs`
* `GET /api/logs/:id`
* `POST /api/logs`
* `POST /api/logs/:id`
* `POST /api/logs/:id/delete`

---

# Health Endpoint

## GET `/api/health`

Checks whether the API server is running.

### Response — 200 OK

```json
{
  "status": "ok"
}
```

---

# Exercise Endpoints

## GET `/api/exercises`

Returns a list of all exercises (summary view).

### Response — 200 OK

```json
[
  { "id": "e1", "name": "Bench Press" },
  { "id": "e2", "name": "Squat" }
]
```

---

## GET `/api/exercises/:id`

Returns full details for a single exercise, including its related logs.

### URL Parameters

* `id` — Exercise ID (string)

### Response — 200 OK

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

### Error — 404 Not Found

```json
{
  "error": "Unknown exercise id"
}
```

---

## POST `/api/exercises`

Creates a new exercise.

### Request Body

```json
{
  "name": "Deadlift",
  "muscleGroup": "Back"
}
```

### Validation Rules

* `name` must be a non-empty string
* `muscleGroup` must be a non-empty string

### Response — 201 Created

```json
{
  "id": "e3",
  "name": "Deadlift",
  "muscleGroup": "Back"
}
```

### Error — 400 Bad Request

```json
{
  "error": "name is required"
}
```

---

## POST `/api/exercises/:id`

Updates an existing exercise. Partial updates are supported.

### URL Parameters

* `id` — Exercise ID

### Request Body (example)

```json
{
  "name": "Incline Bench Press"
}
```

### Response — 200 OK

```json
{
  "id": "e1",
  "name": "Incline Bench Press",
  "muscleGroup": "Chest"
}
```

### Errors

* **404 Not Found**

```json
{ "error": "Unknown exercise id" }
```

* **400 Bad Request**

```json
{ "error": "Invalid name" }
```

---

## POST `/api/exercises/:id/delete`

Deletes an exercise **only if it has no associated logs**.

### Response — 200 OK

```json
{
  "id": "e3",
  "name": "Deadlift",
  "muscleGroup": "Back"
}
```

### Error — 400 Bad Request

```json
{
  "error": "Cannot delete exercise with logs"
}
```

---

# Log Endpoints

## GET `/api/logs`

Returns a summary list of workout logs.

### Response — 200 OK

```json
[
  { "id": "l1", "exerciseId": "e1", "date": "2026-01-20" }
]
```

---

## GET `/api/logs/:id`

Returns full details for a single log, including its related exercise.

### Response — 200 OK

```json
{
  "id": "l1",
  "exerciseId": "e1",
  "date": "2026-01-20",
  "weightKg": 80,
  "reps": 6,
  "exercise": {
    "id": "e1",
    "name": "Bench Press",
    "muscleGroup": "Chest"
  }
}
```

### Error — 404 Not Found

```json
{
  "error": "Unknown log id"
}
```

---

## POST `/api/logs`

Creates a new workout log.

### Request Body

```json
{
  "exerciseId": "e1",
  "date": "2026-01-20",
  "weightKg": 80,
  "reps": 6
}
```

### Validation Rules

* `exerciseId` must reference an existing exercise
* `date` must be in `YYYY-MM-DD` format
* `weightKg` must be a positive number
* `reps` must be a positive number

### Response — 201 Created

```json
{
  "id": "l3",
  "exerciseId": "e1",
  "date": "2026-01-20",
  "weightKg": 80,
  "reps": 6
}
```

---

## POST `/api/logs/:id`

Updates an existing log. Partial updates are supported.

### Request Body (example)

```json
{
  "weightKg": 82.5,
  "reps": 5
}
```

### Response — 200 OK

```json
{
  "id": "l1",
  "exerciseId": "e1",
  "date": "2026-01-20",
  "weightKg": 82.5,
  "reps": 5
}
```

---

## POST `/api/logs/:id/delete`

Deletes a workout log.

### Response — 200 OK

```json
{
  "id": "l1",
  "exerciseId": "e1",
  "date": "2026-01-20",
  "weightKg": 80,
  "reps": 6
}
```

---

## Notes

* Authentication is not implemented (outside coursework scope)
* Data persistence is handled using a local JSON file
* All endpoints are tested using **Jest**
* API behaviour matches documented responses exactly


