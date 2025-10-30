# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Scimus is a TypeScript monorepo web application with Python microservices for ML and PDF processing. The architecture separates concerns:
- **TypeScript apps** (frontend + backend) handle web UI and general API operations
- **Python services** handle CPU-intensive tasks (ML inference, PDF processing)
- **Shared types** ensure type safety across the monorepo

## Development Commands

### Root-level Commands (from project root)
```bash
bun install               # Install all dependencies for monorepo
bun dev                   # Run frontend + backend in parallel
bun dev:frontend          # Run only frontend (port 5173)
bun dev:backend           # Run only backend (port 3001)
bun build                 # Build all apps
bun lint                  # Lint all apps
bun typecheck             # Type check all apps
```

### Frontend (apps/frontend)
```bash
cd apps/frontend
bun dev                   # Dev server (http://localhost:5173)
bun build                 # Production build
bun preview               # Preview production build
bun storybook             # Run Storybook (http://localhost:6006)
bun build-storybook       # Build Storybook
bun typecheck             # Type check only
bun lint                  # Lint only
```

### Backend (apps/backend)
```bash
cd apps/backend
bun run dev               # Dev server with watch mode (http://localhost:3001)
bun run build             # Production build
bun run start             # Run production build
bun run typecheck         # Type check only

# Database commands (Drizzle ORM)
bun run db:generate       # Generate migration from schema changes
bun run db:push           # Apply schema changes directly (dev)
bun run db:migrate        # Apply migrations (production)
bun run db:studio         # Open Drizzle Studio GUI
```

### Python Services (services/python)
```bash
cd services/python
uv sync                   # Install dependencies (creates venv automatically)
uv run python main.py     # Run service (http://localhost:8000)
uv run uvicorn main:app --reload --port 8000  # Run with auto-reload

# API documentation available at http://localhost:8000/docs
```

## Architecture

### Monorepo Structure
- `apps/frontend/` - React + Vite + TypeScript + Tailwind + shadcn/ui
- `apps/backend/` - Bun + Hono + Drizzle ORM + SQLite
- `packages/shared-types/` - Shared TypeScript types for type-safe communication
- `services/python/` - FastAPI microservices (ML + PDF)

### Type Sharing Pattern
The frontend and backend share types via the `@scimus/shared-types` package:
- Types defined in `packages/shared-types/src/index.ts`
- Frontend imports: `import { User, ApiResponse } from '@scimus/shared-types'`
- Backend can import the same types for consistency
- Update shared types when adding new API endpoints or data structures

### Database Pattern (Drizzle ORM)
- Schema defined in `apps/backend/src/db/schema.ts`
- Uses SQLite with timestamp fields stored as Unix epoch integers
- Schema changes workflow:
  1. Modify `schema.ts`
  2. Run `bun run db:generate` to create migration (production)
  3. OR run `bun run db:push` to apply directly (development)
- Type inference: `typeof users.$inferSelect` for select, `$inferInsert` for inserts
- Database file: `apps/backend/sqlite.db` (git-ignored)

### Backend Architecture (Hono)
- Entry point: `apps/backend/src/index.ts`
- Hono app with CORS configured for `localhost:5173` and `localhost:3000`
- Route structure: `/api/v1/...` for API endpoints
- Health check available at `/health`
- Uses middleware: logger, cors

### Python Services Communication
- Python services run independently on port 8000
- TypeScript backend calls Python services via HTTP when needed
- Python service CORS configured to accept requests from port 3001
- Service structure:
  - `main.py` - FastAPI app entry point
  - `ml/` - Machine learning endpoints
  - `pdf/` - PDF processing endpoints
  - `common/` - Shared utilities

### Package Manager Details
- **Bun** with workspaces for entire TypeScript monorepo (replaces pnpm/npm)
- **Bun** as runtime for backend
- **uv** for Python dependency management (not pip/poetry/venv)
- Workspace protocol: `"@scimus/shared-types": "workspace:*"` in package.json

## Key Technology Decisions

### Why Bun?
- **All-in-one tool**: Runtime, bundler, package manager, and test runner
- Fast JavaScript runtime with built-in TypeScript support
- Native workspace support for monorepos (no need for pnpm/npm)
- Compatible with Node.js APIs but significantly faster
- Single tool eliminates complexity: no need for multiple package managers

### Why uv for Python?
- Extremely fast Python package installer and resolver
- Automatic virtual environment management
- Rust-based, replaces pip/poetry/venv
- Commands: `uv sync` (install), `uv run` (execute in venv)

### Why Drizzle ORM?
- TypeScript-first ORM with excellent type inference
- SQL-like syntax, not abstracted magic
- Type-safe query builder
- Lightweight compared to Prisma or TypeORM

### Frontend: Vite + React + Tailwind + shadcn/ui
- Vite for fast dev server and build
- React 19 with TypeScript
- Tailwind v4 for styling
- shadcn/ui for accessible component primitives (not a package, copied to codebase)
- Storybook for component development

## Development Workflow

### Adding a New API Endpoint
1. Define types in `packages/shared-types/src/index.ts`
2. If database-backed, update schema in `apps/backend/src/db/schema.ts`
3. Run `bun run db:push` in `apps/backend` (dev) or `db:generate` + `db:migrate` (prod)
4. Implement endpoint in `apps/backend/src/index.ts`
5. Use shared types in frontend for API calls

### Adding a Python Service Feature
1. Create new endpoint in `services/python/main.py` or subdirectories
2. TypeScript backend calls Python service via HTTP: `fetch('http://localhost:8000/...')`
3. Consider adding shared error handling patterns

### Working with Shared Components (Frontend)
- Components likely use shadcn/ui pattern (copied, not installed)
- Check `apps/frontend/src/lib/` for utility functions (e.g., `cn()` for class merging)
- Storybook available for isolated component development

### Database Migrations
- **Development**: Use `bun run db:push` for quick schema iteration
- **Production**: Use `bun run db:generate` then `bun run db:migrate`
- Migrations stored in `apps/backend/drizzle/` directory

## Port Assignments
- `5173` - Frontend dev server (Vite)
- `3001` - Backend API (Bun + Hono)
- `6006` - Storybook
- `8000` - Python services (FastAPI)

## Important Notes
- **Bun only**: This project uses Bun for all JavaScript/TypeScript package management and runtime
  - Use `bun install` not `npm install` or `pnpm install`
  - Use `bun dev` not `npm run dev` or `pnpm dev`
  - No need for Node.js or pnpm
- **Python uses uv**: Use `uv sync` and `uv run`, not pip or poetry
- **Workspace packages**: Shared types use `workspace:*` protocol (works with Bun)
- **SQLite**: Database is local and git-ignored
- **CORS**: Configured for local development ports only
