import pandas as pd


def summarize_sales(rows: list[dict], start_date: str | None = None, end_date: str | None = None, products: list[dict] | None = None) -> dict:
    if not rows:
        return {"available": True, "row_count": 0, "units_sold": 0, "revenue": 0, "by_product": [], "trends": {"daily": [], "weekly": [], "monthly": []}, "message": "No sales records exist for this period."}
    frame = pd.DataFrame(rows)
    required = {"date", "product_id", "quantity_sold", "unit_price"}
    if not required.issubset(frame.columns):
        return {"available": False, "message": "Supply date, product_id, quantity_sold and unit_price to calculate a sales summary."}
    frame["quantity_sold"] = pd.to_numeric(frame.quantity_sold, errors="coerce")
    frame["unit_price"] = pd.to_numeric(frame.unit_price, errors="coerce")
    frame["date"] = pd.to_datetime(frame.date, errors="coerce", utc=True)
    if frame[["quantity_sold", "unit_price", "date"]].isna().any().any() or (frame[["quantity_sold", "unit_price"]] < 0).any().any():
        return {"available": False, "message": "Sales data contains missing or invalid values; correct it before summarizing."}
    start = pd.to_datetime(start_date, utc=True) if start_date else None
    end = pd.to_datetime(end_date, utc=True) if end_date else None
    if start is not None and end is not None and start > end:
        return {"available": False, "message": "start_date must be on or before end_date."}
    if start_date:
        frame = frame[frame.date >= start]
    if end_date:
        frame = frame[frame.date <= end + pd.Timedelta(days=1) - pd.Timedelta(microseconds=1)]
    frame["revenue"] = frame.quantity_sold * frame.unit_price
    by_product = frame.groupby("product_id").agg(units_sold=("quantity_sold", "sum"), revenue=("revenue", "sum")).reset_index().sort_values("revenue", ascending=False).to_dict("records")
    trend_frame = frame.set_index("date")
    trends = {"daily": trend_frame.resample("D").agg(units_sold=("quantity_sold", "sum"), revenue=("revenue", "sum")).reset_index().to_dict("records"), "weekly": trend_frame.resample("W").agg(units_sold=("quantity_sold", "sum"), revenue=("revenue", "sum")).reset_index().to_dict("records"), "monthly": trend_frame.resample("MS").agg(units_sold=("quantity_sold", "sum"), revenue=("revenue", "sum")).reset_index().to_dict("records")}
    for period in trends.values():
        for item in period:
            item["date"] = item["date"].isoformat()
    return {"available": True, "row_count": len(frame), "units_sold": float(frame.quantity_sold.sum()), "revenue": float(frame.revenue.sum()), "by_product": by_product, "top_by_units": sorted(by_product, key=lambda x: x["units_sold"], reverse=True)[:10], "top_by_revenue": by_product[:10], "trends": trends}
