import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import Link from "next/link";
import MovementForm from "../MovementForm";

async function getActiveEvents(userId: string) {
  const { getActiveTripId } = await import("@/lib/getActiveTrip");
  const tripId = await getActiveTripId(userId);
  if (!tripId) return [];
  const events = await db.event.findMany({
    where: { tripId },
    orderBy: { date: "asc" },
    select: { id: true, name: true, city: true, timezone: true },
  });
  return events;
}

export default async function NewMovementPage() {
  const session = await auth();
  if (!session?.user?.id) return null;
  const events = await getActiveEvents(session.user.id);

  if (events.length === 0) {
    return (
      <div className="px-4 pt-6">
        <div className="flex items-center gap-2 mb-6">
          <Link href="/movements" className="inline-flex items-center gap-1 text-sm font-medium text-[#0C2340]">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="15 18 9 12 15 6" />
            </svg>
            Movements
          </Link>
        </div>
        <div className="bg-white rounded-2xl shadow-sm px-4 py-8 text-center">
          <p className="text-gray-500 text-sm">No active trip or events found.</p>
          <p className="text-gray-300 text-xs mt-1">An Admin needs to set up an active trip first.</p>
        </div>
      </div>
    );
  }

  return <MovementForm events={events} backHref="/movements" />;
}
