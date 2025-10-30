# Python Services

Python-based microservices for machine learning and PDF processing tasks.

## Structure

```
services/python/
├── ml/              # Machine learning models and services
├── pdf/             # PDF processing utilities
├── common/          # Shared utilities
├── main.py          # FastAPI application
└── requirements.txt
```

## Setup

### Create virtual environment

```bash
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
```

### Install dependencies

```bash
pip install -r requirements.txt
```

## Development

```bash
# Start the service
python main.py

# Or with uvicorn directly
uvicorn main:app --reload --port 8000
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
