# services/http/http_client.py
# Định nghĩa interface HTTPClient để không phụ thuộc trực tiếp vào implementation cụ thể (httpx, aiohttp, v.v.).
# Tuân thủ DIP: Các module cấp cao chỉ phụ thuộc vào abstraction này.

from abc import ABC, abstractmethod

class HTTPClient(ABC):
    @abstractmethod
    async def get(self, url: str, headers: dict = None) -> dict:
        """Gửi yêu cầu GET đến URL và trả về phản hồi."""
        pass