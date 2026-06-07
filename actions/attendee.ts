"use server";

import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { revalidatePath } from "next/cache";

export async function updateAttendeeNotes(
  attendeeId: string,
  notes: string
): Promise<{ success: boolean; error?: string }> {
  const session = await auth();
  if (!session?.user?.email) {
    return { success: false, error: "Not authenticated" };
  }

  try {
    await db.attendee.update({
      where: { id: attendeeId },
      data: { notes },
    });
    revalidatePath(`/attendees/${attendeeId}`);
    return { success: true };
  } catch {
    return { success: false, error: "Failed to save notes" };
  }
}
