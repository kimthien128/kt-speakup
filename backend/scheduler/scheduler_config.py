# scheduler/scheduler_config.py
# Xử lý cấu hình scheduler và các job (dọn cache).
# Tuân thủ SRP: Chỉ xử lý scheduler.

from apscheduler.schedulers.background import BackgroundScheduler

def configure_scheduler(cache_service):
    """Cấu hình scheduler để dọn cache mỗi ngày."""
    scheduler = BackgroundScheduler()
    # Thêm job dọn cache
    scheduler.add_job(cache_service.clean_cache, 'interval', hours=24)
    scheduler.start()
    return scheduler