from typing import List, Optional, Literal, Dict, Any
from pydantic import BaseModel, Field

ActivityType = Literal["WALK", "RUN", "LEISURE_BIKE"]
NavigationMode = Literal["A_TO_B", "CIRCULAR_LOOP"]

class Waypoint(BaseModel):
    lat: float = Field(..., ge=-90.0, le=90.0, description="Latitude in decimal degrees")
    lng: float = Field(..., ge=-180.0, le=180.0, description="Longitude in decimal degrees")

class CircularParams(BaseModel):
    start_location: Waypoint
    target_distance_meters: float = Field(..., gt=100.0, le=50000.0, description="Loop target length in meters")
    random_seed: Optional[int] = Field(1, description="Seed integer to vary circular route direction")

class RouteRequest(BaseModel):
    mode: NavigationMode
    activity: ActivityType = "WALK"
    user_weight_kg: float = Field(70.0, gt=20.0, le=250.0, description="Body weight for minute ventilation calculation")
    waypoints: Optional[List[Waypoint]] = Field(None, description="Ordered coordinates for A_TO_B mode")
    circular_params: Optional[CircularParams] = Field(None, description="Parameters for CIRCULAR_LOOP mode")

class AirMetrics(BaseModel):
    predicted_pm25: float
    inhaled_dose_ug: float

class RouteResponse(BaseModel):
    total_distance_km: float
    total_duration_mins: float
    total_inhaled_dose_ug: float
    average_pm25: float
    route_geojson: Dict[str, Any]
