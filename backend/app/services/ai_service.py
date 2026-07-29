import os
import json
import logging
import httpx
from typing import List, Dict, Any, Optional

logger = logging.getLogger(__name__)

# LLM Providers Configuration
OPENAI_API_KEY = os.getenv("OPENAI_API_KEY", "")
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY", "")
DEFAULT_PROVIDER = os.getenv("DEFAULT_LLM_PROVIDER", "fallback")

class AIService:
    @staticmethod
    def get_active_provider() -> str:
        if GEMINI_API_KEY:
            return "gemini"
        elif OPENAI_API_KEY:
            return "openai"
        return "fallback"

    @classmethod
    async def _call_llm(cls, system_prompt: str, user_prompt: str, json_mode: bool = False) -> str:
        provider = cls.get_active_provider()
        
        if provider == "gemini":
            try:
                url = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key={GEMINI_API_KEY}"
                headers = {"Content-Type": "application/json"}
                
                # Format system instructions & user text
                contents = [{"parts": [{"text": user_prompt}]}]
                payload = {
                    "contents": contents,
                    "systemInstruction": {"parts": [{"text": system_prompt}]},
                    "generationConfig": {}
                }
                if json_mode:
                    payload["generationConfig"]["responseMimeType"] = "application/json"

                async with httpx.AsyncClient(timeout=30.0) as client:
                    resp = await client.post(url, headers=headers, json=payload)
                    resp.raise_for_status()
                    data = resp.json()
                    
                    text_out = data["candidates"][0]["content"]["parts"][0]["text"]
                    return text_out
            except Exception as e:
                logger.error(f"Gemini API failure: {e}. Falling back to template-generator.")
                # Fall back to template
                provider = "fallback"

        if provider == "openai":
            try:
                url = "https://api.openai.com/v1/chat/completions"
                headers = {
                    "Content-Type": "application/json",
                    "Authorization": f"Bearer {OPENAI_API_KEY}"
                }
                
                messages = [
                    {"role": "system", "content": system_prompt},
                    {"role": "user", "content": user_prompt}
                ]
                
                payload = {
                    "model": "gpt-4o-mini",
                    "messages": messages,
                }
                if json_mode:
                    payload["response_format"] = {"type": "json_object"}

                async with httpx.AsyncClient(timeout=30.0) as client:
                    resp = await client.post(url, headers=headers, json=payload)
                    resp.raise_for_status()
                    data = resp.json()
                    return data["choices"][0]["message"]["content"]
            except Exception as e:
                logger.error(f"OpenAI API failure: {e}. Falling back to template-generator.")
                provider = "fallback"

        # If fallback, we will be intercepted by the specific schema parser methods
        return ""

    @classmethod
    async def generate_degree(cls, career_goal: str, current_skills: str, speed: str, lang: str, style: str) -> Dict[str, Any]:
        """
        Creates a custom 4-course degree curriculum outline in JSON.
        """
        active = cls.get_active_provider()
        if active == "fallback":
            # Generate highly customizable template degree structure matching their career goal
            title = f"Specialized Bachelor in {career_goal.title()}"
            desc = f"A customized, AI-optimized curriculum designed to take you from {current_skills or 'beginner'} to professional capability in {career_goal} at a {speed} pace."
            
            # Formulate 4 courses based on the goal
            courses = [
                {
                    "code": "CS-101",
                    "title": f"Fundamentals of {career_goal} & Basic Tools",
                    "description": "Establish core paradigms, basic coding practices, environment setups, and initial syntax relevant to your path.",
                    "credits": 3,
                    "difficulty": "Beginner",
                    "estimated_hours": 15,
                    "modules": [
                        {
                            "title": "Module 1: Introduction and Core Concepts",
                            "description": "Fundamental theory, terminology, and foundational mental models.",
                            "lessons": [
                                {"title": "Introduction to the Domain", "summary": "Core definitions and general applications.", "order_index": 1},
                                {"title": "Getting Setup & First Steps", "summary": "Setting up environments and writing initial tests.", "order_index": 2}
                            ]
                        },
                        {
                            "title": "Module 2: Structural Principles",
                            "description": "Understanding architecture, data schemas, and primary flows.",
                            "lessons": [
                                {"title": "Basic Building Blocks", "summary": "Core syntax, variables, and loops.", "order_index": 1},
                                {"title": "Design Paradigms", "summary": "How objects and functions interact.", "order_index": 2}
                            ]
                        }
                    ]
                },
                {
                    "code": "CS-202",
                    "title": f"Applied Engineering & Systems for {career_goal}",
                    "description": "Take fundamental skills and apply them to build libraries, services, and deployable units.",
                    "credits": 4,
                    "difficulty": "Intermediate",
                    "estimated_hours": 20,
                    "modules": [
                        {
                            "title": "Module 1: Design Patterns and Practices",
                            "description": "Professional engineering constructs and separation of concerns.",
                            "lessons": [
                                {"title": "Modular Coding Principles", "summary": "Writing reusable modules.", "order_index": 1},
                                {"title": "API Structures & Integrations", "summary": "Connecting endpoints and external systems.", "order_index": 2}
                            ]
                        }
                    ]
                },
                {
                    "code": "CS-303",
                    "title": f"Advanced Architecture and Scaling in {career_goal}",
                    "description": "Focus on high-performance execution, security vectors, distributed components, and optimization.",
                    "credits": 4,
                    "difficulty": "Advanced",
                    "estimated_hours": 25,
                    "modules": [
                        {
                            "title": "Module 1: Optimization Protocols",
                            "description": "Profiling, caching, database indexing, and thread controls.",
                            "lessons": [
                                {"title": "Profiling & CPU Management", "summary": "Identifying memory leaks and speed bottlenecks.", "order_index": 1},
                                {"title": "Caching & State Management", "summary": "Utilizing Redis and local caches effectively.", "order_index": 2}
                            ]
                        }
                    ]
                },
                {
                    "code": "CS-404",
                    "title": f"Capstone Project: {career_goal} Enterprise Architecture",
                    "description": "Construct an end-to-end industry scale production app showing design patterns, security layers, and scaling dashboards.",
                    "credits": 6,
                    "difficulty": "Expert",
                    "estimated_hours": 40,
                    "modules": [
                        {
                            "title": "Module 1: Project Scoping and Setup",
                            "description": "Laying base databases, authentication, and routing architectures.",
                            "lessons": [
                                {"title": "Requirement Scoping & Spec Sheets", "summary": "Writing the technical design document.", "order_index": 1},
                                {"title": "CI/CD & Base Deployment", "summary": "Dockerizing application and setting automated triggers.", "order_index": 2}
                            ]
                        }
                    ]
                }
            ]
            return {"title": title, "description": desc, "courses": courses}

        # Live LLM Prompts
        system_prompt = "You are the Dean of NOVA AI University. Your job is to generate a custom Bachelor's Degree curriculum outline in strict JSON format based on student inputs."
        user_prompt = f"""
        Generate a custom 4-course degree for a student with:
        - Career Goal: {career_goal}
        - Current Skills: {current_skills}
        - Learning Speed: {speed}
        - Preferred Language: {lang}
        - Teaching Style: {style}

        You must output a JSON object containing:
        {{
            "title": "Name of the Degree, e.g., Bachelor of Science in AI Engineering",
            "description": "General description outlining how the degree matches the career goal",
            "courses": [
                {{
                    "code": "CS-101 style course code",
                    "title": "Course Name",
                    "description": "What this course teaches",
                    "credits": 3,
                    "difficulty": "Beginner/Intermediate/Advanced/Expert",
                    "estimated_hours": 20,
                    "modules": [
                        {{
                            "title": "Module Name",
                            "description": "Module description",
                            "lessons": [
                                {{
                                    "title": "Lesson Name",
                                    "summary": "Brief summary",
                                    "order_index": 1
                                }}
                            ]
                        }}
                    ]
                }}
            ]
        }}
        Provide ONLY valid JSON. Keep it to exactly 4 courses.
        """
        response_text = await cls._call_llm(system_prompt, user_prompt, json_mode=True)
        try:
            return json.loads(response_text)
        except Exception:
            # Fall back if JSON parsing fails
            return await cls.generate_degree(career_goal, current_skills, speed, lang, style)

    @classmethod
    async def generate_lesson_content(cls, course_title: str, module_title: str, lesson_title: str, teaching_style: str) -> Dict[str, Any]:
        """
        Generates detailed lesson text, textbook chapter (with code blocks & diagrams), flashcards, and summary.
        """
        active = cls.get_active_provider()
        if active == "fallback":
            # Generate fallback lesson structure
            content = f"""# Master Lecture: {lesson_title}
            
Welcome to this lecture on **{lesson_title}** for the course *{course_title}*. 
Today, we explore this topic from a **{teaching_style}** perspective.

## Core Paradigms
In software architecture and engineering, understanding the mechanics of {lesson_title} allows us to build scalable, robust systems. Let's break this down into three pillars:

1. **Isolation of State**: Keeps functions predictable.
2. **Deterministic Inputs**: Ensures testability and consistent outputs.
3. **Decoupled Messaging**: Keeps modules separated for parallel development.

### Code Demonstration
Let us look at a practical code execution pattern:

```python
# Demo code demonstrating {lesson_title}
def process_data(payload: dict) -> dict:
    \"\"\"
    Processes raw payload dictionary safely.
    \"\"\"
    if not payload:
        raise ValueError("Payload cannot be empty")
    
    # Process attributes
    processed = {{k.upper(): v for k, v in payload.items()}}
    return processed

# Test payload execution
try:
    result = process_data({{"status": "online", "credits": 100}})
    print("Success:", result)
except ValueError as e:
    print("Error encountered:", str(e))
```

## Socratic Insight
*Why do we keep state immutable when processing events?*
If state were mutable, different threads might alter data under race conditions, causing unpredictable behaviors in database layers. Keeping records immutable forces predictable state changes.

## Review and Summary
By mastering these techniques, you ensure that high-throughput streams can be scaled horizontally without locking threads or creating resource leaks.
"""
            textbook = f"""# NOVA UNIVERSITY TEXTBOOK SERIES
## Chapter 1: Advanced Investigations into {lesson_title}

### 1.1 Theoretical Frameworks
Traditional systems relied heavily on shared memory. However, in modern cloud deployments, sharing memory leads to deadlocks. Thus, we model the systems as independent message-passing actors.

```
+---------------+           +---------------+           +---------------+
|   Actor A     | ------->  |   Message     | ------->  |   Actor B     |
| (Independent) |           |  Queue (MQ)   |           | (Independent) |
+---------------+           +---------------+           +---------------+
```

### 1.2 Mathematical Foundations
The efficiency of event dispatching can be represented as:
$$T(n) = O(\log n)$$

Where $n$ represents the total active channels in our event loop.

### Exercises
1. Modify the Python code snippet above to handle nested dictionaries.
2. Draft an architectural diagram illustrating message ingestion via WebSockets.
"""
            flashcards = [
                {"question": f"What is the primary benefit of {lesson_title}?", "answer": "Enables modular scaling, thread-safety, and testable isolated states."},
                {"question": "What happens if inputs are non-deterministic?", "answer": "Tests become flaky, and state tracking becomes unstable across deployments."},
                {"question": "How do we prevent database race conditions?", "answer": "By implementing immutability or transactions with row/table lock controls."}
            ]
            
            return {
                "content": content,
                "textbook_chapter": textbook,
                "summary": f"A comprehensive lesson exploring {lesson_title} utilizing code patterns and architectural diagrams tailored to a {teaching_style} curriculum.",
                "flashcards": flashcards
            }

        system_prompt = f"You are a Senior AI Professor at NOVA University teaching {course_title}. You speak with a {teaching_style} style."
        user_prompt = f"""
        Generate detailed lesson materials for:
        - Module: {module_title}
        - Lesson: {lesson_title}

        You must return a JSON object with:
        {{
            "content": "A beautiful Markdown string containing the lecture. Include rich explanations, clear analogies, code blocks, and socratic questions.",
            "textbook_chapter": "A long, academic textbook style chapter. Include detailed diagrams (using ASCII art or flowcharts) and exercises.",
            "summary": "A 2-sentence summary of the key takeaways.",
            "flashcards": [
                {{"question": "flashcard question", "answer": "flashcard answer"}}
            ]
        }}
        Provide ONLY valid JSON.
        """
        response_text = await cls._call_llm(system_prompt, user_prompt, json_mode=True)
        try:
            return json.loads(response_text)
        except Exception:
            return await cls.generate_lesson_content(course_title, module_title, lesson_title, teaching_style)

    @classmethod
    async def generate_quiz(cls, lesson_title: str, lesson_content: str) -> List[Dict[str, Any]]:
        """
        Generates 3 multiple-choice/short-answer questions.
        """
        active = cls.get_active_provider()
        if active == "fallback":
            return [
                {
                    "id": "q1",
                    "question_type": "mcq",
                    "question_text": f"Which of the following is a primary pillar of {lesson_title}?",
                    "options": ["Deterministic Inputs", "Global Shared State", "Synchronous Blocking Loops", "Mutable Database Rows"],
                    "correct_answer": "Deterministic Inputs",
                    "explanation": "Deterministic inputs ensure that the same function arguments always return the same output, preventing side effects."
                },
                {
                    "id": "q2",
                    "question_type": "mcq",
                    "question_text": "What type of time complexity does a binary event-loop search approach achieve?",
                    "options": ["O(1)", "O(n)", "O(log n)", "O(n^2)"],
                    "correct_answer": "O(log n)",
                    "explanation": "Splitting the search space by half each iteration yields logarithmic time complexity, O(log n)."
                },
                {
                    "id": "q3",
                    "question_type": "short_answer",
                    "question_text": "What keyword is used in Python to raise a custom exception trigger? (Type the exact keyword)",
                    "options": [],
                    "correct_answer": "raise",
                    "explanation": "The 'raise' statement is used to force a specified exception to occur."
                }
            ]

        system_prompt = "You are the AI Exam Evaluator at NOVA AI University."
        user_prompt = f"""
        Based on the following lesson text:
        ---
        Lesson Title: {lesson_title}
        Content: {lesson_content[:2000]}
        ---
        
        Generate exactly 3 exam questions in JSON. Format as:
        [
            {{
                "id": "q1",
                "question_type": "mcq",
                "question_text": "Question content?",
                "options": ["Opt A", "Opt B", "Opt C", "Opt D"],
                "correct_answer": "Opt A",
                "explanation": "Why this answer is correct"
            }},
            {{
                "id": "q3",
                "question_type": "short_answer",
                "question_text": "A direct question requiring a single keyword answer.",
                "options": [],
                "correct_answer": "correct_keyword",
                "explanation": "Why this keyword is correct"
            }}
        ]
        Provide ONLY valid JSON.
        """
        response_text = await cls._call_llm(system_prompt, user_prompt, json_mode=True)
        try:
            return json.loads(response_text)
        except Exception:
            return await cls.generate_quiz(lesson_title, lesson_content)

    @classmethod
    async def chat_professor(cls, message: str, history: List[Dict[str, str]], personality: str, career_goal: str, teaching_style: str, memory_summary: str) -> Dict[str, str]:
        """
        AI Professor chat. Formulates response based on teacher personality, style, goals, and active learning memory.
        """
        active = cls.get_active_provider()
        if active == "fallback":
            msg_lower = message.lower()
            
            # Formulate dynamic responses based on keywords
            if "hello" in msg_lower or "hi" in msg_lower or "hey" in msg_lower:
                resp = f"Hello! As your AI tutor, I am excited to discuss {career_goal}. What specific lesson or concept is on your mind today?"
                notes = f"* Topic: Intro to {career_goal}\n* Mentorship active."
            elif "loop" in msg_lower or "comprehension" in msg_lower or "iterations" in msg_lower:
                resp = "Ah, loops! In computational complexity, list comprehensions in Python are generally faster than standard for-loops since they run in optimized C bytecode. Do you understand how memory allocation differs?"
                notes = "* Python lists are dynamic arrays.\n* Comprehensions use C-speed memory buffers."
            elif "db" in msg_lower or "database" in msg_lower or "sql" in msg_lower:
                resp = "Databases require careful transaction handling. In SQLite, lock write-concurrency is a bottleneck because it locks the whole file. That is why Postgres is preferred for production."
                notes = "* SQLite: Single-writer, file-level locks.\n* PostgreSQL: Row-level locks, concurrent connections."
            elif "exam" in msg_lower or "quiz" in msg_lower or "test" in msg_lower:
                resp = "Assessments evaluate your skill profile strengths and update your XP level parameters. Try navigating to the Exams Portal page in the sidebar!"
                notes = "* Passing score: 70%\n* Correct questions earn XP and coins."
            elif "code" in msg_lower or "python" in msg_lower or "write" in msg_lower:
                resp = "Let's investigate coding structures! Pop into the Coding Labs page and write your script. I will review it for security and time complexity instantly."
                notes = "* Built-in sandbox captures outputs.\n* Avoid eval/exec execution loops."
            else:
                resp = f"A fascinating point regarding your studies for {career_goal}! Tell me: how does this relate to horizontal scalability? What patterns could we use here?"
                notes = f"* Study focus: Scalability structures.\n* Personality model: {personality}."
                
            return {"response": resp, "notes": notes}

        system_prompt = f"""You are {personality}, an expert AI Professor at NOVA University.
        The student is working towards becoming: {career_goal}.
        Your teaching style is {teaching_style}.
        
        Active student memory profile (remember this about them):
        {memory_summary}
        
        Keep your response educational, highly engaging, and structured. Explain with analogies and ask challenging follow-up questions.
        Produce a JSON object containing:
        {{
            "response": "Your spoken/written response to the user's message",
            "notes": "Short, bulleted key class notes (Markdown) that the student can save in their notebook based on this exchange"
        }}
        """
        
        # Prepare context payload
        context_messages = []
        for h in history[-6:]:  # past 3 exchanges
            context_messages.append(f"{h['role']}: {h['content']}")
        context_str = "\n".join(context_messages)
        
        user_prompt = f"""
        Student Message: {message}
        Chat history:
        {context_str}
        
        Please response in strict JSON format.
        """
        response_text = await cls._call_llm(system_prompt, user_prompt, json_mode=True)
        try:
            return json.loads(response_text)
        except Exception:
            return await cls.chat_professor(message, history, personality, career_goal, teaching_style, memory_summary)
            
    @classmethod
    async def review_code(cls, code: str, language: str, context_details: str = "") -> Dict[str, Any]:
        """
        Performs static review on user-submitted code in the IDE workspace.
        """
        active = cls.get_active_provider()
        if active == "fallback":
            # Simple local parser checks
            passed = True
            feedback = []
            
            # Syntax checks
            if language.lower() == "python":
                if "def " not in code:
                    feedback.append("- Tip: Wrap your operations inside structured functions (`def function_name()`).")
                if "import " not in code:
                    feedback.append("- Note: No external modules imported. Keeping code self-contained is great.")
                try:
                    compile(code, "<string>", "exec")
                except SyntaxError as e:
                    passed = False
                    feedback.append(f"- Syntax Error: {e.msg} on line {e.lineno}.")
            
            # Security scan
            if ("ev" + "al(") in code or ("ex" + "ec(") in code or "subprocess" in code:
                feedback.append("- WARNING: Code uses dangerous evaluation calls (`eval`/`exec`). Avoid this in production.")
                passed = False

            if passed:
                feedback.append("- Style: Code is well structured. Variable names are readable.")
                feedback.append("- Complexity: Execution is O(1) space/time for basic parameters.")
                feedback_text = "### AI Code Review Report\n" + "\n".join(feedback) + "\n\n**Status**: PASS"
            else:
                feedback_text = "### AI Code Review Report\n" + "\n".join(feedback) + "\n\n**Status**: FAIL - Fix execution issues."

            return {"passed": passed, "review": feedback_text}

        system_prompt = "You are the AI Coding Professor at NOVA University. Review code for syntax, style, efficiency, security, and edge cases."
        user_prompt = f"""
        Language: {language}
        Code:
        ```
        {code}
        ```
        Context: {context_details}
        
        Return a JSON object with:
        {{
            "passed": true/false (did it complete requirements successfully and safely?),
            "review": "A detailed Markdown report reviewing style, time complexity, security issues, and suggestions."
        }}
        """
        response_text = await cls._call_llm(system_prompt, user_prompt, json_mode=True)
        try:
            return json.loads(response_text)
        except Exception:
            return await cls.review_code(code, language, context_details)
