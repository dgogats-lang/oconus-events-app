import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { notFound } from "next/navigation";
import Link from "next/link";
import { MovementMode, MovementEntryStatus } from "@prisma/client";
import NotesEditor from "./NotesEditor";

// ─── helpers ──────────────────────────────────────────────────────────────────

const MODE_LABEL: Record<MovementMode, string> = {
  BUS:    "Bus",
  CAR:    "Car",
  FLIGHT: "Flight",
  TRAIN:  "Train",
  WALK:   "Walk",
  OTHER:  "Transfer",
};

const MODE_ICON: Record<MovementMode, string> = {
  BUS:    "🚌",
  CAR:    "🚗",
  FLIGHT: "✈️",
  TRAIN:  "🚆",
  WALK:   "🚶",
  OTHER:  "🚐",
};


const MOVEMENT_STATUS: Record<
  MovementEntryStatus,
  { label: string; className: string }
> = {
  PENDING: { label: "Not boarded", className: "bg-gray-100 text-gray-500" },
  CHECKED_IN: { label: "Boarded", className: "bg-green-50 text-green-700" },
};

function fmtDateTime(d: Date | null | undefined) {
  if (!d) return "—";
  return d.toLocaleString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

// ─── data fetching ────────────────────────────────────────────────────────────

async function getAttendee(id: string) {
  return db.attendee.findUnique({
    where: { id },
    include: {
      company: true,
      eventRegistrations: {
        include: {
          event: { select: { id: true, name: true, city: true, date: true } },
        },
        orderBy: { event: { date: "asc" } },
      },
      hotelManifestEntries: {
        include: {
          hotel: {
            select: {
              name: true,
              address: true,
              phone: true,
              eventId: true,
              event: { select: { id: true, name: true, city: true, date: true } },
            },
          },
        },
        orderBy: { createdAt: "asc" },
      },
      movementManifestEntries: {
        include: {
          movement: {
            select: {
              name: true,
              mode: true,
              departureLocation: true,
              arrivalLocation: true,
              departureTime: true,
              event: { select: { id: true, name: true, city: true, date: true } },
            },
          },
        },
        orderBy: { movement: { departureTime: "asc" } },
      },
    },
  });
}

// ─── page ─────────────────────────────────────────────────────────────────────

export default async function AttendeeProfilePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const session = await auth();

  // Check admin role via DB (reliable regardless of session JWT shape)
  const dbUser = session?.user?.email
    ? await db.user.findUnique({
        where: { email: session.user.email },
        select: { role: true },
      })
    : null;
  const isAdmin = dbUser?.role === "ADMIN";

  const attendee = await getAttendee(id);
  if (!attendee) notFound();

  // ── Build per-event summary (EventRegistration is source of truth) ────────
  const hotelByEvent = new Map(
    attendee.hotelManifestEntries
      .filter((e) => e.hotel.event)
      .map((e) => [
        e.hotel.event!.id,
        { name: e.hotel.name, roomNumber: e.roomNumber },
      ])
  );
  const movementCountByEvent = new Map<string, number>();
  for (const entry of attendee.movementManifestEntries) {
    const eid = entry.movement.event.id;
    movementCountByEvent.set(eid, (movementCountByEvent.get(eid) ?? 0) + 1);
  }

  const attendingEvents = attendee.eventRegistrations.map((reg) => ({
    id: reg.event.id,
    name: reg.event.name,
    city: reg.event.city,
    date: reg.event.date,
    hotel: hotelByEvent.get(reg.event.id) ?? null,
    movementCount: movementCountByEvent.get(reg.event.id) ?? 0,
  }));

  return (
    <div className="pb-24">
      {/* ── Back nav ────────────────────────────────────────────────────── */}
      <div className="px-4 pt-4">
        <Link
          href="/attendees"
          className="inline-flex items-center gap-1 text-sm text-[#0C2340] font-medium"
        >
          <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <polyline points="15 18 9 12 15 6" />
          </svg>
          Attendees
        </Link>
      </div>

      {/* ── Profile header ──────────────────────────────────────────────── */}
      <div className="px-4 pt-4 pb-5">
        <div className="flex items-center gap-4">
          {/* Avatar */}
          <div className="w-16 h-16 rounded-full bg-blue-50 flex items-center justify-center shrink-0">
            <span className="text-xl font-bold text-[#0C2340]">
              {attendee.firstName[0]}
              {attendee.lastName[0]}
            </span>
          </div>

          {/* Name + company */}
          <div className="min-w-0">
            <h1 className="text-xl font-bold text-gray-900">
              {attendee.firstName} {attendee.lastName}
            </h1>
            {attendee.company && (
              <p className="text-sm text-gray-500">{attendee.company.name}</p>
            )}
            {/* Badges */}
            <div className="flex items-center gap-1.5 mt-1.5 flex-wrap">
              {attendee.hasDodId && (
                <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-amber-100 text-amber-800">
                  DoD ID
                </span>
              )}
              {attendee.travelPackage && (
                <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-green-100 text-green-800">
                  Travel Package
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="px-4 space-y-3">
        {/* ── Events ──────────────────────────────────────────────────────── */}
        {attendingEvents.length > 0 && (
          <div className="bg-white rounded-2xl shadow-sm p-4">
            <p className="text-sm font-semibold text-gray-800 mb-3">Events</p>
            <div className="divide-y divide-gray-50">
              {attendingEvents.map((ev) => (
                <div key={ev.id} className="py-2.5 first:pt-0 last:pb-0">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-gray-800">
                        {ev.name}
                      </p>
                      <p className="text-xs text-gray-400">
                        {ev.city} ·{" "}
                        {ev.date.toLocaleDateString("en-US", {
                          month: "short",
                          day: "numeric",
                        })}
                      </p>
                      {ev.hotel && (
                        <p className="text-xs text-gray-400 mt-0.5">
                          {ev.hotel.name}
                          {ev.hotel.roomNumber
                            ? ` · Room ${ev.hotel.roomNumber}`
                            : ""}
                        </p>
                      )}
                    </div>
                    <div className="flex flex-col items-end gap-1 shrink-0">
                      {ev.hotel && (
                        <span className="text-[10px] font-medium px-1.5 py-0.5 rounded bg-blue-50 text-blue-700">
                          Hotel
                        </span>
                      )}
                      {ev.movementCount > 0 && (
                        <span className="text-[10px] font-medium px-1.5 py-0.5 rounded bg-gray-100 text-gray-600">
                          {ev.movementCount} movement
                          {ev.movementCount !== 1 ? "s" : ""}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── Contact ─────────────────────────────────────────────────────── */}
        <div className="bg-white rounded-2xl shadow-sm overflow-hidden divide-y divide-gray-50">
          {attendee.email && (
            <a
              href={`mailto:${attendee.email}`}
              className="flex items-center gap-3 px-4 py-3 hover:bg-gray-50 active:bg-gray-100"
            >
              <div className="w-8 h-8 rounded-full bg-blue-50 flex items-center justify-center shrink-0">
                <svg
                  width="15"
                  height="15"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="#0C2340"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
                  <polyline points="22,6 12,13 2,6" />
                </svg>
              </div>
              <div className="min-w-0">
                <p className="text-[10px] text-gray-400 uppercase tracking-wide">
                  Email
                </p>
                <p className="text-sm text-[#0C2340] truncate">
                  {attendee.email}
                </p>
              </div>
            </a>
          )}
          {attendee.phone && (
            <a
              href={`tel:${attendee.phone}`}
              className="flex items-center gap-3 px-4 py-3 hover:bg-gray-50 active:bg-gray-100"
            >
              <div className="w-8 h-8 rounded-full bg-blue-50 flex items-center justify-center shrink-0">
                <svg
                  width="15"
                  height="15"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="#0C2340"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.14 12 19.79 19.79 0 0 1 1.08 3.4 2 2 0 0 1 3.07 1.22h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L7.09 8.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 21 16.92z" />
                </svg>
              </div>
              <div>
                <p className="text-[10px] text-gray-400 uppercase tracking-wide">
                  Phone
                </p>
                <p className="text-sm text-[#0C2340]">{attendee.phone}</p>
              </div>
            </a>
          )}
        </div>

        {/* ── Flights ─────────────────────────────────────────────────────── */}
        <div className="bg-white rounded-2xl shadow-sm p-4">
          <p className="text-sm font-semibold text-gray-800 mb-3">Flights</p>
          {!attendee.arrivalFlightNumber && !attendee.departureFlightNumber ? (
            <p className="text-sm text-gray-400">No flight details loaded yet.</p>
          ) : (
            <div className="space-y-3">
              {attendee.arrivalFlightNumber && (
                <div className="space-y-1">
                  <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wide">Arrival</p>
                  <p className="text-sm font-semibold text-gray-800">
                    {fmtDateTime(attendee.arrivalScheduledAt)}
                  </p>
                  <p className="text-xs text-gray-400">
                    {[attendee.arrivalAirline, attendee.arrivalFlightNumber].filter(Boolean).join(" ")}
                    {attendee.arrivalAirport ? ` · ${attendee.arrivalAirport}` : ""}
                  </p>
                </div>
              )}
              {attendee.departureFlightNumber && (
                <div className="space-y-1 pt-3 border-t border-gray-50">
                  <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wide">Departure</p>
                  <p className="text-sm font-semibold text-gray-800">
                    {fmtDateTime(attendee.departureScheduledAt)}
                  </p>
                  <p className="text-xs text-gray-400">
                    {[attendee.departureAirline, attendee.departureFlightNumber].filter(Boolean).join(" ")}
                    {attendee.departureAirport ? ` · ${attendee.departureAirport}` : ""}
                  </p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* ── Hotels ──────────────────────────────────────────────────────── */}
        {attendee.hotelManifestEntries.length > 0 && (
          <div className="bg-white rounded-2xl shadow-sm p-4">
            <p className="text-sm font-semibold text-gray-800 mb-3">Hotels</p>
            <div className="space-y-3">
              {attendee.hotelManifestEntries.map((entry) => (
                <div key={entry.id}>
                  <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wide mb-0.5">
                    {entry.hotel.event
                      ? `${entry.hotel.event.name}, ${entry.hotel.event.city}`
                      : "Transit"}
                  </p>
                  <p className="text-sm font-medium text-gray-800">
                    {entry.hotel.name}
                  </p>
                  <p className="text-xs text-gray-400">
                    {entry.roomNumber ? `Room ${entry.roomNumber}` : "No room assigned"}
                    {entry.hotel.address ? ` · ${entry.hotel.address}` : ""}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── Movements ───────────────────────────────────────────────────── */}
        {attendee.movementManifestEntries.length > 0 && (
          <div className="bg-white rounded-2xl shadow-sm p-4">
            <p className="text-sm font-semibold text-gray-800 mb-3">
              Movements
            </p>
            <div className="divide-y divide-gray-50">
              {attendee.movementManifestEntries.map((entry) => {
                const pill = MOVEMENT_STATUS[entry.status];
                const mv = entry.movement;
                return (
                  <div key={entry.id} className="py-2.5 first:pt-0 last:pb-0">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-gray-800">
                          <span className="mr-1">{MODE_ICON[mv.mode]}</span>
                          {mv.name}
                        </p>
                        <p className="text-xs text-gray-400">
                          {mv.departureLocation} → {mv.arrivalLocation}
                        </p>
                        <p className="text-xs text-gray-400">
                          {fmtDateTime(mv.departureTime)}
                        </p>
                      </div>
                      <span
                        className={`shrink-0 text-[10px] font-medium px-2 py-0.5 rounded-full ${pill.className}`}
                      >
                        {pill.label}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* ── Notes ───────────────────────────────────────────────────────── */}
        <div className="bg-white rounded-2xl shadow-sm p-4">
          <p className="text-sm font-semibold text-gray-800 mb-3">Notes</p>
          <NotesEditor
            attendeeId={attendee.id}
            initialNotes={attendee.notes}
          />
        </div>

        {/* ── Admin actions ────────────────────────────────────────────────── */}
        {isAdmin && (
          <div className="bg-white rounded-2xl shadow-sm p-4">
            <p className="text-sm font-semibold text-gray-800 mb-3">
              Admin
            </p>
            <p className="text-xs text-gray-400">
              Full field editing coming soon.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
