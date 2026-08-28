from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.db.base import Base
from app.db.session import engine, settings
from app.api.routes import router
from app import models
Base.metadata.create_all(bind=engine)

with engine.connect() as conn:
    try:
        from sqlalchemy import text
        conn.execute(text("ALTER TABLE applications ADD COLUMN application_mode VARCHAR(30) DEFAULT 'DEMO'"))
        conn.commit()
    except Exception:
        pass
    try:
        from sqlalchemy import text
        conn.execute(text("ALTER TABLE application_documents ADD COLUMN compression_acknowledged BOOLEAN DEFAULT 0"))
        conn.commit()
    except Exception:
        pass

app=FastAPI(title="FormSetu API",version="0.2.0")
app.add_middleware(CORSMiddleware, allow_origins=["*"], allow_credentials=False, allow_methods=["*"], allow_headers=["*"])


app.include_router(router)

@app.get("/")
@app.get("/api")
@app.get("/api/")
@app.get("/health")
def root():
    return {"status": "ok", "service": "formsetu-api", "health": "/api/health", "docs": "/docs"}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("app.main:app", host="127.0.0.1", port=8000, reload=True)

