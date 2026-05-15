from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from ai.explainer import chat_about_vulnerability

router = APIRouter()

class ChatRequest(BaseModel):
    code: str
    vulnerability_details: str
    user_question: str
    language: str = "python"

class ChatResponse(BaseModel):
    answer: str

@router.post("/chat", response_model=ChatResponse)
async def security_chat(request: ChatRequest):
    """
    Endpoint for asking follow-up questions about a vulnerability.
    """
    try:
        answer = await chat_about_vulnerability(
            code=request.code,
            vulnerability_details=request.vulnerability_details,
            user_question=request.user_question,
            language=request.language
        )
        return ChatResponse(answer=answer)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
