# CrewSync

Full-stack coordination platform for college clubs — teams, events, task boards, deadlines, recruitment, and real-time chat, with a role hierarchy that mirrors how clubs actually run (Faculty Admin → Faculty Coordinator → Head/Joint Head → Team Leads → Members).

**Live demo:** [crewsync-web.onrender.com](https://crewsync-web.onrender.com) · Login: `head@ccoew.edu` / `password123`

## Features

- **Kanban task board** with drag-and-drop status changes and dependency tracking
- **Critical path scheduling** — topological sort + forward/backward CPM pass to flag the tasks actually blocking an event
- **Workload-aware assignment** and cross-club load aggregation, so no one silently ends up overbooked across multiple clubs
- **Deadline conflict detection** — flags a member with too many hours due on the same day
- **Explainable event risk scoring** (On Track / At Risk / Critical) with concrete reasons, not just a colour
- **Three-tier role system** — platform, club, and team-level authority, each scoped to what that role should actually be able to do (e.g. a team lead can only assign tasks within their own team; a Faculty Coordinator can view but not operate)
- **Recruitment pipeline** with a full application funnel (Applied → Shortlisted → Interview → Selected), scoped so team leads only review their own team's applicants
- **Real-time chat & activity feed** via Socket.IO, authenticated and membership-scoped per club/team channel
- Hardened against NoSQL injection, regex-based ReDoS, and role-based privilege escalation

## Tech Stack

**Frontend:** React, Vite, Tailwind CSS, React Router, Axios
**Backend:** Node.js, Express, MongoDB (Mongoose)
**Real-time:** Socket.IO
**Auth/Security:** JWT, Helmet, rate limiting, request sanitization
**Testing:** Jest, mongodb-memory-server
**Deployment:** Render (API + static site), Docker Compose for local dev

## Getting Started

```bash
# Backend
cd backend
cp .env.example .env   # set MONGO_URI and a long random JWT_SECRET
npm install
npm run seed
npm run dev

# Frontend (new terminal)
cd frontend
npm install
npm run dev
```

Open `http://localhost:3000`. Seeded accounts (all `password123`):

| Account | Role |
| --- | --- |
| `admin@ccoew.edu` | Faculty Admin — approves new clubs |
| `faculty@ccoew.edu` | Faculty Coordinator — view-only club oversight |
| `head@ccoew.edu` | Head Coordinator — full club/event management |
| `designhead@ccoew.edu` | Team Head — scoped task assignment & recruitment review |
| `riya@ccoew.edu` | Team member |

Or run everything with Docker: `docker compose up --build` (after setting `backend/.env`).

## Testing

```bash
cd backend && npm test
```

Covers scheduling/workload algorithms and API integrity: optimistic locking, dependency validation, assignment eligibility.

## Deployment

Deploys to Render via the included `render.yaml` blueprint (MongoDB Atlas + Render Web Service + Render Static Site). See `render.yaml` for the exact service config.

## Roadmap

- Calendar-based, availability-aware scheduling
- Push notifications for high workload / new invites
- Per-user rate limiting across all write endpoints

---

Built by [Kalyani Fulpagare](https://github.com/KalyaniFulpagare)
