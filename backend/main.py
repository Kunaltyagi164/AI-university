import uvicorn
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.core.database import engine, Base
from app.routes import auth, onboarding, course, professor, ide, exams, research, admin, certificates

# Create database tables automatically for SQLite
Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="NOVA AI University API",
    description="Backend services for the world's first complete AI-powered digital university.",
    version="1.0.0"
)

# Enable CORS for local Next.js frontend calls
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # For development ease, restrict in production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mount Routes
app.include_router(auth.router)
app.include_router(onboarding.router)
app.include_router(course.router)
app.include_router(professor.router)
app.include_router(ide.router)
app.include_router(exams.router)
app.include_router(research.router)
app.include_router(admin.router)
app.include_router(certificates.router)

@app.get("/")
def root():
    return {
        "status": "online",
        "name": "NOVA AI University Backend",
        "version": "1.0.0",
        "health": "excellent"
    }

if __name__ == "__main__":
    uvicorn.run("main:app", host="127.0.0.1", port=8000, reload=True)
