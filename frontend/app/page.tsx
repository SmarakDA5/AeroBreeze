"use client";

import { useState, useEffect } from "react";
import Map from "@/components/Map";
import {
  ActivityType,
  NavigationMode,
  Waypoint,
  RouteResponse,
  RouteRequest,
} from "@/types/aerobreeze";
import {
  Navigation,
  Footprints,
  Flame,
  Bike,
  RotateCw,
  Search,
  Trash2,
  MousePointerClick,
  Plus,
  ShieldCheck,
  Clock,
  Route,
  Map as MapIcon,
  ArrowLeft,
  Wind,
} from "lucide-react";

export default function Home() {
  const [center, setCenter] = useState<[number, number]>([88.3639, 22.5726]);
  const [currentLocation, setCurrentLocation] = useState<Waypoint | null>(null);
  const [mode, setMode] = useState<NavigationMode>("CIRCULAR_LOOP");
  const [activity, setActivity] = useState<ActivityType>("WALK");
  const [distanceKm, setDistanceKm] = useState<number>(4.0);
  const [randomSeed, setRandomSeed] = useState<number>(1);
  const [isLocating, setIsLocating] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [routeData, setRouteData] = useState<RouteResponse | null>(null);

  // Mobile View Toggle: Dashboard vs Live Map
  const [showMobileMap, setShowMobileMap] = useState<boolean>(false);

  // Checkpoints State
  const [checkpoints, setCheckpoints] = useState<Waypoint[]>([]);
  const [isPinModeActive, setIsPinModeActive] = useState<boolean>(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<any[]>([]);

  const backendUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

  // Wake up Render free instance on load
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

  // Set GPS location as the first checkpoint
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

  // Free OpenStreetMap Geocoding
  const handleSearchPlaces = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;

    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(
          searchQuery
        )}&limit=4`,
        { headers: { "Accept-Language": "en" } }
      );
      const data = await res.json();
      setSearchResults(data);
    } catch (err) {
      console.error("Geocoding failed:", err);
    }
  };

  const handleSelectSearchResult = (result: any) => {
    const newWp: Waypoint = {
      id: Math.random().toString(36).substring(2, 9),
      lat: parseFloat(result.lat),
      lng: parseFloat(result.lon),
      label: result.display_name.split(",")[0],
      address: result.display_name,
    };
    setCheckpoints((prev) => [...prev, newWp]);
    setSearchQuery("");
    setSearchResults([]);
  };

  // Map Click (Drops pin when click mode is active)
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

  // API Route Calculation
  const handleCalculateRoute = async () => {
    setIsLoading(true);

    const start = currentLocation || { lat: center[1], lng: center[0] };

    if (mode === "A_TO_B" && checkpoints.length < 2) {
      alert("Please add at least 2 checkpoints to generate an A to B route.");
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
      // Auto open map on mobile when route is ready
      if (window.innerWidth < 1024) {
        setShowMobileMap(true);
      }
    } catch (err) {
      console.error("Routing error:", err);
      alert("Unable to generate route. Please ensure backend is awake.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <main className="h-screen w-screen overflow-hidden bg-nordic-bg font-sans flex flex-col lg:flex-row">
      {/* ======================================================== */}
      {/* LEFT PANEL: DASHBOARD & CONTROLS (Visible on PC & Mobile) */}
      {/* ======================================================== */}
      <section
        className={`w-full lg:w-[480px] xl:w-[520px] h-full flex flex-col justify-between border-r border-nordic-border bg-white/90 backdrop-blur-md z-20 transition-all duration-300 ${
          showMobileMap ? "hidden lg:flex" : "flex"
        }`}
      >
        {/* Top Header */}
        <header className="px-6 py-4 border-b border-nordic-border/60 flex items-center justify-between shrink-0">
          <div className="flex items-center space-x-3">
            <div className="w-9 h-9 rounded-full bg-nordic-sageLight flex items-center justify-center">
              <Footprints className="w-5 h-5 text-nordic-pine" />
            </div>
            <div>
              <h1 className="font-semibold text-nordic-charcoal text-base leading-tight">
                AeroBreeze
              </h1>
              <p className="text-xs text-nordic-sage">Nordic Clean-Air Navigator</p>
            </div>
          </div>

          <button
            onClick={handleLocateUser}
            disabled={isLocating}
            className="flex items-center space-x-1.5 px-3 py-1.5 text-xs font-medium rounded-full bg-nordic-glacier text-nordic-pine hover:bg-nordic-sageLight transition"
          >
            <Navigation className={`w-3.5 h-3.5 ${isLocating ? "animate-spin" : ""}`} />
            <span>{isLocating ? "Locating..." : "My Spot"}</span>
          </button>
        </header>

        {/* Scrollable Setup & Stats Body */}
        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-5">
          {/* Activity Selector */}
          <div className="space-y-1.5">
            <label className="text-[11px] font-semibold text-nordic-charcoal/70 uppercase tracking-wider">
              Activity Type
            </label>
            <div className="grid grid-cols-3 gap-2 bg-nordic-glacier/60 p-1.5 rounded-2xl">
              {[
                { id: "WALK", label: "Walk", icon: Footprints },
                { id: "RUN", label: "Run", icon: Flame },
                { id: "LEISURE_BIKE", label: "Cycle", icon: Bike },
              ].map((item) => {
                const Icon = item.icon;
                const active = activity === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => setActivity(item.id as ActivityType)}
                    className={`flex items-center justify-center space-x-1.5 py-2.5 rounded-xl text-xs font-medium transition ${
                      active
                        ? "bg-white text-nordic-pine shadow-sm font-semibold"
                        : "text-nordic-charcoal/70 hover:text-nordic-charcoal"
                    }`}
                  >
                    <Icon className="w-3.5 h-3.5" />
                    <span>{item.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Navigation Mode Tabs */}
          <div className="space-y-1.5">
            <label className="text-[11px] font-semibold text-nordic-charcoal/70 uppercase tracking-wider">
              Navigation Mode
            </label>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <button
                onClick={() => setMode("CIRCULAR_LOOP")}
                className={`py-2 rounded-xl border text-center transition ${
                  mode === "CIRCULAR_LOOP"
                    ? "border-nordic-pine text-nordic-pine bg-nordic-sageLight/50 font-semibold"
                    : "border-nordic-border text-nordic-charcoal/60 hover:border-nordic-charcoal/30"
                }`}
              >
                Recreational Loop
              </button>
              <button
                onClick={() => setMode("A_TO_B")}
                className={`py-2 rounded-xl border text-center transition ${
                  mode === "A_TO_B"
                    ? "border-nordic-pine text-nordic-pine bg-nordic-sageLight/50 font-semibold"
                    : "border-nordic-border text-nordic-charcoal/60 hover:border-nordic-charcoal/30"
                }`}
              >
                Custom Checkpoints
              </button>
            </div>
          </div>

          {/* Mode Configuration: Loop vs Checkpoints */}
          {mode === "CIRCULAR_LOOP" ? (
            <div className="p-4 rounded-2xl bg-nordic-glacier/30 border border-nordic-border/60 space-y-3">
              <div className="flex justify-between items-center text-xs">
                <span className="text-nordic-charcoal/70">Loop Target Distance</span>
                <span className="font-semibold text-nordic-pine text-sm">{distanceKm} km</span>
              </div>
              <input
                type="range"
                min="1"
                max="20"
                step="0.5"
                value={distanceKm}
                onChange={(e) => setDistanceKm(parseFloat(e.target.value))}
                className="w-full h-1.5 bg-nordic-glacier rounded-lg appearance-none cursor-pointer accent-nordic-pine"
              />
              <div className="flex justify-between items-center text-[11px] text-nordic-charcoal/50 pt-1">
                <span>Starts and ends at your spot</span>
                <button
                  onClick={() => setRandomSeed((s) => s + 1)}
                  className="flex items-center space-x-1 text-nordic-pine hover:underline"
                >
                  <RotateCw className="w-3 h-3" />
                  <span>Shuffle Direction</span>
                </button>
              </div>
            </div>
          ) : (
            /* Checkpoint Configuration */
            <div className="p-4 rounded-2xl bg-nordic-glacier/30 border border-nordic-border/60 space-y-3">
              <div className="flex items-center justify-between text-xs">
                <span className="font-semibold text-nordic-charcoal">Manage Route Stops</span>
                <span className="text-[11px] text-nordic-pine bg-nordic-sageLight px-2 py-0.5 rounded-full font-medium">
                  {checkpoints.length} Selected
                </span>
              </div>

              {/* Pin Drop & GPS toggles */}
              <div className="grid grid-cols-2 gap-2 text-xs">
                <button
                  onClick={() => setIsPinModeActive(!isPinModeActive)}
                  className={`flex items-center justify-center space-x-1.5 py-1.5 px-2 rounded-xl border text-[11px] transition ${
                    isPinModeActive
                      ? "bg-nordic-pine text-white border-nordic-pine"
                      : "border-nordic-border bg-white text-nordic-charcoal"
                  }`}
                >
                  <MousePointerClick className="w-3 h-3" />
                  <span>{isPinModeActive ? "Clicking Active" : "Click to Pin"}</span>
                </button>
                <button
                  onClick={handleUseCurrentLocationAsStart}
                  className="flex items-center justify-center space-x-1.5 py-1.5 px-2 rounded-xl border border-nordic-border bg-white text-nordic-charcoal text-[11px]"
                >
                  <Navigation className="w-3 h-3 text-nordic-pine" />
                  <span>Set Start (GPS)</span>
                </button>
              </div>

              {/* Nominatim Search */}
              <form onSubmit={handleSearchPlaces} className="relative">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search landmark or address..."
                  className="w-full pl-8 pr-3 py-1.5 text-xs bg-white border border-nordic-border rounded-xl focus:outline-none focus:border-nordic-pine text-nordic-charcoal"
                />
                <Search className="w-3.5 h-3.5 text-nordic-sage absolute left-2.5 top-2.5" />
              </form>

              {searchResults.length > 0 && (
                <div className="bg-white border border-nordic-border rounded-xl p-1 max-h-32 overflow-y-auto space-y-1">
                  {searchResults.map((item, idx) => (
                    <button
                      key={idx}
                      onClick={() => handleSelectSearchResult(item)}
                      className="w-full text-left p-1.5 rounded-lg text-[11px] hover:bg-nordic-sageLight/50 flex items-center justify-between truncate"
                    >
                      <span className="truncate pr-2 text-nordic-charcoal">{item.display_name}</span>
                      <Plus className="w-3 h-3 text-nordic-pine shrink-0" />
                    </button>
                  ))}
                </div>
              )}

              {/* Checkpoint list */}
              <div className="space-y-1 max-h-32 overflow-y-auto pr-1">
                {checkpoints.length === 0 ? (
                  <p className="text-[11px] text-nordic-charcoal/50 italic py-2 text-center">
                    No checkpoints added yet. Drop pins or search.
                  </p>
                ) : (
                  checkpoints.map((wp, index) => (
                    <div
                      key={wp.id}
                      className="flex items-center justify-between p-1.5 rounded-lg bg-white border border-nordic-border/50 text-[11px]"
                    >
                      <div className="flex items-center space-x-2 truncate">
                        <span className="w-4 h-4 rounded-full bg-nordic-pine text-white text-[9px] flex items-center justify-center font-bold">
                          {index + 1}
                        </span>
                        <span className="truncate text-nordic-charcoal">{wp.label || `Point ${index + 1}`}</span>
                      </div>
                      <button
                        onClick={() => setCheckpoints((prev) => prev.filter((p) => p.id !== wp.id))}
                        className="text-nordic-charcoal/40 hover:text-red-500"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

          {/* Action Button: Generate */}
          <button
            onClick={handleCalculateRoute}
            disabled={isLoading}
            className="w-full py-3 bg-nordic-pine hover:bg-nordic-pineHover text-white rounded-2xl text-xs font-semibold shadow-sm transition disabled:opacity-50 flex items-center justify-center space-x-2"
          >
            <span>{isLoading ? "Calculating Clean Route..." : "Generate Optimized Route"}</span>
          </button>

          {/* Live Stats & Clean Air Inhalation Card */}
          {routeData ? (
            <div className="p-4 rounded-2xl bg-nordic-sageLight/40 border border-nordic-border/70 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-nordic-charcoal uppercase tracking-wider">
                  Clean-Air Telemetry
                </span>
                <span className="text-[10px] font-semibold text-nordic-pine bg-white px-2 py-0.5 rounded-full border border-nordic-border">
                  Low Exposure Path
                </span>
              </div>

              <div>
                <div className="flex items-baseline space-x-1.5">
                  <span className="text-3xl font-light text-nordic-charcoal">
                    {routeData.total_inhaled_dose_ug}
                  </span>
                  <span className="text-xs text-nordic-charcoal/60 font-medium">µg PM2.5 dose</span>
                </div>
                <p className="text-[11px] text-nordic-sage mt-0.5">
                  Avg Inhaled Concentration: {routeData.average_pm25} µg/m³
                </p>
              </div>

              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="bg-white/80 p-2.5 rounded-xl border border-nordic-border/50 flex items-center space-x-2">
                  <Route className="w-4 h-4 text-nordic-pine shrink-0" />
                  <div>
                    <p className="text-[10px] text-nordic-charcoal/60">Distance</p>
                    <p className="font-semibold text-nordic-charcoal">{routeData.total_distance_km} km</p>
                  </div>
                </div>
                <div className="bg-white/80 p-2.5 rounded-xl border border-nordic-border/50 flex items-center space-x-2">
                  <Clock className="w-4 h-4 text-nordic-pine shrink-0" />
                  <div>
                    <p className="text-[10px] text-nordic-charcoal/60">Duration</p>
                    <p className="font-semibold text-nordic-charcoal">{routeData.total_duration_mins} min</p>
                  </div>
                </div>
              </div>

              <div className="flex items-center space-x-2 text-[11px] text-nordic-pine bg-white/60 p-2 rounded-xl">
                <ShieldCheck className="w-4 h-4 text-nordic-pine shrink-0" />
                <span>Green corridor path prioritized over heavy motor roads.</span>
              </div>
            </div>
          ) : (
            <div className="p-4 rounded-2xl border border-dashed border-nordic-border text-center py-6">
              <Wind className="w-6 h-6 text-nordic-sage mx-auto mb-1.5 opacity-60" />
              <p className="text-xs text-nordic-charcoal/60">Ready to calculate</p>
              <p className="text-[11px] text-nordic-charcoal/40">
                Choose your parameters and hit generate to view clean-air stats.
              </p>
            </div>
          )}
        </div>

        {/* Mobile View Map Button (Pinned to Bottom on Mobile Only) */}
        <div className="p-4 border-t border-nordic-border/60 lg:hidden">
          <button
            onClick={() => setShowMobileMap(true)}
            className="w-full py-2.5 bg-nordic-glacier text-nordic-pine hover:bg-nordic-sageLight rounded-xl text-xs font-semibold flex items-center justify-center space-x-2 transition"
          >
            <MapIcon className="w-4 h-4" />
            <span>View Live Map</span>
          </button>
        </div>
      </section>

      {/* ======================================================== */}
      {/* RIGHT PANEL: LIVE MAP (Persistent on PC, Fullscreen on Mobile) */}
      {/* ======================================================== */}
      <section
        className={`flex-1 h-full relative transition-all duration-300 ${
          showMobileMap
            ? "fixed inset-0 z-50 flex flex-col bg-nordic-bg"
            : "hidden lg:block"
        }`}
      >
        {/* Mobile Header to Unview / Close Map */}
        {showMobileMap && (
          <div className="absolute top-4 left-4 z-20 lg:hidden">
            <button
              onClick={() => setShowMobileMap(false)}
              className="flex items-center space-x-2 px-3 py-2 bg-white/95 backdrop-blur-md border border-nordic-border text-nordic-charcoal text-xs font-semibold rounded-full shadow-md active:scale-95 transition"
            >
              <ArrowLeft className="w-4 h-4 text-nordic-pine" />
              <span>Back to Dashboard</span>
            </button>
          </div>
        )}

        {/* Mobile Floating Mini Stats Bar when viewing map */}
        {showMobileMap && routeData && (
          <div className="absolute bottom-6 left-4 right-4 z-20 lg:hidden">
            <div className="bg-white/95 backdrop-blur-md p-3 rounded-2xl shadow-lg border border-nordic-border flex items-center justify-between">
              <div>
                <p className="text-[10px] text-nordic-charcoal/60">Inhaled PM2.5</p>
                <p className="text-sm font-semibold text-nordic-pine">
                  {routeData.total_inhaled_dose_ug} µg
                </p>
              </div>
              <div className="text-right">
                <p className="text-[10px] text-nordic-charcoal/60">Route Specs</p>
                <p className="text-xs font-medium text-nordic-charcoal">
                  {routeData.total_distance_km} km • {routeData.total_duration_mins} min
                </p>
              </div>
            </div>
          </div>
        )}

        {/* The Live Interactive Map Canvas */}
        <Map
          center={center}
          zoom={13}
          routeGeojson={routeData ? routeData.route_geojson : null}
          currentLocation={currentLocation}
          checkpoints={checkpoints}
          isPinModeActive={isPinModeActive}
          onMapClick={handleMapClick}
          isVisible={showMobileMap || true}
        />
      </section>
    </main>
  );
}
