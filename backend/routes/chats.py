from fastapi import APIRouter, Request, HTTPException, Depends
from database import db
from bson import ObjectId
from routes.auth import get_current_user

router = APIRouter(prefix="/chats", tags=["chats"])
@router.post("")
async def create_chat(request: Request, current_user: dict = Depends(get_current_user)):
    try:
        data = await request.json()
        chat_data = {
            "title": data.get("title", "Untitled Chat"),
            "history" : [],
            "vocab_ids": [],
            "user_id": current_user.id
        }
        result = await db.chats.insert_one(chat_data)
        return {
            "chat_id": str(result.inserted_id),
            "message": "Chat created"
        }
    except Exception as e:
        print(f"Error creating chat: {e}")
        raise HTTPException(status_code=500, detail="Failed to create chat")

# Lấy danh sách lịch sử chat (topic)
@router.get("")
async def get_all_chats(current_user: dict = Depends(get_current_user)):
    try:
        chats = []
        async for chat in db.chats.find({"user_id": current_user.id}):
            chat["_id"] = str(chat["_id"])
            chats.append(chat)
        return chats
    except Exception as e:
        print(f"Error fetching all chats: {e}")
        raise HTTPException(status_code=500, detail="Failed to fetch chats")

# Trả về toàn bộ thông tin của một chat (title, history, vocab_ids, user_id)
@router.get("/{chat_id}")
async def get_chat(chat_id: str, current_user: dict = Depends(get_current_user)):
    try:
        chat = await db.chats.find_one({
            "_id": ObjectId(chat_id),
            "user_id": current_user.id
            })
        if not chat:
            raise HTTPException(status_code=404, detail="Chat not found or not owned by user")
        chat["_id"] = str(chat["_id"])
        return chat
    except Exception as e:
        print(f"Error fetching chat: {e}")
        raise HTTPException(status_code=500, detail="Failed to fetch chat")
    
@router.delete("/{chat_id}")
async def delete_chat(chat_id: str, current_user: dict = Depends(get_current_user)):
    try:
        # Xóa chat dựa trên _id và user id
        result = await db.chats.delete_one({
            "_id": ObjectId(chat_id),
            "user_id" : current_user.id
            })
        if result.deleted_count == 0:
            raise HTTPException(status_code=404, detail="Chat not found or not owned by user")
        
        # Xóa các từ vựng liên quan trong collection vocab
        await db.vocab.delete_many({"chat_id":  chat_id, "user_id": current_user.id})
        
        return {"message": "Chat deleted successfully"}
    except Exception as e:
        print(f"Error deleting chat: {e}")
        raise HTTPException(status_code=500, detail="Failed to delete chat")
    
@router.put("/{chat_id}")
async def update_chat_title(chat_id: str, request: Request, current_user: dict = Depends(get_current_user)):
    try:
        data = await request.json()
        new_title = data.get("title")
        if not new_title or not isinstance(new_title, str):
            raise HTTPException(status_code=400, detail="Invalid title: must be a non-empty string")
        result = await db.chats.update_one(
            {"_id": ObjectId(chat_id), "user_id": current_user.id},
            {"$set": {"title": new_title}}
        )
        if result.modified_count == 0:
            raise HTTPException(status_code=404, detail="Chat not found, not owned by user, or title unchanged")
        return {"message": "Chat title updated successfully"}
    except Exception as e:
        print(f"Error updating chat title: {e}")
        raise HTTPException(status_code=500, detail="Failed to updated chat title")

# Chỉ trả về phần lịch sử tin nhắn (history) của chat dựa trên chat_id
@router.get("/{chat_id}")
async def get_chat_history(chat_id: str, current_user: dict = Depends(get_current_user)):
    try:
        chat = await db.chats.find_one({
            "_id": ObjectId(chat_id),
            "user_id": current_user.id
        })
        if not chat:
            raise HTTPException(status_code=404, detail="Chat not found or not owned by user")
        return {"history": chat.get("history", [])}
    except Exception as e:
        print(f"Error fetching history: {e}")
        raise HTTPException(status_code=500, detail="Failed to fetch history")

@router.post("/{chat_id}/history")
async def add_chat_history(chat_id: str, request: Request, current_user: dict = Depends(get_current_user)):
    try:
        data = await request.json()
        message = {"user": data.get("user",""), "ai":data.get("ai",""), "audioPath": data.get("audioPath", "")}
        result = await db.chats.update_one(
            {"_id": ObjectId(chat_id), "user_id": current_user.id},
            {"$push": {"history": message}}
        )
        if result.modified_count == 0:
            raise HTTPException(status_code=404, detail="Chat not found, not owned by user, or no update")
        return {"message": "History updated"}
    except Exception as e:
        print(f"Error adding chat history: {e}")
        raise HTTPException(status_code=500, detail="Failed to add history")

@router.get("/{chat_id}/vocab")
async def get_chat_vocab(chat_id: str, current_user: dict = Depends(get_current_user)):
    try:
        # Kiểm tra chat có tồn tại không
        chat = await db.chats.find_one({
            "_id": ObjectId(chat_id),
            "user_id": current_user.id
            })
        if not chat:
            raise HTTPException(status_code=404, detail="Chat not found or not owned by user")
        
        vocab_list = []
        async for vocab in db.vocab.find({"chat_id": chat_id, "user_id": current_user.id}):
            vocab["_id"] = str(vocab["_id"])
            vocab_list.append(vocab)
        return vocab_list
    except Exception as e:
        print(f"Error fetching vocab: {e}")
        raise HTTPException(status_code=500, detail="Failed to fetch vocab")
    
