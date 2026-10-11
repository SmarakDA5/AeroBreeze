"use client";

import { useEffect, useRef } from "react";
import maplibregl, { Map as MapLibreMap, Marker } from "maplibre-gl";
import { Waypoint } from "@/types/aerobreeze";

interface MapProps {
  center: [number, number];
  zoom: number;
  routeGeojson: GeoJSON.FeatureCollection | null;
  currentLocation: Waypoint | null;
  checkpoints: Waypoint[];
  isPinModeActive: boolean;
  onMapClick: (coords: { lat: number; lng: number }) => void;
}

export default function Map({
  center,
  zoom,
  routeGeojson,
  currentLocation,
  checkpoints,
  isPinModeActive,
  onMapClick,
}: MapProps) {
  const mapContainer = useRef<HTMLDivElement>(null);
  const mapRef = useRef<MapLibreMap | null>(null);
  const userMarkerRef = useRef<Marker | null>(null);
  const checkpointMarkersRef = useRef<Marker[]>([]);

  // Initialize Map
  useEffect(() => {
    if (!mapContainer.current || mapRef.current) return;

    const map = new maplibregl.Map({
      container: mapContainer.current,
      style: "https://basemaps.cartocdn.com/gl/positron-gl-style/style.json",
      center: center,
      zoom: zoom,
      attributionControl: false,
    });

    map.addControl(new maplibregl.NavigationControl({ showCompass: false }), "top-right");

    map.on("click", (e) => {
      onMapClick({ lat: e.lngLat.lat, lng: e.lngLat.lng });
    });

    mapRef.current = map;

    return () => {
      map.remove();
      mapRef.current = null;
    };
  }, []);

  // Change cursor when in click-to-pin mode
  useEffect(() => {
    if (!mapRef.current) return;
    mapRef.current.getCanvas().style.cursor = isPinModeActive ? "crosshair" : "";
  }, [isPinModeActive]);

  // Update User GPS Marker
  useEffect(() => {
    if (mapRef.current && currentLocation) {
      if (!userMarkerRef.current) {
        const el = document.createElement("div");
        el.className =
          "w-5 h-5 bg-nordic-cyan border-2 border-white rounded-full shadow-lg ring-4 ring-nordic-cyan/20 animate-pulse";
        userMarkerRef.current = new maplibregl.Marker({ element: el })
          .setLngLat([currentLocation.lng, currentLocation.lat])
          .addTo(mapRef.current);
      } else {
        userMarkerRef.current.setLngLat([currentLocation.lng, currentLocation.lat]);
      }
    }
  }, [currentLocation]);

  // Render Checkpoint Markers on the Map
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    // Clear existing markers
    checkpointMarkersRef.current.forEach((m) => m.remove());
    checkpointMarkersRef.current = [];

    // Add updated markers
    checkpoints.forEach((wp, index) => {
      const isStart = index === 0;
      const isEnd = index === checkpoints.length - 1 && checkpoints.length > 1;

      const el = document.createElement("div");
      el.className = `w-7 h-7 rounded-full border-2 border-white shadow-md flex items-center justify-center text-xs font-bold text-white transition-transform hover:scale-125 ${
        isStart
          ? "bg-emerald-600 ring-2 ring-emerald-600/30"
          : isEnd
          ? "bg-nordic-pine ring-2 ring-nordic-pine/30"
          : "bg-nordic-sage ring-2 ring-nordic-sage/30"
      }`;
      el.innerText = isStart ? "S" : isEnd ? "D" : `${index}`;

      const marker = new maplibregl.Marker({ element: el })
        .setLngLat([wp.lng, wp.lat])
        .addTo(map);

      checkpointMarkersRef.current.push(marker);
    });
  }, [checkpoints]);

  // Render Route Polyline
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !map.isStyleLoaded()) return;

    const sourceId = "aerobreeze-route";
    const layerId = "aerobreeze-route-line";
    const casingLayerId = "aerobreeze-route-casing";

    if (!routeGeojson) {
      if (map.getLayer(layerId)) map.removeLayer(layerId);
      if (map.getLayer(casingLayerId)) map.removeLayer(casingLayerId);
      if (map.getSource(sourceId)) map.removeSource(sourceId);
      return;
    }

    if (map.getSource(sourceId)) {
      (map.getSource(sourceId) as maplibregl.GeoJSONSource).setData(routeGeojson);
    } else {
      map.addSource(sourceId, { type: "geojson", data: routeGeojson });

      map.addLayer({
        id: casingLayerId,
        type: "line",
        source: sourceId,
        layout: { "line-join": "round", "line-cap": "round" },
        paint: {
          "line-color": "#ffffff",
          "line-width": 8,
          "line-opacity": 0.8,
        },
      });

      map.addLayer({
        id: layerId,
        type: "line",
        source: sourceId,
        layout: { "line-join": "round", "line-cap": "round" },
        paint: { "line-color": "#2D5A43", "line-width": 5 },
      });
    }

    try {
      const coordinates = (routeGeojson.features[0].geometry as any).coordinates;
      const bounds = coordinates.reduce(
        (b: any, coord: any) => b.extend(coord),
        new maplibregl.LngLatBounds(coordinates[0], coordinates[0])
      );
      map.fitBounds(bounds, { padding: 90, duration: 1500 });
    } catch (e) {
      console.warn("Unable to fit route bounds", e);
    }
  }, [routeGeojson]);

  return <div ref={mapContainer} className="h-full w-full relative" />;
}
