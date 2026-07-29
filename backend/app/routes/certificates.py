import hashlib
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.models import User, Course, Degree
from app.routes.auth import get_current_user
import datetime

router = APIRouter(prefix="/api/certificates", tags=["certificates"])


@router.get("/{course_id}")
def get_certificate(
    course_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Returns certificate metadata for a completed course.
    Only returns data if the course belongs to the current user and is completed.
    """
    course = (
        db.query(Course)
        .join(Degree)
        .filter(
            Course.id == course_id,
            Degree.user_id == current_user.id
        )
        .first()
    )

    if not course:
        raise HTTPException(status_code=404, detail="Course not found or unauthorized.")

    if not course.is_completed:
        raise HTTPException(
            status_code=400,
            detail="Certificate not available. Course has not been completed yet."
        )

    # Generate a deterministic certificate ID from user+course
    cert_raw = f"NOVA-{current_user.id}-{course_id}-{current_user.email}"
    cert_id = "NOVA-" + hashlib.sha256(cert_raw.encode()).hexdigest()[:12].upper()

    degree = course.degree

    return {
        "certificate_id": cert_id,
        "student_name": current_user.full_name,
        "student_email": current_user.email,
        "course_title": course.title,
        "course_code": course.code,
        "course_credits": course.credits,
        "degree_title": degree.title if degree else "Bachelor of Science",
        "issued_date": datetime.date.today().strftime("%B %d, %Y"),
        "difficulty": course.difficulty,
    }
