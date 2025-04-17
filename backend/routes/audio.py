from fastapi import APIRouter, HTTPException, Depends
from fastapi.responses import JSONResponse
from ..dependencies import get_storage_client
from ..storage.storage_client import StorageClient
from ..logging_config import logger

router = APIRouter()

# Phát lại audio
@router.get('/{filename}')
async def get_audio(filename: str, storage_client: StorageClient = Depends(get_storage_client)):
    """
    Trả về URL công khai của file âm thanh trong audio_bucket.

    Args:
        filename (str): Tên file (ví dụ: 'Hello.mp3')
        storage_client (StorageClient): Client lưu trữ được inject qua dependency

    Returns:
        JSONResponse: JSON chứa URL công khai của file

    Raises:
        HTTPException: Nếu file không tồn tại hoặc có lỗi khi truy xuất
    """
    try:
        audio_bucket = storage_client.audio_bucket
        
        # Kiểm tra xem file có tồn tại trong audio_bucket không
        storage_client.stat_object(audio_bucket, filename)
        
        # Tạo URL công khai
        audio_url = storage_client.presigned_get_object(audio_bucket, filename)
        logger.info(f"Generated presigned URL for {filename}: {audio_url}")
        
        # Trả về URL trong JSON
        return JSONResponse(status_code=200, content={"audio_url": audio_url})
    except Exception as e:
        logger.error(f"Failed to fetch audio URL for {filename}: {e}")
        raise HTTPException(status_code=404, detail="Audio file not found")