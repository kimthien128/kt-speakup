# services/cache_service.py
# Xử lý logic dọn cache cho MinIO bucket.
# Tuân thủ SRP: Chỉ xử lý logic dọn cache.

import time
import os

class CacheService:
    def __init__(self, storage_client):
        self.storage_client = storage_client
        self.audio_bucket = os.getenv("AUDIO_BUCKET")
        
    def clean_cache(self):
        try:
            now = time.time()
            # Liệt kê tất cả object trong bucket
            objects = self.storage_client.list_objects(self.audio_bucket, recursive=True)
            
            for obj in objects:
                # Lấy metadata hoặc stat của object
                stat = self.storage_client.stat_object(self.audio_bucket, obj.object_name)
                last_modified = stat.last_modified.timestamp()
                
                if now - last_modified > 604800:  # 7 ngày = 604,800 giây
                    self.storage_client.remove_object(self.audio_bucket, obj.object_name)
                    print(f'Deleted expired cache: {obj.object_name} (last modified: {stat.last_modified})')
        except Exception as e:
            print(f"Error cleaning cache: {e}")