"""Google OAuth2 authentication routes and session management."""

import logging
import os
import secrets

import httpx
from fastapi import APIRouter, Request
from fastapi.responses import JSONResponse, RedirectResponse
from itsdangerous import BadSignature, SignatureExpired, URLSafeTimedSerializer

logger = logging.getLogger(__name__)

auth_router = APIRouter(prefix="/auth")

# ── Config ──────────────────────────────────────────────────────────────────

GOOGLE_CLIENT_ID     = os.getenv("GOOGLE_CLIENT_ID", "")
GOOGLE_CLIENT_SECRET = os.getenv("GOOGLE_CLIENT_SECRET", "")
SESSION_SECRET       = os.getenv("SESSION_SECRET", "change-this-to-a-random-secret")
REDIRECT_URI         = "http://localhost:8000/auth/google/callback"

COOKIE_NAME          = "qn_session"
COOKIE_MAX_AGE       = 7 * 24 * 60 * 60  # 7 days in seconds
SERIALIZER_MAX_AGE   = COOKIE_MAX_AGE

GOOGLE_AUTH_URL      = "https://accounts.google.com/o/oauth2/v2/auth"
GOOGLE_TOKEN_URL     = "https://oauth2.googleapis.com/token"
GOOGLE_USERINFO_URL  = "https://www.googleapis.com/oauth2/v2/userinfo"

_serializer = URLSafeTimedSerializer(SESSION_SECRET)


# ── Session helpers ──────────────────────────────────────────────────────────

def get_session(request: Request) -> dict | None:
    """Return the user dict from the signed session cookie, or None if absent/invalid."""
    raw = request.cookies.get(COOKIE_NAME)
    if not raw:
        return None
    try:
        user = _serializer.loads(raw, max_age=SERIALIZER_MAX_AGE)
        return user
    except (SignatureExpired, BadSignature):
        return None


def set_session(response: RedirectResponse, user: dict) -> None:
    """Write a signed session cookie containing the user dict."""
    value = _serializer.dumps(user)
    response.set_cookie(
        key=COOKIE_NAME,
        value=value,
        max_age=COOKIE_MAX_AGE,
        httponly=True,
        samesite="lax",
    )


# ── Routes ───────────────────────────────────────────────────────────────────

@auth_router.get("/google")
async def google_login(request: Request):
    """Redirect the browser to Google's OAuth consent screen."""
    state = secrets.token_urlsafe(32)
    params = {
        "client_id":     GOOGLE_CLIENT_ID,
        "redirect_uri":  REDIRECT_URI,
        "response_type": "code",
        "scope":         "openid email profile https://www.googleapis.com/auth/drive.file",
        "state":         state,
        "access_type":   "offline",   # request refresh token
        "prompt":        "consent",   # always show consent so refresh token is returned
    }
    query = "&".join(f"{k}={v}" for k, v in params.items())
    redirect_url = f"{GOOGLE_AUTH_URL}?{query}"

    response = RedirectResponse(url=redirect_url)
    # CSRF protection: store state in a short-lived cookie
    response.set_cookie(
        key="oauth_state",
        value=state,
        max_age=600,
        httponly=True,
        samesite="lax",
    )
    return response


@auth_router.get("/google/callback")
async def google_callback(request: Request, code: str = "", state: str = "", error: str = ""):
    """Handle the OAuth callback from Google."""
    if error:
        logger.warning("OAuth error from Google: %s", error)
        return RedirectResponse(url="/login?error=oauth_denied")

    # Validate CSRF state
    stored_state = request.cookies.get("oauth_state")
    if not stored_state or stored_state != state:
        logger.warning("OAuth state mismatch — possible CSRF")
        return RedirectResponse(url="/login?error=state_mismatch")

    if not code:
        return RedirectResponse(url="/login?error=no_code")

    # Exchange authorization code for tokens
    async with httpx.AsyncClient() as client:
        token_response = await client.post(
            GOOGLE_TOKEN_URL,
            data={
                "code":          code,
                "client_id":     GOOGLE_CLIENT_ID,
                "client_secret": GOOGLE_CLIENT_SECRET,
                "redirect_uri":  REDIRECT_URI,
                "grant_type":    "authorization_code",
            },
            headers={"Accept": "application/json"},
        )

    if token_response.status_code != 200:
        logger.error("Token exchange failed: %s", token_response.text)
        return RedirectResponse(url="/login?error=token_exchange_failed")

    tokens = token_response.json()
    access_token = tokens.get("access_token")
    if not access_token:
        return RedirectResponse(url="/login?error=no_access_token")

    # Fetch user info from Google
    async with httpx.AsyncClient() as client:
        userinfo_response = await client.get(
            GOOGLE_USERINFO_URL,
            headers={"Authorization": f"Bearer {access_token}"},
        )

    if userinfo_response.status_code != 200:
        logger.error("Userinfo fetch failed: %s", userinfo_response.text)
        return RedirectResponse(url="/login?error=userinfo_failed")

    info = userinfo_response.json()
    user = {
        "id":            info.get("id", ""),
        "name":          info.get("name", ""),
        "email":         info.get("email", ""),
        "picture":       info.get("picture", ""),
        "access_token":  tokens.get("access_token", ""),
        "refresh_token": tokens.get("refresh_token", ""),  # present with access_type=offline
    }
    logger.info("User authenticated: %s", user["email"])

    response = RedirectResponse(url="/home")
    set_session(response, user)
    # Clear the CSRF state cookie
    response.delete_cookie("oauth_state")
    return response


@auth_router.get("/me")
async def get_me(request: Request):
    """Return the current user's profile, or 401 if not logged in."""
    user = get_session(request)
    if not user:
        return JSONResponse({"error": "not authenticated"}, status_code=401)
    return JSONResponse(user)


@auth_router.get("/logout")
async def logout(request: Request):
    """Clear the session cookie and redirect to the landing page."""
    response = RedirectResponse(url="/")
    response.delete_cookie(COOKIE_NAME)
    logger.info("User logged out")
    return response
