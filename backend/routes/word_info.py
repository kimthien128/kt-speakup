from fastapi import APIRouter, Request
import httpx

router = APIRouter()

@router.post("")
async def word_info(request: Request):
    try:
        data = await request.json()
        word = data.get('word', '').strip()
        if not word:
            return {'error': 'No word provided'}, 400
        
        # Gọi Dictionary API
        api_url = f'https://api.dictionaryapi.dev/api/v2/entries/en/{word}'
        async with httpx.AsyncClient() as client:
            response = await client.get(api_url) # Dùng await với httpx
        if response.status_code != 200:
            return {"definition": "No definition found", "phonetic": "N/A"}
        
        result = response.json()
        # Kiểm tra nếu result là list và có dữ liệu
        if isinstance(result, list) and len(result)>0:
            entry = result[0]
            # Lấy meanings
            meanings = entry.get("meanings", [])
            definition = (
                meanings[0]["definitions"][0]["definition"]
                if meanings and len(meanings) > 0 and len(meanings[0]["definitions"])> 0
                else "No definition found"
            )
            # Lấy phonetic
            phonetic = entry.get("phonetic", "N/A")
            # Lấy audio từ phonetics (ưu tiên link không rỗng)
            phonetics = entry.get("phonetics", [])
            audio = next(
                (item["audio"] for item in phonetics if item.get("audio","")), ""
                # Nếu không có audio nào hợp lệ, trả về chuỗi rỗng
            )
        else:
            definition = "No definition found"
            phonetic = "N/A"
            audio = ""
            
        
        return {"definition": definition, "phonetic": phonetic, "audio": audio}
    except Exception as e:
        print(f'Error fetching word info: {e}')
        return {"definition": "No definition found", "phonetic": "N/A", "audio": ""}