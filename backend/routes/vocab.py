from fastapi import APIRouter, Request
from database import db

router = APIRouter()

@router.post("")
async def add_vocab(request: Request):
    try:
        data = await request.json()
        word_data = {
            "word" : data.get("word", ""),
            "definition": data.get("definition", "No definition found"),
            "phonetic": data.get("phonetic", "N/A"),
            "audio": data.get("audio", ""),
            "topic": data.get("topic", "Daily Life")
        }
        result = await db.vocab.insert_one(word_data)
        return {"message" : f'Added {word_data['word']} to vocab'}
        
    except Exception as e:
        print(f"Error adding vocab: {e}")
        return {'error': 'Failed to add vocab'}, 500
    
@router.get("")
async def get_vocab():
    try:
        vocab_list = []
        async for vocab in db.vocab.find():
            vocab["id"] = str(vocab["_id"]) # Chuyển ObjectId thành string
            vocab_list.append(vocab)
        return vocab_list
    except Exception as e:
        print(f"Error fetching vocab: {e}")
        return {"error": "Failed to fetch vocab"}, 500