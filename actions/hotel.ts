"use server";

import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { revalidatePath } from "next/cache";

export async function createHotel(data: {
  eventId: string;
  name: string;
  address?: string | null;
  phone?: string | null;
  notes?: string | null;
}): Promise<{ success: boolean; id?: string; error?: string }> {
  const session = await auth();
  if (!session?.user?.email) return { success: false, error: "Not authenticated" };
  try {
    const hotel = await db.hotel.create({
      data: {
        eventId: data.eventId,
        name: data.name.trim(),
        address: data.address?.trim() || null,
        phone: data.phone?.trim() || null,
        notes: data.notes?.trim() || null,
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
    eventId: string;
    name: string;
    address?: string | null;
    phone?: string | null;
    notes?: string | null;
  }
): Promise<{ success: boolean; error?: string }> {
  const session = await auth();
  if (!session?.user?.email) return { success: false, error: "Not authenticated" };
  try {
    await db.hotel.update({
      where: { id },
      data: {
        eventId: data.eventId,
        name: data.name.trim(),
        address: data.address?.trim() || null,
        phone: data.phone?.trim() || null,
        notes: data.notes?.trim() || null,
      },
    });
    revalidatePath("/hotels");
    revalidatePath(`/hotels/${id}`);
    return { success: true };
  } catch {
    return { success: false, error: "Failed to update hotel" };
  }
}
