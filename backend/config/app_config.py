# config/app_config.py
# Xử lý cấu hình cho FastAPI app (CORS, router, v.v.).
# Tuân thủ SRP: Chỉ xử lý cấu hình.

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from ..logging_config import logger

def configure_app(app: FastAPI):
    """
    Configure FastAPI app with CORS and other middlewares.
    """
    # Cấu hình CORS
    origins = [
        "http://localhost:5173",  # Frontend dev server
        "http://127.0.0.1:5173",
        "http://157.230.242.152:8000",
        "http://157.230.242.152",
        "http://speakup.ktstudio.vn",
        "https://speakup.ktstudio.vn"
    ]
    
    app.add_middleware(
        CORSMiddleware,
        allow_origins=origins,
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
        expose_headers=['X-Audio-Url', 'X-New-Token'],
    )
    
    # Đăng ký các router
    from ..routes.stt import router as stt_router
    from ..routes.generate import router as generate_router
    from ..routes.tts import router as tts_router
    from ..routes.word_info import router as word_info_router
    from ..routes.vocab import router as vocab_router
    from ..routes.chats import router as chats_router
    from ..routes.auth import router as auth_router
    from ..routes.translate import router as translate_router
    from ..routes.config import router as config_router
    from ..routes.audio import router as audio_router
    from ..routes.users import router as users_router

    app.include_router(auth_router, prefix='/auth')
    app.include_router(stt_router, prefix='/stt')
    app.include_router(generate_router, prefix='/generate')
    app.include_router(tts_router, prefix='/tts')
    app.include_router(word_info_router, prefix='/word-info')
    app.include_router(vocab_router, prefix='/vocab')
    app.include_router(translate_router, prefix='/translate')
    app.include_router(config_router, prefix='/config')
    app.include_router(chats_router, prefix='/chats')
    app.include_router(audio_router, prefix='/audio')
    app.include_router(users_router, prefix='/users')
    
    logger.info("App configured with CORS and routers")
