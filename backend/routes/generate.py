from fastapi import APIRouter, Request, Depends, HTTPException
from fastapi.responses import Response
from .auth import get_auth_service
from ..security import get_current_user, UserInDB, oauth2_scheme
from ..services.auth_service import AuthService
from ..services.ai_service import AIService
from ..dependencies import get_chat_repository, get_openai_client, get_deepseek_client, get_openrouter_client, get_mistral_client, get_gemini_client


router = APIRouter()

# Khởi tạo AIService
async def get_ai_service(
    chat_repository = Depends(get_chat_repository),
    openai_client = Depends(get_openai_client),
    deepseek_client = Depends(get_deepseek_client),
    openrouter_client = Depends(get_openrouter_client),
    mistral_client = Depends(get_mistral_client),
    gemini_client = Depends(get_gemini_client)
):
    
    return AIService(chat_repository, openai_client, deepseek_client, openrouter_client, mistral_client, gemini_client)

# Dependency để lấy current_user
async def get_current_user_with_auth_service(
    token: str = Depends(oauth2_scheme),
    auth_service: AuthService = Depends(get_auth_service),
    response: Response = None
) -> UserInDB:
    return await get_current_user(token=token, auth_service=auth_service, response=response)

@router.post('')
async def generate(
    request: Request, 
    current_user: UserInDB = Depends(get_current_user_with_auth_service), 
    ai_service: AIService = Depends(get_ai_service)
):
    data = await request.json()
    transcript = data.get('transcript', '')
    chat_id = data.get('chat_id', '') # Lấy chat_id từ request để truy xuất history
    method = request.query_params.get('method', 'gemini')
    return await ai_service.generate_response(transcript, chat_id, current_user.id, method)

@router.post('/translate')
async def translate(
    request: Request,
    ai_service: AIService = Depends(get_ai_service)
):
    data = await request.json()
    text = data.get('text', '')
    source_lang = data.get('source_lang', 'English')
    target_lang = data.get('target_lang', 'Vietnamese')
    method = request.query_params.get('method', 'gemini')
    
    if not text:
        raise HTTPException(status_code=400, detail="No text provided")
    if not source_lang or not target_lang:
        raise HTTPException(status_code=400, detail="Source and target languages are required")
    
    return await ai_service.translate(text, source_lang, target_lang, method)