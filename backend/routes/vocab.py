from fastapi import APIRouter, Request
import json
import os
from utils import BASE_DIR

router = APIRouter()

VOCAB_FILE = os.path.join(BASE_DIR, "vocab.json")

@router.post("")
async def add_vocab(request: Request):
    try:
        data = await request.json()
        word_data = {
            "word" : data.get("word"),
            "definition": data.get("definition"),
            "phonetic": data.get("phonetic"),
            "audio": data.get("audio", ""),
            "topic": data.get("topic", "Daily Life")
        }
        # Lưu vào file JSON (hoặc database sau này)
        if os.path.exists(VOCAB_FILE):
            with open(VOCAB_FILE, 'r', encoding='utf-8') as f:
                vocab_list = json.load(f)
        else:
            vocab_list = []
            
        vocab_list.append(word_data)
        with open(VOCAB_FILE, 'w', encoding='utf-8') as f:
            json.dump(vocab_list, f, indent=4)
            
        return {"message" : f'Added {word_data['word']} to vocab'}
    except Exception as e:
        print(f"Error adding vocab: {e}")
        return {'error': 'Failed to add vocab'}, 500