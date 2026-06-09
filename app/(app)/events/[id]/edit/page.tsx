import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { redirect, notFound } from "next/navigation";
import EventForm from "../../EventForm";

export default async function EditEventPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await auth();
  if (!session?.user?.email) redirect("/login");

  const dbUser = await db.user.findUnique({
    where: { email: session.user.email },
    select: { role: true },
  });
  if (dbUser?.role !== "ADMIN") redirect(`/events/${id}`);

  const event = await db.event.findUnique({
    where: { id },
    select: { name: true, city: true, country: true, date: true, timezone: true },
  });
  if (!event) notFound();

  const dateStr = event.date.toISOString().split("T")[0];

  return (
    <EventForm
      eventId={id}
      backHref={`/events/${id}`}
      initialValues={{
        name: event.name,
        city: event.city,
        country: event.country,
        date: dateStr,
        timezone: event.timezone,
      }}
    />
  );
}
