import os
from pathlib import Path

BASE_DIR = Path(__file__).resolve().parent

# Check if MySQL is available or explicitly configured via environment variable
MYSQL_USER = os.getenv("MYSQL_USER", "root")
MYSQL_PASSWORD = os.getenv("MYSQL_PASSWORD", "")
MYSQL_HOST = os.getenv("MYSQL_HOST", "localhost")
MYSQL_PORT = os.getenv("MYSQL_PORT", "3306")
MYSQL_DB = os.getenv("MYSQL_DB", "supershop")

# Primary or fallback DB URL
DEFAULT_SQLITE_URL = f"sqlite:///{BASE_DIR / 'supershop.db'}"
MYSQL_URL = f"mysql+pymysql://{MYSQL_USER}:{MYSQL_PASSWORD}@{MYSQL_HOST}:{MYSQL_PORT}/{MYSQL_DB}"

# Use environment override if set, else check MySQL or fallback
DATABASE_URL = os.getenv("DATABASE_URL", "")

SECRET_KEY = os.getenv("SECRET_KEY", "sushop-secret-jwt-key-2026-fastapi-secure")
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 60 * 24 * 7  # 7 days

UPLOAD_DIR = BASE_DIR / "uploads"
UPLOAD_DIR.mkdir(parents=True, exist_ok=True)

