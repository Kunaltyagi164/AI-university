import json
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.models import User, Lesson, Quiz, QuizAttempt, MemoryNode
from app.schemas import QuizResponse, QuizSubmit, QuizAttemptFeedback
from app.routes.auth import get_current_user
from app.services.ai_service import AIService

router = APIRouter(prefix="/api/exams", tags=["exams"])

@router.get("/generate/{lesson_id}", response_model=QuizResponse)
async def generate_exam(
    lesson_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    # Check if a quiz already exists for this lesson
    quiz = db.query(Quiz).filter(Quiz.lesson_id == lesson_id).first()
    
    # Verify lesson exists
    lesson = db.query(Lesson).filter(Lesson.id == lesson_id).first()
    if not lesson:
        raise HTTPException(status_code=404, detail="Lesson not found.")

    if not quiz:
        try:
            # Generate new questions via AI Service
            questions = await AIService.generate_quiz(
                lesson_title=lesson.title,
                lesson_content=lesson.content or "General software concepts."
            )
            quiz = Quiz(
                lesson_id=lesson_id,
                questions_json=json.dumps(questions)
            )
            db.add(quiz)
            db.commit()
            db.refresh(quiz)
        except Exception as e:
            raise HTTPException(status_code=500, detail=f"Failed to generate exam questions: {str(e)}")

    # Decode JSON questions to object for response matching QuizResponse schema
    questions_list = json.loads(quiz.questions_json)
    return QuizResponse(
        id=quiz.id,
        lesson_id=quiz.lesson_id,
        questions=questions_list
    )

@router.post("/submit/{quiz_id}", response_model=QuizAttemptFeedback)
def submit_exam(
    quiz_id: int,
    payload: QuizSubmit,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    quiz = db.query(Quiz).filter(Quiz.id == quiz_id).first()
    if not quiz:
        raise HTTPException(status_code=404, detail="Quiz not found.")

    questions = json.loads(quiz.questions_json)
    student_answers = payload.answers

    correct_count = 0
    total_questions = len(questions)
    detailed_feedback = {}

    # Score each question
    for q in questions:
        q_id = q["id"]
        correct_ans = q["correct_answer"].strip().lower()
        student_ans = student_answers.get(q_id, "").strip().lower()

        is_correct = False
        if q["question_type"] == "mcq":
            is_correct = (student_ans == correct_ans)
        else:
            # For short answer, support checking keyword containment
            is_correct = (correct_ans in student_ans)

        if is_correct:
            correct_count += 1
            detailed_feedback[q_id] = {
                "correct": True,
                "explanation": f"Correct! {q['explanation']}"
            }
        else:
            detailed_feedback[q_id] = {
                "correct": False,
                "explanation": f"Incorrect. The correct answer is '{q['correct_answer']}'. {q['explanation']}"
            }
            
            # Save weakness memory
            weakness_node = MemoryNode(
                user_id=current_user.id,
                key=f"quiz_weakness_{q_id}",
                value=f"Student failed quiz question: '{q['question_text']}'. Concept: {q['explanation']}",
                category="weakness",
                confidence_score=0.9
            )
            db.add(weakness_node)
            db.commit()

    score = (correct_count / total_questions) * 100.0 if total_questions > 0 else 100.0
    passed = score >= 70.0  # Passing threshold is 70%

    xp_gained = 50 if passed else 10
    coins_gained = 15 if passed else 2

    # Update profile metrics
    profile = current_user.profile
    profile.xp += xp_gained
    profile.coins += coins_gained
    
    new_level = (profile.xp // 100) + 1
    if new_level > profile.level:
        profile.level = new_level
        
    db.commit()

    # Record Attempt
    attempt = QuizAttempt(
        quiz_id=quiz.id,
        user_id=current_user.id,
        answers_json=json.dumps(student_answers),
        score=score,
        passed=passed,
        feedback_json=json.dumps(detailed_feedback)
    )
    db.add(attempt)
    db.commit()

    return QuizAttemptFeedback(
        score=score,
        passed=passed,
        total_questions=total_questions,
        correct_count=correct_count,
        detailed_feedback=detailed_feedback,
        xp_gained=xp_gained,
        coins_gained=coins_gained
    )
