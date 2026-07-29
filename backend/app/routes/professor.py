from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.models import User, MemoryNode
from app.schemas import ChatRequest, ChatResponse
from app.routes.auth import get_current_user
from app.services.ai_service import AIService
import datetime

router = APIRouter(prefix="/api/professor", tags=["professor"])

@router.post("/chat", response_model=ChatResponse)
async def chat_with_professor(
    payload: ChatRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    # Fetch student memory
    memory_nodes = db.query(MemoryNode).filter(MemoryNode.user_id == current_user.id).all()
    memory_details = []
    for node in memory_nodes:
        memory_details.append(f"- Category: {node.category}. Subject: {node.key}. Details: {node.value}")
    
    memory_summary = "\n".join(memory_details) if memory_details else "No previous learning memories found yet."

    career_goal = current_user.profile.career_goal
    teaching_style = current_user.profile.preferred_teaching_style

    try:
        # Call chat professor compiler
        ai_resp = await AIService.chat_professor(
            message=payload.message,
            history=payload.history,
            personality=payload.personality,
            career_goal=career_goal,
            teaching_style=teaching_style,
            memory_summary=memory_summary
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Professor API failed: {str(e)}")

    # Proactively identify if the student discussed a mistake or milestone to record in memory
    msg_lower = payload.message.lower()
    if "don't understand" in msg_lower or "confused about" in msg_lower or "struggling with" in msg_lower:
        # Save a weakness/confusion memory
        topic = msg_lower.split("about")[-1].strip() if "about" in msg_lower else "general_confusion"
        topic = topic.split("with")[-1].strip() if "with" in msg_lower else topic
        topic = topic[:40].replace(" ", "_")
        
        # Check if already recorded
        exist_node = db.query(MemoryNode).filter(MemoryNode.user_id == current_user.id, MemoryNode.key == topic).first()
        if not exist_node:
            node = MemoryNode(
                user_id=current_user.id,
                key=topic,
                value=f"Student expressed confusion or requested simpler explanations for: {payload.message}",
                category="weakness",
                confidence_score=0.8
            )
            db.add(node)
            db.commit()

    elif "mastered" in msg_lower or "understand how" in msg_lower or "built a" in msg_lower:
        # Save a strength memory
        topic = "skill_achievement"
        node = MemoryNode(
            user_id=current_user.id,
            key=topic,
            value=f"Student successfully coded or demonstrated competence in: {payload.message}",
            category="strength",
            confidence_score=0.9
        )
        db.add(node)
        db.commit()

    return ChatResponse(
        response=ai_resp.get("response", "I hear you, let's explore that further."),
        speech_base64=None,
        notes=ai_resp.get("notes", "* Class notes: Event processing.")
    )

@router.get("/memory")
def get_professor_memory(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    nodes = db.query(MemoryNode).filter(MemoryNode.user_id == current_user.id).all()
    return [{"category": n.category, "key": n.key, "value": n.value, "updated_at": n.updated_at} for n in nodes]
