from functools import lru_cache
from pydantic_settings import BaseSettings, SettingsConfigDict

class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file='.env', env_file_encoding='utf-8', extra='ignore')
    groq_api_key: str = ''
    groq_model: str = 'openai/gpt-oss-20b'
    embedding_model: str = 'default'
    chroma_path: str = './storage/chroma'
    standards_path: str = './data/standards.json'
    top_k: int = 5
    max_upload_mb: int = 10
    cors_origins: str = 'http://localhost:5173,http://127.0.0.1:5173,http://localhost:5174,http://127.0.0.1:5174'

    @property
    def cors_list(self):
        return [x.strip() for x in self.cors_origins.split(',') if x.strip()]

@lru_cache
def get_settings() -> Settings:
    return Settings()
