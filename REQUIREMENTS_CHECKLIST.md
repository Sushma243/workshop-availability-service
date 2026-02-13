# Requirements Checklist

This document shows how the project satisfies each requirement from the case study.

---

## Scope & Requirements

| Requirement | Status | Where in the project |
|-------------|--------|----------------------|
| Workshops with configurable working hours, bays, services, and service/repair durations | ✅ | `workshops.config.json`; types in `src/domain/types.ts`; loaded in `src/config/workshopConfig.ts` |
| Query available days for all workshops within 60-day period from current day | ✅ | `src/availability/availabilityService.ts` – `QUERY_DAYS = 60`, `iterStartDates()`, `computeAvailability()` |
| Total time durations for requested services and repairs included | ✅ | Response has `request.totalRequestedHours` and each slot has `totalWorkHours` and per-job `duration` |

---

## Core Business Rules

| Rule | Status | Where |
|------|--------|--------|
| One service/repair per bay at a time (no overlapping) | ✅ | `availabilityService.ts` – jobs placed sequentially; next job starts after previous ends |
| Repairs with dependencies scheduled after that service | ✅ | `buildJobOrder()` adds dependency service before repair; schedule order enforced |
| All jobs in a booking scheduled sequentially | ✅ | `tryScheduleInOneBay()` places jobs one after another; `currentHour` advances after each job |
| Jobs only during workshop working hours and on days bay supports that job | ✅ | `workshop.workingHours`, `workshop.workingDays`, capability `days` in `tryScheduleInOneBay()` |
| Availability queries reflect latest system state | ✅ | Config loaded on each request (cached in memory); no stale data |
| Responses consistent with workshop configurations | ✅ | All data derived from config; no booking creation or config mutation |

---

## Technical Expectations

| Expectation | Status | Where |
|-------------|--------|--------|
| Backend-first, Node.js and TypeScript | ✅ | Entire `src/` is TypeScript; Express server; no frontend required |
| Clear modular structure (modular monolith) | ✅ | `domain/`, `config/`, `availability/`, `api/`, `lambda/` |
| REST API | ✅ | `POST /api/availability`, `GET /health`; JSON request/response |
| Serverless-aware (Lambda/API Gateway) | ✅ | `src/lambda/handler.ts`; same logic used by Express and Lambda |
| In-memory persistence OK; data modeling reflects real-world | ✅ | Config read from JSON, cached; types model workshops, bays, slots |
| Clean, readable, testable code | ✅ | Pure functions in availability; validation separate; tests for service and validation |
| Only availability querying (no booking creation) | ✅ | No POST to create bookings; only `POST /api/availability` to query |
| Do not mutate workshops.config.json | ✅ | `workshopConfig.ts` only reads; no write/update logic anywhere |

---

## API Response Requirements

| Required field | Status | In response |
|----------------|--------|-------------|
| Request: services, repairs, query period (start/end), total work hours | ✅ | `request.services`, `request.repairs`, `request.startDate`, `request.endDate`, `request.totalRequestedHours` |
| Per workshop: ID, name, can fulfill, if not—missing services/repairs | ✅ | `results[].workshopId`, `workshopName`, `canFulfillRequest`, `missingServicesOrRepairs` |
| Per slot: check-in, check-out, total work hours, total days, schedule (job, bay, date, start/end) | ✅ | `availableSlots[].checkIn`, `checkOut`, `totalWorkHours`, `totalDays`, `schedule[]` with `jobName`, `bayId`, `date`, `startHour`, `endHour`, `duration` |

---

## Deliverables

| Deliverable | Status | Location |
|-------------|--------|----------|
| Git repo (or zip) with solution | ✅ | Project root; ready to `git init` or zip |
| README: run locally, architecture, trade-offs, assumptions, AWS scaling | ✅ | `README.md` (includes student-friendly run guide and evaluator section) |
| API documentation | ✅ | `API.md`, `openapi.yaml`, `postman_collection.json` |

---

## Tests

| Type | Status | Location |
|------|--------|----------|
| Unit: availability logic | ✅ | `src/availability/availabilityService.test.ts` (request summary, dependency order, cannot fulfill, empty slots) |
| Unit: validation | ✅ | `src/api/validation.test.ts` (valid/invalid body, missing arrays, empty request, filter non-strings) |
| Integration: API endpoint | ✅ | `src/api/availability.integration.test.ts` (POST /api/availability with real config, response shape) |

---

## Coding Standards & Tooling

| Item | Status |
|------|--------|
| TypeScript strict mode | ✅ | `tsconfig.json`: `"strict": true` |
| ES2022 target | ✅ | `tsconfig.json`: `"target": "ES2022"` |
| ESLint for consistency | ✅ | `eslint.config.mjs`; `npm run lint` |
| Test coverage collected | ✅ | `jest.config.js`: `collectCoverageFrom`; `npm test` outputs coverage |
