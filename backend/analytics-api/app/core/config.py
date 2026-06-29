from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    DATABASE_URL: str = "postgresql+asyncpg://postgres:postgres@localhost:5432/waybill"
    REDIS_URL: str = "redis://localhost:6379/0"
    KAFKA_BROKERS: str = "localhost:9092"
    JWT_SECRET: str = "change-me-in-production"
    INTERNAL_API_KEY: str = ""
    SENDGRID_KEY: str = ""
    TWILIO_SID: str = ""
    TWILIO_AUTH_TOKEN: str = ""
    SENDER_EMAIL: str = "noreply@waybilltracking.com"
    SENDER_PHONE: str = "+12025551234"
    REPORT_EMAIL: str = "ops@waybilltracking.com"
    ALLOWED_ORIGINS: str = "http://localhost:3010"

    class Config:
        env_file = ".env"

settings = Settings()