import os
from fastapi import FastAPI, File, HTTPException, UploadFile
from app.schemas.analysis import BusinessQuestion, ForecastRequest
from app.schemas.inventory import InventoryRequest
from app.services.inventory import analyze_inventory
from app.services.llm import answer_business_question
from app.services.sales import summarize_sales
from app.services.tabular import clean_csv
from app.ml.forecasting import forecast

app = FastAPI(title="SME AI Service", version="1.0.0", description="Validated, input-only SME analytics. The trusted Express API must authorize and scope all business data.")
MAX_UPLOAD_BYTES = max(1024, int(os.getenv("MAX_UPLOAD_BYTES", "2097152")))


@app.get("/health")
def health():
    return {"success": True, "service": "ai-service", "status": "ok"}


@app.post("/api/v1/ingestion/csv/{kind}/preview")
async def preview_csv(kind: str, file: UploadFile = File(...)):
    if kind in {"inventory", "product"}:
        kind = "products"
    if kind not in {"products", "sales"}:
        raise HTTPException(400, "kind must be inventory/products or sales.")
    if file.filename and not file.filename.lower().endswith(".csv"):
        raise HTTPException(415, "Upload a .csv file.")
    content = await file.read(MAX_UPLOAD_BYTES + 1)
    if len(content) > MAX_UPLOAD_BYTES:
        raise HTTPException(413, f"CSV exceeds the {MAX_UPLOAD_BYTES}-byte upload limit.")
    if not content:
        raise HTTPException(400, "CSV file is empty.")
    result = clean_csv(content, kind)
    return {"success": result["valid"], "data": result}


@app.post("/api/v1/inventory/analyze")
def inventory(request: InventoryRequest):
    return {"success": True, "data": analyze_inventory([p.model_dump() for p in request.products]), "source": "authorized_payload_required"}


@app.post("/api/v1/sales/summary")
def sales_summary(rows: list[dict], start_date: str | None = None, end_date: str | None = None):
    return {"success": True, "data": summarize_sales(rows, start_date, end_date)}


@app.post("/api/v1/forecast")
def sales_forecast(request: ForecastRequest):
    return {"success": True, "data": forecast(request.dates, request.quantities, request.horizon)}


@app.post("/api/v1/business-question")
def business_question(request: BusinessQuestion):
    return {"success": True, "data": answer_business_question(request.question)}
