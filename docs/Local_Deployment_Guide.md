# Local Deployment Guide

> One script. Fully local. No cloud.

---

## Quick Start

```bash
git clone https://github.com/colacolaf/Fin.git && cd Fin
chmod +x setup.sh && ./setup.sh
```

Opens `http://localhost:3000` when done.

---

## What `setup.sh` Does

```
1. Check dependencies (python3.11+, node20+, git, curl)
2. Install Ollama → pull configured model
3. Create Python venv → pip install -r requirements.txt
4. Init SQLite DB (data/fin.db)
5. Init basic-memory directory (data/memory/)
6. Generate self-signed certs for local HTTPS (optional)
7. Start FastAPI backend (port 8000)
8. Start React frontend (port 3000)
9. Open browser
```

---

## Prerequisites

| Dependency | macOS | Linux (apt) | Check |
|-----------|-------|-------------|-------|
| Python 3.11+ | `brew install python@3.11` | `sudo apt install python3.11` | `python3 --version` |
| Node.js 20+ | `brew install node` | `curl -fsSL https://deb.nodesource.com/setup_20.x \| sudo -E bash - && sudo apt install nodejs` | `node --version` |
| Git | `brew install git` | `sudo apt install git` | `git --version` |
| Ollama | `brew install ollama` | `curl -fsSL https://ollama.com/install.sh \| sh` | `ollama --version` |
| SQLite3 | Built-in | `sudo apt install sqlite3` | `sqlite3 --version` |

---

## Hardware Requirements

### Tier 1: MVP (Mistral 7B)

| Component | Minimum | Recommended |
|-----------|---------|-------------|
| RAM | 8 GB | 16 GB |
| VRAM (GPU) | None (CPU-only OK) | 6 GB (GTX 1660 / M1) |
| Storage | 10 GB | 20 GB |
| Model size | ~4 GB | — |
| Inference speed | 5–15 tok/s (CPU) | 30–50 tok/s (GPU) |

Good for: development, testing, low-resource machines. All features work. Responses slower but functional.

```
Model: mistral:7b
RAM usage: ~4 GB
```

### Tier 2: Best Quality (Qwen 2.5 32B / Qwen 3.6 35B)

| Component | Minimum | Recommended |
|-----------|---------|-------------|
| RAM | 24 GB | 32 GB |
| VRAM (GPU) | 8 GB (RTX 3070 / M2 Pro) | 16 GB (RTX 4080 / M3 Max) |
| Storage | 30 GB | 50 GB |
| Model size | ~20 GB | — |
| Inference speed | 3–8 tok/s (CPU) | 25–40 tok/s (GPU) |

Good for: daily use, high-quality recommendations. Fast enough for interactive chat.

```
Model: qwen2.5:32b   (or qwen3:35b when available)
RAM usage: ~20 GB
```

### Tier 3: Best Reasoning (DeepSeek-R1 70B)

| Component | Minimum | Recommended |
|-----------|---------|-------------|
| RAM | 48 GB | 64 GB |
| VRAM (GPU) | 16 GB (RTX 4080 / M3 Max) | 24 GB (RTX 4090 / dual GPU) |
| Storage | 60 GB | 100 GB |
| Model size | ~45 GB | — |
| Inference speed | 1–4 tok/s (CPU) | 10–25 tok/s (GPU) |

Good for: max-quality financial reasoning, complex multi-step analysis. CPU-only viable if you have 64GB RAM and patience.

```
Model: deepseek-r1:70b
RAM usage: ~45 GB
```

---

## `setup.sh`

```bash
#!/usr/bin/env bash
set -euo pipefail

# ── config ──────────────────────────────────────────────
MODEL="${FIN_MODEL:-mistral:7b}"   # override: FIN_MODEL=qwen2.5:32b ./setup.sh
FIN_DIR="$(cd "$(dirname "$0")" && pwd)"
VENV="$FIN_DIR/.venv"
DATA_DIR="$FIN_DIR/data"

RED='\033[0;31m'; GREEN='\033[0;32m'; NC='\033[0m'
log()  { echo -e "${GREEN}[fin]${NC} $*"; }
warn() { echo -e "${RED}[fin]${NC} $*"; }
die()  { warn "$*"; exit 1; }

# ── os detection ────────────────────────────────────────
case "$(uname -s)" in
    Darwin)  OS="macos"  ;;
    Linux)   OS="linux"  ;;
    *)       die "Unsupported OS: $(uname -s). macOS or Linux required." ;;
esac
log "OS: $OS"

# ── dependency checks ───────────────────────────────────
command -v python3 >/dev/null || die "python3 not found. Install Python 3.11+."
command -v node    >/dev/null || die "node not found. Install Node.js 20+."
command -v npm     >/dev/null || die "npm not found."

PY_VER=$(python3 -c 'import sys; print(f"{sys.version_info.major}.{sys.version_info.minor}")')
MAJOR=$(echo "$PY_VER" | cut -d. -f1)
MINOR=$(echo "$PY_VER" | cut -d. -f2)
[ "$MAJOR" -ge 3 ] && [ "$MINOR" -ge 11 ] || die "Python 3.11+ required, found $PY_VER"
log "Python $PY_VER ✓"
log "Node $(node --version) ✓"

# ── ollama ──────────────────────────────────────────────
if ! command -v ollama >/dev/null; then
    log "Installing Ollama..."
    case "$OS" in
        macos) brew install ollama ;;
        linux) curl -fsSL https://ollama.com/install.sh | sh ;;
    esac
fi

# Start ollama server if not running
if ! pgrep -f "ollama serve" >/dev/null; then
    log "Starting Ollama server..."
    ollama serve &
    sleep 3  # wait for server
fi

# Pull model
log "Pulling model: $MODEL"
ollama pull "$MODEL" || warn "Model pull failed. Run 'ollama pull $MODEL' manually."
log "Ollama ready ✓"

# ── python venv ─────────────────────────────────────────
if [ ! -d "$VENV" ]; then
    python3 -m venv "$VENV"
    log "venv created ✓"
fi
source "$VENV/bin/activate"

# ── backend dependencies ────────────────────────────────
log "Installing Python dependencies..."
pip install -q --upgrade pip
pip install -q \
    fastapi uvicorn[standard] \
    httpx \
    pydantic pydantic-settings \
    sqlalchemy \
    apscheduler \
    cryptography \
    python-multipart \
    python-jose[cryptography] \
    passlib[bcrypt]
log "Python deps installed ✓"

# ── frontend dependencies ───────────────────────────────
log "Installing frontend dependencies..."
cd "$FIN_DIR/frontend" 2>/dev/null || { warn "No frontend/ directory. Skipping frontend setup."; }
npm install --silent 2>/dev/null || warn "npm install failed. Run manually."
cd "$FIN_DIR"

# ── data directories ────────────────────────────────────
mkdir -p "$DATA_DIR"
mkdir -p "$DATA_DIR/memory/agent_memory/debt"
mkdir -p "$DATA_DIR/memory/agent_memory/investment"
mkdir -p "$DATA_DIR/memory/agent_memory/retirement"

# Init SQLite if not exists
if [ ! -f "$DATA_DIR/fin.db" ]; then
    sqlite3 "$DATA_DIR/fin.db" "
        CREATE TABLE IF NOT EXISTS users (
            id TEXT PRIMARY KEY,
            email TEXT UNIQUE,
            hashed_password TEXT,
            created_at TEXT DEFAULT (datetime('now'))
        );
        CREATE TABLE IF NOT EXISTS recommendations (
            id TEXT PRIMARY KEY,
            user_id TEXT,
            agent TEXT,
            action TEXT,
            confidence REAL,
            rationale TEXT,
            skills_used TEXT,
            created_at TEXT DEFAULT (datetime('now')),
            FOREIGN KEY (user_id) REFERENCES users(id)
        );
        CREATE TABLE IF NOT EXISTS votes (
            id TEXT PRIMARY KEY,
            recommendation_id TEXT,
            user_id TEXT,
            vote TEXT CHECK(vote IN ('helpful','not_helpful','defer')),
            created_at TEXT DEFAULT (datetime('now')),
            FOREIGN KEY (recommendation_id) REFERENCES recommendations(id)
        );
    "
    log "SQLite DB initialized ✓"
fi

# Init user_profile.json if not exists
if [ ! -f "$DATA_DIR/user_profile.json" ]; then
    cat > "$DATA_DIR/user_profile.json" << 'EOF'
{
  "age": null, "income_gross": null, "employment_status": null,
  "state": null, "federal_tax_bracket": null, "state_tax_bracket": null,
  "risk_tolerance": null, "time_horizon": null,
  "portfolio": { "total_value": 0, "holdings": [], "accounts": [] },
  "debts": [], "retirement_accounts": [], "goals": []
}
EOF
    log "user_profile.json created ✓"
fi

# Init past_decisions.json if not exists
if [ ! -f "$DATA_DIR/past_decisions.json" ]; then
    echo '[]' > "$DATA_DIR/past_decisions.json"
    log "past_decisions.json created ✓"
fi

# ── environment config ──────────────────────────────────
if [ ! -f "$FIN_DIR/.env" ]; then
    cat > "$FIN_DIR/.env" << EOF
# Fin local deployment config
FIN_ENV=local
FIN_DATA_DIR=$DATA_DIR
FIN_OLLAMA_MODEL=$MODEL
FIN_OLLAMA_HOST=http://localhost:11434
FIN_DB_PATH=$DATA_DIR/fin.db
FIN_SECRET_KEY=$(python3 -c 'import secrets; print(secrets.token_hex(32))')
FIN_AUTH_ENABLED=false
EOF
    log ".env created ✓"
fi

# ── start services ──────────────────────────────────────
log "Starting FastAPI backend (port 8000)..."
cd "$FIN_DIR"
uvicorn main:app --host 0.0.0.0 --port 8000 --reload &
BACKEND_PID=$!
sleep 2

log "Starting React frontend (port 3000)..."
cd "$FIN_DIR/frontend" 2>/dev/null && npm run dev -- --port 3000 &
FRONTEND_PID=$!
cd "$FIN_DIR"

log ""
log "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
log " Fin running locally"
log " Frontend:  http://localhost:3000"
log " Backend:   http://localhost:8000"
log " API Docs:  http://localhost:8000/docs"
log " Model:     $MODEL"
log "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
log ""
log "Stop: kill $BACKEND_PID $FRONTEND_PID"
log ""

wait
```

Save as `setup.sh` in repo root.

---

## Manual Steps (if script fails)

```bash
# 1. Python backend
python3 -m venv .venv && source .venv/bin/activate
pip install fastapi uvicorn httpx pydantic pydantic-settings sqlalchemy apscheduler cryptography
uvicorn main:app --reload

# 2. Frontend
cd frontend && npm install && npm run dev

# 3. Ollama (separate terminal)
ollama serve
ollama pull mistral:7b
```

---

## Directory Layout After Setup

```
Fin/
├── setup.sh
├── .env
├── .venv/
├── data/
│   ├── fin.db                 # SQLite
│   ├── user_profile.json      # Onboarding output
│   ├── past_decisions.json    # Vote history
│   └── memory/
│       └── agent_memory/
│           ├── debt/           # Debt agent chat turns
│           ├── investment/     # Investment agent chat turns
│           └── retirement/     # Retirement agent chat turns
├── backend/
│   ├── main.py                # FastAPI entry
│   ├── routers/               # API routes
│   ├── agents/                # Agent orchestration
│   ├── connectors/            # Alpaca/Plaid/Finnhub
│   └── prompts/               # System prompts
└── frontend/
    ├── src/                   # React app
    └── public/
```

---

## Configuration

All config via `.env`:

| Variable | Default | Description |
|----------|---------|-------------|
| `FIN_ENV` | `local` | Deployment mode |
| `FIN_DATA_DIR` | `./data` | Data directory |
| `FIN_OLLAMA_MODEL` | `mistral:7b` | Model name in Ollama |
| `FIN_OLLAMA_HOST` | `http://localhost:11434` | Ollama API |
| `FIN_DB_PATH` | `./data/fin.db` | SQLite path |
| `FIN_SECRET_KEY` | auto-generated | JWT signing key |
| `FIN_AUTH_ENABLED` | `false` | Skip Ory Kratos locally |

---

## Switching Models

```bash
# Stop Fin, pull new model, restart
ollama pull qwen2.5:32b
FIN_MODEL=qwen2.5:32b ./setup.sh

# Or edit .env:
# FIN_OLLAMA_MODEL=qwen2.5:32b
```

---

## Verification

```bash
# Backend health
curl http://localhost:8000/health
# → {"status": "ok", "model": "mistral:7b"}

# Chat test
curl -X POST http://localhost:8000/api/chat \
  -H "Content-Type: application/json" \
  -d '{"message": "Hello", "user_context": {"age": 30}}'
# → {"agent": "general", "response": "..."}

# Frontend
open http://localhost:3000
```

---

## What's Skipped (Cloud-Free)

| Feature | Local Alternative |
|---------|------------------|
| Ory Kratos (auth) | `FIN_AUTH_ENABLED=false` — single local user |
| Plaid/Alpaca/Finnhub | Manual portfolio entry via setup wizard |
| Community benchmarks | Disabled locally (Phase 2, needs server) |
| HTTPS certs | HTTP on localhost (add self-signed via `mkcert` if needed) |
| Docker | Not needed — bare metal is simpler for local-only |

---

## Troubleshooting

| Problem | Fix |
|---------|-----|
| `ollama: command not found` | Install Ollama: `brew install ollama` or `curl -fsSL https://ollama.com/install.sh \| sh` |
| Model pull timeout | Run `ollama pull mistral:7b` manually, retry |
| Port 8000 in use | `lsof -ti:8000 \| xargs kill -9` |
| Port 3000 in use | `lsof -ti:3000 \| xargs kill -9` |
| Out of memory (OOM) | Use smaller model: `FIN_MODEL=mistral:7b ./setup.sh` |
| Python version too old | `brew install python@3.11` or `sudo apt install python3.11` |
| `npm install` fails | `rm -rf node_modules && npm cache clean --force && npm install` |
| Backend starts but no responses | Check Ollama: `curl http://localhost:11434/api/tags` |