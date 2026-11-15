import os
import logging
from sqlalchemy import create_engine, event
from sqlalchemy.pool import QueuePool
from sqlalchemy.orm import declarative_base, sessionmaker
from config import DATABASE_URL, MYSQL_URL, DEFAULT_SQLITE_URL

logger = logging.getLogger("uvicorn")

Base = declarative_base()

def get_engine():
    target_url = DATABASE_URL
    if not target_url:
        # Try MySQL first if configured or available
        try:
            test_engine = create_engine(
                MYSQL_URL,
                poolclass=QueuePool,
                pool_size=50,
                max_overflow=100,
                pool_timeout=60,
                pool_pre_ping=True,
                connect_args={"connect_timeout": 2}
            )
            with test_engine.connect():
                logger.info(f"Connected successfully to MySQL at {MYSQL_URL}")
                return test_engine
        except Exception as e:
            logger.info(f"MySQL connection unavailable ({e}); falling back smoothly to SQLite: {DEFAULT_SQLITE_URL}")
            target_url = DEFAULT_SQLITE_URL
    
    if target_url.startswith("sqlite"):
        sqlite_engine = create_engine(
            target_url,
            connect_args={"check_same_thread": False, "timeout": 30},
            poolclass=QueuePool,
            pool_size=50,
            max_overflow=100,
            pool_timeout=60,
            pool_pre_ping=True
        )
        @event.listens_for(sqlite_engine, "connect")
        def set_sqlite_pragma(dbapi_connection, connection_record):
            cursor = dbapi_connection.cursor()
            cursor.execute("PRAGMA journal_mode=WAL")
            cursor.execute("PRAGMA synchronous=NORMAL")
            cursor.execute("PRAGMA busy_timeout=30000")
            cursor.close()
        return sqlite_engine

    return create_engine(
        target_url,
        poolclass=QueuePool,
        pool_size=50,
        max_overflow=100,
        pool_timeout=60,
        pool_pre_ping=True
    )

engine = get_engine()
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

