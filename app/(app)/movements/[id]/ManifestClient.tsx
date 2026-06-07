"use client";

import { useState, useTransition, useRef, useCallback } from "react";
import { MovementEntryStatus } from "@prisma/client";
import { updateManifestEntry } from "@/actions/movement";

// ─── feature flag ─────────────────────────────────────────────────────────────
// Set to false to disable swipe-to-check-in
const SWIPE_TO_CHECK_IN = true;

// ─── types ────────────────────────────────────────────────────────────────────

interface HotelInfo {
  hotel: { name: string };
  roomNumber?: string | null;
}

interface AttendeeInfo {
  id: string;
  firstName: string;
  lastName: string;
  email: string | null;
  phone: string | null;
  company: { name: string } | null;
  hotelManifestEntries: HotelInfo[];
}

interface ManifestEntry {
  attendeeId: string;
  status: MovementEntryStatus;
  checkedInAt: Date | null;
  notes: string | null;
  attendee: AttendeeInfo;
}

interface ManifestClientProps {
  movementId: string;
  entries: ManifestEntry[];
}

// ─── contact sheet ────────────────────────────────────────────────────────────

function ContactSheet({
  attendee,
  onClose,
}: {
  attendee: AttendeeInfo;
  onClose: () => void;
}) {
  const hotel = attendee.hotelManifestEntries[0] ?? null;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/40 z-40"
        onClick={onClose}
      />

      {/* Sheet */}
      <div className="fixed bottom-0 left-0 right-0 z-50 bg-white rounded-t-2xl shadow-xl pb-10">
        {/* Handle */}
        <div className="flex justify-center pt-3 pb-1">
          <div className="w-10 h-1 rounded-full bg-gray-200" />
        </div>

        {/* Name */}
        <div className="px-5 pt-3 pb-4 border-b border-gray-100">
          <p className="text-lg font-bold text-gray-900">
            {attendee.firstName} {attendee.lastName}
          </p>
          {attendee.company && (
            <p className="text-sm text-gray-400">{attendee.company.name}</p>
          )}
          {hotel && (
            <p className="text-sm text-gray-400 mt-0.5">
              {hotel.hotel.name}
              {hotel.roomNumber ? ` · Room ${hotel.roomNumber}` : ""}
            </p>
          )}
        </div>

        {/* Contact actions */}
        <div className="divide-y divide-gray-50">
          {attendee.phone && (
            <a
              href={`tel:${attendee.phone}`}
              className="flex items-center gap-3 px-5 py-4 hover:bg-gray-50 active:bg-gray-100"
            >
              <div className="w-9 h-9 rounded-full bg-green-50 flex items-center justify-center shrink-0">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-green-600">
                  <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.69 12 19.79 19.79 0 0 1 1.61 3.38 2 2 0 0 1 3.6 1h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L7.91 8.6a16 16 0 0 0 6 6l.96-.96a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 21.74 16z" />
                </svg>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-900">Call</p>
                <p className="text-xs text-gray-400">{attendee.phone}</p>
              </div>
            </a>
          )}

          {attendee.phone && (
            <a
              href={`sms:${attendee.phone}`}
              className="flex items-center gap-3 px-5 py-4 hover:bg-gray-50 active:bg-gray-100"
            >
              <div className="w-9 h-9 rounded-full bg-blue-50 flex items-center justify-center shrink-0">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-blue-600">
                  <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
                </svg>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-900">Message</p>
                <p className="text-xs text-gray-400">{attendee.phone}</p>
              </div>
            </a>
          )}

          {attendee.email && (
            <a
              href={`mailto:${attendee.email}`}
              className="flex items-center gap-3 px-5 py-4 hover:bg-gray-50 active:bg-gray-100"
            >
              <div className="w-9 h-9 rounded-full bg-purple-50 flex items-center justify-center shrink-0">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-purple-600">
                  <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
                  <polyline points="22,6 12,13 2,6" />
                </svg>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-900">Email</p>
                <p className="text-xs text-gray-400">{attendee.email}</p>
              </div>
            </a>
          )}

          {!attendee.phone && !attendee.email && (
            <div className="px-5 py-4">
              <p className="text-sm text-gray-400">No contact info on file.</p>
            </div>
          )}
        </div>
      </div>
    </>
  );
}

// ─── manifest row ─────────────────────────────────────────────────────────────

function ManifestRow({
  entry,
  movementId,
  onContactOpen,
}: {
  entry: ManifestEntry;
  movementId: string;
  onContactOpen: (attendee: AttendeeInfo) => void;
}) {
  const [status, setStatus] = useState<MovementEntryStatus>(entry.status);
  const [isPending, startTransition] = useTransition();
  const touchStartX = useRef<number | null>(null);
  const touchStartY = useRef<number | null>(null);

  const toggleCheckIn = useCallback(() => {
    const next: MovementEntryStatus =
      status === "CHECKED_IN" ? "PENDING" : "CHECKED_IN";
    setStatus(next);
    startTransition(async () => {
      const result = await updateManifestEntry(movementId, entry.attendeeId, next);
      if (!result.success) setStatus(status);
    });
  }, [status, movementId, entry.attendeeId]);

  // Swipe right to check in
  function handleTouchStart(e: React.TouchEvent) {
    if (!SWIPE_TO_CHECK_IN) return;
    touchStartX.current = e.touches[0].clientX;
    touchStartY.current = e.touches[0].clientY;
  }

  function handleTouchEnd(e: React.TouchEvent) {
    if (!SWIPE_TO_CHECK_IN) return;
    if (touchStartX.current === null || touchStartY.current === null) return;

    const dx = e.changedTouches[0].clientX - touchStartX.current;
    const dy = Math.abs(e.changedTouches[0].clientY - touchStartY.current);

    // Only trigger on a clear rightward swipe (>60px horizontal, <30px vertical drift)
    if (dx > 60 && dy < 30 && status !== "CHECKED_IN" && !isPending) {
      toggleCheckIn();
    }

    touchStartX.current = null;
    touchStartY.current = null;
  }

  const isCheckedIn = status === "CHECKED_IN";

  return (
    <div
      className="flex items-center gap-3 px-4 py-3.5 divide-x-0"
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
    >
      {/* Check-in toggle — ONLY tap target for status */}
      <button
        onClick={toggleCheckIn}
        disabled={isPending}
        aria-label={isCheckedIn ? "Uncheck" : "Check in"}
        className="shrink-0 w-7 h-7 rounded-full border-2 flex items-center justify-center transition-colors disabled:opacity-50
          focus:outline-none active:scale-95
          ${isCheckedIn
            ? 'border-[#0C2340] bg-[#0C2340]'
            : 'border-gray-300 bg-white'}"
        style={{
          borderColor: isCheckedIn ? "#0C2340" : undefined,
          backgroundColor: isCheckedIn ? "#0C2340" : undefined,
        }}
      >
        {isPending ? (
          <svg className="w-3.5 h-3.5 animate-spin text-gray-400" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4l3-3-3-3v4a8 8 0 00-8 8h4z" />
          </svg>
        ) : isCheckedIn ? (
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="20 6 9 17 4 12" />
          </svg>
        ) : null}
      </button>

      {/* Name + company — tap to open contact sheet */}
      <button
        onClick={() => onContactOpen(entry.attendee)}
        className="flex-1 min-w-0 text-left py-0.5"
      >
        <p className={`text-sm font-medium truncate transition-colors ${isCheckedIn ? "text-gray-400 line-through" : "text-gray-900"}`}>
          {entry.attendee.lastName}, {entry.attendee.firstName}
        </p>
        {entry.attendee.company && (
          <p className="text-xs text-gray-400 truncate">
            {entry.attendee.company.name}
          </p>
        )}
        {entry.notes && (
          <p className="text-xs text-amber-600 mt-0.5 italic truncate">
            {entry.notes}
          </p>
        )}
      </button>

      {/* Chevron hint */}
      <svg
        width="14"
        height="14"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="text-gray-200 shrink-0"
      >
        <polyline points="9 18 15 12 9 6" />
      </svg>
    </div>
  );
}

// ─── main export ─────────────────────────────────────────────────────────────

export default function ManifestClient({
  movementId,
  entries,
}: ManifestClientProps) {
  const [contactAttendee, setContactAttendee] = useState<AttendeeInfo | null>(null);

  // Sort: pending first (alpha), checked-in after (alpha)
  const sorted = [...entries].sort((a, b) => {
    const aIn = a.status === "CHECKED_IN" ? 1 : 0;
    const bIn = b.status === "CHECKED_IN" ? 1 : 0;
    if (aIn !== bIn) return aIn - bIn;
    return a.attendee.lastName.localeCompare(b.attendee.lastName);
  });

  const total = entries.length;
  const checkedIn = entries.filter((e) => e.status === "CHECKED_IN").length;

  if (entries.length === 0) {
    return (
      <div className="bg-white rounded-2xl shadow-sm px-4 py-8 text-center">
        <p className="text-gray-400 text-sm">No attendees on this movement.</p>
      </div>
    );
  }

  return (
    <>
      {/* Summary */}
      <div className="flex items-baseline gap-1.5 px-1 mb-3">
        <span className="text-2xl font-bold text-[#0C2340]">{checkedIn}</span>
        <span className="text-sm text-gray-400">of {total} checked in</span>
        {checkedIn === total && (
          <span className="ml-1 text-xs font-semibold text-green-600">· All aboard</span>
        )}
      </div>

      {SWIPE_TO_CHECK_IN && (
        <p className="text-xs text-gray-300 px-1 mb-2">
          Tap ○ to check in · Swipe right · Tap name for contact
        </p>
      )}
      {!SWIPE_TO_CHECK_IN && (
        <p className="text-xs text-gray-300 px-1 mb-2">
          Tap ○ to check in · Tap name for contact
        </p>
      )}

      <div className="bg-white rounded-2xl shadow-sm overflow-hidden divide-y divide-gray-50">
        {sorted.map((entry) => (
          <ManifestRow
            key={entry.attendeeId}
            entry={entry}
            movementId={movementId}
            onContactOpen={setContactAttendee}
          />
        ))}
      </div>

      {/* Contact sheet */}
      {contactAttendee && (
        <ContactSheet
          attendee={contactAttendee}
          onClose={() => setContactAttendee(null)}
        />
      )}
    </>
  );
}
