# SME AI service

FastAPI analytics service (Python 3.10+). The current repository has an Express/Mongoose `Product` model scoped by `businessId`, but it has no login/authentication middleware, no sales model or routes, and no AI-to-Express integration. For that reason this service accepts explicitly supplied records and does not connect to MongoDB or claim to authorize a business. Do not expose it to untrusted clients or send tenant data unless a trusted server has scoped the records. The existing inventory CRUD continues to live in Express.

## Run on Windows PowerShell

```powershell
cd ai-service
py -m venv .venv
.\.venv\Scripts\Activate.ps1
python -m pip install -r requirements.txt
Copy-Item .env.example .env
uvicorn app.main:app --reload --host 127.0.0.1 --port 8000
```

Open `http://127.0.0.1:8000/docs`. Configuration: `MAX_UPLOAD_BYTES` limits CSV uploads (default 2 MiB). No MongoDB URI is read by this stateless service. LLM variables are intentionally not wired to a provider; all validation, analytics, and forecast code works without an LLM key.

## API

- `GET /health` reports process health only.
- `POST /api/v1/ingestion/csv/{kind}/preview`, multipart field `file`, where kind is `products`, `inventory`, or `sales`. This endpoint is read-only and returns normalized rows only for valid CSVs.
- `POST /api/v1/inventory/analyze` accepts `{ "products": [{ "product_id": "SKU-1", "name": "Cup", "category": "Kitchen", "quantity": 2, "unit_price": 12.5, "reorder_level": 5 }] }`. Reports low/out-of-stock, approaching threshold, valuation, and category totals. Express exposes this against the configured business via `GET http://localhost:5000/api/ai/inventory/summary` (`AI_SERVICE_URL` defaults to `http://127.0.0.1:8000`).
- `POST /api/v1/sales/summary` accepts a JSON array of `{ "date", "product_id", "quantity_sold", "unit_price" }`; optional `start_date` and `end_date` query params filter an inclusive date range. Revenue is consistently calculated as quantity times unit price (a supplied revenue column in CSV is retained for import output but is not double-counted by this summary).
- `POST /api/v1/forecast` accepts aligned `dates`, `quantities`, and optional `horizon` (1–30 days). It returns a baseline with fewer than 60 daily observations; otherwise it trains a gradient boosting regressor using lag features and reports chronological holdout MAE/RMSE. These historical holdout metrics are not a guarantee of future accuracy.
- `POST /api/v1/business-question` returns unavailable until a real provider adapter and authorized business context are configured. It does not fabricate answers.

CSV headers are normalized case-insensitively; examples: `SKU`, `product_id`, `product name`, `stock`, `quantity`, `price`, `reorder threshold`, `sale date`, `transaction date`, `units sold`, `invoice_id`. Inventory required columns: product identifier, name, category, current quantity and unit price; reorder level is optional. Sales required columns: date, product identifier, quantity sold and unit price. CSV accepts UTF-8 BOM. Negative numbers, fractional quantities, invalid dates, missing required values and ambiguous duplicate headers are rejected. Exact sales duplicate rows are reported and retained because a transaction may contain repeated product lines. Inventory identifiers must be unique within one snapshot.

Example:

```powershell
curl.exe -F "file=@app/data/samples/products.csv" http://127.0.0.1:8000/api/v1/ingestion/csv/products/preview
```

`app/data/samples/products.csv` and `sales.csv` are small synthetic examples only. Preview does not save data. There are currently no commit/import endpoints: the only established MongoDB write path is Express product CRUD, and this project has no sales schema or import policy. Do not treat a preview as a completed import or deduct inventory from historical sales. The Express inventory summary route queries only the server-configured `DEMO_BUSINESS_ID`, then sends that scoped data to the locally hosted FastAPI service. This demo has no user authentication; do not deploy it as multi-user authorization.

## Tests

```powershell
python -m pip install -r requirements.txt
python -m pytest
```

Tests use in-memory requests and do not need MongoDB or credentials.
