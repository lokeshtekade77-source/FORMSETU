import sys
import os

# Resolve absolute directory paths
api_dir = os.path.dirname(os.path.abspath(__file__))
root_dir = os.path.dirname(api_dir)
backend_dir = os.path.join(root_dir, "backend")

# Ensure backend and root directories are at the head of Python path
if backend_dir not in sys.path:
    sys.path.insert(0, backend_dir)
if root_dir not in sys.path:
    sys.path.insert(0, root_dir)

# Set current working directory to backend folder for relative path safety
try:
    os.chdir(backend_dir)
except Exception:
    pass

# Import FastAPI instance with IDE linter ignore directive
try:
    from app.main import app  # type: ignore
except ImportError:
    from backend.app.main import app  # type: ignore

# Alias handler for Vercel serverless runtime compatibility
handler = app
