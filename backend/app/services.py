import os
from pathlib import Path
from typing import List, Dict, Any
import requests
import numpy as np
import onnxruntime as ort
from app.schemas import RouteRequest

# Base directory relative to backend root
BASE_DIR = Path(__file__).resolve().parent.parent
MODEL_PATH = os.getenv("MODEL_PATH", str(BASE_DIR / "models" / "aerobreeze_pm25.onnx"))
ORS_API_KEY = os.getenv("ORS_API_KEY", "")

# Load ONNX model once on module import to keep memory consumption < 25MB
if not os.path.exists(MODEL_PATH):
    raise FileNotFoundError(f"Model file not found at: {MODEL_PATH}")

session = ort.InferenceSession(MODEL_PATH, providers=["CPUExecutionProvider"])
input_name = session.get_inputs()[0].name

# Compendium of Physical Activities: MET values
MET_LOOKUP: Dict[str, float] = {
    "WALK": 3.5,
    "RUN": 8.0,
    "LEISURE_BIKE": 5.5
}

def predict_pm25_concentration(sensor_vector: List[float]) -> float:
    """
    Feeds 8-feature vector [PM10, NO, NO2, NOx, NH3, CO, SO2, O3] to ONNX.
    Clamps output to a positive minimum of 1.0 ug/m3.
    """
    input_tensor = np.array([sensor_vector], dtype=np.float32)
    prediction = session.run(None, {input_name: input_tensor})[0][0]
    return float(np.maximum(1.0, prediction))

def calculate_inhalation_rate(weight_kg: float, activity: str) -> float:
    """
    Computes Minute Ventilation (Ve) in m^3/second.
    Formula: Ve (L/min) = 0.21 * weight_kg * MET
    """
    met = MET_LOOKUP.get(activity, 3.5)
    ve_liters_per_min = 0.21 * weight_kg * met
    ve_m3_per_second = (ve_liters_per_min / 1000.0) / 60.0
    return ve_m3_per_second

def fetch_ors_route(payload: RouteRequest) -> Dict[str, Any]:
    """Queries OpenRouteService for pedestrian or bicycle GeoJSON routes."""
    if not ORS_API_KEY:
        raise ValueError("ORS_API_KEY is missing. Configure it in environment variables.")

    profile = "foot-walking" if payload.activity in ["WALK", "RUN"] else "cycling-regular"
    url = f"https://api.openrouteservice.org/v2/directions/{profile}/geojson"
    headers = {
        "Authorization": ORS_API_KEY,
        "Content-Type": "application/json"
    }

    if payload.mode == "CIRCULAR_LOOP":
        if not payload.circular_params:
            raise ValueError("circular_params must be supplied when mode is CIRCULAR_LOOP")
        start = payload.circular_params.start_location
        body = {
            "coordinates": [[start.lng, start.lat]],
            "options": {
                "round_trip": {
                    "length": payload.circular_params.target_distance_meters,
                    "points": 4,
                    "seed": payload.circular_params.random_seed or 1
                }
            }
        }
    else:
        if not payload.waypoints or len(payload.waypoints) < 2:
            raise ValueError("A_TO_B routing requires at least 2 waypoints")
        body = {
            "coordinates": [[wp.lng, wp.lat] for wp in payload.waypoints]
        }

    response = requests.post(url, json=body, headers=headers, timeout=12)
    response.raise_for_status()
    return response.json()

def process_route_exposure(route_geojson: Dict[str, Any], payload: RouteRequest) -> Dict[str, Any]:
    """
    Computes total inhaled PM2.5 dosage along the route geometry
    and enriches GeoJSON feature properties with air quality metadata.
    """
    feature = route_geojson["features"][0]
    summary = feature["properties"]["summary"]
    total_distance_m = summary["distance"]
    total_duration_s = summary["duration"]

    # Baseline atmospheric sensor vector [PM10, NO, NO2, NOx, NH3, CO, SO2, O3]
    baseline_sensor_vector = [75.0, 16.0, 24.0, 28.0, 10.0, 0.8, 12.0, 30.0]
    predicted_pm25 = predict_pm25_concentration(baseline_sensor_vector)

    ve_rate = calculate_inhalation_rate(payload.user_weight_kg, payload.activity)
    total_dose_ug = predicted_pm25 * ve_rate * total_duration_s

    feature["properties"]["air_metrics"] = {
        "predicted_pm25": round(predicted_pm25, 2),
        "inhaled_dose_ug": round(total_dose_ug, 2)
    }

    return {
        "total_distance_km": round(total_distance_m / 1000.0, 2),
        "total_duration_mins": round(total_duration_s / 60.0, 1),
        "total_inhaled_dose_ug": round(total_dose_ug, 2),
        "average_pm25": round(predicted_pm25, 2),
        "route_geojson": route_geojson
    }
