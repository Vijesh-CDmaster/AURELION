"""
Renewable Drop Predictor — Loads the trained XGBoost model and predicts
whether a renewable energy generation drop is imminent.

Model expects 15 features:
  temperature_2_m_above_gnd, relative_humidity_2_m_above_gnd,
  total_cloud_cover_sfc, shortwave_radiation_backwards_sfc,
  wind_speed_10_m_above_gnd, wind_gust_10_m_above_gnd,
  wind_dir_sin, wind_dir_cos,
  power_lag_1, power_lag_2, power_lag_3, power_lag_4, power_lag_5,
  roll_mean_6, roll_std_6
"""

import math
import statistics
import warnings
from pathlib import Path
from typing import Dict

import numpy as np

MODEL_PATH = Path(__file__).parent.parent.parent / "renewable_drop_model(1).pkl"

_model = None


def _load_model():
    """Lazily load the pickled model once."""
    global _model
    if _model is not None:
        return _model
    if not MODEL_PATH.exists():
        raise FileNotFoundError(f"Model file not found at {MODEL_PATH}")
    import joblib
    with warnings.catch_warnings():
        warnings.simplefilter("ignore")
        _model = joblib.load(MODEL_PATH)
    print(f"✅ Renewable drop model loaded — {type(_model).__name__} "
          f"({_model.n_features_in_} features, classes={list(_model.classes_)})")
    return _model


def predict_drop(weather: Dict, power_history: list[float]) -> Dict:
    """Run a prediction.

    Args:
        weather: dict with keys temperature, humidity, cloud_cover,
                 shortwave_radiation, wind_speed, wind_gust, wind_direction_deg
        power_history: list of at least 6 recent power readings (newest last)

    Returns:
        dict with prediction, probability, risk_level, features
    """
    model = _load_model()

    # ── Weather features ──
    temp = weather.get("temperature", 25.0)
    humidity = weather.get("humidity", 50.0)
    cloud = weather.get("cloud_cover", 30.0)
    radiation = weather.get("shortwave_radiation", 400.0)
    wind_speed = weather.get("wind_speed", 5.0)
    wind_gust = weather.get("wind_gust", 8.0)
    wind_dir = weather.get("wind_direction_deg", 180.0)

    wind_dir_sin = math.sin(math.radians(wind_dir))
    wind_dir_cos = math.cos(math.radians(wind_dir))

    # ── Power lag features — need at least 6 readings ──
    min_history = 6
    if len(power_history) < min_history:
        power_history = [0.0] * (min_history - len(power_history)) + power_history

    power_lag_1 = power_history[-1]
    power_lag_2 = power_history[-2]
    power_lag_3 = power_history[-3]
    power_lag_4 = power_history[-4]
    power_lag_5 = power_history[-5]

    last_6 = power_history[-6:]
    roll_mean_6 = sum(last_6) / 6.0
    roll_std_6 = statistics.pstdev(last_6)  # population std (matches pandas .rolling().std(ddof=0))

    features = np.array([[
        temp, humidity, cloud, radiation,
        wind_speed, wind_gust, wind_dir_sin, wind_dir_cos,
        power_lag_1, power_lag_2, power_lag_3, power_lag_4, power_lag_5,
        roll_mean_6, roll_std_6,
    ]])

    feature_names = [
        "temperature_2_m_above_gnd", "relative_humidity_2_m_above_gnd",
        "total_cloud_cover_sfc", "shortwave_radiation_backwards_sfc",
        "wind_speed_10_m_above_gnd", "wind_gust_10_m_above_gnd",
        "wind_dir_sin", "wind_dir_cos",
        "power_lag_1", "power_lag_2", "power_lag_3", "power_lag_4", "power_lag_5",
        "roll_mean_6", "roll_std_6",
    ]

    with warnings.catch_warnings():
        warnings.simplefilter("ignore")
        prediction = int(model.predict(features)[0])

        probas = model.predict_proba(features)[0]
        # Model has 2 classes [0, 1] → probability of drop (class 1)
        if len(probas) >= 2:
            drop_probability = float(probas[1])
        else:
            drop_probability = float(probas[0]) if prediction == 1 else 0.0

    # Risk level
    if drop_probability >= 0.75:
        risk_level = "critical"
    elif drop_probability >= 0.50:
        risk_level = "high"
    elif drop_probability >= 0.25:
        risk_level = "medium"
    else:
        risk_level = "low"

    return {
        "prediction": prediction,          # 0 = no drop, 1 = drop expected
        "drop_probability": round(drop_probability, 4),
        "risk_level": risk_level,
        "features": dict(zip(feature_names, features[0].tolist())),
    }
