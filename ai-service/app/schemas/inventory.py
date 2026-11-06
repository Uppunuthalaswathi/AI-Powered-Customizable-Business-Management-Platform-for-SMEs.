from pydantic import BaseModel, Field


class ProductInput(BaseModel):
    """Input fields align with the Express Product model where applicable."""
    product_id: str = Field(min_length=1, description="SKU or stable product identifier")
    name: str = Field(min_length=1)
    category: str = Field(min_length=1)
    quantity: int = Field(ge=0)
    unit_price: float = Field(ge=0)
    reorder_level: int = Field(default=5, ge=0)


class InventoryRequest(BaseModel):
    products: list[ProductInput]
    # This is context only. It is never used as proof of authorization.
    business_id: str | None = None
