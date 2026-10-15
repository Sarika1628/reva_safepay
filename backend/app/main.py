from pathlib import Path
from contextlib import asynccontextmanager
from fastapi import FastAPI, Request, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
from backend.app.config import settings
from backend.app.database import Base, engine, SessionLocal
from backend.app.services.seed_data import seed_database
from backend.app.ml.model_service import load_model
from backend.app.routers.health import router as health_router
from backend.app.routers.users import router as users_router
from backend.app.routers.contacts import router as contacts_router
from backend.app.routers.payments import router as payments_router
from backend.app.routers.scam_shield import router as scam_router
from backend.app.routers.emergency import router as emergency_router
from backend.app.routers.practice import router as practice_router
from backend.app.routers.compat import router as compat_router


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup: Create tables, seed initial demo data, and load ML scam detector
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()
    try:
        seed_database(db)
    finally:
        db.close()
    
    # Load ML classification model into memory
    load_model()
    
    yield
    # Shutdown logic if any


app = FastAPI(
    title=settings.APP_NAME,
    version="1.0.0",
    description=(
        "Accessible Digital Payment Assistance and Scam-Prevention API "
        "designed for seniors, deaf users, and non-speaking individuals. "
        "Strictly simulated; no real money, banking credentials, or PINs."
    ),
    lifespan=lifespan
)

# CORS configuration
origins = settings.cors_origin_list
if not origins:
    origins = ["*"]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins if "*" not in origins else ["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include Routers
app.include_router(health_router)
app.include_router(users_router)
app.include_router(contacts_router)
app.include_router(payments_router)
app.include_router(scam_router)
app.include_router(emergency_router)
app.include_router(practice_router)
app.include_router(compat_router)

# Production Frontend SPA Static Serving
FRONTEND_DIST = Path(__file__).resolve().parent.parent.parent / "frontend" / "dist"
assets_dir = FRONTEND_DIST / "assets"
if assets_dir.exists():
    app.mount("/assets", StaticFiles(directory=str(assets_dir)), name="assets")


@app.get("/")
def root(request: Request):
    accept = request.headers.get("accept", "")
    index_file = FRONTEND_DIST / "index.html"
    if "text/html" in accept and index_file.exists():
        return FileResponse(index_file)
    return {
        "app": settings.APP_NAME,
        "status": "online",
        "documentation": "/docs",
        "health_check": "/api/health",
        "disclaimer": "SIMULATED PROJECT: No real money transferred or credentials stored."
    }


@app.get("/{full_path:path}")
async def serve_spa_fallback(full_path: str):
    # Do not intercept API, docs, or OpenAPI endpoints
    if full_path.startswith("api") or full_path in ("docs", "redoc", "openapi.json"):
        raise HTTPException(status_code=404, detail="Endpoint not found")
    
    # Check if a static file directly exists (e.g. vite.svg, favicon.ico)
    file_path = FRONTEND_DIST / full_path
    if full_path and file_path.is_file():
        return FileResponse(file_path)
    
    # SPA fallback for client-side routing (e.g. /send-payment, /dashboard)
    index_file = FRONTEND_DIST / "index.html"
    if index_file.exists():
        return FileResponse(index_file)
        
    raise HTTPException(status_code=404, detail="Page not found")

