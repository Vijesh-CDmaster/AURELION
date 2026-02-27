"""
Prediction Router — ML-powered renewable energy drop prediction.
Uses the trained XGBoost/RandomForest model via drop_predictor service.
"""

from fastapi import APIRouter

from ..services.grid_simulator import simulator
from ..services.drop_predictor import predict_drop

router = APIRouter(prefix="/api/prediction", tags=["prediction"])


@router.get("/drop")
async def get_drop_prediction():
    """Run the ML model against current simulated weather + solar data
    and return a drop prediction with probability and risk level."""
    weather = dict(simulator.weather)
    power_history = list(simulator.power_history)

    try:
        result = predict_drop(weather, power_history)
        return {
            "prediction": result["prediction"],
            "drop_probability": result["drop_probability"],
            "risk_level": result["risk_level"],
            "features": result["features"],
            "weather": weather,
            "power_history_last6": power_history[-6:] if len(power_history) >= 6 else power_history,
        }
    except Exception as e:
        return {
            "prediction": -1,
            "drop_probability": 0.0,
            "risk_level": "unknown",
            "error": str(e),
            "weather": weather,
        }


@router.get("/weather")
async def get_weather():
    """Return current simulated weather conditions."""
    return simulator.get_weather_snapshot()
