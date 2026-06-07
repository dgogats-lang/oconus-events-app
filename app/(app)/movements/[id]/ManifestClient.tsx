"use client";

import { useState, useTransition, useRef, useCallback, useEffect } from "react";
import { MovementEntryStatus } from "@prisma/client";
import {
  updateManifestEntry,
  addToManifest,
  removeFromManifest,
  transferToMovement,
} from "@/actions/movement";

// ─── offline queue ────────────────────────────────────────────────────────────

interface QueuedCheckIn {
  movementId: string;
  attendeeId: string;
  status: MovementEntryStatus;
  queuedAt: number;
}

const QUEUE_KEY = "checkin-queue";

function readQueue(): QueuedCheckIn[] {
  if (typeof window === "undefined") return [];
  try {
    return JSON.parse(localStorage.getItem(QUEUE_KEY) ?? "[]");
  } catch {
    return [];
  }
}

function writeQueue(q: QueuedCheckIn[]) {
  localStorage.setItem(QUEUE_KEY, JSON.stringify(q));
}

function enqueue(item: QueuedCheckIn) {
  const q = readQueue().filter(
    (x) => !(x.movementId === item.movementId && x.attendeeId === item.attendeeId)
  );
  writeQueue([...q, item]);
}

function dequeue(movementId: string, attendeeId: string) {
  writeQueue(
    readQueue().filter(
      (x) => !(x.movementId === movementId && x.attendeeId === attendeeId)
    )
  );
}

async function flushQueue(movementId: string) {
  if (!navigator.onLine) return;
  const pending = readQueue().filter((x) => x.movementId === movementId);
  for (const item of pending) {
    try {
      const result = await updateManifestEntry(item.movementId, item.attendeeId, item.status);
      if (result.success) dequeue(item.movementId, item.attendeeId);
    } catch {
      // Leave in queue — will retry next flush
    }
  }
}

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

interface TripAttendee {
  id: string;
  firstName: string;
  lastName: string;
  email: string | null;
  phone: string | null;
  company: { name: string } | null;
}

interface OtherMovement {
  id: string;
  name: string;
  departureTime: Date;
}

interface ManifestClientProps {
  movementId: string;
  entries: ManifestEntry[];
  tripAttendees: TripAttendee[];
  otherMovements: OtherMovement[];
}

// ─── helpers ──────────────────────────────────────────────────────────────────

function attendeeMatches(
  a: { firstName: string; lastName: string; email: string | null; company: { name: string } | null },
  query: string
): boolean {
  if (!query) return true;
  const q = query.toLowerCase().trim();
  return [
    a.firstName,
    a.lastName,
    `${a.firstName} ${a.lastName}`,
    `${a.lastName} ${a.firstName}`,
    `${a.lastName}, ${a.firstName}`,
    a.email ?? "",
    a.company?.name ?? "",
  ].some((c) => c.toLowerCase().includes(q));
}

function fmtMovementTime(d: Date) {
  return d.toLocaleString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

// ─── add attendee sheet ───────────────────────────────────────────────────────

function AddAttendeeSheet({
  available,
  addingId,
  onAdd,
  onClose,
}: {
  available: TripAttendee[];
  addingId: string | null;
  onAdd: (a: TripAttendee) => void;
  onClose: () => void;
}) {
  const [search, setSearch] = useState("");
  const filtered = available.filter((a) => attendeeMatches(a, search));

  return (
    <>
      <div className="fixed inset-0 bg-black/40 z-40" onClick={onClose} />
      <div
        className="fixed bottom-0 left-0 right-0 z-50 bg-white rounded-t-2xl shadow-xl flex flex-col"
        style={{ maxHeight: "80vh" }}
      >
        {/* Handle */}
        <div className="flex justify-center pt-3 pb-1 shrink-0">
          <div className="w-10 h-1 rounded-full bg-gray-200" />
        </div>

        {/* Title */}
        <div className="px-5 pt-2 pb-3 border-b border-gray-100 shrink-0">
          <p className="text-base font-semibold text-gray-900">Add to manifest</p>
          <p className="text-xs text-gray-400 mt-0.5">
            {available.length === 0
              ? "All trip attendees are already on this movement"
              : `${available.length} attendee${available.length === 1 ? "" : "s"} not yet on this movement`}
          </p>
        </div>

        {/* Search */}
        {available.length > 0 && (
          <div className="px-4 py-3 shrink-0">
            <div className="relative">
              <svg
                className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-300 pointer-events-none"
                width="15" height="15" viewBox="0 0 24 24" fill="none"
                stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"
              >
                <circle cx="11" cy="11" r="8" />
                <line x1="21" y1="21" x2="16.65" y2="16.65" />
              </svg>
              <input
                type="search"
                placeholder="Search…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full bg-gray-50 rounded-xl pl-9 pr-4 py-2.5 text-sm text-gray-900 placeholder-gray-300 border-0 focus:outline-none focus:ring-2 focus:ring-[#0C2340]/20"
                autoFocus
              />
            </div>
          </div>
        )}

        {/* List */}
        <div className="overflow-y-auto pb-10 shrink min-h-0">
          {filtered.length === 0 && search ? (
            <div className="px-5 py-8 text-center">
              <p className="text-sm text-gray-400">No results for &ldquo;{search}&rdquo;</p>
            </div>
          ) : filtered.length === 0 ? (
            <div className="px-5 py-8 text-center">
              <p className="text-sm text-gray-400">All trip attendees are on this movement.</p>
            </div>
          ) : (
            filtered.map((a) => {
              const isAdding = addingId === a.id;
              const initials = `${a.firstName[0] ?? ""}${a.lastName[0] ?? ""}`.toUpperCase();
              return (
                <button
                  key={a.id}
                  onClick={() => onAdd(a)}
                  disabled={addingId !== null}
                  className="w-full flex items-center gap-3 px-5 py-3.5 text-left hover:bg-gray-50 active:bg-gray-100 disabled:opacity-60 border-b border-gray-50 last:border-0"
                >
                  <div className="w-9 h-9 rounded-full bg-[#E8EDF2] flex items-center justify-center shrink-0">
                    <span className="text-xs font-semibold text-[#0C2340]">{initials}</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">
                      {a.lastName}, {a.firstName}
                    </p>
                    {a.company && (
                      <p className="text-xs text-gray-400 truncate">{a.company.name}</p>
                    )}
                  </div>
                  {isAdding ? (
                    <svg className="w-4 h-4 animate-spin text-gray-400 shrink-0" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4l3-3-3-3v4a8 8 0 00-8 8h4z" />
                    </svg>
                  ) : (
                    <svg className="w-4 h-4 text-gray-300 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <line x1="12" y1="5" x2="12" y2="19" />
                      <line x1="5" y1="12" x2="19" y2="12" />
                    </svg>
                  )}
                </button>
              );
            })
          )}
        </div>
      </div>
    </>
  );
}

// ─── transfer sheet ───────────────────────────────────────────────────────────

function TransferSheet({
  attendee,
  movements,
  onTransfer,
  onClose,
}: {
  attendee: AttendeeInfo;
  movements: OtherMovement[];
  onTransfer: (movementId: string) => void;
  onClose: () => void;
}) {
  return (
    <>
      <div className="fixed inset-0 bg-black/40 z-40" onClick={onClose} />
      <div className="fixed bottom-0 left-0 right-0 z-50 bg-white rounded-t-2xl shadow-xl pb-10">
        {/* Handle */}
        <div className="flex justify-center pt-3 pb-1">
          <div className="w-10 h-1 rounded-full bg-gray-200" />
        </div>

        {/* Title */}
        <div className="px-5 pt-3 pb-4 border-b border-gray-100">
          <p className="text-base font-semibold text-gray-900">Transfer to another movement</p>
          <p className="text-sm text-gray-400 mt-0.5">
            {attendee.firstName} {attendee.lastName}
          </p>
        </div>

        {/* Movement list */}
        <div className="divide-y divide-gray-50">
          {movements.map((m) => (
            <button
              key={m.id}
              onClick={() => onTransfer(m.id)}
              className="w-full flex items-center justify-between px-5 py-4 text-left hover:bg-gray-50 active:bg-gray-100"
            >
              <div>
                <p className="text-sm font-medium text-gray-900">{m.name}</p>
                <p className="text-xs text-gray-400 mt-0.5">{fmtMovementTime(m.departureTime)}</p>
              </div>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="text-gray-300 shrink-0">
                <polyline points="9 18 15 12 9 6" />
              </svg>
            </button>
          ))}
        </div>
      </div>
    </>
  );
}

// ─── contact sheet ────────────────────────────────────────────────────────────

function ContactSheet({
  attendee,
  otherMovements,
  onRemove,
  onTransferRequest,
  onClose,
}: {
  attendee: AttendeeInfo;
  otherMovements: OtherMovement[];
  onRemove: (attendeeId: string) => void;
  onTransferRequest: (attendee: AttendeeInfo) => void;
  onClose: () => void;
}) {
  const hotel = attendee.hotelManifestEntries[0] ?? null;
  const swipeStartY = useRef<number | null>(null);
  const hasTransfer = otherMovements.length > 0;

  function handleSheetTouchStart(e: React.TouchEvent) {
    swipeStartY.current = e.touches[0].clientY;
  }

  function handleSheetTouchEnd(e: React.TouchEvent) {
    if (swipeStartY.current === null) return;
    const dy = e.changedTouches[0].clientY - swipeStartY.current;
    if (dy > 80) onClose();
    swipeStartY.current = null;
  }

  return (
    <>
      <div className="fixed inset-0 bg-black/40 z-40" onClick={onClose} />
      <div
        className="fixed bottom-0 left-0 right-0 z-50 bg-white rounded-t-2xl shadow-xl pb-10"
        onTouchStart={handleSheetTouchStart}
        onTouchEnd={handleSheetTouchEnd}
        style={{ touchAction: "pan-y" }}
      >
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
            <a href={`tel:${attendee.phone}`} className="flex items-center gap-3 px-5 py-4 hover:bg-gray-50 active:bg-gray-100">
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
            <a href={`sms:${attendee.phone}`} className="flex items-center gap-3 px-5 py-4 hover:bg-gray-50 active:bg-gray-100">
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
            <a href={`mailto:${attendee.email}`} className="flex items-center gap-3 px-5 py-4 hover:bg-gray-50 active:bg-gray-100">
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

        {/* Manifest actions */}
        <div className="mt-2 border-t border-gray-100 divide-y divide-gray-50">
          {/* Transfer */}
          <button
            onClick={() => hasTransfer && onTransferRequest(attendee)}
            disabled={!hasTransfer}
            className={`w-full flex items-center gap-3 px-5 py-4 text-left ${
              hasTransfer
                ? "hover:bg-gray-50 active:bg-gray-100"
                : "opacity-40 cursor-not-allowed"
            }`}
          >
            <div className="w-9 h-9 rounded-full bg-amber-50 flex items-center justify-center shrink-0">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-amber-600">
                <polyline points="17 1 21 5 17 9" />
                <path d="M3 11V9a4 4 0 0 1 4-4h14" />
                <polyline points="7 23 3 19 7 15" />
                <path d="M21 13v2a4 4 0 0 1-4 4H3" />
              </svg>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-900">Transfer to another movement</p>
              {!hasTransfer && (
                <p className="text-xs text-gray-400">No other movements for this event</p>
              )}
            </div>
          </button>

          {/* Remove */}
          <button
            onClick={() => onRemove(attendee.id)}
            className="w-full flex items-center gap-3 px-5 py-4 text-left hover:bg-red-50 active:bg-red-100"
          >
            <div className="w-9 h-9 rounded-full bg-red-50 flex items-center justify-center shrink-0">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-red-500">
                <polyline points="3 6 5 6 21 6" />
                <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
                <path d="M10 11v6M14 11v6" />
                <path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" />
              </svg>
            </div>
            <p className="text-sm font-medium text-red-600">Remove from movement</p>
          </button>
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
  const [isQueued, setIsQueued] = useState(false);

  // On mount: check if this entry has a queued action and apply optimistic state
  useEffect(() => {
    const q = readQueue().find(
      (x) => x.movementId === movementId && x.attendeeId === entry.attendeeId
    );
    if (q) {
      setStatus(q.status);
      setIsQueued(true);
    }
  }, [movementId, entry.attendeeId]);

  const toggleCheckIn = useCallback(() => {
    const next: MovementEntryStatus =
      status === "CHECKED_IN" ? "PENDING" : "CHECKED_IN";
    setStatus(next);

    if (!navigator.onLine) {
      // Queue offline — will sync when back online
      enqueue({ movementId, attendeeId: entry.attendeeId, status: next, queuedAt: Date.now() });
      setIsQueued(true);
      return;
    }

    setIsQueued(false);
    startTransition(async () => {
      const result = await updateManifestEntry(movementId, entry.attendeeId, next);
      if (!result.success) setStatus(status);
    });
  }, [status, movementId, entry.attendeeId]);

  const isCheckedIn = status === "CHECKED_IN";

  return (
    <div className="flex items-center gap-3 px-4 py-3.5">
      {/* Check-in toggle */}
      <button
        onClick={toggleCheckIn}
        disabled={isPending}
        aria-label={isCheckedIn ? "Uncheck" : "Check in"}
        className="shrink-0 w-7 h-7 rounded-full border-2 flex items-center justify-center transition-colors disabled:opacity-50 focus:outline-none active:scale-95"
        style={{
          borderColor: isCheckedIn ? (isQueued ? "#F59E0B" : "#0C2340") : undefined,
          backgroundColor: isCheckedIn ? (isQueued ? "#F59E0B" : "#0C2340") : undefined,
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

      {/* Name + company */}
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

      {/* Chevron */}
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-gray-200 shrink-0">
        <polyline points="9 18 15 12 9 6" />
      </svg>
    </div>
  );
}

// ─── main export ─────────────────────────────────────────────────────────────

export default function ManifestClient({
  movementId,
  entries,
  tripAttendees,
  otherMovements,
}: ManifestClientProps) {
  const [search, setSearch] = useState("");

  // Flush queued check-ins when component mounts (online) or when connectivity returns
  useEffect(() => {
    flushQueue(movementId);

    const handleOnline = () => flushQueue(movementId);
    window.addEventListener("online", handleOnline);
    return () => window.removeEventListener("online", handleOnline);
  }, [movementId]);
  const [contactAttendee, setContactAttendee] = useState<AttendeeInfo | null>(null);
  const [showAddSheet, setShowAddSheet] = useState(false);
  const [transferAttendee, setTransferAttendee] = useState<AttendeeInfo | null>(null);
  const [removedIds, setRemovedIds] = useState<Set<string>>(new Set());
  const [addingId, setAddingId] = useState<string | null>(null);
  const [, startOpTransition] = useTransition();

  // Active manifest IDs (minus optimistically removed)
  const activeIds = new Set(
    entries.filter((e) => !removedIds.has(e.attendeeId)).map((e) => e.attendeeId)
  );
  const availableToAdd = tripAttendees.filter((a) => !activeIds.has(a.id));

  const sorted = [...entries]
    .filter((e) => !removedIds.has(e.attendeeId))
    .sort((a, b) => {
      const aIn = a.status === "CHECKED_IN" ? 1 : 0;
      const bIn = b.status === "CHECKED_IN" ? 1 : 0;
      if (aIn !== bIn) return aIn - bIn;
      return a.attendee.lastName.localeCompare(b.attendee.lastName);
    });

  const filtered = sorted.filter((e) => attendeeMatches(e.attendee, search));
  const total = sorted.length;
  const checkedIn = sorted.filter((e) => e.status === "CHECKED_IN").length;

  function handleRemove(attendeeId: string) {
    setContactAttendee(null);
    setRemovedIds((prev) => new Set([...prev, attendeeId]));
    startOpTransition(async () => {
      const result = await removeFromManifest(movementId, attendeeId);
      if (!result.success) {
        setRemovedIds((prev) => {
          const next = new Set(prev);
          next.delete(attendeeId);
          return next;
        });
      }
    });
  }

  function handleTransferRequest(attendee: AttendeeInfo) {
    setContactAttendee(null);
    setTransferAttendee(attendee);
  }

  function handleTransfer(toMovementId: string) {
    if (!transferAttendee) return;
    const attendeeId = transferAttendee.id;
    setTransferAttendee(null);
    setRemovedIds((prev) => new Set([...prev, attendeeId]));
    startOpTransition(async () => {
      const result = await transferToMovement(movementId, toMovementId, attendeeId);
      if (!result.success) {
        setRemovedIds((prev) => {
          const next = new Set(prev);
          next.delete(attendeeId);
          return next;
        });
      }
    });
  }

  function handleAdd(attendee: TripAttendee) {
    setAddingId(attendee.id);
    startOpTransition(async () => {
      await addToManifest(movementId, attendee.id);
      setAddingId(null);
      setShowAddSheet(false);
    });
  }

  return (
    <>
      {/* Summary + add button */}
      <div className="flex items-center mb-3">
        <div className="flex items-baseline gap-1.5 px-1">
          <span className="text-2xl font-bold text-[#0C2340]">{checkedIn}</span>
          <span className="text-sm text-gray-400">of {total} checked in</span>
          {total > 0 && checkedIn === total && (
            <span className="ml-1 text-xs font-semibold text-green-600">· All aboard</span>
          )}
        </div>
        <button
          onClick={() => setShowAddSheet(true)}
          className="ml-auto flex items-center gap-1.5 text-sm font-medium text-[#0C2340] bg-[#E8EDF2] rounded-full px-3 py-1.5 active:opacity-70"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <line x1="12" y1="5" x2="12" y2="19" />
            <line x1="5" y1="12" x2="19" y2="12" />
          </svg>
          Add
        </button>
      </div>

      {/* Search (only shown when there are entries) */}
      {total > 0 && (
        <div className="relative mb-3">
          <svg
            className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-300 pointer-events-none"
            width="15" height="15" viewBox="0 0 24 24" fill="none"
            stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"
          >
            <circle cx="11" cy="11" r="8" />
            <line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>
          <input
            type="search"
            placeholder="Search name, email, company…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-white rounded-xl pl-9 pr-4 py-2.5 text-sm text-gray-900 placeholder-gray-300 shadow-sm border-0 focus:outline-none focus:ring-2 focus:ring-[#0C2340]/20"
          />
        </div>
      )}

      {total > 0 && (
        <p className="text-xs text-gray-300 px-1 mb-2">
          Tap ○ to check in · Tap name for contact
        </p>
      )}

      {total === 0 ? (
        <div className="bg-white rounded-2xl shadow-sm px-4 py-8 text-center">
          <p className="text-gray-400 text-sm">No attendees on this movement yet.</p>
          <p className="text-gray-300 text-xs mt-1">Tap Add to add someone.</p>
        </div>
      ) : (
        <div className="bg-white rounded-2xl shadow-sm overflow-hidden divide-y divide-gray-50">
          {filtered.length === 0 ? (
            <div className="px-4 py-8 text-center">
              <p className="text-sm text-gray-400">No results for &ldquo;{search}&rdquo;</p>
            </div>
          ) : (
            filtered.map((entry) => (
              <ManifestRow
                key={entry.attendeeId}
                entry={entry}
                movementId={movementId}
                onContactOpen={setContactAttendee}
              />
            ))
          )}
        </div>
      )}

      {/* Contact sheet */}
      {contactAttendee && (
        <ContactSheet
          attendee={contactAttendee}
          otherMovements={otherMovements}
          onRemove={handleRemove}
          onTransferRequest={handleTransferRequest}
          onClose={() => setContactAttendee(null)}
        />
      )}

      {/* Transfer sheet */}
      {transferAttendee && (
        <TransferSheet
          attendee={transferAttendee}
          movements={otherMovements}
          onTransfer={handleTransfer}
          onClose={() => setTransferAttendee(null)}
        />
      )}

      {/* Add attendee sheet */}
      {showAddSheet && (
        <AddAttendeeSheet
          available={availableToAdd}
          addingId={addingId}
          onAdd={handleAdd}
          onClose={() => setShowAddSheet(false)}
        />
      )}
    </>
  );
}
