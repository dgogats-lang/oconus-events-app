import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import Link from "next/link";
// ─── helpers ──────────────────────────────────────────────────────────────────

function fmtTime(d: Date | null | undefined) {
  if (!d) return "—";
  return d.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });
}

function fmtDateHeading(d: Date) {
  const today = new Date();
  const isToday = d.toDateString() === today.toDateString();
  const label = d.toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
  });
  return isToday ? `Today — ${label}` : label;
}

// ─── data fetching ────────────────────────────────────────────────────────────

async function getAllArrivals() {
  const trip = await db.trip.findFirst({ where: { isActive: true } });
  if (!trip) return { trip: null, groups: [] };

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
    isToday: dateStr === new Date().toDateString(),
    items,
  }));

  return { trip, groups };
}

// ─── page ─────────────────────────────────────────────────────────────────────

export default async function ArrivalsPage() {
  await auth();
  const { trip, groups } = await getAllArrivals();

  return (
    <div className="px-4 pt-4 pb-24">
      {/* Back nav */}
      <div className="mb-4">
        <Link
          href="/today"
          className="inline-flex items-center gap-1 text-sm text-[#0C2340] font-medium"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="15 18 9 12 15 6" />
          </svg>
          Today
        </Link>
      </div>

      <h1 className="text-xl font-semibold text-gray-900 mb-1">Arrivals</h1>
      {trip && (
        <p className="text-xs font-medium text-blue-700 mb-5">{trip.name}</p>
      )}

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
                  {fmtDateHeading(group.date)}
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
  );
}
