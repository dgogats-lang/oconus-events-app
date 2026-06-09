import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { redirect } from "next/navigation";
import EventForm from "../EventForm";

export default async function NewEventPage() {
  const session = await auth();
  if (!session?.user?.email) redirect("/login");

  const dbUser = await db.user.findUnique({
    where: { email: session.user.email },
    select: { role: true },
  });
  if (dbUser?.role !== "ADMIN") redirect("/events");

  return <EventForm backHref="/events" />;
}
