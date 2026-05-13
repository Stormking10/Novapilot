"""
routes/history.py
GET /api/history  — returns past scan results (stub; wire to Supabase in Phase 2)
"""
from fastapi import APIRouter

router = APIRouter()

# In-memory store for development; replace with Supabase client in production
_history: list[dict] = []


def save_scan(scan_result: dict):
    """Call this from the scan route to persist results."""
    _history.append(scan_result)
    if len(_history) > 100:   # simple cap
        _history.pop(0)


@router.get("/history")
async def get_history():
    return {"scans": list(reversed(_history))}
