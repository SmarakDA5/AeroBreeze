export type NavigationMode = "CIRCULAR_LOOP" | "A_TO_B";
export type ActivityType = "WALK" | "RUN" | "LEISURE_BIKE";

export interface Waypoint {
  id: string;
  lat: number;
  lng: number;
  label?: string;
  address?: string;
}

export interface CircularParams {
  start_location: { lat: number; lng: number };
  target_distance_meters: number;
  random_seed?: number;
}

export interface RouteRequest {
  mode: NavigationMode;
  activity: ActivityType;
  user_weight_kg: number;
  waypoints?: Array<{ lat: number; lng: number }>;
  circular_params?: CircularParams;
}

export interface RouteResponse {
  total_distance_km: number;
  total_duration_mins: number;
  total_inhaled_dose_ug: number;
  average_pm25: number;
  route_geojson: GeoJSON.FeatureCollection;
}
