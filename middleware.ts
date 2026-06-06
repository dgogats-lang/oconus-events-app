import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

// Auth is enforced in app/(app)/layout.tsx — next-auth cannot run on the
// Edge Runtime (jose uses DecompressionStream, a Node.js-only API).
export function middleware(_request: NextRequest) {
  return NextResponse.next();
}

export const config = {
  matcher: [],
};
