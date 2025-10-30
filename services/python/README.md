# Python Services

Python-based microservices for machine learning and PDF processing tasks.

## Structure

```
services/python/
├── ml/              # Machine learning models and services
├── pdf/             # PDF processing utilities
├── common/          # Shared utilities
├── main.py          # FastAPI application
├── pyproject.toml   # Project configuration and dependencies
└── uv.lock          # Locked dependencies
```

## Prerequisites

- [uv](https://github.com/astral-sh/uv) - Fast Python package installer and resolver

Install uv:
```bash
curl -LsSf https://astral.sh/uv/install.sh | sh
```

## Setup

uv automatically manages virtual environments and dependencies:

```bash
# Install dependencies (creates .venv automatically)
uv sync

# Or manually activate the virtual environment
source .venv/bin/activate  # On Windows: .venv\Scripts\activate
```

## Development

```bash
# Start the service using uv
uv run python main.py

# Or with uvicorn directly
uv run uvicorn main:app --reload --port 8000

# Add new dependencies
uv add package-name

# Add dev dependencies
uv add --dev package-name
```

The service will be available at http://localhost:8000

## API Documentation

Once running, visit:

- Swagger UI: http://localhost:8000/docs
- ReDoc: http://localhost:8000/redoc

## Communication with Main Backend

This service is designed to be called by the main TypeScript backend (Bun + Hono) for CPU-intensive tasks like:

- Machine learning inference
- PDF generation and parsing
- Image processing
- Data analysis

The main backend runs on port 3001, this service runs on port 8000.
