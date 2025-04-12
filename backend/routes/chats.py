#routes/chats.py

from fastapi import APIRouter, Request, HTTPException, Depends
from pydantic import BaseModel
from routes.auth import UserInDB, get_auth_service
from services.chat_service import ChatService
from ..dependencies import get_chat_repository

router = APIRouter()

# Định nghĩa model cho request dịch
class TranslateRequest(BaseModel):
    text: str
    target_lang: str = "vi"
    index: int

#Khởi tạo ChatService với repository
async def get_chat_service(chat_repository = Depends(get_chat_repository)):
    return ChatService(chat_repository)

# Tạo một chat mới
@router.post("")
async def create_chat( current_user: UserInDB = Depends(get_auth_service().get_current_user), chat_service: ChatService = Depends(get_chat_service)):
    try:
        return await chat_service.create_chat(current_user.id)
    except Exception as e:
        print(f"Error creating chat: {e}")
        raise HTTPException(status_code=500, detail="Failed to create chat")

# Lấy danh sách lịch sử chat (topic)
@router.get("")
async def get_all_chats(current_user: UserInDB = Depends(get_auth_service().get_current_user), chat_service: ChatService = Depends(get_chat_service)):
    try:
        return await chat_service.get_all_chats(current_user.id)
    except Exception as e:
        print(f"Error fetching all chats: {e}")
        raise HTTPException(status_code=500, detail="Failed to fetch chats")

# Lấy thông tin chi tiết của một chat
@router.get("/{chat_id}")
async def get_chat(chat_id: str, current_user: UserInDB = Depends(get_auth_service().get_current_user), chat_service: ChatService = Depends(get_chat_service)):
    try:
        return await chat_service.get_chat(chat_id, current_user.id)
    except Exception as e:
        print(f"Error fetching chat: {e}")
        raise HTTPException(status_code=500, detail="Failed to fetch chat")

# Xóa một chat    
@router.delete("/{chat_id}")
async def delete_chat(chat_id: str, current_user: UserInDB = Depends(get_auth_service().get_current_user), chat_service: ChatService = Depends(get_chat_service)):
    try:
        return await chat_service.delete_chat(chat_id, current_user.id)
    except Exception as e:
        print(f"Error deleting chat: {e}")
        raise HTTPException(status_code=500, detail="Failed to delete chat")
    
# Cập nhật title của chat
@router.put("/{chat_id}")
async def update_chat_title(chat_id: str, request: Request, current_user: UserInDB = Depends(get_auth_service().get_current_user), chat_service: ChatService = Depends(get_chat_service)):
    try:
        data = await request.json()
        new_title = data.get("title")
        return await chat_service.update_chat_title(chat_id, new_title, current_user.id)
    except Exception as e:
        print(f"Error updating chat title: {e}")
        raise HTTPException(status_code=500, detail="Failed to updated chat title")

# Cập nhật các trường liên quan đến suggestion
@router.put("/{chat_id}/suggestion")
async def update_chat_suggestion(chat_id: str, request: Request, current_user: UserInDB = Depends(get_auth_service().get_current_user), chat_service: ChatService = Depends(get_chat_service)):
    try:
        data = await request.json()
        return await chat_service.update_chat_suggestion(chat_id, data, current_user.id)
    except HTTPException as e:
        raise e
    except Exception as e:
        print(f"Error updating chat suggestion: {e}")
        raise HTTPException(status_code=500, detail="Failed to update chat suggestion")

# Chỉ trả về phần lịch sử tin nhắn (history) của chat dựa trên chat_id
@router.get("/{chat_id}/history")
async def get_chat_history(chat_id: str, current_user: UserInDB = Depends(get_auth_service().get_current_user), chat_service: ChatService = Depends(get_chat_service)):
    try:
        return await chat_service.get_chat_history(chat_id, current_user.id)
    except Exception as e:
        print(f"Error fetching history: {e}")
        raise HTTPException(status_code=500, detail="Failed to fetch history")

# Thêm một tin nhắn vào lịch sử chat
@router.post("/{chat_id}/history")
async def add_chat_history(chat_id: str, request: Request, current_user: UserInDB = Depends(get_auth_service().get_current_user), chat_service: ChatService = Depends(get_chat_service)):
    try:
        data = await request.json()
        return await chat_service.add_chat_history(chat_id, data, current_user.id)
    except Exception as e:
        print(f"Error adding chat history: {e}")
        raise HTTPException(status_code=500, detail="Failed to add history")

# Cập nhật audioUrl trong history
@router.patch("/{chat_id}/audioUrl")
async def update_chat_history_audio(chat_id: str, request: Request, current_user: UserInDB = Depends(get_auth_service().get_current_user), chat_service: ChatService = Depends(get_chat_service)):
    try:
        data = await request.json()
        index = data.get("index")
        audio_url = data.get("audioUrl")
        return await chat_service.update_chat_history_audio(chat_id, index, audio_url, current_user.id)
    except Exception as e:
        print(f"Error updating chat history audio URL: {e}")
        raise HTTPException(status_code=500, detail="Failed to update history audio URL")

# Dịch đoạn chat của AI & cập nhật vào history
@router.post("/{chat_id}/translate-ai")
async def translate_chat_ai(chat_id: str, request: TranslateRequest, current_user: UserInDB = Depends(get_auth_service().get_current_user), chat_service: ChatService = Depends(get_chat_service)):
    try:
        return await chat_service.translate_chat_ai(chat_id, request.text, request.target_lang, request.index, current_user.id)
    except Exception as e:
        print(f"Error translating AI chat: {e}")
        raise HTTPException(status_code=500, detail="Failed to translate AI chat")

# Lấy danh sách từ vựng của chat
@router.get("/{chat_id}/vocab")
async def get_chat_vocab(chat_id: str, current_user: UserInDB = Depends(get_auth_service().get_current_user), chat_service: ChatService = Depends(get_chat_service)):
    try:
        return await chat_service.get_chat_vocab(chat_id, current_user.id)
    except Exception as e:
        print(f"Error fetching vocab: {e}")
        raise HTTPException(status_code=500, detail="Failed to fetch vocab")
    
