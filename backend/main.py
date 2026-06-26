from fastapi import FastAPI, HTTPException, UploadFile, File, Form
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from dotenv import load_dotenv
from pypdf import PdfReader
import io
import os

load_dotenv()

if not os.getenv("MISTRAL_API_KEY"):
    raise RuntimeError("CRITICAL ERROR: MISTRAL_API_KEY is missing from the environment configuration.")

from engine import AIWorkspaceEngine

app = FastAPI(title="AI-Native Intelligence Workspace API")

app.add_middleware(
    CORSMiddleware,
     allow_origins=[
        "https://ai-native-workspace-p768.vercel.app/",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

engine = AIWorkspaceEngine()

class ResearchRequest(BaseModel):
    topic: str
    content: str

class ChatRequest(BaseModel):
    message: str

@app.get("/")
async def root():
    return {
        "status": "success",
        "message": "AI-Native Workspace Backend is running "
    }

@app.post("/api/research")
async def run_research(payload: ResearchRequest):
    try:
        return engine.process_research(payload.topic, payload.content)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/chat")
async def run_chat(payload: ChatRequest):
    try:
        reply = engine.execute_chat(payload.message)
        return {"response": reply}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/workspace")
async def get_workspace():
    return {
        "graph": engine.workspace.get_serializable_graph(),
        "insights": engine.workspace.insights
    }

@app.post("/api/research/file")
async def run_file_research(
    topic: str = Form(...), 
    file: UploadFile = File(...)
):
    try:
        file_bytes = await file.read()
        extracted_text = ""

        if file.filename.endswith(".pdf"):
            pdf_file = io.BytesIO(file_bytes)
            reader = PdfReader(pdf_file)
            for page in reader.pages:
                text = page.extract_text()
                if text:
                    extracted_text += text + "\n"
        else:
            extracted_text = file_bytes.decode("utf-8", errors="ignore")

        if not extracted_text.strip():
            raise HTTPException(status_code=400, detail="Could not extract any readable text from the file.")

        return engine.process_research(topic, extracted_text)

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
