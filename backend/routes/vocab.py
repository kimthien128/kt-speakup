from fastapi import APIRouter, Request
from database import db

router = APIRouter()

@router.post("")
async def add_vocab(request: Request):
    try:
        data = await request.json()
        chat_id = data.get("chat_id", "")
        topic = "Common"
        if chat_id:
            chat = await db.chats.find_one({"_id": chat_id})
            if chat:
                topic = chat.get("title", "Common")
        word_data = {
            "word" : data.get("word", ""),
            "definition": data.get("definition", "No definition found"),
            "phonetic": data.get("phonetic", "N/A"),
            "audio": data.get("audio", ""),
            "topic": topic,
            "chat_id": chat_id
        }
        result = await db.vocab.insert_one(word_data)
        # Cập nhật vocab_ids trong chats
        if chat_id:
            await db.chats.update_one(
                {"_id": chat_id},
                {"$push": {"vocab_ids": str(result.inserted_id)}}
            )
        return {"message" : f'Added {word_data['word']} to vocab'}
        
    except Exception as e:
        print(f"Error adding vocab: {e}")
        return {'error': 'Failed to add vocab'}, 500