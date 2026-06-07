"use client";

import { useState, useTransition, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createHotel, updateHotel } from "@/actions/hotel";

interface EventOption {
  id: string;
  name: string;
  city: string;
}

interface InitialValues {
  eventId?: string | null;
  tripId: string;
  name: string;
  address?: string | null;
  googlePlaceId?: string | null;
  phone?: string | null;
  notes?: string | null;
}

interface HotelFormProps {
  events: EventOption[];
  tripId: string;
  initialValues?: InitialValues;
  hotelId?: string;
  backHref: string;
}

declare global {
  interface Window {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    google: any;
    initGooglePlaces?: () => void;
  }
}

export default function HotelForm({
  events,
  tripId,
  initialValues,
  hotelId,
  backHref,
}: HotelFormProps) {
  const router = useRouter();
  const isEdit = !!hotelId;

  const [eventId, setEventId]           = useState(initialValues?.eventId ?? "transit");
  const [name, setName]                 = useState(initialValues?.name ?? "");
  const [address, setAddress]           = useState(initialValues?.address ?? "");
  const [googlePlaceId, setGooglePlaceId] = useState(initialValues?.googlePlaceId ?? "");
  const [phone, setPhone]               = useState(initialValues?.phone ?? "");
  const [notes, setNotes]               = useState(initialValues?.notes ?? "");
  const [error, setError]               = useState<string | null>(null);
  const [isPending, startTransition]    = useTransition();

  const addressRef = useRef<HTMLInputElement>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const autocompleteRef = useRef<any>(null);

  const isTransit = eventId === "transit";
  const selectedEvent = events.find((e) => e.id === eventId);

  // Initialise autocomplete once the Google script has loaded
  useEffect(() => {
    function initAutocomplete() {
      if (!addressRef.current || !window.google?.maps?.places) return;
      autocompleteRef.current = new window.google.maps.places.Autocomplete(
        addressRef.current,
        { types: ["establishment", "geocode"] }
      );
      autocompleteRef.current.addListener("place_changed", () => {
        const place = autocompleteRef.current!.getPlace();
        if (place.formatted_address) setAddress(place.formatted_address);
        if (place.place_id) setGooglePlaceId(place.place_id);
        // If the user picked a place with a name different from what they typed,
        // and the hotel name field is still empty, pre-fill it
        if (place.name && !name.trim()) setName(place.name);
      });
    }

    // Script may already be loaded (e.g. navigating back to form)
    if (window.google?.maps?.places) {
      initAutocomplete();
    } else {
      // Callback invoked by the script's onload parameter
      window.initGooglePlaces = initAutocomplete;
    }

    return () => {
      // Clean up listener on unmount
      if (autocompleteRef.current) {
        window.google?.maps?.event?.clearInstanceListeners(autocompleteRef.current);
      }
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!eventId)      { setError("Please select an event."); return; }
    if (!name.trim())  { setError("Please enter a hotel name."); return; }
    setError(null);

    const payload = {
      eventId:       eventId === "transit" ? null : eventId,
      tripId,
      name:          name.trim(),
      address:       address.trim() || null,
      googlePlaceId: googlePlaceId || null,
      phone:         phone.trim() || null,
      notes:         notes.trim() || null,
    };

    startTransition(async () => {
      if (isEdit) {
        const result = await updateHotel(hotelId, payload);
        if (result.success) {
          router.push(`/hotels/${hotelId}`);
        } else {
          setError(result.error ?? "Failed to save.");
        }
      } else {
        const result = await createHotel(payload);
        if (result.success && result.id) {
          router.push(`/hotels/${result.id}`);
        } else {
          setError(result.error ?? "Failed to save.");
        }
      }
    });
  }

  return (
    <form onSubmit={handleSubmit} className="pb-24">
      {/* Nav */}
      <div className="flex items-center justify-between px-4 pt-4 pb-2">
        <Link
          href={backHref}
          className="inline-flex items-center gap-1 text-sm font-medium text-[#0C2340] bg-[#E8EDF2] rounded-full px-3 py-1.5"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="15 18 9 12 15 6" />
          </svg>
          {isEdit ? "Hotel" : "Hotels"}
        </Link>
        <button
          type="submit"
          disabled={isPending}
          className="text-sm font-semibold text-[#0C2340] bg-[#E8EDF2] rounded-full px-3 py-1.5 disabled:opacity-40"
        >
          {isPending ? "Saving…" : "Save"}
        </button>
      </div>

      {/* Title */}
      <h1 className="text-2xl font-semibold text-gray-900 px-4 pt-2 pb-5">
        {isEdit ? "Edit hotel" : "New hotel"}
      </h1>

      {/* Error banner */}
      {error && (
        <div className="mx-4 mb-4 bg-red-50 rounded-xl px-4 py-3">
          <p className="text-sm text-red-600">{error}</p>
        </div>
      )}

      <div className="space-y-6 px-4">

        {/* ── Details ──────────────────────────────────────────────────── */}
        <div>
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2 px-1">
            Details
          </p>
          <div className="bg-white rounded-2xl shadow-sm overflow-hidden divide-y divide-gray-50">

            {/* Event selector */}
            <div className="flex items-center px-4 py-3.5 relative">
              <span className="text-sm text-gray-700 w-24 shrink-0">Event</span>
              <div className="flex-1 flex items-center justify-end gap-1 min-w-0">
                <span className="text-sm truncate text-gray-900">
                  {isTransit ? "Transit (no event)" : selectedEvent ? `${selectedEvent.name} — ${selectedEvent.city}` : "Select event"}
                </span>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-gray-300 shrink-0">
                  <polyline points="9 18 15 12 9 6" />
                </svg>
              </div>
              <select
                value={eventId}
                onChange={(e) => setEventId(e.target.value)}
                className="absolute inset-0 opacity-0 cursor-pointer w-full"
              >
                <option value="transit">Transit (no event)</option>
                {events.map((ev) => (
                  <option key={ev.id} value={ev.id}>
                    {ev.name} — {ev.city}
                  </option>
                ))}
              </select>
            </div>

            {/* Name */}
            <div className="flex items-center px-4 py-3.5">
              <label className="text-sm text-gray-700 w-24 shrink-0" htmlFor="hotel-name">
                Name
              </label>
              <input
                id="hotel-name"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Hotel Vier Jahreszeiten"
                className="flex-1 text-sm text-gray-900 text-right bg-transparent border-0 outline-none placeholder-gray-300 min-w-0"
              />
            </div>
          </div>
        </div>

        {/* ── Contact ───────────────────────────────────────────────────── */}
        <div>
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2 px-1">
            Contact{" "}
            <span className="text-gray-300 normal-case font-normal tracking-normal">· optional</span>
          </p>
          <div className="bg-white rounded-2xl shadow-sm overflow-hidden divide-y divide-gray-50">
            <div className="flex items-center px-4 py-3.5">
              <label className="text-sm text-gray-700 w-24 shrink-0" htmlFor="hotel-address">
                Address
              </label>
              <input
                id="hotel-address"
                ref={addressRef}
                type="text"
                value={address}
                onChange={(e) => {
                  setAddress(e.target.value);
                  // If the user manually edits after picking a place, clear the stored place ID
                  if (googlePlaceId) setGooglePlaceId("");
                }}
                placeholder="Search for hotel address…"
                autoComplete="off"
                className="flex-1 text-sm text-gray-900 text-right bg-transparent border-0 outline-none placeholder-gray-300 min-w-0"
              />
            </div>
            <div className="flex items-center px-4 py-3.5">
              <label className="text-sm text-gray-700 w-24 shrink-0" htmlFor="hotel-phone">
                Phone
              </label>
              <input
                id="hotel-phone"
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+49 89 1234567"
                className="flex-1 text-sm text-gray-900 text-right bg-transparent border-0 outline-none placeholder-gray-300 min-w-0"
              />
            </div>
          </div>
        </div>

        {/* ── Notes ─────────────────────────────────────────────────────── */}
        <div>
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2 px-1">
            Notes{" "}
            <span className="text-gray-300 normal-case font-normal tracking-normal">· optional</span>
          </p>
          <div className="bg-white rounded-2xl shadow-sm">
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Anything staff should know about this hotel…"
              rows={3}
              className="w-full px-4 py-3.5 text-sm text-gray-900 bg-transparent border-0 outline-none resize-none placeholder-gray-300 rounded-2xl"
            />
          </div>
        </div>

      </div>
    </form>
  );
}
