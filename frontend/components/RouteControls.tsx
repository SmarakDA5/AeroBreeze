"use client";

import { useState } from "react";
import { ActivityType, NavigationMode, Waypoint } from "@/types/aerobreeze";
import { Navigation, Footprints, Flame, Bike, RotateCw, MapPin } from "lucide-react";

interface RouteControlsProps {
  mode: NavigationMode;
  setMode: (m: NavigationMode) => void;
  activity: ActivityType;
  setActivity: (a: ActivityType) => void;
  distanceKm: number;
  setDistanceKm: (d: number) => void;
  onLocateUser: () => void;
  isLocating: boolean;
  onCalculate: () => void;
  isLoading: boolean;
  onShuffleLoop: () => void;
}

export default function RouteControls({
  mode,
  setMode,
  activity,
  setActivity,
  distanceKm,
  setDistanceKm,
  onLocateUser,
  isLocating,
  onCalculate,
  isLoading,
  onShuffleLoop,
}: RouteControlsProps) {
  return (
    <div className="absolute top-5 left-5 right-5 sm:right-auto sm:w-[420px] z-10 space-y-3 pointer-events-auto">
      {/* Brand & Top Bar */}
      <div className="bg-white/85 backdrop-blur-md border border-white/60 p-4 rounded-3xl shadow-sm space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 rounded-full bg-nordic-sageLight flex items-center justify-center">
              <Footprints className="w-4 h-4 text-nordic-pine" />
            </div>
            <div>
              <h1 className="font-semibold text-nordic-charcoal text-base leading-tight">AeroBreeze</h1>
              <p className="text-xs text-nordic-sage">Nordic Clean-Air Routing</p>
            </div>
          </div>
          <button
            onClick={onLocateUser}
            disabled={isLocating}
            className="flex items-center space-x-1.5 px-3 py-1.5 text-xs font-medium rounded-full bg-nordic-glacier text-nordic-pine hover:bg-nordic-sageLight transition"
          >
            <Navigation className={`w-3.5 h-3.5 ${isLocating ? "animate-spin" : ""}`} />
            <span>{isLocating ? "Locating..." : "My Spot"}</span>
          </button>
        </div>

        {/* Activity Selectors */}
        <div className="grid grid-cols-3 gap-1.5 bg-nordic-glacier/60 p-1 rounded-2xl">
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
                className={`flex items-center justify-center space-x-1.5 py-2 rounded-xl text-xs font-medium transition ${
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

        {/* Mode Selector */}
        <div className="flex items-center space-x-2 text-xs pt-1">
          <button
            onClick={() => setMode("CIRCULAR_LOOP")}
            className={`flex-1 py-1.5 rounded-full border text-center transition ${
              mode === "CIRCULAR_LOOP"
                ? "border-nordic-pine text-nordic-pine bg-nordic-sageLight/50 font-medium"
                : "border-nordic-border text-nordic-charcoal/60 hover:border-nordic-charcoal/30"
            }`}
          >
            Recreational Loop
          </button>
          <button
            onClick={() => setMode("A_TO_B")}
            className={`flex-1 py-1.5 rounded-full border text-center transition ${
              mode === "A_TO_B"
                ? "border-nordic-pine text-nordic-pine bg-nordic-sageLight/50 font-medium"
                : "border-nordic-border text-nordic-charcoal/60 hover:border-nordic-charcoal/30"
            }`}
          >
            A to B Path
          </button>
        </div>

        {/* Distance Slider (Loop Mode) */}
        {mode === "CIRCULAR_LOOP" && (
          <div className="space-y-1.5 pt-1">
            <div className="flex justify-between items-center text-xs">
              <span className="text-nordic-charcoal/70">Loop Distance</span>
              <span className="font-semibold text-nordic-pine">{distanceKm} km</span>
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
          </div>
        )}

        {/* Action Button */}
        <div className="flex items-center space-x-2 pt-2">
          {mode === "CIRCULAR_LOOP" && (
            <button
              onClick={onShuffleLoop}
              title="Shuffle loop direction"
              className="p-2.5 rounded-2xl bg-nordic-glacier text-nordic-pine hover:bg-nordic-sageLight transition"
            >
              <RotateCw className="w-4 h-4" />
            </button>
          )}
          <button
            onClick={onCalculate}
            disabled={isLoading}
            className="flex-1 py-2.5 px-4 bg-nordic-pine hover:bg-nordic-pineHover text-white rounded-2xl text-xs font-medium shadow-sm transition disabled:opacity-50 flex items-center justify-center space-x-2"
          >
            <span>{isLoading ? "Optimizing Clean Air..." : "Generate Route"}</span>
          </button>
        </div>
      </div>
    </div>
  );
}
