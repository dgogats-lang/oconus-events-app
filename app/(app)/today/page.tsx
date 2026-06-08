import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import Link from "next/link";
import { FlightStatus } from "@prisma/client";
import { MovementCardStack, SerializedMovement } from "./MovementCardStack";

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

const STATUS_PILL: Record<FlightStatus, { label: string; className: string }> = {
  SCHEDULED: { label: "Scheduled", className: "bg-gray-100 text-gray-500" },
  ON_TIME:   { label: "On Time",   className: "bg-green-50 text-green-700" },
  DELAYED:   { label: "Delayed",   className: "bg-amber-50 text-amber-700" },
  LANDED:    { label: "Landed",    className: "bg-blue-50 text-blue-700" },
  CANCELLED: { label: "Cancelled", className: "bg-red-50 text-red-600" },
};

// ─── data fetching ───────────────────────────────────────────────────────────

async function getTodayData() {
  // 1. Active trip — fetched first so we can determine the event timezone
  //    before computing "today". Vercel runs in UTC; we must use localNow()
  //    so that "today" reflects wall-clock time at the event location.
  const trip = await db.trip.findFirst({
    where: { isActive: true },
    include: {
      events: { orderBy: { date: "asc" } },
    },
  });

  if (!trip) return { trip: null };

  // 2. Bootstrap timezone via a two-pass approach:
  //    Approximate currentEvent with UTC first → get its timezone →
  //    recompute "now" as dumb-local wall-clock for that timezone.
  const utcNow = new Date();
  const approxEvent =
    trip.events.find(
      (e) => e.date >= startOfDay(utcNow) && e.date <= endOfDay(utcNow)
    ) ??
    trip.events.find((e) => e.date > utcNow) ??
    trip.events[trip.events.length - 1] ??
    null;
  const timezone = approxEvent?.timezone ?? "UTC";
  const now = localNow(timezone);
  const todayStart = startOfDay(now);
  const todayEnd = endOfDay(now);

  // 3. Current event: prefer today (local), else nearest future, else most recent past
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

  // 6. Upcoming movements for current event (next 5).
  // Each movement carries its own timezone (departure city), so we fetch all
  // movements for the event and filter in JS using localNow(movement.timezone).
  // This correctly handles cross-timezone flights where the departure city
  // differs from the event city.
  const upcomingMovements = currentEvent
    ? (await db.movement.findMany({
        where: { eventId: currentEvent.id },
        include: {
          _count: { select: { movementManifestEntries: true } },
        },
        orderBy: { departureTime: "asc" },
      }))
        .filter((m) => m.departureTime >= localNow(m.timezone ?? currentEvent.timezone))
        .slice(0, 5)
    : [];

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
    upcomingMovements,
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
    upcomingMovements,
    hotels,
  } = await getTodayData();

  // Serialize Date objects for the client component
  const serializedMovements: SerializedMovement[] = (upcomingMovements ?? []).map((m) => ({
    id: m.id,
    name: m.name,
    mode: m.mode,
    departureTime: m.departureTime.toISOString(),
    arrivalTime: m.arrivalTime?.toISOString() ?? null,
    departureLocation: m.departureLocation,
    arrivalLocation: m.arrivalLocation,
    meetTime: m.meetTime?.toISOString() ?? null,
    meetLocation: m.meetLocation,
    notes: m.notes,
    paxCount: m._count.movementManifestEntries,
  }));

  // Use the event's local "today" for the header date display (Vercel runs in UTC)
  const today = localNow(currentEvent?.timezone ?? "UTC");

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

          {/* ── Movements card stack ────────────────────────────────────── */}
          {!currentEvent || serializedMovements.length === 0 ? (
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
            <MovementCardStack movements={serializedMovements} />
          )}

          {/* ── Hotels ─────────────────────────────────────────────────── */}
          <div className="rounded-2xl shadow-sm overflow-hidden">
            {/* Dark header */}
            <div className="bg-[#0C2340] px-4 pt-3.5 pb-3">
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-semibold text-blue-300 uppercase tracking-wider">
                  Hotels
                </span>
                <div className="flex-1" />
                <Link href="/hotels" className="flex items-center gap-1 text-[11px] text-blue-300">
                  <span>View all</span>
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="9 18 15 12 9 6" />
                  </svg>
                </Link>
              </div>
            </div>

            {/* White lower section */}
            <div className="bg-white px-4 pt-2 pb-3">
              {!currentEvent ? (
                <p className="text-gray-400 text-sm py-2">No current event</p>
              ) : hotels.length === 0 ? (
                <p className="text-gray-400 text-sm py-2">No hotels assigned yet</p>
              ) : (
                <ul className="divide-y divide-gray-50">
                  {hotels.map((hotel) => (
                    <li key={hotel.id} className="py-2 first:pt-2 last:pb-0">
                      <Link
                        href={`/hotels/${hotel.id}`}
                        className="flex items-center justify-between gap-2 active:opacity-70"
                      >
                        <p className="text-sm font-medium text-gray-800 truncate">
                          {hotel.name}
                        </p>
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
        </div>
      )}
    </div>
  );
}
