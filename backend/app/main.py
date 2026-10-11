import os
from dotenv import load_dotenv

# Load local environment variables if available
load_dotenv()

from fastapi import FastAPI, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from app.schemas import RouteRequest, RouteResponse
from app.services import fetch_ors_route, process_route_exposure

app = FastAPI(
    title="AeroBreeze Core Engine",
    description="Clean-air microclimate exposure and recreation routing API",
    version="1.0.0"
)

# Enable CORS for Vercel production and local development previews
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/health", status_code=status.HTTP_200_OK)
def health_check():
    """Health check endpoint used by Vercel frontend to wake up sleeping Render instance."""
    return {"status": "operational", "runtime": "native-python-onnx"}

@app.post("/api/v1/route", response_model=RouteResponse)
def compute_route(payload: RouteRequest):
    """Processes either point-to-point waypoints or circular recreational loops."""
    if payload.mode == "A_TO_B":
        if not payload.waypoints or len(payload.waypoints) < 2:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="A_TO_B mode requires a minimum of 2 waypoints."
            )
    elif payload.mode == "CIRCULAR_LOOP":
        if not payload.circular_params:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="CIRCULAR_LOOP mode requires circular_params (start_location & target_distance_meters)."
            )

    try:
        raw_geojson = fetch_ors_route(payload)
        return process_route_exposure(raw_geojson, payload)
    except requests.exceptions.HTTPError as http_err:
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail=f"OpenRouteService Gateway Error: {http_err.response.text}"
        )
    except Exception as exc:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Route processing execution failed: {str(exc)}"
        )
