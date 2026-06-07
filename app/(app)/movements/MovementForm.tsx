"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { MovementMode } from "@prisma/client";
import { createMovement, updateMovement } from "@/actions/movement";

// ─── types ────────────────────────────────────────────────────────────────────

interface EventOption {
  id: string;
  name: string;
  city: string;
}

interface InitialValues {
  eventId: string;
  name: string;
  mode: MovementMode;
  departureLocation: string;
  arrivalLocation: string;
  departureTime: string; // ISO string
  arrivalTime?: string | null;
  meetTime?: string | null;
  meetLocation?: string | null;
  notes?: string | null;
}

interface MovementFormProps {
  events: EventOption[];
  initialValues?: InitialValues;
  movementId?: string;
  backHref: string;
}

// ─── helpers ──────────────────────────────────────────────────────────────────

// Read date/time from a dumb-local ISO string (stored as UTC but meaning local time).
// We pull directly from the string rather than using Date methods, which would
// apply the browser's timezone offset and show the wrong value.
function toLocalDate(iso: string): string {
  return iso.substring(0, 10); // "YYYY-MM-DD"
}

function toLocalTime(iso: string): string {
  return iso.substring(11, 16); // "HH:MM"
}

// ─── mode config ──────────────────────────────────────────────────────────────

const MODES: { value: MovementMode; label: string; icon: string }[] = [
  { value: "BUS",    label: "Bus",      icon: "🚌" },
  { value: "CAR",    label: "Car",      icon: "🚗" },
  { value: "FLIGHT", label: "Flight",   icon: "✈️" },
  { value: "TRAIN",  label: "Train",    icon: "🚆" },
  { value: "WALK",   label: "Walk",     icon: "🚶" },
  { value: "OTHER",  label: "Other",    icon: "🚐" },
];

// ─── component ────────────────────────────────────────────────────────────────

export default function MovementForm({
  events,
  initialValues,
  movementId,
  backHref,
}: MovementFormProps) {
  const router = useRouter();
  const isEdit = !!movementId;

  const [mode, setMode]             = useState<MovementMode>(initialValues?.mode ?? "BUS");
  const [eventId, setEventId]       = useState(initialValues?.eventId ?? "");
  const [name, setName]             = useState(initialValues?.name ?? "");
  const [depLocation, setDepLocation] = useState(initialValues?.departureLocation ?? "");
  const [arrLocation, setArrLocation] = useState(initialValues?.arrivalLocation ?? "");
  const [depDate, setDepDate]       = useState(() => initialValues?.departureTime ? toLocalDate(initialValues.departureTime) : "");
  const [depTime, setDepTime]       = useState(() => initialValues?.departureTime ? toLocalTime(initialValues.departureTime) : "");
  const [arrDate, setArrDate]       = useState(() => initialValues?.arrivalTime ? toLocalDate(initialValues.arrivalTime) : "");
  const [arrTime, setArrTime]       = useState(() => initialValues?.arrivalTime ? toLocalTime(initialValues.arrivalTime) : "");
  const [meetDate, setMeetDate]     = useState(() => initialValues?.meetTime ? toLocalDate(initialValues.meetTime) : "");
  const [meetTime, setMeetTime]     = useState(() => initialValues?.meetTime ? toLocalTime(initialValues.meetTime) : "");
  const [meetLocation, setMeetLocation] = useState(initialValues?.meetLocation ?? "");
  const [notes, setNotes]           = useState(initialValues?.notes ?? "");
  const [error, setError]           = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const selectedEvent = events.find((e) => e.id === eventId);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!eventId)                         { setError("Please select an event."); return; }
    if (!name.trim())                    { setError("Please enter a movement name."); return; }
    if (!depLocation.trim())             { setError("Please enter a departure location."); return; }
    if (!arrLocation.trim())             { setError("Please enter an arrival location."); return; }
    if (!depDate || !depTime)            { setError("Please enter a departure date and time."); return; }
    setError(null);

    // Construct as a dumb-local UTC string — "5:23 PM" is stored as 17:23Z,
    // meaning it regardless of what timezone the browser is in.
    const departureTimeISO = `${depDate}T${depTime}:00.000Z`;
    const arrivalTimeISO   = arrDate && arrTime ? `${arrDate}T${arrTime}:00.000Z` : null;
    const meetTimeISO      = meetDate && meetTime ? `${meetDate}T${meetTime}:00.000Z` : null;

    startTransition(async () => {
      if (isEdit) {
        const result = await updateMovement(movementId, {
          eventId,
          name: name.trim(),
          mode,
          departureLocation: depLocation.trim(),
          arrivalLocation:   arrLocation.trim(),
          departureTime:     departureTimeISO,
          arrivalTime:       arrivalTimeISO,
          meetTime:          meetTimeISO,
          meetLocation:      meetLocation.trim() || null,
          notes:             notes.trim() || null,
        });
        if (result.success) {
          router.push("/movements/" + movementId);
        } else {
          setError(result.error ?? "Failed to save.");
        }
      } else {
        const result = await createMovement({
          eventId,
          name:              name.trim(),
          mode,
          departureLocation: depLocation.trim(),
          arrivalLocation:   arrLocation.trim(),
          departureTime:     departureTimeISO,
          arrivalTime:       arrivalTimeISO,
          meetTime:          meetTimeISO,
          meetLocation:      meetLocation.trim() || null,
          notes:             notes.trim() || null,
        });
        if (result.success && result.id) {
          router.push("/movements/" + result.id);
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
          {isEdit ? "Movement" : "Movements"}
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
        {isEdit ? "Edit movement" : "New movement"}
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
                <span className={`text-sm truncate ${eventId ? "text-gray-900" : "text-gray-300"}`}>
                  {selectedEvent ? `${selectedEvent.name} — ${selectedEvent.city}` : "Select event"}
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
                <option value="">Select event</option>
                {events.map((ev) => (
                  <option key={ev.id} value={ev.id}>
                    {ev.name} — {ev.city}
                  </option>
                ))}
              </select>
            </div>

            {/* Name */}
            <div className="flex items-center px-4 py-3.5">
              <label className="text-sm text-gray-700 w-24 shrink-0" htmlFor="mv-name">
                Name
              </label>
              <input
                id="mv-name"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Bus 1 — Hotel to Airport"
                className="flex-1 text-sm text-gray-900 text-right bg-transparent border-0 outline-none placeholder-gray-300 min-w-0"
              />
            </div>
          </div>
        </div>

        {/* ── Mode ─────────────────────────────────────────────────────── */}
        <div>
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2 px-1">
            Mode
          </p>
          <div className="flex flex-wrap gap-2">
            {MODES.map((m) => (
              <button
                key={m.value}
                type="button"
                onClick={() => setMode(m.value)}
                className={`flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                  mode === m.value
                    ? "bg-[#0C2340] text-white"
                    : "bg-white text-gray-600 shadow-sm"
                }`}
              >
                <span>{m.icon}</span>
                {m.label}
              </button>
            ))}
          </div>
        </div>

        {/* ── Route ────────────────────────────────────────────────────── */}
        <div>
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2 px-1">
            Route
          </p>
          <div className="bg-white rounded-2xl shadow-sm overflow-hidden divide-y divide-gray-50">
            <div className="flex items-center px-4 py-3.5">
              <label className="text-sm text-gray-700 w-24 shrink-0" htmlFor="dep-loc">
                From
              </label>
              <input
                id="dep-loc"
                type="text"
                value={depLocation}
                onChange={(e) => setDepLocation(e.target.value)}
                placeholder="Departure location"
                className="flex-1 text-sm text-gray-900 text-right bg-transparent border-0 outline-none placeholder-gray-300 min-w-0"
              />
            </div>
            <div className="flex items-center px-4 py-3.5">
              <label className="text-sm text-gray-700 w-24 shrink-0" htmlFor="arr-loc">
                To
              </label>
              <input
                id="arr-loc"
                type="text"
                value={arrLocation}
                onChange={(e) => setArrLocation(e.target.value)}
                placeholder="Arrival location"
                className="flex-1 text-sm text-gray-900 text-right bg-transparent border-0 outline-none placeholder-gray-300 min-w-0"
              />
            </div>
          </div>
        </div>

        {/* ── Meet ─────────────────────────────────────────────────────── */}
        <div>
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2 px-1">
            Meet{" "}
            <span className="text-gray-300 normal-case font-normal tracking-normal">· optional</span>
          </p>
          <div className="bg-white rounded-2xl shadow-sm overflow-hidden divide-y divide-gray-50">
            <div className="flex items-center px-4 py-3.5">
              <label className="text-sm text-gray-700 w-24 shrink-0" htmlFor="meet-loc">
                Location
              </label>
              <input
                id="meet-loc"
                type="text"
                value={meetLocation}
                onChange={(e) => setMeetLocation(e.target.value)}
                placeholder="e.g. Hotel lobby"
                className="flex-1 text-sm text-gray-900 text-right bg-transparent border-0 outline-none placeholder-gray-300 min-w-0"
              />
            </div>
            <div className="grid grid-cols-2 divide-x divide-gray-50">
              <div className="flex flex-col px-4 py-3">
                <label className="text-xs text-gray-400 mb-1.5" htmlFor="meet-date">Date</label>
                <input
                  id="meet-date"
                  type="date"
                  value={meetDate}
                  onChange={(e) => setMeetDate(e.target.value)}
                  className="text-sm text-gray-900 bg-transparent border-0 outline-none p-0 w-full"
                />
              </div>
              <div className="flex flex-col px-4 py-3">
                <label className="text-xs text-gray-400 mb-1.5" htmlFor="meet-time">Time</label>
                <input
                  id="meet-time"
                  type="time"
                  value={meetTime}
                  onChange={(e) => setMeetTime(e.target.value)}
                  className="text-sm text-gray-900 bg-transparent border-0 outline-none p-0 w-full"
                />
              </div>
            </div>
          </div>
        </div>

        {/* ── Departure ────────────────────────────────────────────────── */}
        <div>
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2 px-1">
            Departure
          </p>
          <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
            <div className="grid grid-cols-2 divide-x divide-gray-50">
              <div className="flex flex-col px-4 py-3">
                <label className="text-xs text-gray-400 mb-1.5" htmlFor="dep-date">Date</label>
                <input
                  id="dep-date"
                  type="date"
                  value={depDate}
                  onChange={(e) => setDepDate(e.target.value)}
                  className="text-sm text-gray-900 bg-transparent border-0 outline-none p-0 w-full"
                  required
                />
              </div>
              <div className="flex flex-col px-4 py-3">
                <label className="text-xs text-gray-400 mb-1.5" htmlFor="dep-time">Time</label>
                <input
                  id="dep-time"
                  type="time"
                  value={depTime}
                  onChange={(e) => setDepTime(e.target.value)}
                  className="text-sm text-gray-900 bg-transparent border-0 outline-none p-0 w-full"
                  required
                />
              </div>
            </div>
          </div>
        </div>

        {/* ── Arrival ──────────────────────────────────────────────────── */}
        <div>
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2 px-1">
            Arrival{" "}
            <span className="text-gray-300 normal-case font-normal tracking-normal">· optional</span>
          </p>
          <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
            <div className="grid grid-cols-2 divide-x divide-gray-50">
              <div className="flex flex-col px-4 py-3">
                <label className="text-xs text-gray-400 mb-1.5" htmlFor="arr-date">Date</label>
                <input
                  id="arr-date"
                  type="date"
                  value={arrDate}
                  onChange={(e) => setArrDate(e.target.value)}
                  className="text-sm text-gray-900 bg-transparent border-0 outline-none p-0 w-full"
                />
              </div>
              <div className="flex flex-col px-4 py-3">
                <label className="text-xs text-gray-400 mb-1.5" htmlFor="arr-time">Time</label>
                <input
                  id="arr-time"
                  type="time"
                  value={arrTime}
                  onChange={(e) => setArrTime(e.target.value)}
                  className="text-sm text-gray-900 bg-transparent border-0 outline-none p-0 w-full"
                />
              </div>
            </div>
          </div>
        </div>

        {/* ── Notes ────────────────────────────────────────────────────── */}
        <div>
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2 px-1">
            Notes{" "}
            <span className="text-gray-300 normal-case font-normal tracking-normal">· optional</span>
          </p>
          <div className="bg-white rounded-2xl shadow-sm">
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Any notes for staff…"
              rows={3}
              className="w-full px-4 py-3.5 text-sm text-gray-900 bg-transparent border-0 outline-none resize-none placeholder-gray-300 rounded-2xl"
            />
          </div>
        </div>

      </div>
    </form>
  );
}
