from pydantic import model_validator
from pydantic_settings import BaseSettings

_WEAK_SECRETS = {
    "change-me-in-production",
    "secret",
    "changeme",
    "your-secret-here",
    "",
}


class Settings(BaseSettings):
    DATABASE_URL: str = "postgresql+asyncpg://postgres:postgres@localhost:5432/waybill"
    REDIS_URL: str = "redis://localhost:6379/0"
    KAFKA_BROKERS: str = "kafka:29092"
    JWT_SECRET: str = ""
    INTERNAL_API_KEY: str = ""
    SENDGRID_KEY: str = ""
    TWILIO_SID: str = ""
    TWILIO_AUTH_TOKEN: str = ""
    SENDER_EMAIL: str = "noreply@waybilltracking.com"
    SENDER_PHONE: str = "+12025551234"
    REPORT_EMAIL: str = "ops@waybilltracking.com"
    ALLOWED_ORIGINS: str = "http://localhost:3010"

    @model_validator(mode="after")
    def validate_secrets(self) -> "Settings":
        secret = self.JWT_SECRET
        if secret.lower() in _WEAK_SECRETS:
            raise ValueError(
                "JWT_SECRET is not set or uses a known weak placeholder. "
                "Set a strong random value of at least 32 characters in your environment or .env file."
            )
        if len(secret) < 32:
            raise ValueError(
                f"JWT_SECRET is too short ({len(secret)} chars). "
                "It must be at least 32 characters long."
            )
        return self

    class Config:
        env_file = ".env"

settings = Settings()