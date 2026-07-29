import datetime
from sqlalchemy import Column, Integer, String, Text, Float, Boolean, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from app.core.database import Base

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String, unique=True, index=True, nullable=False)
    hashed_password = Column(String, nullable=False)
    full_name = Column(String, nullable=False)
    role = Column(String, default="student")  # student, admin, teacher
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    profile = relationship("StudentProfile", back_populates="user", uselist=False)
    degree = relationship("Degree", back_populates="user", uselist=False)
    quiz_attempts = relationship("QuizAttempt", back_populates="user")
    memory_nodes = relationship("MemoryNode", back_populates="user")

class StudentProfile(Base):
    __tablename__ = "student_profiles"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), unique=True)
    learning_speed = Column(String, default="normal")  # slow, normal, fast
    preferred_language = Column(String, default="English")
    preferred_teaching_style = Column(String, default="socratic")  # socratic, visual, practical, academic
    career_goal = Column(String, default="General AI Specialist")
    current_skills = Column(String, default="")  # comma separated
    xp = Column(Integer, default=0)
    coins = Column(Integer, default=0)
    level = Column(Integer, default=1)
    streak = Column(Integer, default=0)
    last_active_at = Column(DateTime, default=datetime.datetime.utcnow)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    user = relationship("User", back_populates="profile")

class Degree(Base):
    __tablename__ = "degrees"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), unique=True)
    title = Column(String, nullable=False)
    description = Column(Text, nullable=True)
    credits_required = Column(Integer, default=120)
    credits_completed = Column(Integer, default=0)
    duration_weeks = Column(Integer, default=16)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    user = relationship("User", back_populates="degree")
    courses = relationship("Course", back_populates="degree", cascade="all, delete-orphan")

class Course(Base):
    __tablename__ = "courses"

    id = Column(Integer, primary_key=True, index=True)
    degree_id = Column(Integer, ForeignKey("degrees.id", ondelete="CASCADE"))
    code = Column(String, nullable=False)
    title = Column(String, nullable=False)
    description = Column(Text, nullable=True)
    credits = Column(Integer, default=3)
    difficulty = Column(String, default="Intermediate")
    estimated_hours = Column(Integer, default=20)
    is_completed = Column(Boolean, default=False)
    progress = Column(Float, default=0.0)  # percentage 0 to 100
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    degree = relationship("Degree", back_populates="courses")
    modules = relationship("Module", back_populates="course", cascade="all, delete-orphan")

class Module(Base):
    __tablename__ = "modules"

    id = Column(Integer, primary_key=True, index=True)
    course_id = Column(Integer, ForeignKey("courses.id", ondelete="CASCADE"))
    title = Column(String, nullable=False)
    description = Column(Text, nullable=True)
    order_index = Column(Integer, default=0)
    is_completed = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    course = relationship("Course", back_populates="modules")
    lessons = relationship("Lesson", back_populates="module", cascade="all, delete-orphan")

class Lesson(Base):
    __tablename__ = "lessons"

    id = Column(Integer, primary_key=True, index=True)
    module_id = Column(Integer, ForeignKey("modules.id", ondelete="CASCADE"))
    title = Column(String, nullable=False)
    content = Column(Text, nullable=True)  # Markdown generated text
    textbook_chapter = Column(Text, nullable=True)  # Deep textbooks content
    flashcards_json = Column(Text, nullable=True)  # JSON-string array of flashcards (question/answer)
    summary = Column(Text, nullable=True)
    order_index = Column(Integer, default=0)
    is_completed = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    module = relationship("Module", back_populates="lessons")
    quizzes = relationship("Quiz", back_populates="lesson", cascade="all, delete-orphan")

class Quiz(Base):
    __tablename__ = "quizzes"

    id = Column(Integer, primary_key=True, index=True)
    lesson_id = Column(Integer, ForeignKey("lessons.id", ondelete="CASCADE"))
    questions_json = Column(Text, nullable=False)  # JSON representation of quiz details
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    lesson = relationship("Lesson", back_populates="quizzes")
    attempts = relationship("QuizAttempt", back_populates="quiz", cascade="all, delete-orphan")

class QuizAttempt(Base):
    __tablename__ = "quiz_attempts"

    id = Column(Integer, primary_key=True, index=True)
    quiz_id = Column(Integer, ForeignKey("quizzes.id", ondelete="CASCADE"))
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"))
    answers_json = Column(Text, nullable=False)  # Student answers JSON
    score = Column(Float, nullable=False)  # Percentage score
    passed = Column(Boolean, default=False)
    feedback_json = Column(Text, nullable=True)  # Breakdown feedback from AI
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    quiz = relationship("Quiz", back_populates="attempts")
    user = relationship("User", back_populates="quiz_attempts")

class MemoryNode(Base):
    __tablename__ = "memory_nodes"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"))
    key = Column(String, nullable=False)  # e.g., "python_functions", "algebra_weakness"
    value = Column(Text, nullable=False)  # detailed note
    category = Column(String, nullable=False)  # "strength", "weakness", "mistake", "milestone", "fact"
    confidence_score = Column(Float, default=1.0)  # 0.0 to 1.0 confidence in memory
    updated_at = Column(DateTime, default=datetime.datetime.utcnow, onupdate=datetime.datetime.utcnow)

    user = relationship("User", back_populates="memory_nodes")
