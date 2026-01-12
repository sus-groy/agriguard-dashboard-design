Minimal frontend for local development.

Run a static server from the repo root:

    python -m http.server 5173 --directory frontend

Open http://localhost:5173 in your browser. The UI POSTs to http://localhost:8000/diagnose by default.

If your backend runs on a different host/port, edit `frontend/main.js` and set `API_BASE` accordingly.

Security: do not expose `GOOGLE_API_KEY` to the frontend; keep it set only on the backend server.
