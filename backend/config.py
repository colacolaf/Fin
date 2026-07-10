import os

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8")

    fin_env: str = "local"
    data_dir: str = "./data"
    db_path: str = "./data/fin.db"
    jwt_secret: str = ""
    auth_enabled: bool = False
    ollama_host: str = "http://localhost:11434"
    ollama_model: str = "mistral:7b"
    agent_max_tokens: int = 2048
    agent_temperature: float = 0.3
    agent_timeout_seconds: int = 60
    agent_max_retries: int = 3
    agent_default_stream: bool = False
    agent_confidence_reduction_data_staleness: float = 0.15  # per day over 7 days
    ollama_agent_model: str = ""  # override per-agent, falls back to ollama_model
    alpaca_api_key: str = ""
    alpaca_api_secret: str = ""
    encryption_key: str = ""  # AES-256 master key for API credential encryption
    cors_origins: str = "http://localhost:3000,http://localhost:5173"


settings = Settings()

# Ensure JWT secret is set for production
if not settings.jwt_secret:
    if os.environ.get("FIN_ENV", settings.fin_env) == "production":
        raise ValueError("JWT_SECRET must be set in production")
    settings.jwt_secret = "dev-secret-change-in-production"

if not settings.encryption_key:
    if os.environ.get("FIN_ENV", settings.fin_env) == "production":
        raise ValueError("ENCRYPTION_KEY must be set in production")
    settings.encryption_key = "dev-encryption-key-change-in-production-32chars!"  # 32+ chars for AES-256
