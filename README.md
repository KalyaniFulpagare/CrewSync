# CrewSync

> A full-stack workspace for college clubs to coordinate teams, plan events, and spot operational risk before a deadline becomes a crisis.

CrewSync is built around the way student organizations actually operate: a club owns standing teams such as Design, PR, and Content; teams contribute to multiple events; and one person can be overloaded across several clubs without any single event dashboard showing the full picture.

It goes beyond task CRUD by making workload, deadline pressure, task dependencies, and project risk visible and actionable.

## Why CrewSync?

Most task boards can tell a club that a task is late. CrewSync helps explain whether the event is at risk, who still has capacity, and what work is blocking the entire plan.

| Problem | CrewSync approach |
| --- | --- |
| Work gets assigned to the same reliable person | Ranks accepted event members by urgency-weighted open workload |
| Individually reasonable deadlines create an impossible day | Detects deadline collisions using estimated effort and daily capacity |
| Teams cannot see what truly delays an event | Computes the Critical Path Method over the task dependency graph |
| Risk labels feel vague | Produces explainable On Track / At Risk / Critical reasons |
| A student is busy across more than one club | Aggregates every open task into a cross-club **My Total Load** view |

## Highlights

- **Kanban event workspace** with drag-and-drop task status changes
- **Workload-aware assignment** that accounts for near-term deadlines
- **Critical-path scheduling** using a topological sort plus forward/backward CPM passes
- **Deadline conflict detection** for overloaded days
- **Explainable event-risk scoring** from overdue work, inactivity, and stalled critical tasks
- **Cross-club workload aggregation** to identify hidden overload
- **Club hierarchy** for coordinators, team heads/co-heads, and members
- **Role-aware controls** for club management, event hosting, member removal, and invitations
- **Real-time collaboration** with Socket.IO chat, activity, comments, and channel presence
- **Task integrity rules**: dependency validation, assignment eligibility, and optimistic status-update locking
- **Docker-ready** local stack: React frontend, Express API, and MongoDB

## Product flow

```text
Club
 ├─ Coordinators
 ├─ Standing teams (Design / PR / Content / ...)
 │   └─ Heads, co-heads, and members
 └─ Events
     ├─ Task board + dependencies
     ├─ Workload and deadline signals
     ├─ Critical path + risk status
     └─ Members, activity, comments, and discussion
```

## Tech stack

| Layer | Tools |
| --- | --- |
| Frontend | React, Vite, Tailwind CSS, React Router, Axios, Lucide |
| Backend | Node.js, Express, Mongoose |
| Database | MongoDB |
| Real time | Socket.IO |
| Security | JWT, Helmet, rate limiting, role/membership authorization |
| Testing | Jest, Supertest, mongodb-memory-server |
| Local deployment | Docker Compose, Nginx |

## Core logic worth discussing

### Workload-aware assignment

Open tasks are weighted by estimated hours. Tasks due within the next three days count twice, so the assignment ranking favours people with real near-term capacity instead of only counting task totals.

### Critical path

Task dependencies form a directed acyclic graph. CrewSync validates dependencies at creation time, runs a topological sort, then applies forward and backward passes to calculate earliest start, latest start, slack, and zero-slack critical tasks.

### Risk scoring

An event is rated **On Track**, **At Risk**, or **Critical** using concrete signals:

- Percentage of open tasks overdue
- Time since the latest meaningful activity
- Incomplete tasks on the critical path

The UI shows the reasons, not just a colour or generic warning.

### Data integrity and authorization

- A task may depend only on tasks from its own event.
- Dependent work cannot start or complete until prerequisites are done.
- A task can only be assigned to an accepted event member.
- Task status changes use optimistic locking (`expectedVersion`) to prevent silent stale overwrites.
- Event comments, activity, channels, and Socket.IO rooms require appropriate membership.

## Getting started

### Prerequisites

- Node.js 20+
- MongoDB running locally, or Docker Desktop

### Run locally

1. Start MongoDB locally on port `27017`.
2. Configure and start the API:

```bash
cd backend
cp .env.example .env
# Set a long random JWT_SECRET in .env
npm install
npm run seed
npm run dev
```

3. Start the frontend in a second terminal:

```bash
cd frontend
npm install
npm run dev
```

Open `http://localhost:3000`.

### Seeded accounts

All seeded accounts use `password123`.

| Account | Role / useful view |
| --- | --- |
| `head@ccoew.edu` | Head coordinator; full club and event management |
| `designhead@ccoew.edu` | Design head; demonstrates cross-club load |
| `prhead@ccoew.edu` | PR head; demonstrates pending team invitation |
| `meera@ccoew.edu` | Demonstrates pending event invitation |
| `riya@ccoew.edu` | Team member view |

## Run with Docker

1. Copy `backend/.env.example` to `backend/.env` and set a private `JWT_SECRET`.
2. From the project root, run:

```bash
docker compose up --build
```

3. Open `http://localhost:3000`.

Docker Compose starts MongoDB, the API, and an Nginx-served production frontend. API and Socket.IO traffic are proxied through the frontend container.

## Tests

```bash
cd backend
npm test
```

The test suite covers the scheduling and workload algorithms plus API-level integrity scenarios, including optimistic locking, invalid dependencies, cross-event dependencies, assignment eligibility, and dependency-status enforcement.

## Current limitations

- Critical-path timing is based on abstract estimated hours, not calendars, weekends, or individual availability windows.
- MongoDB was selected for the MERN stack; relationships and referential integrity are therefore enforced at the application layer rather than through SQL foreign keys.

## Future direction

- Availability-aware, calendar-based scheduling
- Notification delivery when workload becomes high or an invitation arrives
- Read receipts and mentions in team chat
- Analytics and reporting across a club semester

## Author

Built independently by [Kalyani Fulpagare](https://github.com/KalyaniFulpagare).
