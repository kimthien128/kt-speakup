#routes/vocab.py
from fastapi import APIRouter, Request, HTTPException, Depends
from routes.auth import UserInDB, get_auth_service
from services.vocab_service import VocabService
from ..dependencies import get_vocab_repository
from ..logging_config import logger

router = APIRouter()

# Khởi tạo VocabService với repository tương ứng
async def get_vocab_service(vocab_repository = Depends(get_vocab_repository)):
    return VocabService(vocab_repository)

@router.post("")
async def add_vocab(request: Request, current_user: dict = Depends(get_auth_service().get_current_user), vocab_service: VocabService = Depends(get_vocab_service)):
    try:
        data = await request.json()
        return await vocab_service.add_vocab(data, current_user.id)
    except HTTPException as e:
        raise e
    except Exception as e:
        logger.error(f"Error adding vocab: {e}")
        raise HTTPException(status_code=500, detail="Failed to add vocab")

# Lấy từ vựng theo chat_id
@router.get("/{chat_id}")
async def get_vocab(chat_id: str, current_user: UserInDB = Depends(get_auth_service().get_current_user), vocab_service: VocabService = Depends(get_vocab_service)):
    try:
        logger.info(f"Fetching vocab for chat_id: {chat_id}, user_id: {current_user.id}")
        return await vocab_service.get_vocab(chat_id, current_user.id)
    except HTTPException as e:
        raise e
    except Exception as e:
        logger.error(f"Error getting vocab: {e}")
        raise HTTPException(status_code=500, detail="Failed to get vocab")
    
# xóa từ vựng
@router.delete("/{chatId}/{vocab_id}")
async def delete_vocab(chatId: str, vocab_id: str, current_user: UserInDB = Depends(get_auth_service().get_current_user), vocab_service: VocabService = Depends(get_vocab_service)):
    try:
        logger.info(f"Deleting vocab with ID: {vocab_id} for chatId: {chatId}, user_id: {current_user.id}")
        return await vocab_service.delete_vocab(chatId, vocab_id, current_user.id)
    except HTTPException as e:
        raise e
    except Exception as e:
        logger.error(f"Error deleting vocab: {e}")
        raise HTTPException(status_code=500, detail="Failed to delete vocab")