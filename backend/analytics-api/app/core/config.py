from pydantic import field_validator
from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    DATABASE_URL: str = "postgresql+asyncpg://postgres:postgres@localhost:5432/waybill"
    REDIS_URL: str = "redis://localhost:6379/0"
    KAFKA_BROKERS: str = "kafka:29092"
    JWT_SECRET: str = "change-me-in-production"
    INTERNAL_API_KEY: str = ""
    SENDGRID_KEY: str = ""
    TWILIO_SID: str = ""
    TWILIO_AUTH_TOKEN: str = ""
    SENDER_EMAIL: str = "noreply@waybilltracking.com"
    SENDER_PHONE: str = "+12025551234"
    REPORT_EMAIL: str = "ops@waybilltracking.com"
    ALLOWED_ORIGINS: str = "http://localhost:3010"

    @field_validator("JWT_SECRET")
    @classmethod
    def validate_jwt_secret(cls, v: str) -> str:
        if v == "change-me-in-production":
            raise ValueError("JWT_SECRET must be set to a strong secret before starting.")
        if len(v) < 32:
            raise ValueError("JWT_SECRET must be at least 32 characters long.")
        return v

    class Config:
        env_file = ".env"

settings = Settings()