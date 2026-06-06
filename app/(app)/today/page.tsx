import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { MovementMode, FlightStatus, ArrivalDepartureType } from "@prisma/client";

// ─── helpers ────────────────────────────────────────────────────────────────

function startOfDay(d: Date) {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate(), 0, 0, 0, 0);
}
function endOfDay(d: Date) {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate(), 23, 59, 59, 999);
}

const MODE_LABEL: Record<MovementMode, string> = {
  BUS: "Bus",
  CAR: "Car",
  FLIGHT: "Flight",
  TRAIN: "Train",
  OTHER: "Transfer",
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

// ─── data fetching ───────────────────────────────────────────────────────────

async function getTodayData() {
  const now = new Date();

  // 1. Active trip
  const trip = await db.trip.findFirst({
    where: { isActive: true },
    include: {
      events: { orderBy: { date: "asc" } },
    },
  });

  if (!trip) return { trip: null };

  // 2. Current event: prefer today, else nearest (future first, then most recent past)
  const todayStart = startOfDay(now);
  const todayEnd = endOfDay(now);

  let currentEvent =
    trip.events.find(
      (e) => e.date >= todayStart && e.date <= todayEnd
    ) ??
    trip.events.find((e) => e.date > now) ?? // next upcoming
    trip.events[trip.events.length - 1] ??   // most recent past
    null;

  // 3. Today's arrivals for the active trip
  const todayArrivals = await db.arrivalDepartureRecord.findMany({
    where: {
      type: ArrivalDepartureType.ARRIVAL,
      attendee: { tripId: trip.id },
      scheduledTime: { gte: todayStart, lte: todayEnd },
    },
    include: {
      attendee: { select: { firstName: true, lastName: true } },
    },
    orderBy: { scheduledTime: "asc" },
  });

  // 4. Next movement for current event
  const nextMovement = currentEvent
    ? await db.movement.findFirst({
        where: {
          eventId: currentEvent.id,
          departureTime: { gte: now },
        },
        include: {
          _count: { select: { movementManifestEntries: true } },
        },
        orderBy: { departureTime: "asc" },
      })
    : null;

  // 5. Hotels for current event with attendee counts
  const hotels = currentEvent
    ? await db.hotel.findMany({
        where: { eventId: currentEvent.id },
        include: {
          _count: { select: { hotelManifestEntries: true } },
        },
        orderBy: { name: "asc" },
      })
    : [];

  return { trip, currentEvent, todayArrivals, nextMovement, hotels };
}

// ─── page ────────────────────────────────────────────────────────────────────

export default async function TodayPage() {
  const session = await auth();
  const { trip, currentEvent, todayArrivals, nextMovement, hotels } =
    await getTodayData();

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
          {/* ── Arrivals today ─────────────────────────────────────────── */}
          <div className="bg-white rounded-2xl p-4 shadow-sm">
            <div className="flex items-center justify-between mb-3">
              <p className="text-sm font-semibold text-gray-800">
                Arrivals today
              </p>
              {todayArrivals.length > 0 && (
                <span className="text-xs font-semibold text-gray-700">
                  {todayArrivals.length}{" "}
                  {todayArrivals.length === 1 ? "arrival" : "arrivals"}
                </span>
              )}
            </div>

            {todayArrivals.length === 0 ? (
              <p className="text-gray-400 text-sm">No arrivals scheduled today</p>
            ) : (
              <ul className="divide-y divide-gray-50">
                {todayArrivals.map((rec) => {
                  const pill = STATUS_PILL[rec.status];
                  return (
                    <li key={rec.id} className="py-2 first:pt-0 last:pb-0">
                      <div className="flex items-center justify-between gap-2">
                        <div className="min-w-0">
                          <p className="text-sm font-medium text-gray-800 truncate">
                            {rec.attendee.firstName} {rec.attendee.lastName}
                          </p>
                          <p className="text-xs text-gray-400">
                            {[rec.airline, rec.flightNumber]
                              .filter(Boolean)
                              .join(" ")}
                            {rec.airport ? ` · ${rec.airport}` : ""}
                            {rec.scheduledTime
                              ? ` · ${fmtTime(rec.scheduledTime)}`
                              : ""}
                          </p>
                        </div>
                        <span
                          className={`shrink-0 text-[10px] font-medium px-2 py-0.5 rounded-full ${pill.className}`}
                        >
                          {pill.label}
                        </span>
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>

          {/* ── Next movement ───────────────────────────────────────────── */}
          <div className="bg-white rounded-2xl p-4 shadow-sm">
            <p className="text-sm font-semibold text-gray-800 mb-3">
              Next movement
            </p>
            {!currentEvent ? (
              <p className="text-gray-400 text-sm">No current event</p>
            ) : !nextMovement ? (
              <p className="text-gray-400 text-sm">No upcoming movements</p>
            ) : (
              <div>
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-gray-800">
                      {nextMovement.name}
                    </p>
                    <p className="text-xs text-gray-500 mt-0.5">
                      {MODE_LABEL[nextMovement.mode]} ·{" "}
                      {nextMovement.departureLocation} →{" "}
                      {nextMovement.arrivalLocation}
                    </p>
                  </div>
                  <span className="shrink-0 text-[10px] font-medium px-2 py-0.5 rounded-full bg-blue-50 text-blue-700">
                    {MODE_LABEL[nextMovement.mode]}
                  </span>
                </div>
                <div className="flex items-center gap-4 mt-3 pt-3 border-t border-gray-50">
                  <div>
                    <p className="text-[10px] text-gray-400 uppercase tracking-wide">
                      Departs
                    </p>
                    <p className="text-sm font-medium text-gray-800">
                      {fmtDayTime(nextMovement.departureTime)}
                    </p>
                  </div>
                  <div className="ml-auto text-right">
                    <p className="text-[10px] text-gray-400 uppercase tracking-wide">
                      Pax
                    </p>
                    <p className="text-sm font-medium text-gray-800">
                      {nextMovement._count.movementManifestEntries}
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* ── Hotels ─────────────────────────────────────────────────── */}
          <div className="bg-white rounded-2xl p-4 shadow-sm">
            <p className="text-sm font-semibold text-gray-800 mb-3">
              Hotels
            </p>
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
