from fastapi import APIRouter, Request, HTTPException, Depends
from database import db
from bson import ObjectId
from routes.auth import UserInDB, get_current_user
from pydantic import BaseModel
from deep_translator import GoogleTranslator

router = APIRouter()

class TranslateRequest(BaseModel):
    text: str
    target_lang: str = "vi"
    index: int

@router.post("")
async def create_chat( current_user: UserInDB = Depends(get_current_user)):
    try:
        chat_data = {
            "title": "",
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
async def get_all_chats(current_user: UserInDB = Depends(get_current_user)):
    try:
        # Kiểm tra user_id hợp lệ
        if not current_user.id:
            raise HTTPException(status_code=400, detail="Invalid user ID")
        
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
async def get_chat(chat_id: str, current_user: UserInDB = Depends(get_current_user)):
    try:
        # Kiểm tra ObjectId hợp lệ trước khi query
        if not ObjectId.is_valid(chat_id):
            raise HTTPException(status_code=400, detail="Invalid chat ID")
        
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
async def delete_chat(chat_id: str, current_user: UserInDB = Depends(get_current_user)):
    try:
        # Kiểm tra ObjectId hợp lệ
        if not ObjectId.is_valid(chat_id):
            raise HTTPException(status_code=400, detail="Invalid chat ID")
        
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

# Hàm phụ để kiểm tra quyền sở hữu chat
async def check_chat_ownership(chat_id: str, user_id: str):
    if not ObjectId.is_valid(chat_id):
        raise HTTPException(status_code=400, detail="Invalid chat ID")
    chat = await db.chats.find_one({"_id": ObjectId(chat_id), "user_id": user_id})
    if not chat:
        raise HTTPException(status_code=404, detail="Chat not found or not owned by user")
    return ObjectId(chat_id)
    
# Cập nhật title của chat
@router.put("/{chat_id}")
async def update_chat_title(chat_id: str, request: Request, current_user: UserInDB = Depends(get_current_user)):
    try:
        # Kiểm tra quyền sở hữu
        chat_id_obj = await check_chat_ownership(chat_id, current_user.id)
        
        # Lấy dữ liệu từ request body
        data = await request.json()
        new_title = data.get("title")
        if not new_title or not isinstance(new_title, str):
            raise HTTPException(status_code=400, detail="Invalid title: must be a non-empty string")
        
        # Cập nhật title
        result = await db.chats.update_one(
            {"_id": chat_id_obj},
            {"$set": {"title": new_title}}
        )
        if result.modified_count == 0:
            raise HTTPException(status_code=404, detail="Chat not found, not owned by user, or title unchanged")
        return {"message": "Chat title updated successfully"}
    except Exception as e:
        print(f"Error updating chat title: {e}")
        raise HTTPException(status_code=500, detail="Failed to updated chat title")

# Cập nhật các trường liên quan đến suggestion
@router.put("/{chat_id}/suggestion")
async def update_chat_suggestion(chat_id: str, request: Request, current_user: UserInDB = Depends(get_current_user)):
    try:
        # Kiểm tra quyền sở hữu
        chat_id_obj = await check_chat_ownership(chat_id, current_user.id)
        
        # Lấy dữ liệu từ request body
        data = await request.json()
        update_data = {}
        
        # Kiểm tra và thêm latest_suggestion (nếu có)
        latest_suggestion = data.get("latest_suggestion")
        if latest_suggestion is not None:
            if not isinstance(latest_suggestion, str):
                raise HTTPException(status_code=400, detail="Invalid latest_suggestion: must be a string")
            update_data["latest_suggestion"] = latest_suggestion
            
        # Kiểm tra và thêm translation (nếu có)
        translate_suggestion = data.get("translate_suggestion")
        if translate_suggestion is not None:
            if not isinstance(translate_suggestion, str):
                raise HTTPException(status_code=400, detail="Invalid translate_suggestion: must be a string")
            update_data["translate_suggestion"] = translate_suggestion
            
        # Kiểm tra và thêm suggestion_audio_url (nếu có)
        suggestion_audio_url = data.get("suggestion_audio_url")
        if suggestion_audio_url is not None:
            if not isinstance(suggestion_audio_url, str):
                raise HTTPException(status_code=400, detail="Invalid suggestion_audio_url: must be a string")
            update_data["suggestion_audio_url"] = suggestion_audio_url
            
        # Kiểm tra xem có dữ liệu nào để cập nhật không
        if not update_data:
            raise HTTPException(status_code=400, detail="No valid fields to update")
        
        # Cập nhật vào database
        result = await db.chats.update_one(
            {"_id": chat_id_obj},
            {"$set": update_data}
        )
        if result.modified_count == 0:
            raise HTTPException(status_code=404, detail="Chat not found or no changes made")
        return {"message": "Chat suggestion updated successfully"}
    except Exception as e:
        print(f"Error updating chat suggestion: {e}")
        raise HTTPException(status_code=500, detail="Failed to update chat suggestion")

# Chỉ trả về phần lịch sử tin nhắn (history) của chat dựa trên chat_id
@router.get("/{chat_id}/history")
async def get_chat_history(chat_id: str, current_user: UserInDB = Depends(get_current_user)):
    try:
        # Kiểm tra ObjectId hợp lệ
        if not ObjectId.is_valid(chat_id):
            raise HTTPException(status_code=400, detail="Invalid chat ID")
        
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
async def add_chat_history(chat_id: str, request: Request, current_user: UserInDB = Depends(get_current_user)):
    try:
        # Kiểm tra ObjectId hợp lệ
        if not ObjectId.is_valid(chat_id):
            raise HTTPException(status_code=400, detail="Invalid chat ID")
        
        data = await request.json()
        message = {
            "user": data.get("user",""),
            "ai":data.get("ai",""),
            "audioUrl": data.get("audioUrl", "")
            }
        
        # Kiểm tra chat hiện tại
        chat = await db.chats.find_one({"_id": ObjectId(chat_id), "user_id": current_user.id})
        if not chat:
            raise HTTPException(status_code=404, detail="Chat not found or not owned by user")
        
        # Nếu là tin nhắn đầu tiên và title rỗng, đặt title bằng nội dung user gửi
        update_data = {"$push": {"history": message}}
        if not chat["history"] and not chat["title"]:
            update_data["$set"] = {"title": message["user"]}
        
        result = await db.chats.update_one(
            {"_id": ObjectId(chat_id), "user_id": current_user.id},
            update_data
        )
        if result.modified_count == 0:
            raise HTTPException(status_code=404, detail="Chat not found, not owned by user, or no update")
        return {"message": "History updated"}
    except Exception as e:
        print(f"Error adding chat history: {e}")
        raise HTTPException(status_code=500, detail="Failed to add history")

# Cập nhật audioUrl trong history
@router.patch("/{chat_id}/audioUrl")
async def update_chat_history_audio(chat_id: str, request: Request, current_user: UserInDB = Depends(get_current_user)):
    try:
        # Kiểm tra ObjectId hợp lệ
        if not ObjectId.is_valid(chat_id):
            raise HTTPException(status_code=400, detail="Invalid chat ID")
        
        data = await request.json()
        index = data.get("index")
        audio_url = data.get("audioUrl")
        
        if index is None or not isinstance(index, int) or index < 0:
            raise HTTPException(status_code=400, detail="Invalid index: must be a non-negative integer")
        if not audio_url or not isinstance(audio_url, str):
            raise HTTPException(status_code=400, detail="Invalid audioUrl: must be a non-empty string")
        
        # Kiểm tra chat hiện tại
        chat = await db.chats.find_one({"_id": ObjectId(chat_id), "user_id": current_user.id})
        if not chat:
            raise HTTPException(status_code=404, detail="Chat not found or not owned by user")
        
        if index >= len(chat["history"]):
            raise HTTPException(status_code=400, detail="Index out of range")
        
        # Cập nhật audioUrl cho message tại index trong history
        result = await db.chats.update_one(
            {"_id": ObjectId(chat_id), "user_id": current_user.id},
            {"$set": {f"history.{index}.audioUrl": audio_url}}
        )
        if result.modified_count == 0:
            raise HTTPException(status_code=404, detail="Chat not found, not owned by user, or no update")
        return {"message": "History audio URL updated"}
    except Exception as e:
        print(f"Error updating chat history audio URL: {e}")
        raise HTTPException(status_code=500, detail="Failed to update history audio URL")

# Dịch đoạn chat của AI & cập nhật vào history
@router.post("/{chat_id}/translate-ai")
async def translate_chat_ai(chat_id: str, request: TranslateRequest, current_user: UserInDB = Depends(get_current_user)):
    try:
        # Kiểm tra ObjectId hợp lệ
        if not ObjectId.is_valid(chat_id):
            raise HTTPException(status_code=400, detail="Invalid chat ID")
        
        # Kiểm tra chat hiện tại
        chat = await db.chats.find_one(
            {"_id": ObjectId(chat_id), "user_id": current_user.id},
            {"history": 1} # Lấy toàn bộ danh sách history
            )
        if not chat or "history" not in chat:
            raise HTTPException(status_code=404, detail="Chat not found or not owned by user")
        
        # Kiểm tra danh sách history
        chat_history = chat["history"]
        if not isinstance(chat_history, list) or request.index >= len(chat_history):
            raise HTTPException(status_code=400, detail="Index out of range or history format invalid")
        
        chat_entry = chat_history[request.index]
        if "ai" not in chat_entry:
            raise HTTPException(status_code=400, detail="Chat entry missing 'ai' field")
        
        # Kiểm tra nếu đã có bản dịch
        if "translateAi" in chat_entry and chat_entry["translateAi"]:
            print("AI chat already translated. Get from DB")
            return {"translatedTextAi": chat_entry["translateAi"], "message": "AI chat already translated"}
        
        # Nếu chưa có, tiến hành dịch
        print("Translating AI chat...")
        translator = GoogleTranslator(source="auto", target=request.target_lang)
        translated_text  = translator.translate(chat_entry["ai"])
        
        # Cập nhật vào DB
        result = await db.chats.update_one(
            {
                "_id": ObjectId(chat_id),
                "user_id": current_user.id,
                f"history.{request.index}.ai": chat_entry["ai"] # Kiểm tra xem đoạn chat AI cần dịch có khớp không
             },
            {"$set": {f"history.{request.index}.translateAi": translated_text}}
        )
        if result.modified_count == 0:
            raise HTTPException(status_code=404, detail="Chat not found, not owned by user, or text mismatch")
        return {"translatedTextAi": translated_text,
                "message": "AI chat translated and updated"}
    except Exception as e:
        print(f"Error translating AI chat: {e}")
        raise HTTPException(status_code=500, detail="Failed to translate AI chat")


@router.get("/{chat_id}/vocab")
async def get_chat_vocab(chat_id: str, current_user: UserInDB = Depends(get_current_user)):
    try:
        # Kiểm tra ObjectId hợp lệ
        if not ObjectId.is_valid(chat_id):
            raise HTTPException(status_code=400, detail="Invalid chat ID")
        
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
    
