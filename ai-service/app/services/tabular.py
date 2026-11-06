"""CSV normalization and validation for the existing Product shape and sales facts."""
from __future__ import annotations

from io import BytesIO
import re
import pandas as pd

PRODUCT_REQUIRED = {"product_id", "name", "category", "quantity", "unit_price"}
SALES_REQUIRED = {"date", "product_id", "quantity_sold", "unit_price"}
ALIASES = {
    "sku": "product_id", "productid": "product_id", "product_id": "product_id",
    "product_name": "name", "product": "name", "item_name": "name",
    "price": "unit_price", "selling_price": "unit_price", "unitprice": "unit_price",
    "stock": "quantity", "current_quantity": "quantity", "current_stock": "quantity",
    "lowstockthreshold": "reorder_level", "low_stock_threshold": "reorder_level",
    "reorder_threshold": "reorder_level", "reorder_level": "reorder_level",
    "sale_date": "date", "transaction_date": "date", "invoice_date": "date",
    "qty": "quantity_sold", "units_sold": "quantity_sold",
    "invoice_id": "transaction_id", "transaction_id": "transaction_id",
    "revenue": "revenue", "supplier": "supplier",
}


def _column_name(value: object) -> str:
    key = re.sub(r"[^a-z0-9]+", "_", str(value).strip().lower()).strip("_")
    compact = key.replace("_", "")
    return ALIASES.get(key, ALIASES.get(compact, key))


def clean_csv(content: bytes, kind: str) -> dict:
    """Return diagnostics and safe normalized rows; never echoes raw input values."""
    if kind not in {"products", "sales"}:
        raise ValueError("kind must be 'products' or 'sales'.")
    try:
        frame = pd.read_csv(BytesIO(content), dtype=str, keep_default_na=False, encoding="utf-8-sig")
    except Exception as exc:
        return {"valid": False, "errors": [f"Could not read CSV ({type(exc).__name__})."], "warnings": [], "row_count": 0, "columns": [], "missing_values": {}, "invalid_numeric_fields": {}, "invalid_dates": 0, "duplicate_rows": 0, "rows": []}
    if frame.empty and not len(frame.columns):
        return {"valid": False, "errors": ["CSV is empty or has no header row."], "warnings": [], "row_count": 0, "columns": [], "missing_values": {}, "invalid_numeric_fields": {}, "invalid_dates": 0, "duplicate_rows": 0, "rows": []}
    original_columns = list(frame.columns)
    frame.columns = [_column_name(c) for c in original_columns]
    for original, normalized in zip(original_columns, frame.columns):
        if str(original).strip().lower() == "quantity":
            target = "quantity" if kind == "products" else "quantity_sold"
            frame = frame.rename(columns={normalized: target})
    if kind == "products" and "reorder_level" in frame:
        frame["reorder_level"] = frame["reorder_level"].replace("", "5")
    errors: list[str] = []
    if len(set(frame.columns)) != len(frame.columns):
        errors.append("Multiple CSV headers map to the same field; provide one column per field.")
    required = PRODUCT_REQUIRED if kind == "products" else SALES_REQUIRED
    unsupported = sorted(set(frame.columns) - (required | {"reorder_level", "supplier", "transaction_id", "revenue", "source_line_id"}))
    missing_columns = sorted(required - set(frame.columns))
    if unsupported:
        errors.append(f"Unsupported columns: {', '.join(unsupported)}.")
    if missing_columns:
        errors.append(f"Required columns missing: {', '.join(missing_columns)}.")
    if len(frame) > 100000:
        errors.append("CSV exceeds the 100000-row limit.")
    missing = {c: int(frame[c].astype(str).str.strip().eq("").sum()) for c in frame.columns}
    numeric_cols = ({"quantity", "unit_price", "reorder_level"} if kind == "products" else {"quantity_sold", "unit_price", "revenue"}) & set(frame.columns)
    invalid_numeric: dict[str, int] = {}
    for col in numeric_cols:
        nums = pd.to_numeric(frame[col], errors="coerce")
        bad = (nums.isna() & frame[col].astype(str).str.strip().ne("")) | (nums < 0)
        if col in required:
            bad |= frame[col].astype(str).str.strip().eq("")
        if col in {"quantity", "reorder_level", "quantity_sold"}:
            bad |= nums.mod(1).ne(0)
        invalid_numeric[col] = int(bad.sum())
    invalid_dates = 0
    if kind == "sales" and "date" in frame:
        dates = pd.to_datetime(frame.date, errors="coerce", utc=True)
        invalid_dates = int(dates.isna().sum())
    # A product identifier may occur only once in an inventory snapshot. Sales lines
    # can share invoice/date/SKU; exact duplicate rows are reported but retained.
    duplicate_rows = int(frame.duplicated().sum())
    errors_count = sum(missing.get(c, 0) for c in required) + sum(invalid_numeric.values()) + invalid_dates
    if errors_count:
        errors.append("One or more rows contain missing required values or invalid numeric/date values.")
    valid = not errors
    rows: list[dict] = []
    if valid:
        for _, record in frame.iterrows():
            row = {k: str(v).strip() for k, v in record.items()}
            for col in numeric_cols:
                if row[col] == "":
                    continue
                row[col] = float(row[col]) if col in {"unit_price", "revenue"} else int(float(row[col]))
            if kind == "sales":
                row["date"] = pd.to_datetime(row["date"], utc=True).isoformat()
                calculated = row["quantity_sold"] * row["unit_price"]
                row["revenue"] = row.get("revenue") if row.get("revenue") not in (None, "") else calculated
            rows.append(row)
        if kind == "products":
            ids = [str(r["product_id"]).strip().upper() for r in rows]
            if len(ids) != len(set(ids)):
                errors.append("Duplicate product identifiers occur in this inventory snapshot.")
                valid = False
                rows = []
    return {"valid": valid, "errors": errors, "warnings": ["Exact duplicate rows were found; sales lines are preserved." ] if duplicate_rows else [], "row_count": int(len(frame)), "columns": list(frame.columns), "missing_values": missing, "invalid_numeric_fields": invalid_numeric, "invalid_dates": invalid_dates, "duplicate_rows": duplicate_rows, "rows": rows if valid else []}
