import os
import sys
from pathlib import Path
from typing import List, Dict, Any, Optional
import requests
import numpy as np
import onnxruntime as ort
from app.schemas import RouteRequest

# Base directory: /opt/render/project/src/backend
BASE_DIR = Path(__file__).resolve().parent.parent
default_model_path = str(BASE_DIR / "models" / "aerobreeze_pm25.onnx")
MODEL_PATH = os.getenv("MODEL_PATH", default_model_path)
ORS_API_KEY = os.getenv("ORS_API_KEY", "")

session: Optional[ort.InferenceSession] = None
input_name: Optional[str] = None

# Graceful model loader to prevent startup failure
try:
    if not os.path.exists(MODEL_PATH):
        # Fallback check for relative path
        alt_path = "models/aerobreeze_pm25.onnx"
        if os.path.exists(alt_path):
            MODEL_PATH = alt_path
        else:
            print(f"[ERROR] ONNX Model not found at: {MODEL_PATH}", file=sys.stderr)
            print(f"[DEBUG] Current working directory: {os.getcwd()}", file=sys.stderr)
            print(f"[DEBUG] Files in BASE_DIR: {list(BASE_DIR.glob('**/*'))}", file=sys.stderr)

    if os.path.exists(MODEL_PATH):
        session = ort.InferenceSession(MODEL_PATH, providers=["CPUExecutionProvider"])
        input_name = session.get_inputs()[0].name
        print(f"[INFO] Successfully loaded ONNX model from: {MODEL_PATH}")
    else:
        print("[WARNING] Running without ONNX model session. Model inference will use fallback heuristic.", file=sys.stderr)
except Exception as e:
    print(f"[ERROR] Failed to initialize ONNX runtime: {e}", file=sys.stderr)

MET_LOOKUP: Dict[str, float] = {
    "WALK": 3.5,
    "RUN": 8.0,
    "LEISURE_BIKE": 5.5
}

def predict_pm25_concentration(sensor_vector: List[float]) -> float:
    """Predicts PM2.5 or provides graceful baseline fallback."""
    if session is not None and input_name is not None:
        input_tensor = np.array([sensor_vector], dtype=np.float32)
        prediction = session.run(None, {input_name: input_tensor})[0][0]
        return float(np.maximum(1.0, prediction))
    
    # Safe fallback if model binary is missing
    return float(max(1.0, 0.5 * sensor_vector[0] + 0.3 * sensor_vector[2]))

def calculate_inhalation_rate(weight_kg: float, activity: str) -> float:
    met = MET_LOOKUP.get(activity, 3.5)
    ve_liters_per_min = 0.21 * weight_kg * met
    return (ve_liters_per_min / 1000.0) / 60.0

def fetch_ors_route(payload: RouteRequest) -> Dict[str, Any]:
    if not ORS_API_KEY:
        raise ValueError("ORS_API_KEY is not configured in environment variables.")

    profile = "foot-walking" if payload.activity in ["WALK", "RUN"] else "cycling-regular"
    url = f"https://api.openrouteservice.org/v2/directions/{profile}/geojson"
    headers = {
        "Authorization": ORS_API_KEY,
        "Content-Type": "application/json"
    }

    if payload.mode == "CIRCULAR_LOOP":
        if not payload.circular_params:
            raise ValueError("circular_params required for CIRCULAR_LOOP mode")
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
    feature = route_geojson["features"][0]
    summary = feature["properties"]["summary"]
    total_distance_m = summary["distance"]
    total_duration_s = summary["duration"]

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
