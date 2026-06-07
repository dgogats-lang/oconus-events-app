import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import Link from "next/link";

// ─── data fetching ────────────────────────────────────────────────────────────

async function getHotelsData() {
  const trip = await db.trip.findFirst({
    where: { isActive: true },
    include: {
      events: {
        orderBy: { date: "asc" },
        include: {
          hotels: {
            orderBy: { name: "asc" },
            include: {
              _count: { select: { hotelManifestEntries: true } },
            },
          },
        },
      },
    },
  });
  return trip;
}

function fmtDate(d: Date) {
  return d.toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
  });
}

// ─── component ────────────────────────────────────────────────────────────────

export default async function HotelsPage() {
  await auth();
  const trip = await getHotelsData();

  if (!trip) {
    return (
      <div className="px-4 pt-6">
        <h1 className="text-xl font-semibold text-gray-900 mb-4">Hotels</h1>
        <div className="bg-white rounded-2xl shadow-sm px-4 py-8 text-center">
          <p className="text-gray-400 text-sm">No active trip.</p>
        </div>
      </div>
    );
  }

  const hasAnyHotels = trip.events.some((e) => e.hotels.length > 0);

  return (
    <div className="pb-24">
      <div className="px-4 pt-6 pb-2">
        <div className="flex items-center gap-2 mb-0.5">
          <Link
            href="/more"
            className="inline-flex items-center gap-1 text-sm font-medium text-[#0C2340] bg-[#E8EDF2] rounded-full px-3 py-1.5"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="15 18 9 12 15 6" />
            </svg>
            More
          </Link>
        </div>
        <h1 className="text-xl font-semibold text-gray-900 mt-3">Hotels</h1>
        <p className="text-xs text-gray-400 mt-0.5">{trip.name}</p>
      </div>

      {!hasAnyHotels ? (
        <div className="mx-4 mt-2 bg-white rounded-2xl shadow-sm px-4 py-8 text-center">
          <p className="text-gray-400 text-sm">No hotels yet.</p>
          <p className="text-gray-300 text-xs mt-1">Hotels will appear here once data is imported.</p>
        </div>
      ) : (
        <div className="space-y-6 px-4 pt-2">
          {trip.events.map((event) => {
            if (event.hotels.length === 0) return null;
            return (
              <div key={event.id}>
                {/* Event section header */}
                <div className="flex items-center gap-2 mb-2">
                  <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                    {event.name}
                  </p>
                  <p className="text-xs text-gray-400">· {fmtDate(event.date)}</p>
                </div>

                {/* Hotel rows */}
                <div className="bg-white rounded-2xl shadow-sm overflow-hidden divide-y divide-gray-50">
                  {event.hotels.map((hotel) => {
                    const count = hotel._count.hotelManifestEntries;
                    return (
                      <Link
                        key={hotel.id}
                        href={`/hotels/${hotel.id}`}
                        className="flex items-center gap-3 px-4 py-4 hover:bg-gray-50 active:bg-gray-100"
                      >
                        {/* Icon */}
                        <div className="w-9 h-9 rounded-xl bg-indigo-50 flex items-center justify-center shrink-0 text-lg leading-none">
                          🏨
                        </div>

                        {/* Info */}
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-gray-900 truncate">
                            {hotel.name}
                          </p>
                          {hotel.address && (
                            <p className="text-xs text-gray-400 truncate mt-0.5">
                              {hotel.address}
                            </p>
                          )}
                        </div>

                        {/* Count + chevron */}
                        <div className="flex items-center gap-2 shrink-0">
                          <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-gray-100 text-gray-600">
                            {count} {count === 1 ? "guest" : "guests"}
                          </span>
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#D1D5DB" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
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
