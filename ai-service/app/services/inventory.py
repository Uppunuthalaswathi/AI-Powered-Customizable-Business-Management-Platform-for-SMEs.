import pandas as pd


def analyze_inventory(products: list[dict]) -> dict:
    frame = pd.DataFrame(products)
    if frame.empty:
        return {"product_count": 0, "low_stock": [], "out_of_stock": [], "approaching_reorder": [], "inventory_value": 0.0, "by_category": []}
    for col in ("quantity", "unit_price", "reorder_level"):
        if col in frame:
            frame[col] = pd.to_numeric(frame[col], errors="coerce")
    if "reorder_level" not in frame:
        frame["reorder_level"] = 5
    frame["reorder_level"] = frame.reorder_level.fillna(5)
    frame["quantity"] = frame.quantity.fillna(0)
    out = frame[frame.quantity == 0]
    low = frame[(frame.quantity > 0) & (frame.quantity <= frame.reorder_level)]
    approach = frame[(frame.quantity > frame.reorder_level) & (frame.quantity <= frame.reorder_level * 1.25)]
    fields = [c for c in ("product_id", "sku", "name", "quantity", "reorder_level") if c in frame]
    value = float((frame.quantity * frame.unit_price).sum()) if "unit_price" in frame else None
    category = []
    if "category" in frame:
        category = frame.assign(value=frame.quantity * frame.unit_price if "unit_price" in frame else 0).groupby("category", dropna=False).agg(products=("quantity", "size"), units=("quantity", "sum"), value=("value", "sum")).reset_index().to_dict("records")
    return {"product_count": len(frame), "low_stock": low[fields].to_dict("records"), "out_of_stock": out[fields].to_dict("records"), "approaching_reorder": approach[fields].to_dict("records"), "inventory_value": value, "by_category": category}
