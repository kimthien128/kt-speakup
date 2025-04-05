# backend/routes/word_info.py
from fastapi import APIRouter, Request, HTTPException
import httpx
from utils import WORDNIK_API_KEY

router = APIRouter()

@router.post("")
async def word_info(request: Request):
    try:
        data = await request.json()
        word = data.get('word', '').strip().lower()
        source = data.get('source', 'dictionaryapi').strip().lower()
        limit = data.get('limit', 2)
        
        if not word:
            return {'error': 'No word provided'}, 400
        
        # Khởi tạo biến để lưu API URL và config (nếu cần)
        api_url = None
        headers = {}
        
        # Lựa chọn source API
        if source == 'dictionaryapi':
            api_url = f'https://api.dictionaryapi.dev/api/v2/entries/en/{word}'
        elif source == 'wordnik':
            # kiểm tra xem API key có hợp lệ không
            if not WORDNIK_API_KEY:
                raise HTTPException(status_code=500, detail="Wordnik API key is not set.")
            
            # Wordnik API không có một endpoint duy nhất để lấy tất cả thông tin
            # nên sẽ gọi nhiều endpoint và tổng hợp dữ liệu
            base_url = f'https://api.wordnik.com/v4/word.json/{word}'
            headers = {'api_key':WORDNIK_API_KEY}
        else:
            raise HTTPException(status_code=400, detail="Unsupported dictionary source: {source}")
        
        # Chuẩn hóa dữ liệu trả về
        definition = "No definition found"
        phonetic = "N/A"
        audio = ""
        etymologies = []
        examples = []
        frequency = 0
        hyphenation = []
        phrases = []
        pronunciations = []
        related_words = []
        scrabble_score = 0
        top_example = ""
        
        
        # Gọi API từ điển tương ứng
        if source == 'dictionaryapi':
            async with httpx.AsyncClient() as client:
                print("Making request to:", api_url)
                response = await client.get(api_url, headers=headers) # Dùng await với httpx
                print(f"Dictionary API response: {response.status_code}, {response.text}")
            if response.status_code != 200:
                return {"definition": "No definition found", "phonetic": "N/A", "audio": ""}
            
            result = response.json()
        
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
                
        elif source == 'wordnik':
            async with httpx.AsyncClient() as client:
                # 1. Lấy definitions : định nghĩa
                definitions_url = f'{base_url}/definitions?limit={limit}&includeRelated=false&useCanonical=false&includeTags=false'
                definitions_response = await client.get(definitions_url, headers=headers)
                if definitions_response.status_code == 200:
                    definitions = definitions_response.json()
                    if isinstance(definitions, list):
                        for def_item in definitions:
                            if isinstance(def_item, dict) and "text" in def_item:
                                definition = def_item["text"]
                                break
                    else:
                        print(f"No definitions found for word: {word}")
                
                # 2. Lấy audio 
                audio_url = f"{base_url}/audio?limit={limit}"
                audio_response = await client.get(audio_url, headers=headers)
                if audio_response.status_code == 200:
                    audio_data = audio_response.json()
                    if isinstance(audio_data, list) and len(audio_data) > 0 and "fileUrl" in audio_data[0]:
                        audio = audio_data[0]["fileUrl"]
                    else:
                        print(f"No audio found for word: {word}")
                
                # 3. Lấy etymologies : từ nguyên
                etymologies_url = f"{base_url}/etymologies"
                etymologies_response = await client.get(etymologies_url, headers=headers)
                if etymologies_response.status_code == 200:
                    etymologies_data = etymologies_response.json()
                    if isinstance(etymologies_data, list):
                        etymologies = etymologies_data[:limit]
                    else:
                        print(f"No etymologies found for word: {word}")
                    
                # 4. Lấy examples : ví dụ
                examples_url = f"{base_url}/examples?limit={limit}"
                examples_response = await client.get(examples_url, headers=headers)
                if examples_response.status_code == 200:
                    examples_data = examples_response.json()
                    examples_list = examples_data.get("examples", [])
                    if isinstance(examples_list, list):
                        examples = [example["text"] for example in examples_list if isinstance(example, dict) and "text" in example][:limit]
                    else:
                        print(f"No examples found for word: {word}")
                    
                # 5. Lấy frequency : tần suất
                frequency_url = f"{base_url}/frequency?useCanonical=false&startYear=1800&endYear=2025"
                frequency_response = await client.get(frequency_url, headers=headers)
                if frequency_response.status_code == 200:
                    frequency_data = frequency_response.json()
                    if isinstance(frequency_data, dict):
                        frequency = frequency_data.get("totalCount", 0)
                    else:
                        print(f"No frequency data found for word: {word}")
                    
                # 6. Lấy hyphenation: gạch nối
                hyphenation_url = f"{base_url}/hyphenation?useCanonical=false"
                hyphenation_response = await client.get(hyphenation_url, headers=headers)
                if hyphenation_response.status_code == 200:
                    hyphenation_data = hyphenation_response.json()
                    if isinstance(hyphenation_data, list):
                        hyphenation = [part["text"] for part in hyphenation_data if isinstance(part, dict) and "text" in part][:limit]
                    else:
                        print(f"No hyphenation data found for word: {word}")
                    
                # 7. Lấy phrases : cụm từ
                phrases_url = f"{base_url}/phrases?limit={limit}"
                phrases_response = await client.get(phrases_url, headers=headers)
                if phrases_response.status_code == 200:
                    phrases_data = phrases_response.json()
                    if isinstance(phrases_data, list):
                        phrases = [
                            f"{phrase['gram1']} {phrase['gram2']}"
                            for phrase in phrases_data
                            if isinstance(phrase, dict) and "gram1" in phrase and "gram2" in phrase
                        ][:limit]
                    else:
                        print(f"No phrases found for word: {word}")
                    
                # 8. Lấy pronunciations : phát âm
                pronunciations_url = f"{base_url}/pronunciations?limit={limit}&typeFormat=IPA"
                pronunciations_response = await client.get(pronunciations_url, headers=headers)
                if pronunciations_response.status_code == 200:
                    pronunciations_data = pronunciations_response.json()
                    if isinstance(pronunciations_data, list):
                        pronunciations = [pron["raw"] for pron in pronunciations_data if isinstance(pron, dict) and "raw" in pron][:limit]
                        phonetic = pronunciations[0] if pronunciations else "N/A"
                    else:
                        print(f"No pronunciations found for word: {word}")
                    
                # 9. Lấy related words : từ liên quan
                related_words_url = f"{base_url}/relatedWords?limitPerRelationshipType={limit}"
                related_words_response = await client.get(related_words_url, headers=headers)
                if related_words_response.status_code == 200:
                    related_words_data = related_words_response.json()
                    if isinstance(related_words_data, list):
                        related_words = [
                            {
                                "relationshipType": rel.get("relationshipType", "Unknown"),
                                "words": rel.get("words", [])[:limit]
                            }
                            for rel in related_words_data
                            if isinstance(rel, dict) and "relationshipType" in rel and "words" in rel
                        ]
                    else:
                        print(f"No related words found for word: {word}")
                        
                # 10. Lấy scrabble score : điểm scrabble
                scrabble_score_url = f"{base_url}/scrabbleScore"
                scrabble_score_response = await client.get(scrabble_score_url, headers=headers)
                if scrabble_score_response.status_code == 200:
                    scrabble_score_data = scrabble_score_response.json()
                    if isinstance(scrabble_score_data, dict):
                        scrabble_score = scrabble_score_data.get("value", 0)
                    else:
                        print(f"No scrabble score found for word: {word}")
                    
                # 11. Lấy top example 
                top_example_url = f"{base_url}/topExample"
                top_example_response = await client.get(top_example_url, headers=headers)
                if top_example_response.status_code == 200:
                    top_example_data = top_example_response.json()
                    if isinstance(top_example_data, dict):
                        top_example = top_example_data.get("text", "")
                    else:
                        print(f"No top example found for word: {word}")
        
        return {
            "definition": definition,
            "phonetic": phonetic,
            "audio": audio,
            "etymologies": etymologies,
            "examples": examples,
            "frequency": frequency,
            "hyphenation": hyphenation,
            "phrases": phrases,
            "pronunciations": pronunciations,
            "relatedWords": related_words,
            "scrabbleScore": scrabble_score,
            "topExample": top_example
        }
    except Exception as e:
        print(f'Error fetching word info: {str(e)}')  # Đảm bảo chuyển exception thành string
        print(f'Exception type: {type(e)}')  # Log cả kiểu exception
        import traceback
        traceback.print_exc()  # In toàn bộ stack trace
        return {
            "definition": "No definition found",
            "phonetic": "N/A",
            "audio": "",
            "etymologies": [],
            "examples": [],
            "frequency": 0,
            "hyphenation": [],
            "phrases": [],
            "pronunciations": [],
            "relatedWords": [],
            "scrabbleScore": 0,
            "topExample": ""
        }