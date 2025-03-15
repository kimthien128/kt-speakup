from fastapi import APIRouter, Request, HTTPException
from database import db
from bson import ObjectId

router = APIRouter(prefix="/chats", tags=["chats"])
@router.post("")
async def create_chat(request: Request):
    try:
        data = await request.json()
        chat_data = {
            "title": data.get("title", "Untitled Chat"),
            "history" : [],
            "vocab_ids": []
        }
        result = await db.chats.insert_one(chat_data)
        return {
            "chat_id": str(result.inserted_id),
            "message": "Chat created"
        }
    except Exception as e:
        print(f"Error creating chat: {e}")
        raise HTTPException(status_code=500, detail="Failed to create chat")

@router.get("")
async def get_all_chats():
    try:
        chats = []
        async for chat in db.chats.find():
            chat["_id"] = str(chat["_id"])
            chats.append(chat)
        return chats
    except Exception as e:
        print(f"Error fetching all chats: {e}")
        raise HTTPException(status_code=500, detail="Failed to fetch chats")

@router.get("/{chat_id}")
async def get_chat(chat_id: str):
    try:
        chat = await db.chats.find_one({"_id": ObjectId(chat_id)})
        if not chat:
            return {"error": "Chat not found"}, 404
        chat["_id"] = str(chat["_id"])
        return chat
    except Exception as e:
        print(f"Error fetching chat: {e}")
        raise HTTPException(status_code=500, detail="Failed to fetch chat")
    
@router.get("/{chat_id}/history")
async def get_chat_history(chat_id: str):
    try:
        chat = await db.chats.find_one({"_id": ObjectId(chat_id)})
        if not chat:
            return {"error": "Chat not found"}, 404
        return {"history": chat.get("history", [])}
    except Exception as e:
        print(f"Error fetching history: {e}")
        raise HTTPException(status_code=500, detail="Failed to fetch history")

@router.post("/{chat_id}/history")
async def add_chat_history(chat_id: str, request: Request):
    try:
        data = await request.json()
        message = {"user": data.get("user",""), "ai":data.get("ai",""), "audioPath": data.get("audioPath", "")}
        result = await db.chats.update_one(
            {"_id": ObjectId(chat_id)},
            {"$push": {"history": message}}
        )
        if result.modified_count == 0:
            raise HTTPException(status_code=404, detail="Chat not found or no update")
        return {"message": "History updated"}
    except Exception as e:
        print(f"Error adding chat history: {e}")
        raise HTTPException(status_code=500, detail="Failed to add history")

@router.get("/{chat_id}/vocab")
async def get_chat_vocab(chat_id: str):
    try:
        # Kiểm tra chat có tồn tại không
        chat = await db.chats.find_one({"_id": ObjectId(chat_id)})
        if not chat:
            raise HTTPException(status_code=404, detail="Chat not found")
        
        vocab_list = []
        async for vocab in db.vocab.find({"chat_id": chat_id}):
            vocab["_id"] = str(vocab["_id"])
            vocab_list.append(vocab)
        return vocab_list
    except Exception as e:
        print(f"Error fetching vocab: {e}")
        raise HTTPException(status_code=500, detail="Failed to fetch vocab")
    
@router.delete("/{chat_id}")
async def delete_chat(chat_id: str):
    try:
        # Xóa chat dựa trên _id
        result = await db.chats.delete_one({"_id": ObjectId(chat_id)})
        if result.deleted_count == 0:
            raise HTTPException(status_code=404, detail="Chat not found")
        
        # Xóa các từ vựng liên quan trong collection vocab
        await db.vocab.delete_many({"chat_id":  chat_id})
        
        return {"message": "Chat deleted successfully"}
    except Exception as e:
        print(f"Error deleting chat: {e}")
        raise HTTPException(status_code=500, detail="Failed to delete chat")