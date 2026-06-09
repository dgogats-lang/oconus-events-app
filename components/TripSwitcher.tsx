"use client";

import { useState, useTransition } from "react";
import { selectTrip } from "@/actions/trip";
import { useRouter } from "next/navigation";

interface Trip {
  id: string;
  name: string;
}

interface Props {
  trips: Trip[];
  currentTripId: string | null;
}

export default function TripSwitcher({ trips, currentTripId }: Props) {
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();
  const router = useRouter();

  const current = trips.find((t) => t.id === currentTripId) ?? trips[0] ?? null;

  function handleSelect(tripId: string) {
    setOpen(false);
    startTransition(async () => {
      const result = await selectTrip(tripId);
      if (result.success) router.refresh();
    });
  }

  if (trips.length === 0) return null;

  return (
    <div className="relative mb-4">
      {/* Trigger */}
      <button
        onClick={() => setOpen((v) => !v)}
        disabled={pending}
        className="w-full flex items-center justify-between gap-3 bg-white rounded-2xl shadow-sm px-4 py-3.5 active:bg-gray-50 transition-colors"
      >
        <div className="flex items-center gap-3 min-w-0">
          <span className="text-xl">🌍</span>
          <div className="min-w-0 text-left">
            <p className="text-[10px] font-bold text-gray-400 tracking-widest uppercase">
              Active Trip
            </p>
            <p className="text-sm font-semibold text-gray-900 truncate">
              {current?.name ?? "No trip selected"}
            </p>
          </div>
        </div>
        <svg
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          stroke="#D1D5DB"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          className={`flex-shrink-0 transition-transform ${open ? "rotate-90" : ""}`}
        >
          <polyline points="9 18 15 12 9 6" />
        </svg>
      </button>

      {/* Dropdown */}
      {open && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 z-10"
            onClick={() => setOpen(false)}
          />
          <div className="absolute top-full left-0 right-0 mt-1 bg-white rounded-2xl shadow-lg z-20 overflow-hidden">
            {trips.map((trip) => (
              <button
                key={trip.id}
                onClick={() => handleSelect(trip.id)}
                className="w-full flex items-center justify-between px-4 py-3.5 text-left active:bg-gray-50 transition-colors border-b border-gray-100 last:border-0"
              >
                <span className="text-sm font-medium text-gray-900 truncate pr-2">
                  {trip.name}
                </span>
                {trip.id === currentTripId && (
                  <svg
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="#0C2340"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="flex-shrink-0"
                  >
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                )}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
