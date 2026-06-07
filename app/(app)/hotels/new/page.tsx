import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { notFound } from "next/navigation";
import HotelForm from "../HotelForm";

async function getTripAndEvents() {
  const trip = await db.trip.findFirst({ where: { isActive: true } });
  if (!trip) return null;
  const events = await db.event.findMany({
    where: { tripId: trip.id },
    select: { id: true, name: true, city: true },
    orderBy: { date: "asc" },
  });
  return { trip, events };
}

export default async function NewHotelPage() {
  await auth();
  const data = await getTripAndEvents();
  if (!data) notFound();

  return <HotelForm events={data.events} tripId={data.trip.id} backHref="/hotels" />;
}
