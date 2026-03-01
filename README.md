# AURELION — Grid-Entropy Sentinel

Full-stack smart-grid monitoring and simulation platform with:

- Next.js frontend dashboard (real-time telemetry + control views)
- FastAPI backend (REST APIs + WebSocket streams)
- AI insights powered by Anthropic Claude (optional via API key)
- Simulation, defense, forecasting, VPP orchestration, and analytics modules

---

## Overview

AURELION is built for real-time grid observability and resilience testing. It combines a live dashboard, simulated disturbance injection, device/cluster control, and AI-assisted operational summaries for grid events.

### Core capabilities

- Real-time dashboard for grid frequency, latency, device/VPP metrics
- Forecast visualizations (including transformer and solar risk views)
- Defense and attack simulation workflows
- MARL/agent cluster status and override actions
- Event history, analytics summaries, and simulation playback
- Claude-generated insight endpoints for explainability

---

## Tech stack

### Frontend

- Next.js 15
- React 19
- TypeScript
- Tailwind CSS + Radix UI components
- Recharts (data visualizations)
- Zustand (state)

### Backend

- FastAPI
- Uvicorn
- Pydantic
- WebSockets
- scikit-learn, xgboost, numpy (prediction/ML utilities)
- Anthropic SDK (AI insights)

---

## Project structure

```text
AURELION/
├─ src/                     # Next.js app (UI, hooks, client helpers)
│  ├─ app/                  # App Router pages
│  ├─ components/           # UI + domain components
│  ├─ hooks/                # React hooks (WS, AI, etc.)
│  └─ lib/                  # API clients, stores, utilities
├─ backend/
│  ├─ main.py               # FastAPI app, WS channels, router mounting
│  ├─ routers/              # REST route modules
│  └─ services/             # AI, simulation, prediction, defense services
└─ docs/
	 └─ blueprint.md          # Product concept and feature blueprint
```

---

## Prerequisites

- Node.js 20+
- Python 3.10+
- npm (or pnpm/yarn)

---

## Local development setup

### 1) Install frontend dependencies

From project root:

```bash
npm install
```

### 2) Install backend dependencies

From `backend/`:

```bash
pip install -r requirements.txt
```

### 3) Configure environment variables

Create `.env.local` in project root:

```env
NEXT_PUBLIC_FASTAPI_URL=http://localhost:8000
NEXT_PUBLIC_FASTAPI_WS_URL=ws://localhost:8000
```

Create `.env` in `backend/` (optional but recommended):

```env
ANTHROPIC_API_KEY=your_anthropic_key_here
SECRET_KEY=replace_with_a_secure_random_secret
```

Notes:

- If `ANTHROPIC_API_KEY` is missing, AI endpoints return graceful fallback text.
- `SECRET_KEY` has a default in code but should be overridden for non-demo use.

### 4) Run backend

From project root:

```bash
uvicorn backend.main:app --reload --port 8000
```

### 5) Run frontend

From project root:

```bash
npm run dev
```

Default frontend URL: `http://localhost:9002`

---

## Available frontend scripts

- `npm run dev` — start Next.js dev server (port 9002)
- `npm run build` — production build
- `npm run start` — run production build
- `npm run lint` — lint checks
- `npm run typecheck` — TypeScript type checks

---

## Backend API surface

Mounted router prefixes:

- `/api/stats`
- `/api/frequency`
- `/api/forecast`
- `/api/agents`
- `/api/defense`
- `/api/vpp`
- `/api/devices`
- `/api/simulation`
- `/api/analytics`
- `/api/config`
- `/api/events`
- `/api/auth`
- `/api/ai`
- `/api/prediction`

Health endpoints:

- `GET /`
- `GET /health`

### WebSocket channels

- `/ws/grid`
- `/ws/frequency`
- `/ws/solar`
- `/ws/coherence`
- `/ws/simulation`

---

## Main UI sections

The frontend includes routes for:

- Dashboard (`/`)
- Agents (`/agents`)
- Analytics (`/analytics`)
- Assistant (`/assistant`)
- Config (`/config`)
- Defense (`/defense`)
- Devices (`/devices`)
- Forecast (`/forecast`)
- Frequency (`/frequency`)
- History (`/history`)
- Simulation (`/simulation`)
- VPP (`/vpp`)
- Login (`/login`)

---

## Troubleshooting

- Frontend cannot fetch backend:
	- Ensure backend is running on `http://localhost:8000`
	- Check `NEXT_PUBLIC_FASTAPI_URL` and CORS origins
- WebSocket disconnect loops:
	- Verify `NEXT_PUBLIC_FASTAPI_WS_URL` is `ws://localhost:8000`
	- Confirm backend is reachable and not blocked by firewall
- AI insight endpoints return unavailable/error:
	- Set `ANTHROPIC_API_KEY` in `backend/.env`
	- Restart backend after updating env vars

---

## Notes for production hardening

- Replace default auth secret (`SECRET_KEY`)
- Restrict CORS origins to trusted frontend domains
- Add proper auth/user management and token expiry policy
- Use process manager/container orchestration for backend uptime
- Add persistent database-backed storage where needed
