"use server";

import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { revalidatePath } from "next/cache";

export async function createHotel(data: {
  eventId?: string | null; // null for transit hotels
  tripId: string;          // always required — denormalized for easy querying
  name: string;
  address?: string | null;
  phone?: string | null;
  notes?: string | null;
}): Promise<{ success: boolean; id?: string; error?: string }> {
  const session = await auth();
  if (!session?.user?.email) return { success: false, error: "Not authenticated" };
  if (!data.eventId && !data.tripId) return { success: false, error: "Hotel must belong to an event or trip." };
  try {
    const hotel = await db.hotel.create({
      data: {
        eventId: data.eventId || null,
        tripId:  data.tripId,
        name:    data.name.trim(),
        address: data.address?.trim() || null,
        phone:   data.phone?.trim() || null,
        notes:   data.notes?.trim() || null,
      },
    });
    revalidatePath("/hotels");
    return { success: true, id: hotel.id };
  } catch {
    return { success: false, error: "Failed to create hotel" };
  }
}

export async function updateHotel(
  id: string,
  data: {
    eventId?: string | null;
    tripId: string;
    name: string;
    address?: string | null;
    phone?: string | null;
    notes?: string | null;
  }
): Promise<{ success: boolean; error?: string }> {
  const session = await auth();
  if (!session?.user?.email) return { success: false, error: "Not authenticated" };
  if (!data.eventId && !data.tripId) return { success: false, error: "Hotel must belong to an event or trip." };
  try {
    await db.hotel.update({
      where: { id },
      data: {
        eventId: data.eventId || null,
        tripId:  data.tripId,
        name:    data.name.trim(),
        address: data.address?.trim() || null,
        phone:   data.phone?.trim() || null,
        notes:   data.notes?.trim() || null,
      },
    });
    revalidatePath("/hotels");
    revalidatePath(`/hotels/${id}`);
    return { success: true };
  } catch {
    return { success: false, error: "Failed to update hotel" };
  }
}
