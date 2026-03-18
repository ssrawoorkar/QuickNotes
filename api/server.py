"""FastAPI server — WebSocket hub + REST endpoints."""

import logging
import os
from dotenv import load_dotenv
load_dotenv()
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse, RedirectResponse

from api.routes import router
from api.auth import auth_router, get_session
from api.drive import drive_router

logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(message)s")

app = FastAPI(title="QuickNotes")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth_router)
app.include_router(drive_router)
app.include_router(router)

# Serve React build static assets (JS, CSS, images, etc.)
DIST_DIR = os.path.join(os.path.dirname(__file__), "..", "frontend", "dist")
DIST_DIR = os.path.normpath(DIST_DIR)

if os.path.isdir(DIST_DIR):
    app.mount("/assets", StaticFiles(directory=os.path.join(DIST_DIR, "assets")), name="assets")


def _serve_index():
    """Return frontend/dist/index.html for React Router to handle."""
    index_path = os.path.join(DIST_DIR, "index.html")
    if os.path.isfile(index_path):
        return FileResponse(index_path)
    # Fallback to legacy UI if build doesn't exist yet
    return FileResponse("ui/index.html")


@app.get("/")
def index():
    """Serve the React app landing route."""
    return _serve_index()


@app.get("/favicon.svg")
def favicon():
    """Serve the app favicon."""
    fav = os.path.join(DIST_DIR, "favicon.svg")
    if os.path.isfile(fav):
        return FileResponse(fav, media_type="image/svg+xml")
    return FileResponse("ui/favicon.svg", media_type="image/svg+xml")


@app.get("/login")
def login():
    """Serve the React app (login route handled client-side)."""
    return _serve_index()


@app.get("/home")
def home(request: Request):
    """Serve the React app dashboard."""
    return _serve_index()


@app.get("/session")
def session(request: Request):
    """Serve the React app recorder page."""
    return _serve_index()


@app.get("/settings")
def settings(request: Request):
    """Serve the React app settings page."""
    return _serve_index()


@app.get("/profile")
def profile(request: Request):
    """Serve the React app profile page."""
    return _serve_index()


# Catch-all for any other frontend routes React Router might handle.
# Excludes API paths: /ws, /transcribe, /notes, /auth/*, /drive/*, /assets/*
@app.get("/{full_path:path}")
def catch_all(full_path: str):
    """Serve index.html for all non-API routes so React Router works."""
    api_prefixes = ("ws", "transcribe", "notes", "auth/", "drive/", "assets/", "static/")
    if any(full_path.startswith(p) for p in api_prefixes):
        return RedirectResponse(url="/")
    return _serve_index()
