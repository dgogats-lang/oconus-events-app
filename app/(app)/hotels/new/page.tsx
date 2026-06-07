import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import HotelForm from "../HotelForm";

async function getEvents() {
  const trip = await db.trip.findFirst({ where: { isActive: true } });
  if (!trip) return [];
  return db.event.findMany({
    where: { tripId: trip.id },
    select: { id: true, name: true, city: true },
    orderBy: { date: "asc" },
  });
}

export default async function NewHotelPage() {
  await auth();
  const events = await getEvents();

  return <HotelForm events={events} backHref="/hotels" />;
}
