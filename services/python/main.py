"""
Python Services for Scimus
Handles machine learning and PDF processing tasks
"""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI(
    title="Scimus Python Services",
    description="Machine Learning and PDF Processing Services",
    version="0.1.0",
)

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3001"],  # Main backend
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/")
async def root():
    """Root endpoint."""
    return {
        "service": "Scimus Python Services",
        "version": "0.1.0",
        "endpoints": {
            "ml": "/ml",
            "pdf": "/pdf",
        },
    }


@app.get("/health")
async def health_check():
    """Health check endpoint."""
    return {"status": "healthy"}


# ML endpoints
@app.get("/ml")
async def ml_info():
    """Machine learning service info."""
    return {
        "service": "Machine Learning",
        "status": "ready",
    }


# PDF endpoints
@app.get("/pdf")
async def pdf_info():
    """PDF processing service info."""
    return {
        "service": "PDF Processing",
        "status": "ready",
    }


if __name__ == "__main__":
    import uvicorn

    uvicorn.run(app, host="0.0.0.0", port=8000)
