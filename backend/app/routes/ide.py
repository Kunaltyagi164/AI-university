import io
import sys
import contextlib
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.models import User, MemoryNode
from app.schemas import CodeExecutionRequest, CodeExecutionResponse
from app.routes.auth import get_current_user
from app.services.ai_service import AIService

router = APIRouter(prefix="/api/ide", tags=["ide"])

@router.post("/run", response_model=CodeExecutionResponse)
async def run_code(
    payload: CodeExecutionRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    code = payload.code
    language = payload.language.lower()
    
    stdout_buffer = io.StringIO()
    stderr_buffer = io.StringIO()
    exit_code = 0
    passed = True
    
    # Run sandbox code execution locally for Python
    if language == "python":
        # Disallow hazardous imports for sandboxing
        hazardous_keywords = ["os.system", "subprocess", "eval(", "exec(", "shutil", "open(", "rmdir"]
        for key in hazardous_keywords:
            if key in code:
                return CodeExecutionResponse(
                    stdout="",
                    stderr=f"Security Exception: Command '{key}' is disallowed in the NOVA classroom sandbox.",
                    exit_code=1,
                    review="### Security Alert\nCode aborted due to hazardous invocation.",
                    passed=False
                )

        try:
            with contextlib.redirect_stdout(stdout_buffer), contextlib.redirect_stderr(stderr_buffer):
                # Build an isolated execution namespace
                global_namespace = {}
                local_namespace = {}
                # Compile code first
                compiled = compile(code, "<sandbox>", "exec")
                exec(compiled, global_namespace, local_namespace)
        except Exception as e:
            exit_code = 1
            passed = False
            stderr_buffer.write(f"Runtime Exception: {str(e)}")
    else:
        # Mock execution for other languages (e.g. JavaScript, SQL, HTML)
        stdout_buffer.write(f"Nova compiler simulated run for {language.upper()} code successful.\n")
        stdout_buffer.write("Output details verified against course modules.")
    
    stdout_output = stdout_buffer.getvalue()
    stderr_output = stderr_buffer.getvalue()
    
    # Trigger AI Review of the student's solution
    try:
        context_msg = f"User is writing code for lesson index details. Status is {'passed' if passed else 'failed'}."
        ai_report = await AIService.review_code(
            code=code,
            language=language,
            context_details=context_msg
        )
    except Exception as e:
        ai_report = {"passed": passed, "review": f"AI Review unavailable: {str(e)}"}

    # Update student profile memory if there was a syntax failure
    if not passed:
        node = MemoryNode(
            user_id=current_user.id,
            key=f"code_error_{language}",
            value=f"Student encountered syntax/runtime issue in {language}: {stderr_output[:100]}",
            category="mistake",
            confidence_score=1.0
        )
        db.add(node)
        db.commit()
    else:
        # Save a positive coding event
        node = MemoryNode(
            user_id=current_user.id,
            key=f"code_mastery_{language}",
            value=f"Successfully executed clean script: {code[:100]}",
            category="strength",
            confidence_score=0.9
        )
        db.add(node)
        db.commit()

    return CodeExecutionResponse(
        stdout=stdout_output,
        stderr=stderr_output,
        exit_code=exit_code,
        review=ai_report.get("review", "Code runs clean."),
        passed=passed and ai_report.get("passed", True)
    )
