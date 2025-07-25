# backend/dependencies.py
#Tạo các instance singleton cho các dependency như MongoRepository, StorageClient, HTTPClient, v.v.
#Sử dụng FastAPI's Depends để inject các instance này vào các service.

import os
from fastapi import Depends
from .database.database_factory import database
from .repositories.mongo_repository import MongoRepository
from .repositories.auth_repository import AuthRepository
from .repositories.chat_repository import ChatRepository
from .repositories.vocab_repository import VocabRepository
from .repositories.config_repository import ConfigRepository
from .storage.minio_client import MinioClient
from .services.http.httpx_client import HttpxClient
from .services.ai.openai_client import OpenAIClient
from .services.ai.deepseek_client import DeepSeekClient
from .services.ai.openrouter_client import OpenRouterClient
from .services.ai.gemini_client import GeminiClient
from .services.audio.ffmpeg_audio_processor import FFmpegAudioProcessor
from .services.dictionary.dictionaryapi_client import DictionaryAPIClient
from .services.dictionary.wordnik_client import WordnikClient
from .services.tts.gtts_client import GTTSClient
from .services.tts.piper_client import PiperClient
from .services.stt.vosk_stt_client import VoskSTTClient
from .services.stt.assemblyai_stt_client import AssemblyAISTTClient
from .services.stt.google_stt_client import GoogleSTTClient
from .services.translation.google_translation_client import GoogleTranslationClient
from .services.vocab_service import VocabService

# Singleton instance cho database
class DatabaseSingleton:
    _instance = None
    
    @classmethod
    async def get_instance(cls):
        if cls._instance is None:
            cls._instance = await database.connect()
        return cls._instance
    
# Singleton instances cho các dependency
class DependencyContainer:
    _mongo_repository = None
    _auth_repository = None
    _chat_repository = None
    _vocab_repository = None
    _config_repository = None
    _storage_client = None
    _http_client = None
    _openai_client = None
    _deepseek_client = None
    _openrouter_client = None
    _mistral_client = None
    _gemini_client = None
    _audio_processor = None
    _dictionaryapi_client = None
    _wordnik_client = None
    _gtts_client = None
    _piper_client = None
    _vosk_client = None
    _assemblyai_client = None
    _google_stt_client = None
    _google_translation_client = None
    _vocab_service = None
    
    # Đọc cấu hình ENABLED_AI_CLIENTS từ biến môi trường
    @classmethod
    def _get_enabled_ai_clients(cls):
        enabled_clients = os.getenv("ENABLED_AI_CLIENTS", "")
        return set(enabled_clients.split(",")) if enabled_clients else set()
    
    @classmethod
    async def get_mongo_repository(cls):
        if cls._mongo_repository is None:
            db = await DatabaseSingleton.get_instance()
            cls._mongo_repository = MongoRepository(db)
        return cls._mongo_repository

    @classmethod
    async def get_auth_repository(cls):
        if cls._auth_repository is None:
            mongo_repo = await cls.get_mongo_repository()
            cls._auth_repository = AuthRepository(mongo_repo)
        return cls._auth_repository

    @classmethod
    async def get_chat_repository(cls):
        if cls._chat_repository is None:
            mongo_repo = await cls.get_mongo_repository()
            cls._chat_repository = ChatRepository(mongo_repo)
        return cls._chat_repository

    @classmethod
    async def get_vocab_repository(cls):
        if cls._vocab_repository is None:
            mongo_repo = await cls.get_mongo_repository()
            cls._vocab_repository = VocabRepository(mongo_repo)
        return cls._vocab_repository

    @classmethod
    async def get_config_repository(cls):
        if cls._config_repository is None:
            mongo_repo = await cls.get_mongo_repository()
            cls._config_repository = ConfigRepository(mongo_repo)
        return cls._config_repository
#
    @classmethod
    def get_storage_client(cls):
        if cls._storage_client is None:
            cls._storage_client = MinioClient()
        return cls._storage_client

    @classmethod
    def get_http_client(cls):
        if cls._http_client is None:
            cls._http_client = HttpxClient()
        return cls._http_client

    @classmethod
    def get_openai_client(cls):
        enabled_clients = cls._get_enabled_ai_clients()
        if "chatgpt" not in enabled_clients:
            return None
        if cls._openai_client is None:
            cls._openai_client = OpenAIClient()
        return cls._openai_client
    
    @classmethod
    def get_deepseek_client(cls):
        enabled_clients = cls._get_enabled_ai_clients()
        if "deepseek" not in enabled_clients:
            return None
        if cls._deepseek_client is None:
            cls._deepseek_client = DeepSeekClient()
        return cls._deepseek_client
    
    @classmethod
    def get_openrouter_client(cls):
        enabled_clients = cls._get_enabled_ai_clients()
        if "openrouter" not in enabled_clients:
            return None
        if cls._openrouter_client is None:
            cls._openrouter_client = OpenRouterClient()
        return cls._openrouter_client

    @classmethod
    def get_mistral_client(cls):
        enabled_clients = cls._get_enabled_ai_clients()
        if "mistral" not in enabled_clients:
            return None
        
        # Trì hoãn việc import MistralClient cho đến khi thực sự cần, yêu cầu thư viện llama-cpp-python và build tools c++
        from .services.ai.mistral_client import MistralClient
        if cls._mistral_client is None:
            cls._mistral_client = MistralClient()
        return cls._mistral_client

    @classmethod
    def get_gemini_client(cls):
        enabled_clients = cls._get_enabled_ai_clients()
        if "gemini" not in enabled_clients:
            return None
        if cls._gemini_client is None:
            cls._gemini_client = GeminiClient()
        return cls._gemini_client

    @classmethod
    def get_audio_processor(cls):
        if cls._audio_processor is None:
            cls._audio_processor = FFmpegAudioProcessor()
        return cls._audio_processor

    @classmethod
    def get_dictionaryapi_client(cls):
        if cls._dictionaryapi_client is None:
            http_client = cls.get_http_client()
            cls._dictionaryapi_client = DictionaryAPIClient(http_client)
        return cls._dictionaryapi_client

    @classmethod
    def get_wordnik_client(cls):
        if cls._wordnik_client is None:
            http_client = cls.get_http_client()
            cls._wordnik_client = WordnikClient(http_client)
        return cls._wordnik_client
    
    @classmethod
    async def get_vocab_service(cls):
        if cls._vocab_service is None:
            vocab_repository = await cls.get_vocab_repository()
            dictionaryapi_client = cls.get_dictionaryapi_client()
            wordnik_client = cls.get_wordnik_client()
            cls._vocab_service = VocabService(vocab_repository, dictionaryapi_client, wordnik_client)
        return cls._vocab_service

    @classmethod
    def get_gtts_client(cls):
        if cls._gtts_client is None:
            cls._gtts_client = GTTSClient()
        return cls._gtts_client

    @classmethod
    def get_piper_client(cls):
        enabled_clients = cls._get_enabled_ai_clients()
        if "piper" not in enabled_clients:
            return None
        if cls._piper_client is None:
            cls._piper_client = PiperClient()
        return cls._piper_client

    @classmethod
    def get_vosk_client(cls):
        enabled_clients = cls._get_enabled_ai_clients()
        if "vosk" not in enabled_clients:
            return None
        if cls._vosk_client is None:
            cls._vosk_client = VoskSTTClient()
        return cls._vosk_client

    @classmethod
    def get_assemblyai_client(cls):
        enabled_clients = cls._get_enabled_ai_clients()
        if "assemblyai" not in enabled_clients:
            return None
        if cls._assemblyai_client is None:
            cls._assemblyai_client = AssemblyAISTTClient()
        return cls._assemblyai_client
    
    @classmethod
    def get_google_stt_client(cls):
        if cls._google_stt_client is None:
            cls._google_stt_client = GoogleSTTClient()
        return cls._google_stt_client

    @classmethod
    def get_google_translation_client(cls):
        if cls._google_translation_client is None:
            cls._google_translation_client = GoogleTranslationClient()
        return cls._google_translation_client
    
# Dependency injection functions
async def get_auth_repository():
    return await DependencyContainer.get_auth_repository()

async def get_chat_repository():
    return await DependencyContainer.get_chat_repository()

async def get_vocab_repository():
    return await DependencyContainer.get_vocab_repository()

async def get_config_repository():
    return await DependencyContainer.get_config_repository()

def get_storage_client():
    return DependencyContainer.get_storage_client()

def get_http_client():
    return DependencyContainer.get_http_client()

def get_openai_client():
    return DependencyContainer.get_openai_client()

def get_deepseek_client():
    return DependencyContainer.get_deepseek_client()

def get_openrouter_client():
    return DependencyContainer.get_openrouter_client()

def get_mistral_client():
    return DependencyContainer.get_mistral_client()

def get_gemini_client():
    return DependencyContainer.get_gemini_client()

def get_audio_processor():
    return DependencyContainer.get_audio_processor()

def get_dictionaryapi_client():
    return DependencyContainer.get_dictionaryapi_client()

def get_wordnik_client():
    return DependencyContainer.get_wordnik_client()

async def get_vocab_service():
    return await DependencyContainer.get_vocab_service()

def get_gtts_client():
    return DependencyContainer.get_gtts_client()

def get_piper_client():
    return DependencyContainer.get_piper_client()

def get_vosk_client():
    return DependencyContainer.get_vosk_client()

def get_assemblyai_client():
    return DependencyContainer.get_assemblyai_client()

def get_google_stt_client():
    return DependencyContainer.get_google_stt_client()

def get_google_translation_client():
    return DependencyContainer.get_google_translation_client()