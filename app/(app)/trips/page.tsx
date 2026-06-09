import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import Link from "next/link";
import PageHeader from "@/components/PageHeader";
import Pill from "@/components/Pill";
import { getAccessibleTrips, getActiveTripId } from "@/lib/getActiveTrip";

function fmtDateRange(start: Date, end: Date) {
  const opts: Intl.DateTimeFormatOptions = { month: "short", day: "numeric" };
  return `${start.toLocaleDateString("en-US", opts)} – ${end.toLocaleDateString("en-US", { ...opts, year: "numeric" })}`;
}

export default async function TripsPage() {
  const session = await auth();
  if (!session?.user?.id) return null;

  const [trips, activeTripId, dbUser] = await Promise.all([
    getAccessibleTrips(session.user.id),
    getActiveTripId(session.user.id),
    db.user.findUnique({
      where: { id: session.user.id },
      select: { role: true },
    }),
  ]);

  const canCreate = dbUser?.role === "ADMIN" || dbUser?.role === "SUPER_ADMIN";

  return (
    <div className="px-4 pt-6 pb-24">
      <PageHeader
        title="Trips"
        eyebrow="MORE"
        backHref="/more"
        backLabel="More"
        action={
          canCreate ? (
            <Pill variant="secondary" icon href="/trips/new">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                <line x1="12" y1="5" x2="12" y2="19" />
                <line x1="5" y1="12" x2="19" y2="12" />
              </svg>
            </Pill>
          ) : undefined
        }
      />

      {trips.length === 0 ? (
        <div className="bg-white rounded-2xl shadow-sm px-4 py-8 text-center">
          <p className="text-gray-400 text-sm">No trips yet.</p>
          {canCreate && (
            <Link href="/trips/new" className="mt-3 inline-block text-sm font-semibold text-brand-navy">
              Create your first trip →
            </Link>
          )}
        </div>
      ) : (
        <div className="bg-white rounded-2xl shadow-sm divide-y divide-gray-100">
          {trips.map((trip) => (
            <Link
              key={trip.id}
              href={`/trips/${trip.id}`}
              className="flex items-center gap-4 px-4 py-4 active:bg-gray-50 transition-colors"
            >
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <p className="text-sm font-semibold text-gray-900 truncate">{trip.name}</p>
                  {trip.id === activeTripId && (
                    <span className="text-[10px] font-bold text-white bg-brand-navy rounded-full px-2 py-0.5 uppercase tracking-wide flex-shrink-0">
                      Active
                    </span>
                  )}
                </div>
                <p className="text-xs text-gray-400 mt-0.5">
                  {fmtDateRange(trip.startDate, trip.endDate)}
                </p>
              </div>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#D1D5DB" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="9 18 15 12 9 6" />
              </svg>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
