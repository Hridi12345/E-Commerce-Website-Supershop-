import os
from pathlib import Path
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

from database import engine, SessionLocal, Base
import models
from seed_data import seed_database
from config import UPLOAD_DIR

from routers import (
    auth_routes,
    product_routes,
    inventory_routes,
    order_routes,
    customer_routes,
    marketing_routes,
    analytics_routes,
    content_routes,
    settings_routes
)

# Initialize database schema
Base.metadata.create_all(bind=engine)

# Run seed data
db_session = SessionLocal()
try:
    seed_database(db_session)
finally:
    db_session.close()

app = FastAPI(
    title="SuShop E-Commerce & Admin API",
    description="High-throughput E-Commerce Storefront & Admin Back Office API built with FastAPI and MySQL/SQLAlchemy",
    version="2.0.0"
)

# Enable secure CORS with explicit allowed origins
ALLOWED_ORIGINS = [
    "http://localhost:5173",
    "http://127.0.0.1:5173",
    "http://localhost:3000",
    "http://127.0.0.1:3000",
    "http://localhost:8000",
    "http://127.0.0.1:8000"
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH"],
    allow_headers=["*"],
)

# Mount upload directory
UPLOAD_DIR.mkdir(parents=True, exist_ok=True)
app.mount("/uploads", StaticFiles(directory=str(UPLOAD_DIR)), name="uploads")

# Include Routers
app.include_router(auth_routes.router)
app.include_router(product_routes.router)
app.include_router(inventory_routes.router)
app.include_router(order_routes.router)
app.include_router(customer_routes.router)
app.include_router(marketing_routes.router)
app.include_router(analytics_routes.router)
app.include_router(content_routes.router)
app.include_router(settings_routes.router)

from fastapi.responses import FileResponse

@app.get("/api/health")
def health_check():
    return {
        "status": "healthy",
        "service": "SuShop E-Commerce Backend",
        "engine": str(engine.url).split("://")[0]
    }

# Mount Frontend production build if present
FRONTEND_DIST = Path(__file__).resolve().parent.parent / "frontend" / "dist"
if FRONTEND_DIST.exists():
    app.mount("/assets", StaticFiles(directory=str(FRONTEND_DIST / "assets")), name="assets")

    @app.get("/{full_path:path}")
    async def serve_frontend(full_path: str):
        if full_path.startswith("api/") or full_path == "api":
            from fastapi import HTTPException
            raise HTTPException(status_code=404, detail="API endpoint not found")
        file_path = FRONTEND_DIST / full_path
        if file_path.exists() and file_path.is_file():
            return FileResponse(file_path)
        return FileResponse(FRONTEND_DIST / "index.html")

