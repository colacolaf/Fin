# 01 — Project Scaffold & Monorepo Setup

## What & Why
Init monorepo: `backend/` (FastAPI + SQLAlchemy + SQLite), `frontend/` (Vite + React + TypeScript), `shared/` (types, schemas, constants). Single `package.json` with npm workspaces. One `pyproject.toml` for backend. ESLint + Prettier shared config. Minimal, works-first.

## Files to Create / Modify
```
Fin/
├── backend/
│   ├── pyproject.toml
│   ├── main.py                  # FastAPI app entry
│   ├── config.py                # Settings from env
│   └── __init__.py
├── frontend/
│   ├── package.json
│   ├── vite.config.ts
│   ├── tsconfig.json
│   ├── index.html
│   └── src/
│       ├── main.tsx
│       └── App.tsx
├── shared/
│   ├── package.json
│   └── src/
│       ├── types.ts
│       └── constants.ts
├── package.json                 # npm workspaces root
├── tsconfig.base.json           # shared TS base
├── .eslintrc.cjs
├── .prettierrc
├── .gitignore
└── README.md
```

## Steps
1. Create root `package.json` with `"workspaces": ["frontend", "shared"]`
2. Scaffold `frontend/` via `npm create vite@latest frontend -- --template react-ts`
3. Create `shared/` package (`package.json` with `"name": "@fin/shared"`)
4. Wire `tsconfig.base.json` → `frontend/tsconfig.json` extends it, `shared/tsconfig.json` extends it
5. Add ESLint (`@typescript-eslint`) + Prettier configs at root. Single `.eslintrc.cjs`, single `.prettierrc`
6. Create `backend/` with `pyproject.toml` (FastAPI, uvicorn, SQLAlchemy, Alembic, python-jose, cryptography)
7. Create `backend/main.py` — minimal FastAPI app with health check `GET /api/health`
8. Create `frontend/src/App.tsx` — render "Fin" heading, call `/api/health`
9. Add `backend/config.py` — load DATABASE_URL, SECRET_KEY, ALPACA_API_KEY from `.env`
10. Verify: `cd backend && uvicorn main:app --reload` → `curl localhost:8000/api/health` returns 200
11. Verify: `cd frontend && npm run dev` → browser shows Fin heading + health check response
12. Verify: `npm run lint` passes at root

## Skills to Use
- `subagent-driven-development`
- `code-review-and-quality`
- `superpowers-lab`

## GitHub Repos Needed
- `fastapi/fastapi` (reference patterns)
- `vitejs/vite` (create-vite template)

## Edge Cases & Risks
- npm workspaces hoisting may conflict with frontend deps → verify `npm ls` clean
- Python venv location → use `backend/.venv`, ensure `.gitignore` covers it
- Port conflicts (3000 for Vite, 8000 for FastAPI) → documented in README
- Node version must be ≥18 for npm workspaces

## Done When
- [ ] `npm install` at root installs all workspaces without errors
- [ ] `npm run dev` in frontend starts Vite on :3000
- [ ] `uvicorn backend.main:app` starts FastAPI on :8000
- [ ] `GET /api/health` returns `{"status": "ok"}`
- [ ] Frontend fetches and displays health status
- [ ] `npm run lint` passes (0 errors, 0 warnings)
- [ ] `npm run format` formats all files consistently
- [ ] Git: review diff, squash merge to main with `[01] Project scaffold & monorepo setup`