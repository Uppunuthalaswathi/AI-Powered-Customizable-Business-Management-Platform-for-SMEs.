import numpy as np
import pandas as pd


def forecast(dates: list[str], quantities: list[float], horizon: int = 7) -> dict:
    if len(dates) != len(quantities) or len(dates) < 30:
        return {"available": False, "forecast": None, "message": "Insufficient history. Provide at least 30 daily observations; 60 or more is recommended for evaluation."}
    if not 1 <= horizon <= 30:
        return {"available": False, "forecast": None, "message": "horizon must be between 1 and 30 days."}
    try:
        frame = pd.DataFrame({"date": pd.to_datetime(dates, errors="raise", utc=True), "quantity": pd.to_numeric(quantities, errors="raise")})
    except Exception:
        return {"available": False, "forecast": None, "message": "Dates or quantities contain invalid values."}
    if frame.quantity.isna().any() or (frame.quantity < 0).any():
        return {"available": False, "forecast": None, "message": "Quantities must be finite non-negative values."}
    series = frame.groupby("date").quantity.sum().sort_index().asfreq("D", fill_value=0)
    if len(series) < 30:
        return {"available": False, "forecast": None, "message": "Fewer than 30 daily observations remain after aggregation."}
    values = series.to_numpy(dtype=float)
    baseline = float(np.mean(values[-min(7, len(values)):]))
    if len(values) < 60:
        return {"available": False, "forecast": None, "baseline_daily_units": baseline, "message": "A baseline is available, but fewer than 60 daily observations are available for a time-based model evaluation."}
    # Lag features and forward validation preserve chronology; last 20% is held out.
    X, y = [], []
    for i in range(14, len(values)):
        X.append([*values[i-7:i], float(np.mean(values[i-14:i])), float(i % 7)])
        y.append(values[i])
    X, y = np.asarray(X), np.asarray(y)
    split = max(1, int(len(y) * 0.8))
    if len(y) - split < 5:
        return {"available": False, "forecast": None, "baseline_daily_units": baseline, "message": "Not enough held-out observations to evaluate the model."}
    try:
        from sklearn.ensemble import HistGradientBoostingRegressor
        model = HistGradientBoostingRegressor(max_iter=100, max_leaf_nodes=7, l2_regularization=1.0, random_state=17)
        model.fit(X[:split], y[:split])
        predictions = np.maximum(0, model.predict(X[split:]))
        mae = float(np.mean(np.abs(y[split:] - predictions)))
        rmse = float(np.sqrt(np.mean((y[split:] - predictions) ** 2)))
        # Recursive multi-step forecast using the fitted model.
        history = list(values)
        result = []
        last_date = series.index[-1]
        for offset in range(horizon):
            i = len(history)
            features = np.asarray([[*history[-7:], float(np.mean(history[-14:])), float((i + offset) % 7)]])
            pred = float(max(0, model.predict(features)[0]))
            result.append({"date": (last_date + pd.Timedelta(days=offset + 1)).date().isoformat(), "quantity": pred})
            history.append(pred)
        return {"available": True, "model": "HistGradientBoostingRegressor", "history_days": len(series), "forecast": result, "baseline_daily_units": baseline, "evaluation": {"method": "chronological 80/20 holdout", "mae": mae, "rmse": rmse}}
    except ImportError:
        return {"available": False, "forecast": None, "baseline_daily_units": baseline, "message": "Install scikit-learn to run the evaluated forecast model."}
