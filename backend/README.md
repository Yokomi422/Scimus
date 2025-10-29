# Scimus Backend

FastAPI backend for the Scimus application.

## Setup

### Using pip

```bash
pip install -r requirements.txt
```

### Using Poetry

```bash
poetry install
```

## Running the Server

### Development

```bash
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

Or with Poetry:

```bash
poetry run uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

## API Documentation

Once the server is running, visit:

- Swagger UI: http://localhost:8000/docs
- ReDoc: http://localhost:8000/redoc

## Project Structure

```
backend/
├── app/
│   ├── __init__.py
│   └── main.py
├── .env.example
├── requirements.txt
├── pyproject.toml
└── README.md
```
