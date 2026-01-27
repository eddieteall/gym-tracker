# Gym Tracker API Documentation

## Overview

This API supports the Gym Tracker web application.
It allows the client to create and retrieve exercises and workout logs using a REST-style interface.

The API is implemented using **Node.js and Express** and communicates using **JSON**.

**Base URL:**

```
http://localhost:3000
```

All request and response bodies are JSON unless stated otherwise.

---

## HTTP Status Codes

The API uses the following HTTP status codes:

* **200 OK** – Request completed successfully
* **201 Created** – A new resource was successfully created
* **400 Bad Request** – Invalid or missing request data
* **404 Not Found** – The requested resource does not exist

---

## Exercises

### GET `/api/exercises`

Returns a list of all exercises.
This endpoint is used to populate the exercise list in the user interface.
Only summary information is returned.

**Response – 200 OK**

```json
[
  { "id": "e1", "name": "Bench Press" },
  { "id": "e2", "name": "Squat" }
]
```

---

### GET `/api/exercises/:id`

Returns detailed information about a single exercise, including all workout logs associated with it.

**Path Parameters**

* `id` (string): The exercise ID

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
      "weightKg": 60,
      "reps": 8
    }
  ]
}
```

**Error Response – 404 Not Found**

```json
{ "error": "Unknown exercise id" }
```

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

**Response – 201 Created**

```json
{
  "id": "e3",
  "name": "Deadlift",
  "muscleGroup": "Back"
}
```

**Error Response – 400 Bad Request**

```json
{ "error": "name is required" }
```

---

## Logs

### GET `/api/logs`

Returns a list of all workout logs in summary form.

**Response – 200 OK**

```json
[
  {
    "id": "l1",
    "date": "2026-01-20",
    "exerciseId": "e1"
  }
]
```

---

### GET `/api/logs/:id`

Returns detailed information about a single workout log, including the related exercise.

**Path Parameters**

* `id` (string): The log ID

**Response – 200 OK**

```json
{
  "id": "l1",
  "exerciseId": "e1",
  "date": "2026-01-20",
  "weightKg": 60,
  "reps": 8,
  "exercise": {
    "id": "e1",
    "name": "Bench Press",
    "muscleGroup": "Chest"
  }
}
```

**Error Response – 404 Not Found**

```json
{ "error": "Unknown log id" }
```

---

### POST `/api/logs`

Creates a new workout log for an existing exercise.

**Request Body**

```json
{
  "exerciseId": "e1",
  "date": "2026-01-20",
  "weightKg": 60,
  "reps": 8
}
```

**Response – 201 Created**

```json
{
  "id": "l2",
  "exerciseId": "e1",
  "date": "2026-01-20",
  "weightKg": 60,
  "reps": 8
}
```

**Error Response – 400 Bad Request**

```json
{ "error": "exerciseId does not exist" }
```

---

## Additional Endpoints

### POST `/api/logs/:id`

Updates an existing workout log.
Any subset of fields may be provided.

**Request Body Example**

```json
{
  "date": "2026-01-21",
  "weightKg": 62.5,
  "reps": 6
}
```

**Response – 200 OK**

```json
{
  "id": "l2",
  "exerciseId": "e1",
  "date": "2026-01-21",
  "weightKg": 62.5,
  "reps": 6
}
```

**Error Response – 404 Not Found**

```json
{ "error": "Unknown log id" }
```

---

### POST `/api/logs/:id/delete`

Deletes an existing workout log.

**Response – 200 OK**

```json
{
  "id": "l2",
  "exerciseId": "e1",
  "date": "2026-01-21",
  "weightKg": 62.5,
  "reps": 6
}
```

**Error Response – 404 Not Found**

```json
{ "error": "Unknown log id" }
```

