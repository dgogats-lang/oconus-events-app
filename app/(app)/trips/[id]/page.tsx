import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { notFound } from "next/navigation";
import Link from "next/link";
import DetailNavBar from "@/components/DetailNavBar";
import SectionCard from "@/components/SectionCard";
import InviteMemberForm from "./InviteMemberForm";
import RemoveMemberButton from "./RemoveMemberButton";

function fmtDateRange(start: Date, end: Date) {
  const opts: Intl.DateTimeFormatOptions = { month: "short", day: "numeric" };
  return `${start.toLocaleDateString("en-US", opts)} – ${end.toLocaleDateString("en-US", { ...opts, year: "numeric" })}`;
}

export default async function TripDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await auth();
  if (!session?.user?.id) return null;
  const { id } = await params;

  const [trip, dbUser] = await Promise.all([
    db.trip.findUnique({
      where: { id },
      include: {
        events: { orderBy: { date: "asc" }, select: { id: true, name: true, city: true } },
        memberships: {
          include: { user: { select: { id: true, name: true, email: true } } },
          orderBy: { createdAt: "asc" },
        },
        _count: { select: { attendees: true } },
      },
    }),
    db.user.findUnique({
      where: { id: session.user.id },
      select: { role: true },
    }),
  ]);

  if (!trip) notFound();

  const isSuperAdmin = dbUser?.role === "SUPER_ADMIN";
  const membership = trip.memberships.find((m) => m.userId === session.user.id);
  const isAdmin = isSuperAdmin || membership?.role === "ADMIN";

  // Non-super-admins must be a member to view
  if (!isSuperAdmin && !membership) notFound();

  return (
    <div className="pb-24">
      <DetailNavBar
        backHref="/trips"
        backLabel="Trips"
        action={
          isAdmin ? (
            <Link
              href={`/trips/${id}/edit`}
              className="inline-flex items-center justify-center w-9 h-9 rounded-full bg-[#E8EDF2]"
            >
              {/* Pencil + square icon */}
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#0C2340" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
              </svg>
            </Link>
          ) : undefined
        }
      />

      <div className="px-4 mt-4 mb-6">
        <p className="text-[10px] font-bold text-gray-400 tracking-widest uppercase mb-1">Trip</p>
        <h1 className="text-[28px] font-extrabold text-[#0C2340] tracking-tight leading-tight">
          {trip.name}
        </h1>
        <p className="text-sm text-gray-400 mt-1">{fmtDateRange(trip.startDate, trip.endDate)}</p>
        {trip.description && (
          <p className="text-sm text-gray-600 mt-1">{trip.description}</p>
        )}
      </div>

      <div className="px-4 space-y-4">
        {/* Stats */}
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-white rounded-2xl shadow-sm px-4 py-3">
            <p className="text-xl font-extrabold text-brand-navy">{trip.events.length}</p>
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-0.5">Events</p>
          </div>
          <div className="bg-white rounded-2xl shadow-sm px-4 py-3">
            <p className="text-xl font-extrabold text-brand-navy">{trip._count.attendees}</p>
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-0.5">Attendees</p>
          </div>
        </div>

        {/* Members */}
        <SectionCard title="Team Members">
          <div className="divide-y divide-gray-100">
            {trip.memberships.map((m) => (
              <div key={m.id} className="flex items-center gap-3 px-4 py-3">
                {/* Avatar */}
                <div className="w-8 h-8 rounded-full bg-[#0C2340] flex items-center justify-center flex-shrink-0">
                  <span className="text-white text-xs font-bold">
                    {(m.user.name ?? m.user.email).charAt(0).toUpperCase()}
                  </span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">
                    {m.user.name ?? m.user.email}
                  </p>
                  {m.user.name && (
                    <p className="text-xs text-gray-400 truncate">{m.user.email}</p>
                  )}
                </div>
                <span className={`text-[10px] font-bold uppercase tracking-wide px-2 py-0.5 rounded-full flex-shrink-0 ${
                  m.role === "ADMIN"
                    ? "bg-[#0C2340] text-white"
                    : "bg-gray-100 text-gray-500"
                }`}>
                  {m.role}
                </span>
                {isAdmin && m.userId !== session.user.id && (
                  <RemoveMemberButton tripId={id} userId={m.userId} />
                )}
              </div>
            ))}
          </div>

          {/* Invite form — admins only */}
          {isAdmin && (
            <div className="px-4 pt-3 pb-4 border-t border-gray-100">
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-3">
                Invite Member
              </p>
              <InviteMemberForm tripId={id} />
            </div>
          )}
        </SectionCard>
      </div>
    </div>
  );
}
