import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import Link from "next/link";
import { MovementMode } from "@prisma/client";
import PageHeader from "@/components/PageHeader";

// ─── helpers ──────────────────────────────────────────────────────────────────

const MODE_ICON: Record<MovementMode, string> = {
  BUS:    "🚌",
  CAR:    "🚗",
  FLIGHT: "✈️",
  TRAIN:  "🚆",
  WALK:   "🚶",
  OTHER:  "🚐",
};

const MODE_LABEL: Record<MovementMode, string> = {
  BUS:    "Bus",
  CAR:    "Car",
  FLIGHT: "Flight",
  TRAIN:  "Train",
  WALK:   "Walk",
  OTHER:  "Transfer",
};

function fmtTime(d: Date) {
  return d.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });
}

function fmtDateShort(d: Date) {
  return d.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" });
}

// Returns a Date whose UTC value equals the current wall-clock time in the
// given IANA timezone. Used to compare against dumb-local stored times.
function localNow(timezone: string): Date {
  const s = new Date().toLocaleString("sv-SE", { timeZone: timezone });
  return new Date(s.replace(" ", "T") + ".000Z");
}

function isToday(d: Date, timezone: string) {
  const ln = localNow(timezone);
  return (
    d.getFullYear() === ln.getFullYear() &&
    d.getMonth() === ln.getMonth() &&
    d.getDate() === ln.getDate()
  );
}

function isPast(d: Date, timezone: string) {
  return d < localNow(timezone);
}

// ─── data fetching ────────────────────────────────────────────────────────────

async function getMovementsData(userId: string) {
  const { getActiveTripId } = await import("@/lib/getActiveTrip");
  const tripId = await getActiveTripId(userId);
  if (!tripId) return null;
  const trip = await db.trip.findUnique({
    where: { id: tripId },
    include: {
      events: {
        orderBy: { date: "asc" },
        include: {
          movements: {
            orderBy: { departureTime: "asc" },
            include: {
              movementManifestEntries: {
                select: { status: true },
              },
            },
          },
        },
      },
    },
  });

  return trip;
}

// ─── component ────────────────────────────────────────────────────────────────

export default async function MovementsPage() {
  const session = await auth();
  if (!session?.user?.id) return null;

  const trip = await getMovementsData(session.user.id);

  if (!trip) {
    return (
      <div className="px-4 pt-6">
        <PageHeader title="Movements" />
        <div className="bg-white rounded-2xl shadow-sm px-4 py-8 text-center">
          <p className="text-gray-400 text-sm">No active trip.</p>
        </div>
      </div>
    );
  }

  const hasAnyMovements = trip.events.some((e) => e.movements.length > 0);

  return (
    <div className="pb-24">
      <div className="px-4 pt-6 pb-2">
        <PageHeader
          eyebrow={trip.name}
          title="Movements"
          action={
            <Link
              href="/movements/new"
              className="flex items-center gap-1.5 text-sm font-bold text-white bg-[#0C2340] rounded-full px-4 py-1.5"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <line x1="12" y1="5" x2="12" y2="19" />
                <line x1="5" y1="12" x2="19" y2="12" />
              </svg>
              Add
            </Link>
          }
        />
      </div>

      {!hasAnyMovements ? (
        <div className="mx-4 bg-white rounded-2xl shadow-sm px-4 py-8 text-center">
          <p className="text-gray-400 text-sm">No movements yet.</p>
          <p className="text-gray-300 text-xs mt-1">Movements will appear here once data is imported.</p>
        </div>
      ) : (
        <div className="space-y-6 px-4 pt-2">
          {trip.events.map((event) => {
            if (event.movements.length === 0) return null;

            return (
              <div key={event.id}>
                {/* Event section header */}
                <div className="flex items-center gap-2 mb-2">
                  <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                    {event.name}
                  </p>
                  <p className="text-xs text-gray-400">
                    · {fmtDateShort(event.date)}
                  </p>
                </div>

                {/* Movement rows */}
                <div className="bg-white rounded-2xl shadow-sm overflow-hidden divide-y divide-gray-50">
                  {event.movements.map((movement) => {
                    const total = movement.movementManifestEntries.length;
                    const checkedIn = movement.movementManifestEntries.filter(
                      (e) => e.status === "CHECKED_IN"
                    ).length;
                    const allDone = total > 0 && checkedIn === total;
                    const departing = isPast(movement.departureTime, movement.timezone ?? event.timezone);
                    const todayMovement = isToday(movement.departureTime, movement.timezone ?? event.timezone);

                    return (
                      <Link
                        key={movement.id}
                        href={`/movements/${movement.id}`}
                        className="flex items-center gap-3 px-4 py-3.5 hover:bg-gray-50 active:bg-gray-100"
                      >
                        {/* Mode icon */}
                        <div className="w-9 h-9 rounded-xl bg-blue-50 flex items-center justify-center shrink-0 text-lg leading-none">
                          {MODE_ICON[movement.mode]}
                        </div>

                        {/* Main info */}
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-gray-900 truncate">
                            {movement.name}
                          </p>
                          <p className="text-xs text-gray-400 mt-0.5">
                            {MODE_LABEL[movement.mode]} · {fmtTime(movement.departureTime)}
                            {movement.arrivalTime
                              ? ` → ${fmtTime(movement.arrivalTime)}`
                              : ""}
                          </p>
                        </div>

                        {/* Right: count + chevron */}
                        <div className="flex items-center gap-2 shrink-0">
                          {total > 0 && (
                            <span
                              className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
                                allDone
                                  ? "bg-green-50 text-green-700"
                                  : todayMovement && !departing
                                  ? "bg-blue-50 text-blue-700"
                                  : "bg-gray-100 text-gray-600"
                              }`}
                            >
                              {checkedIn}/{total}
                            </span>
                          )}
                          {total === 0 && (
                            <span className="text-xs text-gray-300">Empty</span>
                          )}
                          <svg
                            width="16"
                            height="16"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2.5"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            className="text-gray-300"
                          >
                            <polyline points="9 18 15 12 9 6" />
                          </svg>
                        </div>
                      </Link>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
