import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import Link from "next/link";
import { MovementMode, FlightStatus } from "@prisma/client";

// ─── helpers ────────────────────────────────────────────────────────────────

function startOfDay(d: Date) {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate(), 0, 0, 0, 0);
}
function endOfDay(d: Date) {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate(), 23, 59, 59, 999);
}

// Returns a Date whose UTC value equals the current wall-clock time in the
// given IANA timezone. Used to compare against dumb-local stored times.
function localNow(timezone: string): Date {
  // sv-SE locale produces "YYYY-MM-DD HH:MM:SS" — parse as UTC to get dumb-local
  const s = new Date().toLocaleString("sv-SE", { timeZone: timezone });
  return new Date(s.replace(" ", "T") + ".000Z");
}

const MODE_LABEL: Record<MovementMode, string> = {
  BUS:    "Bus",
  CAR:    "Car",
  FLIGHT: "Flight",
  TRAIN:  "Train",
  WALK:   "Walk",
  OTHER:  "Transfer",
};

const STATUS_PILL: Record<FlightStatus, { label: string; className: string }> = {
  SCHEDULED: { label: "Scheduled", className: "bg-gray-100 text-gray-500" },
  ON_TIME:   { label: "On Time",   className: "bg-green-50 text-green-700" },
  DELAYED:   { label: "Delayed",   className: "bg-amber-50 text-amber-700" },
  LANDED:    { label: "Landed",    className: "bg-blue-50 text-blue-700" },
  CANCELLED: { label: "Cancelled", className: "bg-red-50 text-red-600" },
};

function fmtTime(d: Date | null | undefined) {
  if (!d) return "—";
  return d.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });
}

function fmtDayTime(d: Date | null | undefined) {
  if (!d) return "—";
  return d.toLocaleString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

function fmtDuration(dep: Date, arr: Date | null | undefined): string | null {
  if (!arr) return null;
  const mins = Math.round((arr.getTime() - dep.getTime()) / 60000);
  if (mins <= 0) return null;
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  if (h === 0) return `${m}m`;
  if (m === 0) return `${h}h`;
  return `${h}h ${m}m`;
}

// ─── data fetching ───────────────────────────────────────────────────────────

async function getTodayData() {
  const now = new Date();
  const todayStart = startOfDay(now);
  const todayEnd = endOfDay(now);

  // 1. Active trip
  const trip = await db.trip.findFirst({
    where: { isActive: true },
    include: {
      events: { orderBy: { date: "asc" } },
    },
  });

  if (!trip) return { trip: null };

  // 2. Current event: prefer today, else nearest (future first, then most recent past)
  let currentEvent =
    trip.events.find(
      (e) => e.date >= todayStart && e.date <= todayEnd
    ) ??
    trip.events.find((e) => e.date > now) ?? // next upcoming
    trip.events[trip.events.length - 1] ??   // most recent past
    null;

  // 3. Arrival/departure window boundaries (for card visibility)
  //    Arrivals card: visible while today <= last arrival date
  //    Departures card: visible once today >= first departure date
  const [lastArrivalRow, firstDepartureRow] = await Promise.all([
    db.attendee.findFirst({
      where: { tripId: trip.id, arrivalScheduledAt: { not: null } },
      orderBy: { arrivalScheduledAt: "desc" },
      select: { arrivalScheduledAt: true },
    }),
    db.attendee.findFirst({
      where: { tripId: trip.id, departureScheduledAt: { not: null } },
      orderBy: { departureScheduledAt: "asc" },
      select: { departureScheduledAt: true },
    }),
  ]);

  const lastArrivalDate = lastArrivalRow?.arrivalScheduledAt
    ? startOfDay(lastArrivalRow.arrivalScheduledAt)
    : null;
  const firstDepartureDate = firstDepartureRow?.departureScheduledAt
    ? startOfDay(firstDepartureRow.departureScheduledAt)
    : null;

  const showArrivals = lastArrivalDate ? todayStart <= lastArrivalDate : false;
  const showDepartures = firstDepartureDate ? todayStart >= firstDepartureDate : false;

  // 4. Today's arrivals (only fetched when card is visible)
  const todayArrivals = showArrivals
    ? await db.attendee.findMany({
        where: {
          tripId: trip.id,
          arrivalScheduledAt: { gte: todayStart, lte: todayEnd },
        },
        select: {
          id: true,
          firstName: true,
          lastName: true,
          arrivalAirline: true,
          arrivalFlightNumber: true,
          arrivalAirport: true,
          arrivalScheduledAt: true,
        },
        orderBy: { arrivalScheduledAt: "asc" },
      })
    : [];

  // Next arrival date when none are today (card still in-window but empty today)
  const nextArrivalRow =
    showArrivals && todayArrivals.length === 0
      ? await db.attendee.findFirst({
          where: {
            tripId: trip.id,
            arrivalScheduledAt: { gt: todayEnd },
          },
          orderBy: { arrivalScheduledAt: "asc" },
          select: { arrivalScheduledAt: true },
        })
      : null;

  // 5. Today's departures (only fetched when card is visible)
  const todayDepartures = showDepartures
    ? await db.attendee.findMany({
        where: {
          tripId: trip.id,
          departureScheduledAt: { gte: todayStart, lte: todayEnd },
        },
        select: {
          id: true,
          firstName: true,
          lastName: true,
          departureAirline: true,
          departureFlightNumber: true,
          departureAirport: true,
          departureScheduledAt: true,
        },
        orderBy: { departureScheduledAt: "asc" },
      })
    : [];

  // Next departure date when none are today
  const nextDepartureRow =
    showDepartures && todayDepartures.length === 0
      ? await db.attendee.findFirst({
          where: {
            tripId: trip.id,
            departureScheduledAt: { gt: todayEnd },
          },
          orderBy: { departureScheduledAt: "asc" },
          select: { departureScheduledAt: true },
        })
      : null;

  // 6. Next movement for current event
  // Use localNow so the comparison is against wall-clock time at the event
  // location, not UTC (movement times are stored as dumb-local).
  const nextMovement = currentEvent
    ? await db.movement.findFirst({
        where: {
          eventId: currentEvent.id,
          departureTime: { gte: localNow(currentEvent.timezone) },
        },
        include: {
          _count: { select: { movementManifestEntries: true } },
        },
        orderBy: { departureTime: "asc" },
      })
    : null;

  // 7. Hotels for current event with attendee counts
  const hotels = currentEvent
    ? await db.hotel.findMany({
        where: { eventId: currentEvent.id },
        include: {
          _count: { select: { hotelManifestEntries: true } },
        },
        orderBy: { name: "asc" },
      })
    : [];

  return {
    trip,
    currentEvent,
    showArrivals,
    todayArrivals,
    nextArrivalDate: nextArrivalRow?.arrivalScheduledAt ?? null,
    showDepartures,
    todayDepartures,
    nextDepartureDate: nextDepartureRow?.departureScheduledAt ?? null,
    nextMovement,
    hotels,
  };
}

// ─── page ────────────────────────────────────────────────────────────────────

export default async function TodayPage() {
  const session = await auth();
  const {
    trip,
    currentEvent,
    showArrivals,
    todayArrivals,
    nextArrivalDate,
    showDepartures,
    todayDepartures,
    nextDepartureDate,
    nextMovement,
    hotels,
  } = await getTodayData();

  const today = new Date();

  return (
    <div className="px-4 pt-6 pb-24">
      {/* Header */}
      <div className="flex items-start justify-between mb-1">
        <div>
          <h1 className="text-xl font-semibold text-gray-900">Today</h1>
          <p className="text-sm text-gray-500">
            {today.toLocaleDateString("en-US", {
              weekday: "long",
              month: "long",
              day: "numeric",
            })}
          </p>
        </div>
        <span className="text-xs text-gray-400 mt-1">
          {session?.user?.name ?? session?.user?.email}
        </span>
      </div>

      {/* Trip context */}
      {trip ? (
        <p className="text-xs font-medium text-blue-700 mb-5">
          {trip.name}
          {currentEvent ? ` · ${currentEvent.name}, ${currentEvent.city}` : ""}
        </p>
      ) : (
        <p className="text-xs text-gray-400 mb-5">No active trip</p>
      )}

      {!trip ? (
        // ── No active trip ─────────────────────────────────────────────────
        <div className="bg-white rounded-2xl p-6 shadow-sm text-center">
          <p className="text-gray-400 text-sm">No active trip configured.</p>
          <p className="text-gray-300 text-xs mt-1">
            Ask an Admin to mark a trip as active.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {/* ── Arrivals card (visible while today ≤ last arrival date) ── */}
          {showArrivals && (
            <Link href="/today/arrivals" className="block bg-white rounded-2xl p-4 shadow-sm active:bg-gray-50">
              <div className="flex items-center gap-2 mb-3">
                <p className="text-sm font-semibold text-gray-800">Arrivals</p>
                <div className="flex-1 h-px bg-blue-100" />
              </div>
              {todayArrivals.length > 0 ? (
                <div className="flex items-end justify-between">
                  <div className="flex items-baseline gap-2">
                    <span className="text-4xl font-semibold text-gray-900">
                      {todayArrivals.length}
                    </span>
                    <span className="text-sm text-gray-400">
                      {todayArrivals.length === 1 ? "arrival today" : "arrivals today"}
                    </span>
                  </div>
                  <div className="flex items-center gap-1 text-xs text-gray-400">
                    <span>View all</span>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="9 18 15 12 9 6" />
                    </svg>
                  </div>
                </div>
              ) : nextArrivalDate ? (
                <div className="flex items-center justify-between">
                  <p className="text-sm text-gray-500">
                    Next:{" "}
                    <span className="font-medium text-gray-800">
                      {nextArrivalDate.toLocaleDateString("en-US", {
                        weekday: "short",
                        month: "short",
                        day: "numeric",
                      })}
                    </span>
                  </p>
                  <div className="flex items-center gap-1 text-xs text-gray-400">
                    <span>View all</span>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="9 18 15 12 9 6" />
                    </svg>
                  </div>
                </div>
              ) : (
                <p className="text-gray-400 text-sm">No arrivals scheduled today</p>
              )}
            </Link>
          )}

          {/* ── Departures card (visible once today ≥ first departure date) */}
          {showDepartures && (
            <Link href="/today/departures" className="block bg-white rounded-2xl p-4 shadow-sm active:bg-gray-50">
              <div className="flex items-center gap-2 mb-3">
                <p className="text-sm font-semibold text-gray-800">Departures</p>
                <div className="flex-1 h-px bg-blue-100" />
              </div>
              {todayDepartures.length > 0 ? (
                <div className="flex items-end justify-between">
                  <div className="flex items-baseline gap-2">
                    <span className="text-4xl font-semibold text-gray-900">
                      {todayDepartures.length}
                    </span>
                    <span className="text-sm text-gray-400">
                      {todayDepartures.length === 1 ? "departure today" : "departures today"}
                    </span>
                  </div>
                  <div className="flex items-center gap-1 text-xs text-gray-400">
                    <span>View all</span>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="9 18 15 12 9 6" />
                    </svg>
                  </div>
                </div>
              ) : nextDepartureDate ? (
                <div className="flex items-center justify-between">
                  <p className="text-sm text-gray-500">
                    Next:{" "}
                    <span className="font-medium text-gray-800">
                      {nextDepartureDate.toLocaleDateString("en-US", {
                        weekday: "short",
                        month: "short",
                        day: "numeric",
                      })}
                    </span>
                  </p>
                  <div className="flex items-center gap-1 text-xs text-gray-400">
                    <span>View all</span>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="9 18 15 12 9 6" />
                    </svg>
                  </div>
                </div>
              ) : (
                <p className="text-gray-400 text-sm">No departures scheduled today</p>
              )}
            </Link>
          )}

          {/* ── Next movement ───────────────────────────────────────────── */}
          {!currentEvent || !nextMovement ? (
            <div className="bg-white rounded-2xl p-4 shadow-sm">
              <div className="flex items-center gap-2 mb-3">
                <p className="text-sm font-semibold text-gray-800">Next movement</p>
                <div className="flex-1 h-px bg-blue-100" />
              </div>
              <p className="text-gray-400 text-sm">
                {!currentEvent ? "No current event" : "No upcoming movements"}
              </p>
            </div>
          ) : (
            <Link
              href={`/movements/${nextMovement.id}`}
              className="block bg-white rounded-2xl p-4 shadow-sm active:bg-gray-50"
            >
              <div className="flex items-center gap-2 mb-3">
                <p className="text-sm font-semibold text-gray-800">Next movement</p>
                <div className="flex-1 h-px bg-blue-100" />
              </div>

              {/* Name + mode pill on same line */}
              <div className="flex items-center gap-2 mb-3 flex-wrap">
                <p className="text-sm font-semibold text-gray-800">
                  {nextMovement.name}
                </p>
                <span className="text-[11px] font-medium px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 shrink-0">
                  {MODE_LABEL[nextMovement.mode]}
                </span>
              </div>

              {/* Route visual */}
              <div className="flex flex-col">
                <div className="flex items-center gap-2.5">
                  <div className="w-3.5 flex justify-center">
                    <div className="w-2.5 h-2.5 rounded-full border-2 border-gray-400 bg-white" />
                  </div>
                  <p className="text-sm text-gray-800">{nextMovement.departureLocation}</p>
                </div>
                <div className="flex gap-2.5">
                  <div className="w-3.5 flex justify-center">
                    <div className="w-px h-4 bg-gray-200" />
                  </div>
                </div>
                <div className="flex items-center gap-2.5">
                  <div className="w-3.5 flex justify-center">
                    <div className="w-2.5 h-2.5 rounded-full bg-gray-700" />
                  </div>
                  <p className="text-sm text-gray-800">{nextMovement.arrivalLocation}</p>
                </div>
              </div>

              {/* Meet callout */}
              {(nextMovement.meetTime || nextMovement.meetLocation) && (
                <div className="mt-3 bg-blue-50 rounded-xl px-3 py-2 flex items-center gap-2">
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-blue-500 shrink-0">
                    <circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" />
                  </svg>
                  <div className="flex items-center gap-1.5 min-w-0">
                    <span className="text-[10px] font-semibold text-blue-500 uppercase tracking-wide shrink-0">Meet</span>
                    {nextMovement.meetLocation && (
                      <span className="text-xs text-blue-900 font-medium truncate">{nextMovement.meetLocation}</span>
                    )}
                    {nextMovement.meetTime && (
                      <span className="text-xs text-blue-700 shrink-0">{fmtTime(nextMovement.meetTime)}</span>
                    )}
                  </div>
                </div>
              )}

              {/* Footer */}
              <div className="flex items-center mt-3 pt-3 border-t border-gray-50">
                <div>
                  <p className="text-[10px] text-gray-400 uppercase tracking-wide">Departs</p>
                  <p className="text-sm font-medium text-gray-800">
                    {fmtDayTime(nextMovement.departureTime)}
                  </p>
                </div>
                {fmtDuration(nextMovement.departureTime, nextMovement.arrivalTime) && (
                  <div className="mx-auto text-center">
                    <p className="text-[10px] text-gray-400 uppercase tracking-wide">Duration</p>
                    <p className="text-sm font-medium text-gray-800">
                      {fmtDuration(nextMovement.departureTime, nextMovement.arrivalTime)}
                    </p>
                  </div>
                )}
                <div className="ml-auto text-right">
                  <p className="text-[10px] text-gray-400 uppercase tracking-wide">Pax</p>
                  <p className="text-sm font-medium text-gray-800">
                    {nextMovement._count.movementManifestEntries}
                  </p>
                </div>
                <svg
                  className="ml-2.5 text-gray-300 shrink-0"
                  width="14" height="14" viewBox="0 0 24 24"
                  fill="none" stroke="currentColor" strokeWidth="2.5"
                  strokeLinecap="round" strokeLinejoin="round"
                >
                  <polyline points="9 18 15 12 9 6" />
                </svg>
              </div>
            </Link>
          )}

          {/* ── Hotels ─────────────────────────────────────────────────── */}
          <div className="bg-white rounded-2xl p-4 shadow-sm">
            <div className="flex items-center gap-2 mb-3">
              <p className="text-sm font-semibold text-gray-800">
                Hotels
              </p>
              <div className="flex-1 h-px bg-blue-100" />
            </div>
            {!currentEvent ? (
              <p className="text-gray-400 text-sm">No current event</p>
            ) : hotels.length === 0 ? (
              <p className="text-gray-400 text-sm">No hotels assigned yet</p>
            ) : (
              <ul className="divide-y divide-gray-50">
                {hotels.map((hotel) => (
                  <li
                    key={hotel.id}
                    className="py-2 first:pt-0 last:pb-0 flex items-center justify-between gap-2"
                  >
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-gray-800 truncate">
                        {hotel.name}
                      </p>
                      {hotel.address && (
                        <p className="text-xs text-gray-400 truncate">
                          {hotel.address}
                        </p>
                      )}
                    </div>
                    <span className="shrink-0 text-xs text-gray-500">
                      {hotel._count.hotelManifestEntries}{" "}
                      {hotel._count.hotelManifestEntries === 1
                        ? "guest"
                        : "guests"}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
