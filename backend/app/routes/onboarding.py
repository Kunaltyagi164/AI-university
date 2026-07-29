from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.models import User, Degree, Course, Module, Lesson
from app.schemas import OnboardingRequest, DegreeResponse
from app.routes.auth import get_current_user
from app.services.ai_service import AIService

router = APIRouter(prefix="/api/onboarding", tags=["onboarding"])

@router.post("/submit", response_model=DegreeResponse)
async def submit_onboarding(
    request: OnboardingRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    # Check if user already has a degree generated
    existing_degree = db.query(Degree).filter(Degree.user_id == current_user.id).first()
    if existing_degree:
        # Delete old degree to re-compile
        db.delete(existing_degree)
        db.commit()

    # Update student profile details
    profile = current_user.profile
    profile.learning_speed = request.learning_speed
    profile.preferred_language = request.preferred_language
    profile.preferred_teaching_style = request.preferred_teaching_style
    profile.career_goal = request.career_goal
    profile.current_skills = request.current_skills
    db.commit()

    # Call LLM/Fallback to generate degree outline
    try:
        degree_data = await AIService.generate_degree(
            career_goal=request.career_goal,
            current_skills=request.current_skills,
            speed=request.learning_speed,
            lang=request.preferred_language,
            style=request.preferred_teaching_style
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"AI generation failed: {str(e)}")

    # Construct the Degree in Database
    new_degree = Degree(
        user_id=current_user.id,
        title=degree_data.get("title", f"B.S. in {request.career_goal.title()}"),
        description=degree_data.get("description", "A personalized university program designed by NOVA AI."),
        credits_required=120,
        credits_completed=0,
        duration_weeks=16
    )
    db.add(new_degree)
    db.commit()
    db.refresh(new_degree)

    # Add Courses
    for course_idx, c_data in enumerate(degree_data.get("courses", [])):
        course = Course(
            degree_id=new_degree.id,
            code=c_data.get("code", f"CS-{100 + course_idx}"),
            title=c_data.get("title", f"Course {course_idx}"),
            description=c_data.get("description", ""),
            credits=c_data.get("credits", 3),
            difficulty=c_data.get("difficulty", "Intermediate"),
            estimated_hours=c_data.get("estimated_hours", 20),
            is_completed=False,
            progress=0.0
        )
        db.add(course)
        db.commit()
        db.refresh(course)

        # Add Modules
        for mod_idx, m_data in enumerate(c_data.get("modules", [])):
            module = Module(
                course_id=course.id,
                title=m_data.get("title", f"Module {mod_idx}"),
                description=m_data.get("description", ""),
                order_index=mod_idx + 1,
                is_completed=False
            )
            db.add(module)
            db.commit()
            db.refresh(module)

            # Add Lessons
            for les_idx, l_data in enumerate(m_data.get("lessons", [])):
                lesson = Lesson(
                    module_id=module.id,
                    title=l_data.get("title", f"Lesson {les_idx}"),
                    summary=l_data.get("summary", ""),
                    order_index=les_idx + 1,
                    is_completed=False
                )
                db.add(lesson)
                db.commit()

    db.refresh(new_degree)
    return new_degree
