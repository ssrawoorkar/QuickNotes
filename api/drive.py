"""Google Drive integration — save notes as .md or create a Google Doc."""

import json
import logging
import os
from datetime import datetime

import httpx
from fastapi import APIRouter, Request
from fastapi.responses import JSONResponse

from api.auth import (
    GOOGLE_CLIENT_ID,
    GOOGLE_CLIENT_SECRET,
    GOOGLE_TOKEN_URL,
    get_session,
    set_session,
)

logger = logging.getLogger(__name__)
drive_router = APIRouter(prefix="/drive")

DRIVE_UPLOAD_URL  = "https://www.googleapis.com/upload/drive/v3/files"
DRIVE_FILES_URL   = "https://www.googleapis.com/drive/v3/files"


# ── Token helpers ────────────────────────────────────────────────────────────

async def _refresh_access_token(refresh_token: str) -> str | None:
    """Exchange a refresh token for a new access token."""
    async with httpx.AsyncClient() as client:
        resp = await client.post(GOOGLE_TOKEN_URL, data={
            "client_id":     GOOGLE_CLIENT_ID,
            "client_secret": GOOGLE_CLIENT_SECRET,
            "refresh_token": refresh_token,
            "grant_type":    "refresh_token",
        })
    if resp.status_code == 200:
        return resp.json().get("access_token")
    logger.error("Token refresh failed: %s", resp.text)
    return None


async def _get_valid_token(request: Request) -> tuple[str | None, dict | None]:
    """
    Return (access_token, session) — refreshing the token if needed.
    Returns (None, None) if the user is not authenticated.
    """
    session = get_session(request)
    if not session:
        return None, None

    access_token = session.get("access_token", "")

    # Try a quick auth check; if 401, refresh
    async with httpx.AsyncClient() as client:
        check = await client.get(
            "https://www.googleapis.com/oauth2/v1/tokeninfo",
            params={"access_token": access_token},
        )

    if check.status_code != 200:
        refresh_token = session.get("refresh_token", "")
        if not refresh_token:
            return None, None
        new_token = await _refresh_access_token(refresh_token)
        if not new_token:
            return None, None
        session["access_token"] = new_token
        access_token = new_token

    return access_token, session


def _session_response(data: dict, session: dict, status: int = 200) -> JSONResponse:
    """Return a JSONResponse and update the session cookie with any token changes."""
    from itsdangerous import URLSafeTimedSerializer
    from api.auth import SESSION_SECRET, COOKIE_NAME, COOKIE_MAX_AGE
    serializer = URLSafeTimedSerializer(SESSION_SECRET)
    response = JSONResponse(data, status_code=status)
    response.set_cookie(
        key=COOKIE_NAME,
        value=serializer.dumps(session),
        max_age=COOKIE_MAX_AGE,
        httponly=True,
        samesite="lax",
    )
    return response


# ── Routes ───────────────────────────────────────────────────────────────────

@drive_router.post("/save")
async def save_to_drive(request: Request):
    """
    Upload the current notes as a .md file to Google Drive.
    If the file was previously saved this session, updates it in place.
    """
    access_token, session = await _get_valid_token(request)
    if not access_token:
        return JSONResponse({"error": "not_authenticated"}, status_code=401)

    body = await request.json()
    content = body.get("content", "")
    if not content.strip():
        return JSONResponse({"error": "no_content"}, status_code=400)

    existing_file_id = session.get("drive_file_id")
    date_str = datetime.now().strftime("%Y-%m-%d %H:%M")
    filename = f"QuickNotes – {date_str}.md"

    headers = {"Authorization": f"Bearer {access_token}"}

    async with httpx.AsyncClient() as client:
        if existing_file_id:
            # Patch existing file content
            resp = await client.patch(
                f"{DRIVE_UPLOAD_URL}/{existing_file_id}?uploadType=media",
                headers={**headers, "Content-Type": "text/plain"},
                content=content.encode(),
            )
            file_id = existing_file_id
        else:
            # Create new file via multipart upload
            metadata = json.dumps({"name": filename}).encode()
            file_bytes = content.encode()
            boundary = "qn_boundary_abc123"
            body_parts = (
                f"--{boundary}\r\n"
                f"Content-Type: application/json; charset=UTF-8\r\n\r\n"
            ).encode() + metadata + (
                f"\r\n--{boundary}\r\n"
                f"Content-Type: text/plain; charset=UTF-8\r\n\r\n"
            ).encode() + file_bytes + f"\r\n--{boundary}--".encode()

            resp = await client.post(
                f"{DRIVE_UPLOAD_URL}?uploadType=multipart",
                headers={**headers, "Content-Type": f"multipart/related; boundary={boundary}"},
                content=body_parts,
            )
            if resp.status_code not in (200, 201):
                logger.error("Drive upload failed: %s", resp.text)
                return JSONResponse({"error": "upload_failed", "detail": resp.text}, status_code=500)
            file_id = resp.json().get("id")
            session["drive_file_id"] = file_id

    logger.info("Notes saved to Drive: %s", file_id)
    return _session_response({"file_id": file_id, "name": filename}, session)


@drive_router.post("/create-doc")
async def create_google_doc(request: Request):
    """
    Create a new Google Doc from the current notes and return the edit URL.
    """
    access_token, session = await _get_valid_token(request)
    if not access_token:
        return JSONResponse({"error": "not_authenticated"}, status_code=401)

    body = await request.json()
    content = body.get("content", "")
    if not content.strip():
        return JSONResponse({"error": "no_content"}, status_code=400)

    date_str = datetime.now().strftime("%Y-%m-%d %H:%M")
    filename = f"QuickNotes – {date_str}"
    headers = {"Authorization": f"Bearer {access_token}"}

    # Upload as plain text with Google Doc MIME type — Drive auto-converts
    metadata = json.dumps({
        "name":     filename,
        "mimeType": "application/vnd.google-apps.document",
    }).encode()
    file_bytes = content.encode()
    boundary = "qn_boundary_def456"
    body_parts = (
        f"--{boundary}\r\n"
        f"Content-Type: application/json; charset=UTF-8\r\n\r\n"
    ).encode() + metadata + (
        f"\r\n--{boundary}\r\n"
        f"Content-Type: text/plain; charset=UTF-8\r\n\r\n"
    ).encode() + file_bytes + f"\r\n--{boundary}--".encode()

    async with httpx.AsyncClient() as client:
        resp = await client.post(
            f"{DRIVE_UPLOAD_URL}?uploadType=multipart",
            headers={**headers, "Content-Type": f"multipart/related; boundary={boundary}"},
            content=body_parts,
        )

    if resp.status_code not in (200, 201):
        logger.error("Doc creation failed: %s", resp.text)
        return JSONResponse({"error": "creation_failed", "detail": resp.text}, status_code=500)

    doc_id  = resp.json().get("id")
    doc_url = f"https://docs.google.com/document/d/{doc_id}/edit"
    logger.info("Google Doc created: %s", doc_url)
    return _session_response({"doc_url": doc_url, "doc_id": doc_id}, session)
