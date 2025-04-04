from fastapi import APIRouter, Request, HTTPException
import requests
import httpx

router = APIRouter()

@router.post("")
async def word_info(request: Request):
    try:
        data = await request.json()
        word = data.get('word', '').strip()
        source = data.get('source', 'dictionaryapi').strip().lower()
        
        if not word:
            return {'error': 'No word provided'}, 400
        
        # Khởi tạo biến để lưu API URL và config (nếu cần)
        api_url = None
        headers = {}
        
        # Lựa chọn source API
        if source == 'dictionaryapi':
            api_url = f'https://api.dictionaryapi.dev/api/v2/entries/en/{word}'
        elif source == 'wordnik':
            api_url = ''
            headers = {'':''}
        else:
            raise HTTPException(status_code=400, detail="Unsupported dictionary source: {source}")
        
        # Gọi API từ điển tương ứng
        async with httpx.AsyncClient() as client:
            print("Making request to:", api_url)
            response = await client.get(api_url, headers=headers) # Dùng await với httpx
            print(f"Dictionary API response: {response.status_code}, {response.text}")
        if response.status_code != 200:
            return {"definition": "No definition found", "phonetic": "N/A", "audio": ""}
        
        result = response.json()
        
        # Chuẩn hóa dữ liệu dựa trên source
        if source == 'dictionaryapi':
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
        # elif source == 'wordnik':
            
        return {"definition": definition, "phonetic": phonetic, "audio": audio}
    except Exception as e:
        print(f'Error fetching word info: {str(e)}')  # Đảm bảo chuyển exception thành string
        print(f'Exception type: {type(e)}')  # Log cả kiểu exception
        import traceback
        traceback.print_exc()  # In toàn bộ stack trace
        return {"definition": "No definition found", "phonetic": "N/A", "audio": ""}