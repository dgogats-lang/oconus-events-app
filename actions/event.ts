"use server";

import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { revalidatePath } from "next/cache";

async function requireAdmin() {
  const session = await auth();
  if (!session?.user?.email) return null;
  const user = await db.user.findUnique({
    where: { email: session.user.email },
    select: { role: true },
  });
  return user?.role === "ADMIN" ? session : null;
}

export async function createEvent(data: {
  name: string;
  city: string;
  country: string;
  date: string;
  timezone: string;
}): Promise<{ success: boolean; id?: string; error?: string }> {
  const session = await requireAdmin();
  if (!session) return { success: false, error: "Admin only" };

  try {
    const trip = await db.trip.findFirst({ where: { isActive: true }, select: { id: true } });
    if (!trip) return { success: false, error: "No active trip" };

    const event = await db.event.create({
      data: {
        tripId: trip.id,
        name: data.name.trim(),
        city: data.city.trim(),
        country: data.country.trim(),
        date: new Date(data.date + "T12:00:00.000Z"),
        timezone: data.timezone,
      },
    });

    revalidatePath("/events");
    return { success: true, id: event.id };
  } catch (e) {
    console.error(e);
    return { success: false, error: "Failed to create event" };
  }
}

export async function updateEvent(
  id: string,
  data: {
    name: string;
    city: string;
    country: string;
    date: string;
    timezone: string;
  }
): Promise<{ success: boolean; error?: string }> {
  const session = await requireAdmin();
  if (!session) return { success: false, error: "Admin only" };

  try {
    await db.event.update({
      where: { id },
      data: {
        name: data.name.trim(),
        city: data.city.trim(),
        country: data.country.trim(),
        date: new Date(data.date + "T12:00:00.000Z"),
        timezone: data.timezone,
      },
    });

    revalidatePath("/events");
    revalidatePath(`/events/${id}`);
    return { success: true };
  } catch (e) {
    console.error(e);
    return { success: false, error: "Failed to update event" };
  }
}
