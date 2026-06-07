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
            <Link
              href="/today/arrivals"
              className="block rounded-2xl shadow-sm overflow-hidden active:opacity-90"
            >
              <div className="bg-[#0C2340] px-4 pt-3.5 pb-5">
                {/* Label row */}
                <div className="flex items-center gap-2 mb-3">
                  <span className="text-[10px] font-semibold text-blue-300 uppercase tracking-wider">
                    Arrivals
                  </span>
                  <div className="flex-1" />
                  <div className="flex items-center gap-1 text-[11px] text-blue-300">
                    <span>View all</span>
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="9 18 15 12 9 6" />
                    </svg>
                  </div>
                </div>

                {/* Count or next-date state */}
                {todayArrivals.length > 0 ? (
                  <div className="flex items-baseline gap-2.5">
                    <span className="text-[42px] font-semibold text-white leading-none">
                      {todayArrivals.length}
                    </span>
                    <span className="text-sm text-blue-300">
                      {todayArrivals.length === 1 ? "arrival today" : "arrivals today"}
                    </span>
                  </div>
                ) : nextArrivalDate ? (
                  <div className="flex items-baseline gap-2.5">
                    <span className="text-[42px] font-semibold text-white leading-none">0</span>
                    <span className="text-sm text-blue-300">
                      today · next{" "}
                      <span className="text-white font-medium">
                        {nextArrivalDate.toLocaleDateString("en-US", {
                          weekday: "short",
                          month: "short",
                          day: "numeric",
                        })}
                      </span>
                    </span>
                  </div>
                ) : (
                  <p className="text-sm text-blue-300">No arrivals scheduled today</p>
                )}
              </div>
            </Link>
          )}

          {/* ── Departures card (visible once today ≥ first departure date) */}
          {showDepartures && (
            <Link
              href="/today/departures"
              className="block rounded-2xl shadow-sm overflow-hidden active:opacity-90"
            >
              <div className="bg-[#0C2340] px-4 pt-3.5 pb-5">
                {/* Label row */}
                <div className="flex items-center gap-2 mb-3">
                  <span className="text-[10px] font-semibold text-blue-300 uppercase tracking-wider">
                    Departures
                  </span>
                  <div className="flex-1" />
                  <div className="flex items-center gap-1 text-[11px] text-blue-300">
                    <span>View all</span>
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="9 18 15 12 9 6" />
                    </svg>
                  </div>
                </div>

                {/* Count or next-date state */}
                {todayDepartures.length > 0 ? (
                  <div className="flex items-baseline gap-2.5">
                    <span className="text-[42px] font-semibold text-white leading-none">
                      {todayDepartures.length}
                    </span>
                    <span className="text-sm text-blue-300">
                      {todayDepartures.length === 1 ? "departure today" : "departures today"}
                    </span>
                  </div>
                ) : nextDepartureDate ? (
                  <div className="flex items-baseline gap-2.5">
                    <span className="text-[42px] font-semibold text-white leading-none">0</span>
                    <span className="text-sm text-blue-300">
                      today · next{" "}
                      <span className="text-white font-medium">
                        {nextDepartureDate.toLocaleDateString("en-US", {
                          weekday: "short",
                          month: "short",
                          day: "numeric",
                        })}
                      </span>
                    </span>
                  </div>
                ) : (
                  <p className="text-sm text-blue-300">No departures scheduled today</p>
                )}
              </div>
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
              className="block rounded-2xl shadow-sm overflow-hidden active:opacity-90"
            >
              {/* ── Dark header ── */}
              <div className="bg-[#0C2340] px-4 pt-3.5 pb-4">

                {/* Label row: "Next movement" + combined mode|pax pill */}
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-[10px] font-semibold text-blue-300 uppercase tracking-wider">
                    Next movement
                  </span>
                  <div className="flex items-center rounded-full overflow-hidden" style={{background: "rgba(255,255,255,0.12)"}}>
                    <span className="text-[10px] font-semibold text-blue-200 px-2.5 py-1 border-r" style={{borderColor: "rgba(255,255,255,0.15)"}}>
                      {MODE_LABEL[nextMovement.mode]}
                    </span>
                    <span className="text-[10px] font-semibold text-blue-200 px-2.5 py-1 flex items-center gap-1">
                      <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/>
                        <path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>
                      </svg>
                      {nextMovement._count.movementManifestEntries} pax
                    </span>
                  </div>
                </div>

                {/* Movement name */}
                <p className="text-[15px] font-semibold text-white mb-3 leading-snug">
                  {nextMovement.name}
                </p>

                {/* Stat columns: Meet · Departs · Duration */}
                <div className="flex items-start gap-4">
                  {(nextMovement.meetTime || nextMovement.meetLocation) ? (
                    <>
                      <div className="shrink-0">
                        <p className="text-[10px] font-semibold text-blue-300 uppercase tracking-wider mb-1">Meet</p>
                        <p className="text-[22px] font-semibold text-white leading-none">
                          {nextMovement.meetTime ? fmtTime(nextMovement.meetTime) : "—"}
                        </p>
                        {nextMovement.meetLocation && (
                          <p className="text-[11px] text-blue-300 mt-0.5">{nextMovement.meetLocation}</p>
                        )}
                      </div>
                      <div className="w-px self-stretch mt-1" style={{background: "rgba(255,255,255,0.15)"}} />
                    </>
                  ) : null}
                  <div className="shrink-0">
                    <p className="text-[10px] font-semibold text-blue-300 uppercase tracking-wider mb-1">Departs</p>
                    <p className="text-[22px] font-semibold text-white leading-none">
                      {fmtTime(nextMovement.departureTime)}
                    </p>
                    <p className="text-[11px] text-blue-300 mt-0.5">
                      {nextMovement.departureTime.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" })}
                    </p>
                  </div>
                  {fmtDuration(nextMovement.departureTime, nextMovement.arrivalTime) && (
                    <>
                      <div className="w-px self-stretch mt-1" style={{background: "rgba(255,255,255,0.15)"}} />
                      <div className="shrink-0">
                        <p className="text-[10px] font-semibold text-blue-300 uppercase tracking-wider mb-1">Duration</p>
                        <p className="text-[22px] font-semibold text-white leading-none">
                          {fmtDuration(nextMovement.departureTime, nextMovement.arrivalTime)}
                        </p>
                      </div>
                    </>
                  )}
                </div>
              </div>

              {/* ── White lower section ── */}
              <div className="bg-white px-4 pt-3 pb-3.5">
                {/* Route with inline times */}
                <div className="flex flex-col">
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full border-2 border-gray-400 bg-white shrink-0" />
                      <p className="text-sm text-gray-800">{nextMovement.departureLocation}</p>
                    </div>
                    <p className="text-xs text-gray-400 shrink-0">{fmtTime(nextMovement.departureTime)}</p>
                  </div>
                  <div className="flex gap-2 py-0.5 ml-[3px]">
                    <div className="w-px h-4 bg-gray-200 ml-[3px]" />
                  </div>
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full bg-gray-700 shrink-0" />
                      <p className="text-sm text-gray-800">{nextMovement.arrivalLocation}</p>
                    </div>
                    {nextMovement.arrivalTime && (
                      <p className="text-xs text-gray-400 shrink-0">{fmtTime(nextMovement.arrivalTime)}</p>
                    )}
                  </div>
                </div>

                {/* Notes */}
                {nextMovement.notes && (
                  <div className="mt-2.5 bg-amber-50 rounded-xl px-3 py-2">
                    <p className="text-xs text-amber-800 leading-relaxed">{nextMovement.notes}</p>
                  </div>
                )}
              </div>
            </Link>
          )}

          {/* ── Hotels ─────────────────────────────────────────────────── */}
          <div className="bg-white rounded-2xl p-4 shadow-sm">
            <div className="flex items-center gap-2 mb-3">
              <p className="text-sm font-semibold text-gray-800">Hotels</p>
              <div className="flex-1 h-px bg-blue-100" />
              <Link href="/hotels" className="text-xs text-[#0C2340] font-medium flex items-center gap-0.5">
                View all
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="9 18 15 12 9 6" />
                </svg>
              </Link>
            </div>
            {!currentEvent ? (
              <p className="text-gray-400 text-sm">No current event</p>
            ) : hotels.length === 0 ? (
              <p className="text-gray-400 text-sm">No hotels assigned yet</p>
            ) : (
              <ul className="divide-y divide-gray-50">
                {hotels.map((hotel) => (
                  <li key={hotel.id} className="py-2 first:pt-0 last:pb-0">
                    <Link
                      href={`/hotels/${hotel.id}`}
                      className="flex items-center justify-between gap-2 active:opacity-70"
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
                      <div className="flex items-center gap-1.5 shrink-0">
                        <span className="text-xs text-gray-500">
                          {hotel._count.hotelManifestEntries}{" "}
                          {hotel._count.hotelManifestEntries === 1 ? "guest" : "guests"}
                        </span>
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#D1D5DB" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                          <polyline points="9 18 15 12 9 6" />
                        </svg>
                      </div>
                    </Link>
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
