from pydantic import BaseModel, Field


class ForecastRequest(BaseModel):
    dates: list[str]
    quantities: list[float]
    horizon: int = Field(default=7, ge=1, le=30)


class BusinessQuestion(BaseModel):
    question: str = Field(min_length=1, max_length=2000)
    business_id: str | None = None
