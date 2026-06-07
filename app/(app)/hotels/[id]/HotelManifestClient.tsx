"use client";

import { useState, useTransition, useRef } from "react";
import Link from "next/link";
import { assignToHotel, removeFromHotel, updateRoomNumber } from "@/actions/hotelManifest";

// ─── types ────────────────────────────────────────────────────────────────────

interface AttendeeInfo {
  id: string;
  firstName: string;
  lastName: string;
  email: string | null;
  phone: string | null;
  company: { name: string } | null;
}

interface RoomingEntry {
  id: string;
  attendeeId: string;
  roomNumber: string | null;
  attendee: AttendeeInfo;
}

interface HotelManifestClientProps {
  hotelId: string;
  entries: RoomingEntry[];
  assignableAttendees: AttendeeInfo[];
  coverageGap: AttendeeInfo[]; // travel package attendees with no hotel at this stop
}

// ─── helpers ──────────────────────────────────────────────────────────────────

function initials(first: string, last: string) {
  return `${first[0] ?? ""}${last[0] ?? ""}`.toUpperCase();
}

function attendeeMatches(a: AttendeeInfo, query: string): boolean {
  if (!query) return true;
  const q = query.toLowerCase().trim();
  return [
    a.firstName,
    a.lastName,
    `${a.firstName} ${a.lastName}`,
    `${a.lastName} ${a.firstName}`,
    a.email ?? "",
    a.company?.name ?? "",
  ].some((s) => s.toLowerCase().includes(q));
}

// ─── room number inline edit ──────────────────────────────────────────────────

function RoomNumberEdit({
  hotelId,
  attendeeId,
  roomNumber,
}: {
  hotelId: string;
  attendeeId: string;
  roomNumber: string | null;
}) {
  const [editing, setEditing]   = useState(false);
  const [value, setValue]       = useState(roomNumber ?? "");
  const [saved, setSaved]       = useState(roomNumber);
  const [isPending, startTransition] = useTransition();
  const inputRef = useRef<HTMLInputElement>(null);

  function handleOpen() {
    setValue(saved ?? "");
    setEditing(true);
    setTimeout(() => inputRef.current?.focus(), 50);
  }

  function handleSave() {
    const next = value.trim() || null;
    setSaved(next);
    setEditing(false);
    startTransition(async () => {
      const result = await updateRoomNumber(hotelId, attendeeId, next);
      if (!result.success) setSaved(roomNumber); // revert on failure
    });
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === "Enter") handleSave();
    if (e.key === "Escape") { setEditing(false); setValue(saved ?? ""); }
  }

  if (editing) {
    return (
      <div className="flex items-center gap-1.5 shrink-0">
        <input
          ref={inputRef}
          type="text"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onBlur={handleSave}
          onKeyDown={handleKeyDown}
          placeholder="Room #"
          className="w-20 text-xs text-gray-900 text-right bg-gray-100 rounded-lg px-2 py-1 border-0 outline-none focus:ring-2 focus:ring-[#0C2340]/20"
        />
      </div>
    );
  }

  return (
    <button
      onClick={handleOpen}
      disabled={isPending}
      className="shrink-0 flex items-center gap-1 active:opacity-70"
    >
      {saved ? (
        <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-gray-100 text-gray-700">
          Rm {saved}
        </span>
      ) : (
        <span className="text-xs text-gray-300 flex items-center gap-1">
          <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
          </svg>
          Room
        </span>
      )}
    </button>
  );
}

// ─── attendee action sheet ────────────────────────────────────────────────────

function AttendeeSheet({
  attendee,
  hotelId,
  onRemove,
  onClose,
}: {
  attendee: AttendeeInfo;
  hotelId: string;
  onRemove: (attendeeId: string) => void;
  onClose: () => void;
}) {
  const swipeStartY = useRef<number | null>(null);

  function handleTouchStart(e: React.TouchEvent) {
    swipeStartY.current = e.touches[0].clientY;
  }
  function handleTouchEnd(e: React.TouchEvent) {
    if (swipeStartY.current === null) return;
    if (e.changedTouches[0].clientY - swipeStartY.current > 80) onClose();
    swipeStartY.current = null;
  }

  return (
    <>
      <div className="fixed inset-0 bg-black/40 z-40" onClick={onClose} />
      <div
        className="fixed bottom-0 left-0 right-0 z-50 bg-white rounded-t-2xl shadow-xl pb-10"
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
        style={{ touchAction: "pan-y" }}
      >
        <div className="flex justify-center pt-3 pb-1">
          <div className="w-10 h-1 rounded-full bg-gray-200" />
        </div>

        <div className="px-5 pt-3 pb-4 border-b border-gray-100">
          <p className="text-lg font-bold text-gray-900">
            {attendee.firstName} {attendee.lastName}
          </p>
          {attendee.company && (
            <p className="text-sm text-gray-400">{attendee.company.name}</p>
          )}
        </div>

        <div className="divide-y divide-gray-50">
          {/* View profile */}
          <Link
            href={`/attendees/${attendee.id}`}
            className="flex items-center gap-3 px-5 py-4 hover:bg-gray-50 active:bg-gray-100"
            onClick={onClose}
          >
            <div className="w-9 h-9 rounded-full bg-[#E8EDF2] flex items-center justify-center shrink-0">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-[#0C2340]">
                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" />
              </svg>
            </div>
            <p className="text-sm font-medium text-gray-900">View profile</p>
          </Link>

          {/* Contact */}
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

          {/* Remove */}
          <button
            onClick={() => { onRemove(attendee.id); onClose(); }}
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
            <p className="text-sm font-medium text-red-600">Remove from hotel</p>
          </button>
        </div>
      </div>
    </>
  );
}

// ─── add attendee sheet ───────────────────────────────────────────────────────

function AddAttendeeSheet({
  available,
  addingId,
  onAdd,
  onClose,
}: {
  available: AttendeeInfo[];
  addingId: string | null;
  onAdd: (a: AttendeeInfo) => void;
  onClose: () => void;
}) {
  const [search, setSearch] = useState("");
  const filtered = available.filter((a) => attendeeMatches(a, search));

  return (
    <>
      <div className="fixed inset-0 bg-black/40 z-40" onClick={onClose} />
      <div className="fixed bottom-0 left-0 right-0 z-50 bg-white rounded-t-2xl shadow-xl flex flex-col" style={{ maxHeight: "80vh" }}>
        <div className="flex justify-center pt-3 pb-1 shrink-0">
          <div className="w-10 h-1 rounded-full bg-gray-200" />
        </div>

        <div className="px-5 pt-2 pb-3 border-b border-gray-100 shrink-0">
          <p className="text-base font-semibold text-gray-900">Add to hotel</p>
          <p className="text-xs text-gray-400 mt-0.5">
            {available.length === 0
              ? "All attendees are already assigned"
              : `${available.length} attendee${available.length === 1 ? "" : "s"} available`}
          </p>
        </div>

        {available.length > 0 && (
          <div className="px-4 py-3 shrink-0">
            <div className="relative">
              <svg className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-300 pointer-events-none" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
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

        <div className="overflow-y-auto pb-10 shrink min-h-0">
          {filtered.length === 0 ? (
            <div className="px-5 py-8 text-center">
              <p className="text-sm text-gray-400">
                {search ? `No results for "${search}"` : "All attendees already assigned."}
              </p>
            </div>
          ) : (
            filtered.map((a) => {
              const isAdding = addingId === a.id;
              return (
                <button
                  key={a.id}
                  onClick={() => onAdd(a)}
                  disabled={addingId !== null}
                  className="w-full flex items-center gap-3 px-5 py-3.5 text-left hover:bg-gray-50 active:bg-gray-100 disabled:opacity-60 border-b border-gray-50 last:border-0"
                >
                  <div className="w-9 h-9 rounded-full bg-[#E8EDF2] flex items-center justify-center shrink-0">
                    <span className="text-xs font-semibold text-[#0C2340]">
                      {initials(a.firstName, a.lastName)}
                    </span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">
                      {a.lastName}, {a.firstName}
                    </p>
                    {a.company && <p className="text-xs text-gray-400 truncate">{a.company.name}</p>}
                  </div>
                  {isAdding ? (
                    <svg className="w-4 h-4 animate-spin text-gray-400 shrink-0" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4l3-3-3-3v4a8 8 0 00-8 8h4z" />
                    </svg>
                  ) : (
                    <svg className="w-4 h-4 text-gray-300 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
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

// ─── main export ─────────────────────────────────────────────────────────────

export default function HotelManifestClient({
  hotelId,
  entries,
  assignableAttendees,
  coverageGap,
}: HotelManifestClientProps) {
  const [liveEntries, setLiveEntries]   = useState(entries);
  const [removedIds, setRemovedIds]     = useState<Set<string>>(new Set());
  const [addingId, setAddingId]         = useState<string | null>(null);
  const [showAddSheet, setShowAddSheet] = useState(false);
  const [sheetAttendee, setSheetAttendee] = useState<AttendeeInfo | null>(null);
  const [, startTransition]             = useTransition();

  const visibleEntries = liveEntries.filter((e) => !removedIds.has(e.attendeeId));
  const assignedIds    = new Set(visibleEntries.map((e) => e.attendeeId));
  const available      = assignableAttendees.filter((a) => !assignedIds.has(a.id));
  const gapUnassigned  = coverageGap.filter((a) => !assignedIds.has(a.id));

  function handleRemove(attendeeId: string) {
    setRemovedIds((prev) => new Set([...prev, attendeeId]));
    startTransition(async () => {
      const result = await removeFromHotel(hotelId, attendeeId);
      if (!result.success) {
        setRemovedIds((prev) => { const n = new Set(prev); n.delete(attendeeId); return n; });
      }
    });
  }

  function handleAdd(attendee: AttendeeInfo) {
    setAddingId(attendee.id);
    startTransition(async () => {
      const result = await assignToHotel(hotelId, attendee.id);
      if (result.success) {
        setLiveEntries((prev) => [
          ...prev,
          { id: `opt-${attendee.id}`, attendeeId: attendee.id, roomNumber: null, attendee },
        ]);
      }
      setAddingId(null);
      setShowAddSheet(false);
    });
  }

  return (
    <>
      {/* Coverage gap */}
      {gapUnassigned.length > 0 && (
        <div className="px-4 mb-4">
          <div className="bg-amber-50 border border-amber-200 rounded-2xl px-4 py-3">
            <div className="flex items-center gap-2 mb-2">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-amber-600 shrink-0">
                <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
                <line x1="12" y1="9" x2="12" y2="13" /><line x1="12" y1="17" x2="12.01" y2="17" />
              </svg>
              <p className="text-xs font-semibold text-amber-700 uppercase tracking-wide">
                Missing coverage — {gapUnassigned.length} travel package {gapUnassigned.length === 1 ? "attendee" : "attendees"} unassigned at this stop
              </p>
            </div>
            <div className="space-y-1">
              {gapUnassigned.map((a) => (
                <div key={a.id} className="flex items-center justify-between gap-2">
                  <p className="text-xs text-amber-800 truncate">
                    {a.firstName} {a.lastName}
                    {a.company ? ` · ${a.company.name}` : ""}
                  </p>
                  <button
                    onClick={() => handleAdd(a)}
                    disabled={addingId !== null}
                    className="text-xs font-semibold text-amber-700 shrink-0 hover:text-amber-900 disabled:opacity-40"
                  >
                    Assign here
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Header row: count + add button */}
      <div className="px-4 flex items-center mb-3">
        <div className="flex items-baseline gap-1.5 px-1">
          <span className="text-2xl font-bold text-[#0C2340]">{visibleEntries.length}</span>
          <span className="text-sm text-gray-400">
            {visibleEntries.length === 1 ? "guest" : "guests"}
          </span>
        </div>
        <button
          onClick={() => setShowAddSheet(true)}
          className="ml-auto flex items-center gap-1.5 text-sm font-medium text-[#0C2340] bg-[#E8EDF2] rounded-full px-3 py-1.5 active:opacity-70"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
          </svg>
          Add
        </button>
      </div>

      <div className="px-4">
        <p className="text-xs text-gray-300 px-1 mb-2">Tap name for options · Tap room to edit</p>

        {visibleEntries.length === 0 ? (
          <div className="bg-white rounded-2xl shadow-sm px-4 py-8 text-center">
            <p className="text-gray-400 text-sm">No guests assigned yet.</p>
            <p className="text-gray-300 text-xs mt-1">Tap Add to assign someone.</p>
          </div>
        ) : (
          <div className="bg-white rounded-2xl shadow-sm overflow-hidden divide-y divide-gray-50">
            {visibleEntries.map((entry) => (
              <div key={entry.attendeeId} className="flex items-center gap-3 px-4 py-3.5">
                {/* Avatar */}
                <div className="w-9 h-9 rounded-full bg-[#0C2340] flex items-center justify-center shrink-0">
                  <span className="text-xs font-semibold text-white">
                    {initials(entry.attendee.firstName, entry.attendee.lastName)}
                  </span>
                </div>

                {/* Name + company — tap opens sheet */}
                <button
                  onClick={() => setSheetAttendee(entry.attendee)}
                  className="flex-1 min-w-0 text-left py-0.5"
                >
                  <p className="text-sm font-medium text-gray-900 truncate">
                    {entry.attendee.lastName}, {entry.attendee.firstName}
                  </p>
                  {entry.attendee.company && (
                    <p className="text-xs text-gray-400 truncate">{entry.attendee.company.name}</p>
                  )}
                </button>

                {/* Room number edit */}
                <RoomNumberEdit
                  hotelId={hotelId}
                  attendeeId={entry.attendeeId}
                  roomNumber={entry.roomNumber}
                />
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Attendee action sheet */}
      {sheetAttendee && (
        <AttendeeSheet
          attendee={sheetAttendee}
          hotelId={hotelId}
          onRemove={handleRemove}
          onClose={() => setSheetAttendee(null)}
        />
      )}

      {/* Add sheet */}
      {showAddSheet && (
        <AddAttendeeSheet
          available={available}
          addingId={addingId}
          onAdd={handleAdd}
          onClose={() => setShowAddSheet(false)}
        />
      )}
    </>
  );
}
