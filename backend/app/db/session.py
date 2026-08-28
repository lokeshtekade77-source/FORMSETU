import os
from collections.abc import Generator
from pydantic_settings import BaseSettings
from sqlalchemy import create_engine
from sqlalchemy.orm import Session, sessionmaker

is_vercel = os.getenv("VERCEL") is not None
default_db_url = "sqlite:////tmp/formsetu.db" if is_vercel else "sqlite:///./formsetu.db"
default_storage_path = "/tmp/storage" if is_vercel else "./storage"

class Settings(BaseSettings):
    database_url: str = default_db_url
    cors_origins: str = "http://localhost:3000"
    document_storage_path: str = default_storage_path
    class Config: env_file = ".env"
settings = Settings()
connect_args = {"check_same_thread": False} if settings.database_url.startswith("sqlite") else {}
engine = create_engine(settings.database_url, connect_args=connect_args)
SessionLocal = sessionmaker(bind=engine, autocommit=False, autoflush=False)
def get_db() -> Generator[Session, None, None]:
    db = SessionLocal()
    try: yield db
    finally: db.close()
