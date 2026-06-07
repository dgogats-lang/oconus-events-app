"use server";

import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { revalidatePath } from "next/cache";

export async function assignToHotel(
  hotelId: string,
  attendeeId: string
): Promise<{ success: boolean; error?: string }> {
  const session = await auth();
  if (!session?.user?.email) return { success: false, error: "Not authenticated" };
  try {
    await db.hotelManifestEntry.create({
      data: { hotelId, attendeeId },
    });
    revalidatePath(`/hotels/${hotelId}`);
    return { success: true };
  } catch (e: unknown) {
    // Unique constraint = already assigned
    if (e instanceof Error && e.message.includes("Unique constraint")) {
      return { success: false, error: "Already assigned to this hotel." };
    }
    return { success: false, error: "Failed to assign." };
  }
}

export async function removeFromHotel(
  hotelId: string,
  attendeeId: string
): Promise<{ success: boolean; error?: string }> {
  const session = await auth();
  if (!session?.user?.email) return { success: false, error: "Not authenticated" };
  try {
    await db.hotelManifestEntry.delete({
      where: { hotelId_attendeeId: { hotelId, attendeeId } },
    });
    revalidatePath(`/hotels/${hotelId}`);
    return { success: true };
  } catch {
    return { success: false, error: "Failed to remove." };
  }
}

export async function updateRoomNumber(
  hotelId: string,
  attendeeId: string,
  roomNumber: string | null
): Promise<{ success: boolean; error?: string }> {
  const session = await auth();
  if (!session?.user?.email) return { success: false, error: "Not authenticated" };
  try {
    await db.hotelManifestEntry.update({
      where: { hotelId_attendeeId: { hotelId, attendeeId } },
      data: { roomNumber: roomNumber?.trim() || null },
    });
    revalidatePath(`/hotels/${hotelId}`);
    return { success: true };
  } catch {
    return { success: false, error: "Failed to update room number." };
  }
}
