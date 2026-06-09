import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import Link from "next/link";
import DetailNavBar from "@/components/DetailNavBar";
// ─── helpers ──────────────────────────────────────────────────────────────────

function fmtTime(d: Date | null | undefined) {
  if (!d) return "—";
  return d.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });
}

function fmtDateHeading(d: Date, isToday: boolean) {
  const label = d.toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
  });
  return isToday ? `Today — ${label}` : label;
}

// ─── data fetching ────────────────────────────────────────────────────────────

// Returns a Date whose UTC value equals the current wall-clock time in the
// given IANA timezone. Used to compare against dumb-local stored times.
function localNow(timezone: string): Date {
  const s = new Date().toLocaleString("sv-SE", { timeZone: timezone });
  return new Date(s.replace(" ", "T") + ".000Z");
}

async function getAllArrivals(userId: string) {
  const { getActiveTripId } = await import("@/lib/getActiveTrip");
  const tripId = await getActiveTripId(userId);
  if (!tripId) return { trip: null, groups: [] };
  const trip = await db.trip.findUnique({ where: { id: tripId } });
  if (!trip) return { trip: null, groups: [] };

  // Get timezone from the earliest event (arrivals happen at trip start)
  const firstEvent = await db.event.findFirst({
    where: { tripId: trip.id },
    orderBy: { date: "asc" },
    select: { timezone: true },
  });
  const todayStr = localNow(firstEvent?.timezone ?? "UTC").toDateString();

  const arrivals = await db.attendee.findMany({
    where: {
      tripId: trip.id,
      arrivalScheduledAt: { not: null },
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
  });

  // Group by calendar date
  const map = new Map<string, typeof arrivals>();
  for (const a of arrivals) {
    const key = a.arrivalScheduledAt!.toDateString();
    if (!map.has(key)) map.set(key, []);
    map.get(key)!.push(a);
  }

  const groups = Array.from(map.entries()).map(([dateStr, items]) => ({
    date: new Date(dateStr),
    isToday: dateStr === todayStr,
    items,
  }));

  return { trip, groups };
}

// ─── page ─────────────────────────────────────────────────────────────────────

export default async function ArrivalsPage() {
  const session = await auth();
  if (!session?.user?.id) return null;
  const { trip, groups } = await getAllArrivals(session.user.id);

  return (
    <div className="pb-24">
      <DetailNavBar backHref="/today" backLabel="Today" />
      <div className="px-4 mt-4 mb-5">
        <h1 className="text-[30px] font-extrabold text-[#0C2340] tracking-tight leading-none">Arrivals</h1>
        {trip && (
          <p className="text-[10px] font-bold text-gray-400 tracking-widest uppercase mt-1.5">{trip.name}</p>
        )}
      </div>
      <div className="px-4 pb-24">
      {!trip || groups.length === 0 ? (
        <div className="bg-white rounded-2xl p-6 shadow-sm text-center">
          <p className="text-gray-400 text-sm">No arrival data loaded yet.</p>
        </div>
      ) : (
        <div className="space-y-5">
          {groups.map((group) => (
            <div key={group.date.toDateString()}>
              {/* Date heading */}
              <div className="flex items-center gap-2 mb-2">
                <p className={`text-xs font-semibold uppercase tracking-wide ${group.isToday ? "text-blue-700" : "text-gray-400"}`}>
                  {fmtDateHeading(group.date, group.isToday)}
                </p>
                <div className="flex-1 h-px bg-gray-100" />
                <span className="text-xs text-gray-400">
                  {group.items.length} {group.items.length === 1 ? "arrival" : "arrivals"}
                </span>
              </div>

              {/* Arrivals list */}
              <div className="bg-white rounded-2xl shadow-sm divide-y divide-gray-50">
                {group.items.map((a) => {
                  return (
                    <Link
                      key={a.id}
                      href={`/attendees/${a.id}`}
                      className="flex items-center gap-3 px-4 py-3 first:rounded-t-2xl last:rounded-b-2xl hover:bg-gray-50 active:bg-gray-100"
                    >
                      {/* Time */}
                      <div className="w-14 shrink-0 text-right">
                        <p className="text-sm font-semibold text-gray-800">
                          {fmtTime(a.arrivalScheduledAt)}
                        </p>
                      </div>

                      {/* Divider */}
                      <div className="w-px h-8 bg-gray-100 shrink-0" />

                      {/* Name + flight */}
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium text-gray-900 truncate">
                          {a.lastName}, {a.firstName}
                        </p>
                        <p className="text-xs text-gray-400 truncate">
                          {[a.arrivalAirline, a.arrivalFlightNumber]
                            .filter(Boolean)
                            .join(" ")}
                          {a.arrivalAirport ? ` · ${a.arrivalAirport}` : ""}
                        </p>
                      </div>

                      {/* Chevron */}
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#D1D5DB" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="shrink-0">
                        <polyline points="9 18 15 12 9 6" />
                      </svg>
                    </Link>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}
      </div>
    </div>
  );
}
