"use client";

import { useState, useEffect } from "react";
import Map from "@/components/Map";
import RouteControls from "@/components/RouteControls";
import CheckpointPanel from "@/components/CheckpointPanel";
import MetricsDrawer from "@/components/MetricsDrawer";
import {
  ActivityType,
  NavigationMode,
  Waypoint,
  RouteResponse,
  RouteRequest,
} from "@/types/aerobreeze";

export default function Home() {
  const [center, setCenter] = useState<[number, number]>([88.3639, 22.5726]);
  const [currentLocation, setCurrentLocation] = useState<Waypoint | null>(null);
  const [mode, setMode] = useState<NavigationMode>("A_TO_B");
  const [activity, setActivity] = useState<ActivityType>("WALK");
  const [distanceKm, setDistanceKm] = useState<number>(4.0);
  const [randomSeed, setRandomSeed] = useState<number>(1);
  const [isLocating, setIsLocating] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [routeData, setRouteData] = useState<RouteResponse | null>(null);
  
  // Interactive Checkpoint State
  const [checkpoints, setCheckpoints] = useState<Waypoint[]>([]);
  const [isPinModeActive, setIsPinModeActive] = useState<boolean>(true);

  const backendUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

  // Wake up sleeping Render free instance on load
  useEffect(() => {
    fetch(`${backendUrl}/health`).catch(() => {});
  }, [backendUrl]);

  // Request GPS Location
  const handleLocateUser = () => {
    if (!navigator.geolocation) {
      alert("Geolocation is not supported by your browser.");
      return;
    }
    setIsLocating(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const spot: Waypoint = {
          id: "current-gps",
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
          label: "My Spot",
        };
        setCurrentLocation(spot);
        setCenter([spot.lng, spot.lat]);
        setIsLocating(false);
      },
      (err) => {
        console.warn("Location permission denied", err);
        setIsLocating(false);
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  // Set Current Location as Start Point in the Checkpoints Panel
  const handleUseCurrentLocationAsStart = () => {
    if (!currentLocation) {
      handleLocateUser();
    }
    if (currentLocation) {
      setCheckpoints((prev) => [
        currentLocation,
        ...prev.filter((p) => p.id !== "current-gps"),
      ]);
    }
  };

  // Map Click Handler: Drops a pin if Pin Mode is active
  const handleMapClick = (coords: { lat: number; lng: number }) => {
    if (!isPinModeActive && mode !== "A_TO_B") return;

    const newWp: Waypoint = {
      id: Math.random().toString(36).substring(2, 9),
      lat: coords.lat,
      lng: coords.lng,
      label: `Point ${checkpoints.length + 1}`,
    };
    setCheckpoints((prev) => [...prev, newWp]);
  };

  const handleRemoveCheckpoint = (id: string) => {
    setCheckpoints((prev) => prev.filter((p) => p.id !== id));
  };

  const handleClearCheckpoints = () => {
    setCheckpoints([]);
    setRouteData(null);
  };

  // Compute Clean Air Route
  const handleCalculateRoute = async () => {
    setIsLoading(true);

    const start = currentLocation || { lat: center[1], lng: center[0] };

    if (mode === "A_TO_B" && checkpoints.length < 2) {
      alert("Please add at least 2 checkpoints (Start and Destination) to generate a route.");
      setIsLoading(false);
      return;
    }

    const payload: RouteRequest = {
      mode,
      activity,
      user_weight_kg: 70.0,
      ...(mode === "CIRCULAR_LOOP"
        ? {
            circular_params: {
              start_location: { lat: start.lat, lng: start.lng },
              target_distance_meters: distanceKm * 1000,
              random_seed: randomSeed,
            },
          }
        : {
            waypoints: checkpoints.map((cp) => ({ lat: cp.lat, lng: cp.lng })),
          }),
    };

    try {
      const res = await fetch(`${backendUrl}/api/v1/route`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        throw new Error(`Server returned error: ${res.statusText}`);
      }

      const data: RouteResponse = await res.json();
      setRouteData(data);
    } catch (err) {
      console.error("Routing error:", err);
      alert("Unable to generate route. Ensure the backend instance is active.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <main className="relative h-screen w-screen overflow-hidden bg-nordic-bg font-sans">
      {/* Live Map Canvas */}
      <Map
        center={center}
        zoom={13}
        routeGeojson={routeData ? routeData.route_geojson : null}
        currentLocation={currentLocation}
        checkpoints={checkpoints}
        isPinModeActive={isPinModeActive}
        onMapClick={handleMapClick}
      />

      {/* Primary Top Bar & Mode Selectors */}
      <RouteControls
        mode={mode}
        setMode={setMode}
        activity={activity}
        setActivity={setActivity}
        distanceKm={distanceKm}
        setDistanceKm={setDistanceKm}
        onLocateUser={handleLocateUser}
        isLocating={isLocating}
        onCalculate={handleCalculateRoute}
        isLoading={isLoading}
        onShuffleLoop={() => setRandomSeed((s) => s + 1)}
      />

      {/* Dedicated Checkpoint Management Panel (A-to-B Mode) */}
      {mode === "A_TO_B" && (
        <div className="absolute top-[280px] left-5 right-5 sm:right-auto sm:w-[420px] z-10 pointer-events-auto">
          <CheckpointPanel
            checkpoints={checkpoints}
            onAddCheckpoint={(wp) => setCheckpoints((prev) => [...prev, wp])}
            onRemoveCheckpoint={handleRemoveCheckpoint}
            onClearCheckpoints={handleClearCheckpoints}
            isPinModeActive={isPinModeActive}
            setIsPinModeActive={setIsPinModeActive}
            onUseCurrentLocationAsStart={handleUseCurrentLocationAsStart}
          />
        </div>
      )}

      {/* Clean Air Telemetry HUD */}
      <MetricsDrawer metrics={routeData} />
    </main>
  );
}
