from fastapi import APIRouter, Request, HTTPException, Depends
from database import db
from bson import ObjectId
from routes.auth import UserInDB, get_current_user

router = APIRouter()

@router.post("")
async def add_vocab(request: Request, current_user: dict = Depends(get_current_user)):
    try:
        data = await request.json()
        chat_id = data.get("chat_id", "")
        if not chat_id:
            raise HTTPException(status_code=400, detail="chat_id is required")
        
        # Kiểm tra chat_id hợp lệ
        chat = await db.chats.find_one({"_id": ObjectId(chat_id), "user_id": current_user.id})
        if not chat:
            raise HTTPException(status_code=404, detail="Chat not found or not owned by user")
        
        word_data = {
            "word" : data.get("word", "").capitalize(), #viết hoa chữ cái đầu tiên
            "definition": data.get("definition", "No definition found"),
            "phonetic": data.get("phonetic", "N/A"),
            "audio": data.get("audio", ""),
            "chat_id": ObjectId(chat_id),
            "user_id": current_user.id
        }
        
        # Kiểm tra trùng lặp
        if await db.vocab.find_one({"word": word_data["word"], "chat_id": ObjectId(chat_id), "user_id": current_user.id}):
            raise HTTPException(status_code=400, detail="Word already exists in this chat")
        
        # Cập nhật vocab_ids trong chats
        result = await db.vocab.insert_one(word_data)
        await db.chats.update_one(
            {"_id": ObjectId(chat_id)},
            {"$push": {"vocab_ids": str(result.inserted_id)}}
        )
        print(f"Inserted vocab: {word_data}, ID: {result.inserted_id}")
        return {"message" : f'Added {word_data['word']} to vocab'}
    except HTTPException as e:
        raise e
    except Exception as e:
        print(f"Error adding vocab: {e}")
        raise HTTPException(status_code=500, detail="Failed to add vocab")

# Lấy từ vựng theo chat_id
@router.get("/{chat_id}")
async def get_vocab(chat_id: str, current_user: UserInDB = Depends(get_current_user)):
    try:
        print(f"Fetching vocab for chat_id: {chat_id}, user_id: {current_user.id}")
        chat = await db.chats.find_one({"_id": ObjectId(chat_id), "user_id": current_user.id})
        if not chat:
            print(f"Chat not found or not owned: {chat_id}")
            raise HTTPException(status_code=404, detail="Chat not found or not owned by user")
        
        vocab_list = await db.vocab.find({"chat_id": ObjectId(chat_id)}).to_list(length=None)
        print(f"Found {len(vocab_list)} vocab items for chat_id: {chat_id}")
        for vocab in vocab_list:
            vocab["_id"] = str(vocab["_id"])
            vocab["chat_id"] = str(vocab["chat_id"])
        return {"vocab": vocab_list}
    
    except Exception as e:
        print(f"Error getting vocab: {e}")
        raise HTTPException(status_code=500, detail="Failed to get vocab")