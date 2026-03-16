"""FastAPI server — WebSocket hub + REST endpoints."""

import logging
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


@app.get("/")
def index():
    """Serve the landing page."""
    return FileResponse("ui/landing.html")


@app.get("/login")
def login():
    """Serve the login page."""
    return FileResponse("ui/login.html")


@app.get("/profile")
def profile(request: Request):
    if not get_session(request):
        return RedirectResponse(url="/login")
    return FileResponse("ui/profile.html")


@app.get("/settings")
def settings(request: Request):
    if not get_session(request):
        return RedirectResponse(url="/login")
    return FileResponse("ui/settings.html")


@app.get("/home")
def home(request: Request):
    """Serve the dashboard — redirects to /login if no active session."""
    if not get_session(request):
        return RedirectResponse(url="/login")
    return FileResponse("ui/home.html")


@app.get("/session")
def session(request: Request):
    """Serve the recorder/note-taking page."""
    if not get_session(request):
        return RedirectResponse(url="/login")
    return FileResponse("ui/session.html")




# Static files at /static — keep /ws and /notes free for the API
app.mount("/static", StaticFiles(directory="ui"), name="static")
