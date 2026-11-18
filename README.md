# 🤖 Yash Kumar Singh — AI Resume Portfolio Chatbot

An interactive AI portfolio chatbot powered by FastAPI and Groq LLM. It parses your resume (PDF) and answers recruiter questions in real-time about your skills, projects, experience, education, and achievements.

---

## 🌟 Features

- **Automated Resume Ingestion**: Reads `backend/my_resume.pdf` and parses all 38+ technical skills, work experiences, projects, and achievements.
- **Smart Disk Caching**: Parsed resume is cached to `my_resume_cache.json` for near-instant (0.01s) server startup.
- **Candidate Persona Chatbot**: Answers in the first person ("I built...", "My experience includes...") strictly based on verified resume data with zero hallucination.
- **Interactive Recruiter Frontend**: Modern dark-mode UI with animated background glow, quick-prompt buttons, active skill tags, and direct PDF resume download.
- **Unified Single-Port Serving**: FastAPI serves both the REST API (`/api/chat`, `/api/resume`, `/api/resume-pdf`) and the interactive frontend on port 8000.

---

## 🚀 How to Run Locally

### Option 1: Double-Click Launcher
Double-click:
👉 **`run.bat`**

### Option 2: Terminal Command
```bash
cd c:\dev\AI_PROJECT\resume_chatbot
.venv\Scripts\uvicorn.exe backend.main:app --host 127.0.0.1 --port 8000 --reload
```

Then open your browser at:
👉 **`http://localhost:8000`**

---

## 📡 API Endpoints

- `GET /` — Serves the interactive portfolio chat frontend
- `GET /api/health` — Checks API health and parsed candidate details
- `GET /api/resume` — Returns parsed resume JSON structure
- `GET /api/resume-pdf` — Downloads the actual PDF resume
- `POST /api/chat` — Body: `{"question": "Tell me about your rocketry avionics experience"}`

