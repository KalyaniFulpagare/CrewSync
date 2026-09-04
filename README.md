# CrewSync

A full-stack (MERN) coordination platform for college club teams — modeled on how clubs like TEDxCCOEW actually run: a **club** has faculty/head coordinators overseeing **standing teams** (Design, PR, Content, ...), each with a team head, co-head, and members. Events belong to a club and pull tasks from these teams. Beyond CRUD, the system actively reasons about **who has capacity**, **which deadlines are colliding**, **which tasks are actually blocking the event**, and **whether the event — or the whole club — is under strain**.

Built as an independent solo project, distinct from a separate group lab submission of a similar idea — this is my own implementation, architecture, and algorithm design.

## The five things this actually computes (not just displays)

1. **Workload-aware task assignment** (per event). Ranks team members by current open-task load, weighting tasks due within 3 days twice as heavily as distant ones.
2. **Deadline conflict detection.** Buckets a member's open tasks by due date and flags any day where combined estimated effort exceeds a realistic daily capacity — catching deadlines that look fine individually but stack into an impossible day.
3. **Critical path scheduling.** Runs the Critical Path Method (topological sort + forward/backward pass over the task dependency DAG) to find the zero-slack chain that actually controls when the event can happen.
4. **Rule-based "at risk" flagging.** Combines % overdue, days since last activity, and stalled critical-path tasks into an explainable On Track / At Risk / Critical status, with the reasons spelled out.
5. **"My Total Load"** — the flagship piece. Aggregates a person's open tasks across *every club they're in*, not just one. A member can look perfectly fine on each individual club's dashboard while being genuinely overloaded once every commitment is counted together — this is the one number no single-club view can ever produce, because it requires seeing across club boundaries.

## Also included

- **Real club hierarchy**: Club → Faculty/Head/Joint-Head Coordinators → standing Teams → Team Head/Co-head/Members, rendered as a live org chart.
- **A persistent hub**: a club-wide chat channel plus one channel per team, with live online/offline presence — separate from per-event discussion threads.
- **Authorization, not just authentication.** Every route that creates or modifies a resource (tasks, events, teams, coordinators) checks that the requester actually belongs to that event/club/team — not just that they're logged in as *someone*.

## Known limitations (stated plainly, not hidden)

- The Critical Path Method works in abstract "hours," not calendar-aware scheduling — it doesn't know about weekends, working hours, or a member's availability windows. Fixable, but out of scope for now.
- MongoDB was the stack constraint (MERN), not the ideal fit for this data's actual shape (club→team→member→task is fairly relational) — this is a deliberate trade-off from the stack choice, not a bug. Referential integrity that a SQL foreign key would give for free is instead enforced at the application layer (see task dependency validation below).

## Two things I found and fixed, not just documented

- **Optimistic locking on task status updates.** Every task update now requires the client to send back the version it last saw (`expectedVersion`); if someone else updated the task in between, the request is rejected with a 409 instead of silently overwriting their change. Tested with two competing updates to confirm the stale one never wins.
- **Task dependency validation.** Creating a task with `dependsOn` now checks that every referenced task actually exists and belongs to the *same event* — without this, a task could reference a deleted task or one from a completely different event and silently corrupt the critical-path calculation. Tested for both a nonexistent ID and a cross-event reference.

## Stack

React (Vite) + Tailwind · Node.js / Express · MongoDB / Mongoose · Socket.IO (live activity feed, chat, and presence) · JWT auth · Jest (all five algorithms have real, verified unit tests — no MongoDB needed to run them)

## Running it locally

**Backend**
```bash
cd backend
npm install
cp .env.example .env      # fill in JWT_SECRET with any long random string
npm run seed                # creates 1 club, 3 coordinators, 3 teams, 1 event, 5 tasks, hub messages
npm run dev                  # http://localhost:5000
```

**Frontend**
```bash
cd frontend
npm install
npm run dev                  # http://localhost:3000
```

Seeded logins (all `password123`): `head@ccoew.edu` (Head Coordinator), `designhead@ccoew.edu`, `prhead@ccoew.edu`, `riya@ccoew.edu`, `meera@ccoew.edu`.

## Tests

```bash
cd backend
npm test
```

The five algorithm test files (`criticalPath`, `workloadAssignment`, `conflictDetector`, `riskScorer`, `clubWorkloadHeatmap`) are pure logic tests — no database needed, run instantly. A few controller-level integration tests use `mongodb-memory-server` and need one-time internet access to download a `mongod` binary on first run.

## What I'd add next

- Drag-and-drop task reordering with automatic critical-path recompute
- Email/push notification when a member crosses into the HIGH workload band
- Read receipts and @mentions in the hub chat

## Run with Docker

1. Copy `backend/.env.example` to `backend/.env` and set a long, private `JWT_SECRET`.
2. Run `docker compose up --build` from the repository root.
3. Open `http://localhost:3000`. MongoDB, the API, frontend, and Socket.IO are wired together by Compose.

`backend/.env` is deliberately ignored by Git. Never commit a real database URI or JWT secret.

## Publish to GitHub

```bash
git init
git add .
git commit -m "feat: complete CrewSync coordination platform"
git branch -M main
git remote add origin https://github.com/YOUR-USERNAME/crewsync.git
git push -u origin main
```

Create the empty GitHub repository first and do not initialize it with a README. Dependencies, production builds, and local secrets are excluded by the included ignore rules.
