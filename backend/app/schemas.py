from pydantic import BaseModel, EmailStr, Field
from typing import List, Optional, Dict, Any
from datetime import datetime

# Auth Schemas
class UserCreate(BaseModel):
    email: EmailStr
    password: str = Field(min_length=6)
    full_name: str

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class UserResponse(BaseModel):
    id: int
    email: EmailStr
    full_name: str
    role: str
    created_at: datetime

    class Config:
        from_attributes = True

class Token(BaseModel):
    access_token: str
    token_type: str
    user: UserResponse

class TokenData(BaseModel):
    email: Optional[str] = None

# Profile Schemas
class ProfileResponse(BaseModel):
    id: int
    user_id: int
    learning_speed: str
    preferred_language: str
    preferred_teaching_style: str
    career_goal: str
    current_skills: str
    xp: int
    coins: int
    level: int
    streak: int
    last_active_at: datetime

    class Config:
        from_attributes = True

class ProfileUpdate(BaseModel):
    learning_speed: Optional[str] = None
    preferred_language: Optional[str] = None
    preferred_teaching_style: Optional[str] = None
    career_goal: Optional[str] = None
    current_skills: Optional[str] = None
    xp: Optional[int] = None
    coins: Optional[int] = None
    level: Optional[int] = None
    streak: Optional[int] = None

# Onboarding Schemas
class OnboardingRequest(BaseModel):
    career_goal: str = Field(..., description="e.g. Become a Senior ML Engineer")
    current_skills: str = Field("", description="Comma separated current skills")
    learning_speed: str = Field("normal", description="slow, normal, fast")
    preferred_language: str = Field("English", description="Preferred language for lectures")
    preferred_teaching_style: str = Field("socratic", description="socratic, visual, practical, academic")
    available_hours_per_day: float = Field(2.0, description="Hours available for studies")

# Lesson Schemas
class LessonCreate(BaseModel):
    title: str
    content: Optional[str] = None
    textbook_chapter: Optional[str] = None
    flashcards_json: Optional[str] = None
    summary: Optional[str] = None
    order_index: int

class LessonResponse(BaseModel):
    id: int
    module_id: int
    title: str
    summary: Optional[str] = None
    order_index: int
    is_completed: bool

    class Config:
        from_attributes = True

class LessonDetailResponse(LessonResponse):
    content: Optional[str] = None
    textbook_chapter: Optional[str] = None
    flashcards_json: Optional[str] = None
    created_at: datetime

# Module Schemas
class ModuleResponse(BaseModel):
    id: int
    course_id: int
    title: str
    description: Optional[str] = None
    order_index: int
    is_completed: bool
    lessons: List[LessonResponse] = []

    class Config:
        from_attributes = True

# Course Schemas
class CourseResponse(BaseModel):
    id: int
    degree_id: int
    code: str
    title: str
    description: Optional[str] = None
    credits: int
    difficulty: str
    estimated_hours: int
    is_completed: bool
    progress: float

    class Config:
        from_attributes = True

class CourseDetailResponse(CourseResponse):
    modules: List[ModuleResponse] = []

# Degree Schemas
class DegreeResponse(BaseModel):
    id: int
    user_id: int
    title: str
    description: Optional[str] = None
    credits_required: int
    credits_completed: int
    duration_weeks: int
    courses: List[CourseResponse] = []

    class Config:
        from_attributes = True

# Quiz Schemas
class QuizQuestion(BaseModel):
    id: str
    question_type: str  # mcq, short_answer
    question_text: str
    options: Optional[List[str]] = None  # for mcq
    correct_answer: str  # text of correct option or correct short answer keyword
    explanation: str

class QuizResponse(BaseModel):
    id: int
    lesson_id: int
    questions: List[QuizQuestion]

class QuizSubmit(BaseModel):
    answers: Dict[str, str]  # question_id -> student_answer

class QuizAttemptFeedback(BaseModel):
    score: float
    passed: bool
    total_questions: int
    correct_count: int
    detailed_feedback: Dict[str, Any]  # question_id -> {"correct": bool, "explanation": str}
    xp_gained: int
    coins_gained: int

class QuizAttemptResponse(BaseModel):
    id: int
    quiz_id: int
    user_id: int
    score: float
    passed: bool
    feedback_json: str
    created_at: datetime

    class Config:
        from_attributes = True

# AI Professor Chat Schemas
class ChatRequest(BaseModel):
    message: str
    personality: str = "Professor Albert"  # Albert (Socratic/Warm), Athena (Analytical/Direct), Lex (Humorous/Code-heavy)
    history: List[Dict[str, str]] = []  # [{"role": "user"/"assistant", "content": "..."}]

class ChatResponse(BaseModel):
    response: str
    speech_base64: Optional[str] = None  # Synthesized speech if requested
    notes: Optional[str] = None  # Live notes updated during conversation

# Coding Lab Schemas
class CodeExecutionRequest(BaseModel):
    code: str
    language: str  # python, javascript
    lesson_id: Optional[int] = None

class CodeExecutionResponse(BaseModel):
    stdout: str
    stderr: str
    exit_code: int
    review: Optional[str] = None  # AI Review of code style, efficiency, security
    passed: bool

# Research Helper Schemas
class ResearchRequest(BaseModel):
    topic: str
    action: str  # outline, citations, literature_review
    context: Optional[str] = None

class ResearchResponse(BaseModel):
    result: str
    citations: List[Dict[str, str]] = []

# Admin telemetry Schemas
class SystemStats(BaseModel):
    total_users: int
    total_degrees: int
    total_courses: int
    total_lessons: int
    active_llm_provider: str
    api_calls_logged: int
