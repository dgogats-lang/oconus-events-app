import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import Link from "next/link";
import PageHeader from "@/components/PageHeader";

async function getEventsData() {
  const trip = await db.trip.findFirst({
    where: { isActive: true },
    include: {
      events: {
        orderBy: { date: "asc" },
        include: {
          _count: {
            select: { eventRegistrations: true },
          },
          hotels: {
            select: { id: true },
          },
        },
      },
    },
  });
  return trip;
}

function fmtDate(d: Date) {
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

export default async function EventsPage() {
  const session = await auth();
  if (!session) return null;

  const trip = await getEventsData();
  if (!trip) {
    return (
      <div className="px-4 pt-6">
        <p className="text-sm text-gray-400">No active trip found.</p>
      </div>
    );
  }

  return (
    <div className="px-4 pt-6 pb-24">
      <PageHeader
        title="Events"
        eyebrow={trip.name.toUpperCase()}
        backHref="/more"
        backLabel="More"
      />

      <div className="bg-white rounded-2xl shadow-sm divide-y divide-gray-100">
        {trip.events.map((event) => (
          <Link
            key={event.id}
            href={`/events/${event.id}`}
            className="flex items-center gap-4 px-4 py-4 active:bg-gray-50 transition-colors"
          >
            {/* Date badge */}
            <div className="w-12 flex-shrink-0 text-center">
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                {fmtDate(event.date).split(" ")[0]}
              </p>
              <p className="text-xl font-extrabold text-brand-navy leading-none">
                {fmtDate(event.date).split(" ")[1]}
              </p>
            </div>

            {/* Event info */}
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-gray-900 truncate">{event.name}</p>
              <p className="text-xs text-gray-400 truncate">
                {event.city}, {event.country}
              </p>
            </div>

            {/* Stats */}
            <div className="flex items-center gap-3 flex-shrink-0">
              <div className="text-right">
                <p className="text-sm font-bold text-brand-navy">
                  {event._count.eventRegistrations}
                </p>
                <p className="text-[10px] text-gray-400">attendees</p>
              </div>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#D1D5DB" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="9 18 15 12 9 6" />
              </svg>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
