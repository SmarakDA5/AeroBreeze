"use client";

import { useState } from "react";
import { Waypoint } from "@/types/aerobreeze";
import { 
  MapPin, 
  Search, 
  Trash2, 
  MousePointerClick, 
  Navigation, 
  Plus, 
  Layers 
} from "lucide-react";

interface CheckpointPanelProps {
  checkpoints: Waypoint[];
  onAddCheckpoint: (wp: Waypoint) => void;
  onRemoveCheckpoint: (id: string) => void;
  onClearCheckpoints: () => void;
  isPinModeActive: boolean;
  setIsPinModeActive: (active: boolean) => void;
  onUseCurrentLocationAsStart: () => void;
}

export default function CheckpointPanel({
  checkpoints,
  onAddCheckpoint,
  onRemoveCheckpoint,
  onClearCheckpoints,
  isPinModeActive,
  setIsPinModeActive,
  onUseCurrentLocationAsStart,
}: CheckpointPanelProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);

  // Free OpenStreetMap Nominatim Geocoding API (Zero API key needed)
  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;

    setIsSearching(true);
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
    } finally {
      setIsSearching(false);
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
    onAddCheckpoint(newWp);
    setSearchQuery("");
    setSearchResults([]);
  };

  return (
    <div className="bg-white/85 backdrop-blur-md border border-white/60 p-4 rounded-3xl shadow-sm space-y-3.5">
      <div className="flex items-center justify-between border-b border-nordic-border/50 pb-2">
        <div className="flex items-center space-x-2">
          <Layers className="w-4 h-4 text-nordic-pine" />
          <h2 className="text-xs font-semibold text-nordic-charcoal uppercase tracking-wider">
            Checkpoints & Stops
          </h2>
        </div>
        <span className="text-[11px] font-medium text-nordic-pine px-2 py-0.5 rounded-full bg-nordic-sageLight">
          {checkpoints.length} Selected
        </span>
      </div>

      {/* Mode Action Toggles */}
      <div className="grid grid-cols-2 gap-2 text-xs">
        <button
          onClick={() => setIsPinModeActive(!isPinModeActive)}
          className={`flex items-center justify-center space-x-1.5 py-2 px-3 rounded-xl border transition ${
            isPinModeActive
              ? "bg-nordic-pine text-white border-nordic-pine shadow-sm font-medium"
              : "border-nordic-border bg-nordic-glacier/40 text-nordic-charcoal hover:bg-nordic-sageLight/50"
          }`}
        >
          <MousePointerClick className="w-3.5 h-3.5" />
          <span>{isPinModeActive ? "Clicking Map Active" : "Click Map to Pin"}</span>
        </button>

        <button
          onClick={onUseCurrentLocationAsStart}
          className="flex items-center justify-center space-x-1.5 py-2 px-3 rounded-xl border border-nordic-border bg-nordic-glacier/40 text-nordic-charcoal hover:bg-nordic-sageLight/50 transition"
        >
          <Navigation className="w-3.5 h-3.5 text-nordic-pine" />
          <span>Set Start (GPS)</span>
        </button>
      </div>

      {/* Free Nominatim Search Bar */}
      <form onSubmit={handleSearch} className="relative">
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search place or landmark..."
          className="w-full pl-8 pr-3 py-1.5 text-xs bg-nordic-glacier/60 border border-nordic-border rounded-xl focus:outline-none focus:border-nordic-pine text-nordic-charcoal"
        />
        <Search className="w-3.5 h-3.5 text-nordic-sage absolute left-2.5 top-2.5" />
      </form>

      {/* Search Autocomplete Results */}
      {searchResults.length > 0 && (
        <div className="bg-white border border-nordic-border rounded-xl shadow-md p-1 space-y-1 max-h-36 overflow-y-auto">
          {searchResults.map((item, idx) => (
            <button
              key={idx}
              onClick={() => handleSelectSearchResult(item)}
              className="w-full text-left p-1.5 rounded-lg text-[11px] hover:bg-nordic-sageLight/50 flex items-center justify-between transition"
            >
              <span className="truncate pr-2 text-nordic-charcoal">
                {item.display_name}
              </span>
              <Plus className="w-3 h-3 text-nordic-pine shrink-0" />
            </button>
          ))}
        </div>
      )}

      {/* List of Checkpoints */}
      <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
        {checkpoints.length === 0 ? (
          <p className="text-center py-4 text-xs text-nordic-charcoal/50 italic">
            No checkpoints added yet. Click on the map or search to place pins.
          </p>
        ) : (
          checkpoints.map((wp, index) => {
            const isStart = index === 0;
            const isEnd = index === checkpoints.length - 1 && checkpoints.length > 1;

            return (
              <div
                key={wp.id}
                className="flex items-center justify-between p-2 rounded-xl bg-nordic-glacier/40 border border-nordic-border/60 text-xs"
              >
                <div className="flex items-center space-x-2 truncate pr-2">
                  <div
                    className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold shrink-0 ${
                      isStart
                        ? "bg-emerald-600 text-white"
                        : isEnd
                        ? "bg-nordic-pine text-white"
                        : "bg-nordic-sage text-white"
                    }`}
                  >
                    {isStart ? "S" : isEnd ? "D" : index}
                  </div>
                  <div className="truncate">
                    <p className="font-medium text-nordic-charcoal truncate">
                      {wp.label || `Point ${index + 1}`}
                    </p>
                    <p className="text-[10px] text-nordic-charcoal/50">
                      {wp.lat.toFixed(4)}, {wp.lng.toFixed(4)}
                    </p>
                  </div>
                </div>

                <button
                  onClick={() => onRemoveCheckpoint(wp.id)}
                  className="p-1 text-nordic-charcoal/40 hover:text-red-500 transition"
                  title="Remove checkpoint"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            );
          })
        )}
      </div>

      {checkpoints.length > 0 && (
        <button
          onClick={onClearCheckpoints}
          className="w-full text-center py-1 text-[11px] text-red-500 hover:text-red-700 transition"
        >
          Clear All Checkpoints
        </button>
      )}
    </div>
  );
}
