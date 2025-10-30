# Scimus Backend

Bun + Hono backend for the Scimus application.

## Tech Stack

- **Bun** - Fast JavaScript runtime
- **Hono** - Ultrafast web framework
- **Drizzle ORM** - TypeScript ORM for SQLite
- **SQLite** - Lightweight database

## Setup

```bash
# Install dependencies
bun install

# Generate database schema
bun run db:generate

# Run migrations
bun run db:push
```

## Development

```bash
# Start development server with watch mode
bun run dev
```

The server will be available at http://localhost:3001

## Database

### Generate migration

```bash
bun run db:generate
```

### Apply migrations

```bash
bun run db:push
```

### Open Drizzle Studio

```bash
bun run db:studio
```

## API Documentation

- Health check: `GET /health`
- API v1: `GET /api/v1`

## Project Structure

```
apps/backend/
├── src/
│   ├── db/
│   │   ├── schema.ts      # Database schema
│   │   └── index.ts       # Database connection
│   └── index.ts           # Main application
├── drizzle/               # Generated migrations
├── drizzle.config.ts      # Drizzle configuration
├── tsconfig.json
└── package.json
```
