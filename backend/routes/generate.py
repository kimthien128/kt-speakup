from fastapi import APIRouter, Request, Depends
from ..services.auth_service import UserInDB
from ..routes.auth import get_auth_service
from ..database.database_factory import database
from ..repositories.mongo_repository import MongoRepository
from ..repositories.chat_repository import ChatRepository
from ..services.ai.openai_client import OpenAIClient
from ..services.ai.mistral_client import MistralClient
from ..services.ai.gemini_client import GeminiClient
from ..services.ai_service import AIService


router = APIRouter()

# Khởi tạo AIService
async def get_ai_service():
    db = await database.connect()
    base_repository = MongoRepository(db)
    chat_repository = ChatRepository(base_repository)
    openai_client = OpenAIClient()
    mistral_client = MistralClient()
    gemini_client = GeminiClient()
    return AIService(chat_repository, openai_client, mistral_client, gemini_client)

@router.post('')
async def generate(request: Request, current_user: UserInDB = Depends(get_auth_service().get_current_user), ai_service: AIService = Depends(get_ai_service)):
    data = await request.json()
    transcript = data.get('transcript', '')
    chat_id = data.get('chat_id', '') # Lấy chat_id từ request để truy xuất history
    method = request.query_params.get('method', 'gemini')
    return await ai_service.generate_response(transcript, chat_id, current_user.id, method)