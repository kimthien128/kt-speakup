# repositories/config_repository.py
# Định nghĩa ConfigRepository để xử lý các truy vấn dữ liệu liên quan đến site config.
# Nhận một instance của BaseRepository thông qua constructor để không phụ thuộc vào implementation cụ thể.
# Tuân thủ DIP: Chỉ phụ thuộc vào abstraction BaseRepository.

class ConfigRepository:
    def __init__(self, repository):
        self.repository = repository
        self.config_id = "site_config_id"

    async def get_config(self) -> dict:
        """Lấy site config từ database"""
        return await self.repository.find_one("site_configs", {"_id": self.config_id})

    async def update_config(self, update_data: dict):
        """Cập nhật site config trong database"""
        return await self.repository.update_one(
            "site_configs",
            {"_id": self.config_id},
            {"$set": update_data},
            upsert=True
        )