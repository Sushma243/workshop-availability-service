# Workshop Booking Availability Service

A backend service that **finds when** fleet vehicles can get maintenance (like MOT, brake repairs) at workshops. You tell it *what* work you need; it tells you *which workshops* can do it and *on which days* in the next 60 days. **It does not book anything**—it only shows what is possible.

---

## Table of contents

1. [What is this project?](#what-is-this-project)
2. [Why does it exist?](#why-does-it-exist)
3. [What do I need to run it?](#what-do-i-need-to-run-it)
4. [How do I run it? (step by step)](#how-do-i-run-it-step-by-step)
5. [How do I test the API?](#how-do-i-test-the-api)
6. [What is inside the project? (folders and files)](#what-is-inside-the-project-folders-and-files)
7. [How do I run the tests?](#how-do-i-run-the-tests)
8. [Troubleshooting](#troubleshooting)
9. [For evaluators](#for-evaluators)

---

## What is this project?

- **Workshops** have **bays** (like workstations). Each bay can do only certain **services** (e.g. MOT, ADR) and **repairs** (e.g. Brakes, Body) and only on certain **days** and **hours**.
- You send a **request**: “I need MOT and Brakes.”
- The service answers: “Here are the workshops that can do that, and here are the **available slots** (date/time in, date/time out, and a detailed schedule) in the next **60 days**.”

So: **input = list of services and repairs; output = when and where they can be done.**

---

## Why does it exist?

It is part of a **fleet maintenance platform**: companies with many trucks or vans need to know *when* they can send a vehicle to a workshop for specific work. This service only does the “when is it possible?” part. Another system or a person would use this information to actually book the appointment.

---

## What do I need to run it?

- **Node.js** version 18 or higher (this runs the JavaScript/TypeScript code).
- **npm** (comes with Node.js; used to install dependencies).

To check if you have them, open a terminal and type:

```bash
node --version
npm --version
```

If you see version numbers, you’re good. If you see “command not found”, install Node.js first (see [INSTALL_NODE.md](./INSTALL_NODE.md)).

---

## How do I run it? (step by step)

Clone `https://github.com/Sushma243/workshop-availability-service.git` from github.

### Step 1: Go to the project folder

```bash
cd workshop-availability-service
```

(Or drag the project folder into the terminal, or use the full path, for example:  
`cd /Users/YourName/workshop-availability-service`)

### Step 2: Install dependencies

```bash
npm install
```

This downloads the libraries the project needs (Express, TypeScript, etc.). Wait until it finishes.

### Step 3: Build the project

```bash
npm run build
```

This builds the **React frontend** (in `client/`) and compiles the **backend** TypeScript into JavaScript. You should see no errors. To build only the backend: `npx tsc`. To build only the frontend: `npm run build:client`.

### Step 4: Start the server

```bash
npm start
```

You should see something like:

```
Workshop Availability Service listening on http://localhost:3000
POST /api/availability - query available slots
```

**The app is now running.** Leave this terminal open.

- **In your browser:** Open **http://localhost:3000** to use the React web UI: select services and repairs, set the start date (default is today), then click “Check availability”). The UI matches Viamanta’s look and feel (dark blue, orange, clean layout).
- **API only:** Use `curl` or Postman as in Step 5 below.

### Step 5: Try the API (in a *new* terminal)

Open a **second** terminal window. Then run one of the commands below.

**Check that the server is alive:**

```bash
curl http://localhost:3000/health
```

You should get something like: `{"status":"ok","service":"workshop-availability-service"}`.

**Ask for availability (example: MOT + Brakes):**

```bash
curl -X POST http://localhost:3000/api/availability \
  -H "Content-Type: application/json" \
  -d '{"services":["MOT"],"repairs":["Brakes"]}'
```

You should get a long JSON response with `"success": true`, a `request` summary, and `results` for each workshop with `availableSlots` and a `schedule`.

When you are done, go back to the first terminal and press **Ctrl+C** to stop the server.

---

## How do I test the API?

- **From the terminal:** use `curl` as in Step 5 above.
- **From a browser:** open `http://localhost:3000` for the web UI, or `http://localhost:3000/health` for the health check.
- **Postman:** import **`postman_collection.json`** (File → Import → select the file). The collection has **POST /api/availability** and **GET /health**. Variable `baseUrl` is set to `http://localhost:3000`; change it if your server runs on another port.
- **Bruno:** you can use the same **`postman_collection.json`** — in Bruno go to **Import → Import Postman Collection** and select this file. Or create two requests manually: **GET** `http://localhost:3000/health` and **POST** `http://localhost:3000/api/availability` with body `{"services":["MOT"],"repairs":["Brakes"]}` and header `Content-Type: application/json`.

More details and examples: [API.md](./API.md).

---

## What is inside the project? (folders and files)

| Path | What it is / why it’s there |
|------|------------------------------|
| **workshops.config.json** | Data about workshops: names, working hours, bays, which services/repairs each bay does and on which days. The app **only reads** this file; it never changes it. |
| **src/** | All the application source code (TypeScript). |
| **src/domain/types.ts** | Definitions of “what is a workshop, a bay, a slot, a schedule.” So the rest of the code uses the same shapes of data. |
| **src/config/workshopConfig.ts** | Loads `workshops.config.json` from disk and keeps it in memory. Used whenever we need to compute availability. |
| **src/availability/availabilityService.ts** | The main logic: given a list of services and repairs, it finds all possible slots in the next 60 days for each workshop, respecting working hours, bay capabilities, and rules like “Brakes only after MOT.” |
| **src/api/routes.ts** | Connects the URL `POST /api/availability` to the handler that runs the availability logic. |
| **src/api/availabilityHandler.ts** | Receives the HTTP request, checks the body (validation), calls the availability service, and sends back the JSON response. |
| **src/api/validation.ts** | Checks that the request has `services` and `repairs` as arrays and that at least one of them is non-empty. |
| **src/app.ts** | Creates the Express app (middleware and routes). Used both by the server (index.ts) and by the integration tests. |
| **src/index.ts** | Entry point when you run `npm start`: builds the app and starts listening on port 3000. |
| **src/lambda/handler.ts** | Same logic can be run on AWS Lambda (serverless). Used when you deploy to the cloud instead of running your own server. |
| **src/**/*.test.ts** | Unit tests: they test one piece of logic (e.g. availability rules, validation) without starting the whole server. |
| **src/api/availability.integration.test.ts** | Integration test: it sends real HTTP requests to the API and checks the response. |
| **package.json** | Lists the project name, scripts (`npm start`, `npm test`, etc.), and dependencies. |
| **tsconfig.json** | TypeScript settings (e.g. strict mode, output folder). |
| **jest.config.js** | Jest test runner settings (where to find tests, coverage). |
| **API.md** | API documentation: request and response format, examples. |
| **openapi.yaml** | OpenAPI (Swagger) description of the API. |
| **postman_collection.json** | Postman collection to call the API. |
| **client/** | React (Vite + TypeScript) frontend; build output in **client/dist**. Served at http://localhost:3000 — Viamanta-style (dark blue, orange, Montserrat). Includes start date (default: today). |
| **REQUIREMENTS_CHECKLIST.md** | Shows how each requirement from the case study is satisfied. |
| **INSTALL_NODE.md** | How to install Node.js if you don’t have it. |

---

## How do I run the tests?

Make sure you are in the project folder. You do **not** need to start the server to run tests.

**Run all tests (unit + integration):**

```bash
npm test
```

You should see Jest run the test files and a summary (e.g. “Tests: X passed”).  
To see **coverage** (which lines of code are exercised by tests), the same command already runs with coverage; look for the `coverage/` folder or the table in the output.

**Run tests in watch mode** (re-run when you change code):

```bash
npm run test:watch
```

**Check code style (lint):**

```bash
npm run lint
```

If there are no problems, you’ll see no errors.

---

## Troubleshooting

| Problem | What to try |
|--------|--------------|
| `command not found: npm` or `command not found: node` | Node.js is not installed or not in your PATH. Install Node.js (see [INSTALL_NODE.md](./INSTALL_NODE.md)). On Mac with Homebrew, you can run: `eval "$(/opt/homebrew/bin/brew shellenv)"` and then try again. |
| `npm install` fails (network or permission errors) | Check your internet. Don’t use `sudo` for `npm install`. If you use a corporate network, you may need a proxy. |
| `npm run build` fails | Make sure you ran `npm install` first. If TypeScript reports errors, fix the reported file and line. |
| Server doesn’t start or “address already in use” | Something else is using port 3000. Stop that program, or set a different port: `PORT=3001 npm start`. |
| `curl` returns “Connection refused” | The server is not running. Start it in another terminal with `npm start` and try again. |
| Tests fail (e.g. “Cannot find module”) | Run `npm install` and `npm run build` again. Make sure you’re in the project root folder. |

---

## For evaluators

- **Requirements:** See [REQUIREMENTS_CHECKLIST.md](./REQUIREMENTS_CHECKLIST.md) for a mapping of case-study requirements to the codebase.
- **Run locally:** Prerequisites: Node.js 18+. Then: `npm install` → `npm run build` → `npm start`. Server: http://localhost:3000.
- **Coding standards:** TypeScript strict mode and ES2022 (`tsconfig.json`). ESLint + `@typescript-eslint` for style and consistency (`.eslintrc.cjs`); run `npm run lint`. No Prettier in this repo; formatting is manual/editor-based.
- **Tests:** `npm test` runs **unit tests** (availability rules, validation, 60-day window, working hours) and **integration tests** (real HTTP `POST /api/availability` and `GET /health` with the actual config). Coverage is collected (`jest.config.js`); see `src/availability/availabilityService.test.ts`, `src/api/validation.test.ts`, and `src/api/availability.integration.test.ts`.
- **Linting:** `npm run lint` (ESLint + TypeScript ESLint). Config: `.eslintrc.cjs`.
- **API docs:** [API.md](./API.md) (markdown), [openapi.yaml](./openapi.yaml) (OpenAPI 3.0), [postman_collection.json](./postman_collection.json) (Postman).
- **Architecture, trade-offs, assumptions, AWS:** See the section below.

### Architecture and design (summary)

- **Modular monolith:** Code is split by domain: `domain/` (types), `config/` (load config), `availability/` (slot calculation), `api/` (HTTP and validation), `lambda/` (serverless entry).
- **Config:** `workshops.config.json` is read once and cached; never mutated.
- **Business rules:** One job per bay at a time; jobs ordered by dependencies (e.g. MOT before Brakes); sequential placement; only within working hours and on days the bay supports that job.
- **REST:** Single main endpoint `POST /api/availability`; response includes request summary, per-workshop “can fulfill” / missing list, and per-slot check-in/check-out and schedule.
- **Serverless:** Same logic used by Express and by `src/lambda/handler.ts` for AWS Lambda/API Gateway.

### Trade-offs

- In-memory config: no database; config changes require restart. Acceptable for the scope.
- No pagination on slots: all slots in 60 days returned per workshop; could add limit/offset later.
- Single job ordering: dependency order only; no exploration of all permutations.
- No existing bookings: slots are from config only; a real system would subtract already-booked times.

### Assumptions and limitations

- Single timezone (UTC in code).
- Config shape must match the TypeScript types.
- No authentication (to be added at API Gateway or app layer in production).
- Repair dependency is a single service ID (no complex dependency graph).

### Scaling on AWS

- Run the API via **Lambda + API Gateway** using `src/lambda/handler.ts`.
- Store workshop config in **SSM Parameter Store** or **S3**; load at cold start and cache.
- Add **DynamoDB** (or RDS) for bookings and filter availability by existing bookings.
- Use **ElastiCache (Redis)** or **API Gateway cache** for repeated queries; **CloudWatch** and **X-Ray** for observability; rate limiting at API Gateway.
