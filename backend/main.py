import json
import os
from pathlib import Path
from typing import Any

from dotenv import load_dotenv
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse, HTMLResponse
from groq import Groq
from pydantic import BaseModel
from pypdf import PdfReader

# ---------------------------------------------------------------------------
# Configuration
# ---------------------------------------------------------------------------
ENV_PATH = Path(__file__).resolve().parent.parent / ".env"
load_dotenv(ENV_PATH)

GROQ_API_KEY = os.getenv("GROQ_API_KEY", "").strip()
if not GROQ_API_KEY:
    raise ValueError(
        "GROQ_API_KEY is missing. Set it in .env at the project root."
    )

client = Groq(api_key=GROQ_API_KEY)
MODEL = os.getenv("GROQ_MODEL", "openai/gpt-oss-20b")

RESUME_PDF_PATH = Path(__file__).resolve().parent / "my_resume.pdf"
CACHE_PATH = Path(__file__).resolve().parent / "my_resume_cache.json"

# ---------------------------------------------------------------------------
# Pydantic Schemas
# ---------------------------------------------------------------------------
class Experience(BaseModel):
    company: str | None = None
    role: str | None = None
    duration: str | None = None
    description: str | None = None
    skills_used: list[str] = []


class Resume(BaseModel):
    name: str | None = "Yash Kumar Singh"
    email: str | None = None
    phone: str | None = None
    total_experience_years: float | None = None
    skills: list[str] = []
    experiences: list[Experience] = []
    education: list[str] = []
    projects: list[Any] = []
    achievements: list[str] = []


class ChatRequest(BaseModel):
    question: str


class ChatResponse(BaseModel):
    answer: str
    candidate_name: str | None = None


# ---------------------------------------------------------------------------
# Resume Parsing with disk caching
# ---------------------------------------------------------------------------
def read_pdf(file_path: Path) -> str:
    reader = PdfReader(file_path)
    text = ""
    for page in reader.pages:
        page_text = page.extract_text()
        if page_text:
            text += page_text + "\n"
    return text.strip()


def parse_resume_with_llm(resume_text: str) -> Resume:
    prompt = f"""You are a resume extractor. Extract structured information from the resume below.
Return a valid JSON object with the following keys:
- name (string)
- email (string)
- phone (string)
- total_experience_years (number or null)
- skills (list of strings, include all languages, frameworks, tools, databases, and concepts)
- education (list of strings)
- experiences (list of objects with company, role, duration, description, skills_used)
- projects (list of objects with name and description)
- achievements (list of strings)

Resume:
{resume_text}
"""

    response = client.chat.completions.create(
        model=MODEL,
        messages=[
            {"role": "user", "content": prompt},
        ],
        response_format={"type": "json_object"},
    )
    data = json.loads(response.choices[0].message.content)
    return Resume(**data)


def get_or_parse_resume() -> Resume:
    """Load parsed resume from local JSON cache if fresh; otherwise parse with Groq LLM and cache."""
    if not RESUME_PDF_PATH.exists():
        raise FileNotFoundError(f"Resume PDF not found at {RESUME_PDF_PATH}")

    if CACHE_PATH.exists() and CACHE_PATH.stat().st_mtime >= RESUME_PDF_PATH.stat().st_mtime:
        try:
            with open(CACHE_PATH, "r", encoding="utf-8") as f:
                data = json.load(f)
            parsed = Resume(**data)
            if parsed.skills:  # verified non-empty
                print(f"⚡ Loaded resume from cache for: {parsed.name} ({len(parsed.skills)} skills)")
                return parsed
        except Exception as e:
            print(f"⚠️ Cache read error ({e}), re-parsing with LLM...")

    print(f"📄 Loading resume from: {RESUME_PDF_PATH}")
    text = read_pdf(RESUME_PDF_PATH)
    print(f"🤖 Parsing resume with LLM ({MODEL})...")
    parsed = parse_resume_with_llm(text)

    try:
        with open(CACHE_PATH, "w", encoding="utf-8") as f:
            json.dump(parsed.model_dump(), f, indent=2)
        print(f"💾 Saved parsed resume to cache: {CACHE_PATH}")
    except Exception as e:
        print(f"⚠️ Could not write cache: {e}")

    return parsed


# Parse once at module load
PARSED_RESUME = get_or_parse_resume()
print(f"✅ Ready for candidate: {PARSED_RESUME.name}")


# ---------------------------------------------------------------------------
# Chat Logic
# ---------------------------------------------------------------------------
def ask_candidate(question: str, resume: Resume) -> str:
    system_prompt = f"""You are an AI assistant representing a job candidate named {resume.name}.
You are embedded in the candidate's portfolio website. Recruiters and hiring managers
will ask you questions about the candidate.

Here is everything you know about the candidate:
{resume.model_dump_json(indent=2)}

Rules:
1. Answer ONLY using the information above.
2. Never make up facts, projects, or skills that are not listed.
3. If information is unavailable, say "I don't have that specific detail in my resume, but feel free to reach out to me directly at {resume.email}!"
4. Be professional, friendly, articulate, and concise.
5. Answer as if you ARE the candidate speaking in first person ("I have experience in...", "My projects include...").
6. When listing skills or projects, format them cleanly with bullet points.
7. If asked about contact info, share the email ({resume.email}) and phone ({resume.phone}) from the resume."""

    response = client.chat.completions.create(
        model=MODEL,
        messages=[
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": question},
        ],
    )
    return response.choices[0].message.content


# ---------------------------------------------------------------------------
# FastAPI Application
# ---------------------------------------------------------------------------
app = FastAPI(
    title="Resume Chatbot API",
    description="AI-powered portfolio chatbot that answers recruiter questions from resume data.",
)

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/api/health")
def health():
    return {
        "status": "ok",
        "candidate": PARSED_RESUME.name,
        "skills_count": len(PARSED_RESUME.skills),
        "model": MODEL,
    }


@app.get("/api/resume")
def get_resume():
    """Return the parsed resume data for the frontend to display."""
    return PARSED_RESUME.model_dump()


@app.get("/api/resume-pdf")
def get_resume_pdf():
    """Download the actual PDF resume."""
    if not RESUME_PDF_PATH.exists():
        return {"error": "Resume PDF not found"}
    return FileResponse(
        RESUME_PDF_PATH,
        media_type="application/pdf",
        filename="Yash_Kumar_Singh_Resume.pdf"
    )


@app.post("/api/chat", response_model=ChatResponse)
def chat(request: ChatRequest):
    """Answer a recruiter's question about the candidate."""
    answer = ask_candidate(request.question, PARSED_RESUME)
    return ChatResponse(answer=answer, candidate_name=PARSED_RESUME.name)


# ---------------------------------------------------------------------------
# Serve Frontend Static Files
# ---------------------------------------------------------------------------
FRONTEND_DIR = Path(__file__).resolve().parent.parent / "frontend"

if FRONTEND_DIR.exists():
    @app.get("/", response_class=HTMLResponse)
    def serve_index():
        index_file = FRONTEND_DIR / "index.html"
        if index_file.exists():
            return HTMLResponse(content=index_file.read_text(encoding="utf-8"))
        return HTMLResponse(content="<h1>Frontend index.html not found</h1>", status_code=404)

    app.mount("/static", StaticFiles(directory=str(FRONTEND_DIR)), name="static")
