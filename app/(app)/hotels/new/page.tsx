import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { notFound } from "next/navigation";
import HotelForm from "../HotelForm";

async function getTripAndEvents(userId: string) {
  const { getActiveTripId } = await import("@/lib/getActiveTrip");
  const tripId = await getActiveTripId(userId);
  if (!tripId) return null;
  const [trip, events] = await Promise.all([
    db.trip.findUnique({ where: { id: tripId } }),
    db.event.findMany({
      where: { tripId },
      select: { id: true, name: true, city: true },
      orderBy: { date: "asc" },
    }),
  ]);
  if (!trip) return null;
  return { trip, events };
}

export default async function NewHotelPage() {
  const session = await auth();
  if (!session?.user?.id) return null;
  const data = await getTripAndEvents(session.user.id);
  if (!data) notFound();

  return <HotelForm events={data.events} tripId={data.trip.id} backHref="/hotels" />;
}
