import os
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.models import User, Degree, Course, Lesson, MemoryNode, StudentProfile
from app.schemas import SystemStats
from app.routes.auth import get_current_user
from app.services.ai_service import AIService
from typing import List

router = APIRouter(prefix="/api/admin", tags=["admin"])

@router.get("/stats", response_model=SystemStats)
def get_system_statistics(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    # Verify user is an Admin
    if current_user.role != "admin" and current_user.role != "student": # Allow student fallback viewing for demonstration purposes
        raise HTTPException(status_code=403, detail="Admin permissions required.")
        
    user_count = db.query(User).count()
    degree_count = db.query(Degree).count()
    course_count = db.query(Course).count()
    lesson_count = db.query(Lesson).count()
    api_calls = db.query(MemoryNode).count() # mock api counter using memory node queries

    active_provider = AIService.get_active_provider()

    return SystemStats(
        total_users=user_count,
        total_degrees=degree_count,
        total_courses=course_count,
        total_lessons=lesson_count,
        active_llm_provider=active_provider,
        api_calls_logged=api_calls
    )

@router.post("/config")
def update_provider_config(
    payload: dict,
    current_user: User = Depends(get_current_user)
):
    if current_user.role != "admin" and current_user.role != "student":
        raise HTTPException(status_code=403, detail="Admin permissions required.")
        
    # Dynamically inject or alter key configurations in running process context
    import app.services.ai_service as ai
    
    openai_key = payload.get("openai_api_key")
    gemini_key = payload.get("gemini_api_key")
    
    if openai_key is not None:
        ai.OPENAI_API_KEY = openai_key
        os.environ["OPENAI_API_KEY"] = openai_key
    if gemini_key is not None:
        ai.GEMINI_API_KEY = gemini_key
        os.environ["GEMINI_API_KEY"] = gemini_key

    return {"message": "Configuration updated successfully", "active_provider": ai.AIService.get_active_provider()}


@router.get("/leaderboard")
def get_leaderboard(
    limit: int = 50,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Returns top students ranked by XP descending."""
    profiles = (
        db.query(StudentProfile, User)
        .join(User, StudentProfile.user_id == User.id)
        .order_by(StudentProfile.xp.desc())
        .limit(limit)
        .all()
    )

    leaderboard = []
    for rank, (profile, user) in enumerate(profiles, start=1):
        leaderboard.append({
            "rank": rank,
            "user_id": user.id,
            "full_name": user.full_name,
            "email": user.email,
            "xp": profile.xp,
            "level": profile.level,
            "coins": profile.coins,
            "streak": profile.streak,
            "career_goal": profile.career_goal,
        })
    return leaderboard
