"use client";

import { useState } from "react";
import Link from "next/link";
import { assignToHotel } from "@/actions/hotelManifest";

// ─── types ────────────────────────────────────────────────────────────────────

export interface HotelStop {
  label: string;               // "Munich Summit · Munich" or "Transit"
  hotelId: string | null;      // assigned hotel id
  hotelName: string | null;    // assigned or (for transit) the hotel name
  roomNumber: string | null;
  isGap: boolean;              // travel package + not assigned
  availableHotels: { id: string; name: string }[];
}

interface Props {
  attendeeId: string;
  stops: HotelStop[];
}

// ─── component ────────────────────────────────────────────────────────────────

export default function AttendeeHotelsClient({ attendeeId, stops }: Props) {
  const [liveStops, setLiveStops] = useState<HotelStop[]>(stops);
  const [openSheet, setOpenSheet] = useState<number | null>(null);
  const [pending, setPending] = useState(false);

  async function handleAssign(stopIndex: number, hotelId: string, hotelName: string) {
    setPending(true);
    setLiveStops((prev) =>
      prev.map((s, i) =>
        i === stopIndex
          ? {
              ...s,
              hotelId,
              hotelName,
              isGap: false,
              availableHotels: s.availableHotels.filter((h) => h.id !== hotelId),
            }
          : s
      )
    );
    setOpenSheet(null);

    const result = await assignToHotel(hotelId, attendeeId);
    if (!result.success) {
      // Rollback
      setLiveStops(stops);
    }
    setPending(false);
  }

  return (
    <div className="bg-white rounded-2xl shadow-sm p-4">
      <p className="text-sm font-semibold text-gray-800 mb-3">Hotels</p>

      <div className="space-y-4">
        {liveStops.map((stop, i) => (
          <div key={i}>
            <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wide mb-1">
              {stop.label}
            </p>

            {stop.hotelId ? (
              /* ── Assigned ── */
              <div className="flex items-center justify-between gap-2">
                <div className="min-w-0">
                  <Link
                    href={`/hotels/${stop.hotelId}`}
                    className="text-sm font-medium text-[#0C2340]"
                  >
                    {stop.hotelName}
                  </Link>
                  <p className="text-xs text-gray-400 mt-0.5">
                    {stop.roomNumber ? `Room ${stop.roomNumber}` : "No room assigned"}
                  </p>
                </div>
                {stop.availableHotels.length > 0 && (
                  <button
                    onClick={() => setOpenSheet(i)}
                    className="text-xs text-blue-600 font-medium shrink-0"
                  >
                    Change
                  </button>
                )}
              </div>
            ) : stop.isGap ? (
              /* ── Gap (travel package, not assigned) ── */
              <div className="flex items-center justify-between gap-2 bg-amber-50 rounded-xl px-3 py-2.5">
                <div className="flex items-center gap-2 min-w-0">
                  <svg
                    width="14"
                    height="14"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="text-amber-600 shrink-0"
                  >
                    <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
                    <line x1="12" y1="9" x2="12" y2="13" />
                    <line x1="12" y1="17" x2="12.01" y2="17" />
                  </svg>
                  <div className="min-w-0">
                    {stop.hotelName && (
                      <p className="text-xs font-medium text-amber-800 truncate">
                        {stop.hotelName}
                      </p>
                    )}
                    <p className="text-xs text-amber-700">No hotel assigned</p>
                  </div>
                </div>
                {stop.availableHotels.length > 0 && (
                  <button
                    onClick={() => setOpenSheet(i)}
                    className="text-xs font-semibold text-amber-800 bg-amber-100 rounded-full px-2.5 py-1 shrink-0"
                  >
                    Assign
                  </button>
                )}
              </div>
            ) : (
              /* ── Not assigned, not a gap (non-travel-package) ── */
              <div className="flex items-center justify-between gap-2">
                <p className="text-sm text-gray-400">No hotel assigned</p>
                {stop.availableHotels.length > 0 && (
                  <button
                    onClick={() => setOpenSheet(i)}
                    className="text-xs text-blue-600 font-medium shrink-0"
                  >
                    Assign
                  </button>
                )}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* ── Assign sheet ── */}
      {openSheet !== null && (
        <>
          <div
            className="fixed inset-0 bg-black/40 z-40"
            onClick={() => !pending && setOpenSheet(null)}
          />
          <div className="fixed bottom-0 left-0 right-0 bg-white rounded-t-2xl z-50">
            {/* Handle */}
            <div className="flex justify-center pt-3 pb-1">
              <div className="w-10 h-1 rounded-full bg-gray-200" />
            </div>

            <div className="px-4 pt-2 pb-3 flex items-center justify-between">
              <p className="text-sm font-semibold text-gray-900">
                Assign Hotel
                <span className="font-normal text-gray-400 ml-1.5">
                  {liveStops[openSheet].label}
                </span>
              </p>
              <button
                onClick={() => setOpenSheet(null)}
                className="text-gray-400 p-1"
                aria-label="Close"
              >
                <svg
                  width="18"
                  height="18"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            </div>

            <div className="divide-y divide-gray-50 px-4 pb-10">
              {liveStops[openSheet].availableHotels.map((hotel) => (
                <button
                  key={hotel.id}
                  onClick={() => handleAssign(openSheet, hotel.id, hotel.name)}
                  disabled={pending}
                  className="w-full text-left py-3.5 flex items-center justify-between gap-2 disabled:opacity-50"
                >
                  <span className="text-sm text-gray-800">{hotel.name}</span>
                  <svg
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="text-gray-300 shrink-0"
                  >
                    <polyline points="9 18 15 12 9 6" />
                  </svg>
                </button>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
