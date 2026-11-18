import sys
from pathlib import Path

# Add project root to Python module search path
ROOT_DIR = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(ROOT_DIR))

# Export the FastAPI app instance for Vercel Serverless Functions
from backend.main import app
