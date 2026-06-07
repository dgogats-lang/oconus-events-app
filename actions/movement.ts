"use server";

import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { MovementEntryStatus } from "@prisma/client";
import { revalidatePath } from "next/cache";

export async function updateManifestEntry(
  movementId: string,
  attendeeId: string,
  status: MovementEntryStatus
): Promise<{ success: boolean; error?: string }> {
  const session = await auth();
  if (!session?.user?.email) {
    return { success: false, error: "Not authenticated" };
  }

  try {
    await db.movementManifestEntry.update({
      where: {
        movementId_attendeeId: { movementId, attendeeId },
      },
      data: {
        status,
        checkedInAt: status === "CHECKED_IN" ? new Date() : null,
      },
    });

    revalidatePath(`/movements/${movementId}`);
    revalidatePath("/movements");
    return { success: true };
  } catch {
    return { success: false, error: "Failed to update check-in status" };
  }
}
