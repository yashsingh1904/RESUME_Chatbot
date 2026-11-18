@echo off
cd /d "%~dp0"
echo Starting Yash Kumar Singh's AI Resume Portfolio Chatbot...
echo Frontend & API will be live at: http://localhost:8000
.venv\Scripts\uvicorn.exe backend.main:app --host 127.0.0.1 --port 8000 --reload
pause

