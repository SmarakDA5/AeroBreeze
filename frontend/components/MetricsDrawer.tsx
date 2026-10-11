"use client";

import { RouteResponse } from "@/types/aerobreeze";
import { Wind, ShieldCheck, Clock, Route } from "lucide-react";

interface MetricsDrawerProps {
  metrics: RouteResponse | null;
}

export default function MetricsDrawer({ metrics }: MetricsDrawerProps) {
  if (!metrics) return null;

  return (
    <div className="absolute bottom-6 left-5 right-5 sm:left-auto sm:right-6 sm:w-80 z-10 pointer-events-auto">
      <div className="bg-white/85 backdrop-blur-md border border-white/60 p-5 rounded-3xl shadow-sm space-y-4">
        {/* Exposure Status Banner */}
        <div className="flex items-center justify-between pb-2 border-b border-nordic-border/50">
          <div className="flex items-center space-x-2">
            <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-xs font-semibold text-nordic-charcoal uppercase tracking-wider">
              Optimal Canopy Air
            </span>
          </div>
          <span className="text-[11px] font-medium text-nordic-pine px-2 py-0.5 rounded-full bg-nordic-sageLight">
            Low PM2.5
          </span>
        </div>

        {/* Main Inhalation Score */}
        <div>
          <div className="flex items-baseline space-x-1">
            <span className="text-3xl font-light tracking-tight text-nordic-charcoal">
              {metrics.total_inhaled_dose_ug}
            </span>
            <span className="text-xs text-nordic-charcoal/60 font-medium">µg inhaled dose</span>
          </div>
          <p className="text-[11px] text-nordic-sage mt-0.5">
            Avg Ambient: {metrics.average_pm25} µg/m³
          </p>
        </div>

        {/* Telemetry Grid */}
        <div className="grid grid-cols-2 gap-2 text-xs pt-1">
          <div className="bg-nordic-glacier/40 p-2.5 rounded-2xl flex items-center space-x-2.5">
            <Route className="w-4 h-4 text-nordic-pine shrink-0" />
            <div>
              <p className="text-[10px] text-nordic-charcoal/60">Distance</p>
              <p className="font-semibold text-nordic-charcoal">{metrics.total_distance_km} km</p>
            </div>
          </div>
          <div className="bg-nordic-glacier/40 p-2.5 rounded-2xl flex items-center space-x-2.5">
            <Clock className="w-4 h-4 text-nordic-pine shrink-0" />
            <div>
              <p className="text-[10px] text-nordic-charcoal/60">Duration</p>
              <p className="font-semibold text-nordic-charcoal">{metrics.total_duration_mins} min</p>
            </div>
          </div>
        </div>

        {/* Health Shield Footer */}
        <div className="flex items-center space-x-2 text-[11px] text-nordic-pine/80 bg-nordic-sageLight/50 p-2 rounded-xl">
          <ShieldCheck className="w-4 h-4 shrink-0 text-nordic-pine" />
          <span>Bypassed high-traffic corridors for park canopy.</span>
        </div>
      </div>
    </div>
  );
}
