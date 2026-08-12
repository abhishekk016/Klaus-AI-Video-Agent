import os
import uuid
import shutil
import threading
import traceback
from pathlib import Path
from typing import Optional

from fastapi import FastAPI, HTTPException, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

from dotenv import load_dotenv
from utils.audio_processor import process_input
from core.transcriber import transcribe_all
from core.summarizer import summarize, generate_title
from core.extractor import extract_action_items, extract_key_decisions, extract_questions
from core.rag_engine import build_rag_chain, ask_question

load_dotenv()

app = FastAPI(title="AI Video Assistant API")

allowed_origins = os.environ.get("ALLOWED_ORIGIN", "*")
app.add_middleware(
    CORSMiddleware,
    allow_origins=[o.strip() for o in allowed_origins.split(",")],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# In-memory job + chat-session store. Fine for a single-instance deploy;
# swap for Redis if you scale to multiple workers/instances.
JOBS: dict = {}
CHAINS: dict = {}

UPLOAD_DIR = Path(os.environ.get("UPLOAD_DIR", "./uploads"))
UPLOAD_DIR.mkdir(parents=True, exist_ok=True)

STAGES = [
    "queued",
    "ingesting",
    "transcribing",
    "titling",
    "summarizing",
    "extracting",
    "indexing",
    "done",
]


class ProcessRequest(BaseModel):
    source: str
    language: str = "english"


class ChatRequest(BaseModel):
    session_id: str
    question: str


def _run_job(job_id: str, source: str, language: str):
    job = JOBS[job_id]
    try:
        job["stage"] = "ingesting"
        chunks = process_input(source)

        job["stage"] = "transcribing"
        transcript = transcribe_all(chunks, language)

        job["stage"] = "titling"
        title = generate_title(transcript)

        job["stage"] = "summarizing"
        summary = summarize(transcript)

        job["stage"] = "extracting"
        action_items = extract_action_items(transcript)
        decisions = extract_key_decisions(transcript)
        questions = extract_questions(transcript)

        job["stage"] = "indexing"
        rag_chain = build_rag_chain(transcript)
        CHAINS[job_id] = rag_chain

        job["result"] = {
            "title": title,
            "transcript": transcript,
            "summary": summary,
            "action_items": action_items,
            "key_decisions": decisions,
            "open_questions": questions,
        }
        job["stage"] = "done"
    except Exception as exc:  # noqa: BLE001
        job["error"] = str(exc)
        job["stage"] = "error"
        job["trace"] = traceback.format_exc()


@app.post("/api/upload")
async def upload_file(file: UploadFile = File(...)):
    """Stores an uploaded local video/audio file and returns the path
    the pipeline should use as `source`."""
    safe_name = f"{uuid.uuid4().hex}_{Path(file.filename).name}"
    dest = UPLOAD_DIR / safe_name
    with dest.open("wb") as out:
        shutil.copyfileobj(file.file, out)
    return {"path": str(dest)}


@app.post("/api/process")
def start_process(req: ProcessRequest):
    if not req.source.strip():
        raise HTTPException(status_code=400, detail="Source is required.")

    job_id = str(uuid.uuid4())
    JOBS[job_id] = {"stage": "queued", "result": None, "error": None}

    thread = threading.Thread(
        target=_run_job, args=(job_id, req.source.strip(), req.language), daemon=True
    )
    thread.start()

    return {"job_id": job_id, "stages": STAGES}


@app.get("/api/status/{job_id}")
def get_status(job_id: str):
    job = JOBS.get(job_id)
    if job is None:
        raise HTTPException(status_code=404, detail="Unknown job id.")
    return {
        "stage": job["stage"],
        "done": job["stage"] == "done",
        "error": job["error"],
        "result": job["result"],
    }


@app.post("/api/chat")
def chat(req: ChatRequest):
    rag_chain = CHAINS.get(req.session_id)
    if rag_chain is None:
        raise HTTPException(
            status_code=404,
            detail="No processed video for this session yet. Process one first.",
        )
    if not req.question.strip():
        raise HTTPException(status_code=400, detail="Question is required.")

    answer = ask_question(rag_chain, req.question.strip())
    return {"answer": answer}


@app.get("/api/health")
def health():
    return {"status": "ok"}


@app.get("/")
def home():
    return {
        "message": "AI Video Agent API is running"
    }
