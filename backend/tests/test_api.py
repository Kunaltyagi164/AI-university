import os
import sys
import pytest
from fastapi.testclient import TestClient

# Adjust path to import app correctly
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from main import app
from app.core.database import Base, engine

# Ensure we test with a clean SQLite DB
Base.metadata.create_all(bind=engine)
client = TestClient(app)

def test_root_status():
    response = client.get("/")
    assert response.status_code == 200
    assert response.json()["status"] == "online"
    assert "NOVA" in response.json()["name"]

def test_auth_and_onboarding():
    # 1. Sign up a test student
    signup_data = {
        "email": "student@nova.edu",
        "password": "strongpassword123",
        "full_name": "Test Scholar"
    }
    resp = client.post("/api/auth/signup", json=signup_data)
    assert resp.status_code == 200
    data = resp.json()
    assert "access_token" in data
    token = data["access_token"]
    headers = {"Authorization": f"Bearer {token}"}

    # 2. Get current user details
    me_resp = client.get("/api/auth/me", headers=headers)
    assert me_resp.status_code == 200
    assert me_resp.json()["email"] == "student@nova.edu"

    # 3. Submit onboarding to compile degree
    onboarding_data = {
        "career_goal": "Become a Senior ML Engineer",
        "current_skills": "python, basics",
        "learning_speed": "normal",
        "preferred_language": "English",
        "preferred_teaching_style": "socratic",
        "available_hours_per_day": 3.0
      }
    onb_resp = client.post("/api/onboarding/submit", json=onboarding_data, headers=headers)
    assert onb_resp.status_code == 200
    degree = onb_resp.json()
    assert "courses" in degree
    assert len(degree["courses"]) == 4

def test_ide_sandbox():
    signup_data = {
        "email": "ide_student@nova.edu",
        "password": "strongpassword123",
        "full_name": "IDE Scholar"
    }
    resp = client.post("/api/auth/signup", json=signup_data)
    token = resp.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}

    # Test execution of normal code
    code_payload = {
        "code": "nums = [1, 2, 3]\nresult = [n*2 for n in nums]\nprint('Evens:', result)",
        "language": "python"
    }
    run_resp = client.post("/api/ide/run", json=code_payload, headers=headers)
    assert run_resp.status_code == 200
    assert "Evens: [2, 4, 6]" in run_resp.json()["stdout"]
    assert run_resp.json()["exit_code"] == 0

    # Test hazardous input abort
    dangerous_payload = {
        "code": "import os\nos.system('echo hack')",
        "language": "python"
    }
    dang_resp = client.post("/api/ide/run", json=dangerous_payload, headers=headers)
    assert dang_resp.status_code == 200
    assert dang_resp.json()["passed"] is False
    assert "disallowed in the NOVA classroom sandbox" in dang_resp.json()["stderr"]
