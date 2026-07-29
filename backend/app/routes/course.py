import json
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.models import User, Degree, Course, Module, Lesson
from app.schemas import DegreeResponse, CourseDetailResponse, LessonDetailResponse
from app.routes.auth import get_current_user
from app.services.ai_service import AIService

router = APIRouter(prefix="/api/course", tags=["course"])

@router.get("/degree", response_model=DegreeResponse)
def get_user_degree(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    degree = db.query(Degree).filter(Degree.user_id == current_user.id).first()
    if not degree:
        raise HTTPException(status_code=404, detail="No degree has been generated. Complete onboarding first.")
    return degree

@router.get("/{course_id}", response_model=CourseDetailResponse)
def get_course_details(
    course_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    # Verify course belongs to user
    course = db.query(Course).join(Degree).filter(
        Course.id == course_id,
        Degree.user_id == current_user.id
    ).first()
    
    if not course:
        raise HTTPException(status_code=404, detail="Course not found or unauthorized.")
    return course

@router.get("/lesson/{lesson_id}", response_model=LessonDetailResponse)
async def get_lesson_details(
    lesson_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    lesson = db.query(Lesson).join(Module).join(Course).join(Degree).filter(
        Lesson.id == lesson_id,
        Degree.user_id == current_user.id
    ).first()
    
    if not lesson:
        raise HTTPException(status_code=404, detail="Lesson not found.")

    # Lazy-load/generate lesson materials if content is null
    if not lesson.content:
        course_title = lesson.module.course.title
        module_title = lesson.module.title
        teaching_style = current_user.profile.preferred_teaching_style

        try:
            ai_content = await AIService.generate_lesson_content(
                course_title=course_title,
                module_title=module_title,
                lesson_title=lesson.title,
                teaching_style=teaching_style
            )
            lesson.content = ai_content.get("content", "")
            lesson.textbook_chapter = ai_content.get("textbook_chapter", "")
            lesson.summary = ai_content.get("summary", "")
            lesson.flashcards_json = json.dumps(ai_content.get("flashcards", []))
            db.commit()
            db.refresh(lesson)
        except Exception as e:
            raise HTTPException(status_code=500, detail=f"Failed to generate lesson content: {str(e)}")

    return lesson

@router.post("/lesson/{lesson_id}/complete")
def complete_lesson(
    lesson_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    lesson = db.query(Lesson).join(Module).join(Course).join(Degree).filter(
        Lesson.id == lesson_id,
        Degree.user_id == current_user.id
    ).first()
    
    if not lesson:
        raise HTTPException(status_code=404, detail="Lesson not found.")

    if not lesson.is_completed:
        lesson.is_completed = True
        
        # Award XP and coins
        profile = current_user.profile
        profile.xp += 25
        profile.coins += 5
        
        # Check level up (100 XP per level)
        new_level = (profile.xp // 100) + 1
        if new_level > profile.level:
            profile.level = new_level
            
        profile.streak += 1
        db.commit()

        # Update course progress
        course = lesson.module.course
        total_lessons = db.query(Lesson).join(Module).filter(Module.course_id == course.id).count()
        completed_lessons = db.query(Lesson).join(Module).filter(
            Module.course_id == course.id,
            Lesson.is_completed == True
        ).count()
        
        if total_lessons > 0:
            course.progress = (completed_lessons / total_lessons) * 100.0
            if completed_lessons == total_lessons:
                course.is_completed = True
                profile.xp += 100  # Bonus for completing course
                profile.coins += 20
        db.commit()

    return {"message": "Lesson completed successfully", "xp": current_user.profile.xp, "level": current_user.profile.level}
