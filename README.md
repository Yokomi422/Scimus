# Scimus

A modern TypeScript monorepo web application with Python microservices for ML and PDF processing.

## Tech Stack

### Frontend

- **Vite** - Fast build tool and dev server
- **React** - UI library with TypeScript
- **Tailwind CSS** - Utility-first CSS framework
- **shadcn/ui** - Re-usable components built with Radix UI and Tailwind
- **Storybook** - Component development and documentation

### Backend (TypeScript)

- **Bun** - Fast JavaScript runtime and package manager
- **Hono** - Ultrafast web framework
- **Drizzle ORM** - TypeScript ORM with excellent type safety
- **SQLite** - Lightweight, serverless database

### Python Services

- **FastAPI** - Modern Python web framework for microservices
- **Python ML/PDF** - Machine learning and PDF processing services

### Monorepo

- **Bun workspaces** - Fast, efficient monorepo package management
- **Shared types** - Type-safe communication between frontend and backend

## Project Structure

```
Scimus/
├── apps/
│   ├── frontend/              # React + Vite + TypeScript
│   │   ├── src/
│   │   ├── .storybook/        # Storybook configuration
│   │   └── package.json
│   └── backend/               # Bun + Hono + Drizzle
│       ├── src/
│       │   ├── db/            # Database schema and connection
│       │   └── index.ts       # Main application
│       ├── drizzle.config.ts
│       └── package.json
├── packages/
│   └── shared-types/          # Shared TypeScript types
│       └── src/
│           └── index.ts
├── services/
│   └── python/                # Python microservices
│       ├── ml/                # Machine learning
│       ├── pdf/               # PDF processing
│       ├── main.py
│       └── requirements.txt
├── pnpm-workspace.yaml
├── package.json
└── README.md
```

## Getting Started

### Prerequisites

- [Bun](https://bun.sh) >= 1.0
- [uv](https://github.com/astral-sh/uv) - Fast Python package installer (for Python services)

### Installation

```bash
# Install all dependencies (uses Bun workspaces)
bun install
```

### Development

#### Run all services

```bash
# Run frontend and backend in parallel
bun dev
```

#### Run individually

```bash
# Frontend (http://localhost:5173)
bun dev:frontend

# Backend (http://localhost:3001)
bun dev:backend

# Storybook (http://localhost:6006)
cd apps/frontend && bun storybook
```

#### Python Services

```bash
cd services/python

# Install dependencies (uv manages virtual environment automatically)
uv sync

# Run service (http://localhost:8000)
uv run python main.py

# Or run with uvicorn
uv run uvicorn main:app --reload --port 8000
```

## Database

### Setup SQLite database

```bash
cd apps/backend

# Generate migration
bun run db:generate

# Apply migration
bun run db:push

# Open Drizzle Studio (database GUI)
bun run db:studio
```

## API Endpoints

### Main Backend (Bun + Hono)

- Health check: `GET http://localhost:3001/health`
- API v1: `GET http://localhost:3001/api/v1`

### Python Services

- Health check: `GET http://localhost:8000/health`
- ML service: `GET http://localhost:8000/ml`
- PDF service: `GET http://localhost:8000/pdf`
- API docs: http://localhost:8000/docs

## Development Commands

### Root

```bash
bun dev               # Run all apps in parallel
bun build             # Build all apps
bun lint              # Lint all apps
bun typecheck         # Type check all apps
```

### Frontend

```bash
cd apps/frontend
bun dev               # Development server
bun build             # Build for production
bun preview           # Preview production build
bun storybook         # Run Storybook
bun typecheck         # Type check
```

### Backend

```bash
cd apps/backend
bun run dev           # Development server with watch mode
bun run build         # Build for production
bun run start         # Run production build
bun run typecheck     # Type check
bun run db:generate   # Generate database migration
bun run db:push       # Apply database migration
bun run db:studio     # Open Drizzle Studio
```

## Architecture

This project uses a **monorepo architecture** with **TypeScript-first** approach:

1. **Bun workspaces** manage all TypeScript packages (frontend, backend, shared-types)
2. **Frontend and Backend share types** via `@scimus/shared-types` package
3. **Main API** (TypeScript/Bun) handles web requests and database operations
4. **Python Services** handle CPU-intensive tasks:
   - Machine learning inference
   - PDF generation and parsing
   - Image processing
   - Data analysis

The TypeScript backend communicates with Python services via HTTP when needed.

## License

MIT
