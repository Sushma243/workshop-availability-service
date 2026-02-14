# Workshop Availability API

Base URL (local): `http://localhost:3000`

## POST /api/availability

Query available workshop slots for requested services and repairs within the next 60 days.

### Request

**Headers**

- `Content-Type: application/json`

**Body**

| Field     | Type     | Required | Description                    |
|----------|----------|----------|--------------------------------|
| services | string[] | No*      | Service IDs (e.g. MOT, ADR)    |
| repairs  | string[] | No*      | Repair IDs (e.g. Brakes, Axels)|
| startDate| string   | No       | Start of 60-day window (YYYY-MM-DD). If omitted or in the past, today is used. |

*At least one of `services` or `repairs` must be non-empty.

**Example**

```json
{
  "services": ["MOT"],
  "repairs": ["Brakes"]
}
```

**Example with custom start date**

```json
{
  "services": ["MOT"],
  "repairs": ["Brakes"],
  "startDate": "2026-03-01"
}
```

### Response (200 OK)

| Field    | Type   | Description                          |
|----------|--------|--------------------------------------|
| success  | true   | Always true for 200                  |
| request  | object | Echo of request and period summary  |
| results  | array  | One entry per workshop              |

**request**

| Field               | Type   | Description                          |
|---------------------|--------|--------------------------------------|
| services            | string[] | Requested service IDs               |
| repairs             | string[] | Requested repair IDs                |
| totalRequestedHours | number | Sum of durations for all jobs      |
| startDate           | string | YYYY-MM-DD (first day of 60-day window) |
| endDate             | string | YYYY-MM-DD (last day of 60-day window, inclusive) |

**results[]**

| Field                   | Type    | Description                                    |
|-------------------------|---------|------------------------------------------------|
| workshopId              | string  | Workshop identifier                            |
| workshopName            | string  | Human-readable name                            |
| canFulfillRequest       | boolean | Whether workshop can do all requested jobs     |
| missingServicesOrRepairs| string[]| Present if canFulfillRequest is false          |
| availableSlots          | array   | Slots where the request can be scheduled       |

**availableSlots[]**

| Field           | Type   | Description                              |
|-----------------|--------|------------------------------------------|
| checkIn         | string | ISO datetime (e.g. 2026-02-09T09:00)    |
| checkOut        | string | ISO datetime (e.g. 2026-02-09T16:00)    |
| totalWorkHours  | number | Sum of job durations in this slot       |
| totalDays       | number | Calendar days span (1 = same day)       |
| schedule        | array  | Ordered list of jobs in this slot       |

**schedule[]**

| Field    | Type   | Description                |
|----------|--------|----------------------------|
| jobName  | string | e.g. MOT, Brakes           |
| jobType  | string | "service" or "repair"      |
| bayId    | string | Bay where job is scheduled |
| date     | string | YYYY-MM-DD                 |
| startHour| number | Start hour (0–23)          |
| endHour  | number | End hour (0–23)            |
| duration | number | Hours                      |

**Example response**

```json
{
  "success": true,
  "request": {
    "services": ["MOT"],
    "repairs": ["Brakes"],
    "totalRequestedHours": 7,
    "startDate": "2026-02-09",
    "endDate": "2026-04-09"
  },
  "results": [
    {
      "workshopId": "workshop-1",
      "workshopName": "Amsterdam Central",
      "canFulfillRequest": true,
      "availableSlots": [
        {
          "checkIn": "2026-02-09T09:00",
          "checkOut": "2026-02-09T16:00",
          "totalWorkHours": 7,
          "totalDays": 1,
          "schedule": [
            {
              "jobName": "MOT",
              "jobType": "service",
              "bayId": "W1-Bay-1",
              "date": "2026-02-09",
              "startHour": 9,
              "endHour": 15,
              "duration": 6
            },
            {
              "jobName": "Brakes",
              "jobType": "repair",
              "bayId": "W1-Bay-1",
              "date": "2026-02-09",
              "startHour": 15,
              "endHour": 16,
              "duration": 1
            }
          ]
        }
      ]
    }
  ]
}
```

### Error responses

**400 Bad Request** — Validation failed (e.g. missing or invalid body, empty services and repairs).

```json
{
  "success": false,
  "error": "Validation failed",
  "details": [
    { "field": "repairs", "message": "repairs must be an array of strings" }
  ]
}
```

**500 Internal Server Error** — Server or config error.

```json
{
  "success": false,
  "error": "Internal server error",
  "message": "..."
}
```

## GET /health

Health check.

**Response (200 OK)**

```json
{
  "status": "ok",
  "service": "workshop-availability-service"
}
```
