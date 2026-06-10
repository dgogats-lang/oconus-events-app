import { auth, signOut } from "@/lib/auth";
import Link from "next/link";
import TripSwitcher from "@/components/TripSwitcher";
import { getAccessibleTrips, getActiveTripId } from "@/lib/getActiveTrip";
import { ReactNode } from "react";

interface Section {
  href: string;
  label: string;
  description: string;
  icon: ReactNode;
}

const sections: Section[] = [
  {
    href: "/trips",
    label: "Trips",
    description: "Manage trips and team members",
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#0C2340" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="10"/>
        <line x1="2" y1="12" x2="22" y2="12"/>
        <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/>
      </svg>
    ),
  },
  {
    href: "/events",
    label: "Events",
    description: "Summits and stops for this trip",
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#0C2340" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/>
        <circle cx="12" cy="10" r="3"/>
      </svg>
    ),
  },
  {
    href: "/hotels",
    label: "Hotels",
    description: "Hotel assignments and rooming lists",
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#0C2340" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
        <polyline points="9 22 9 12 15 12 15 22"/>
      </svg>
    ),
  },
  {
    href: "/arrivals",
    label: "Arrivals",
    description: "Inbound flight tracking board",
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#0C2340" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M17.8 19.2L16 11l3.5-3.5C21 6 21 4 19 2c-2-2-4-2-5.5-.5L10 5 1.8 6.2c-.5.1-.7.6-.4 1l4 4c.3.3.8.4 1.1.1L9 9.5l1.5 7.5-2 2 3 3 2-2z"/>
      </svg>
    ),
  },
];

export default async function MorePage() {
  const session = await auth();
  const userId = session?.user?.id ?? "";

  const [trips, activeTripId] = await Promise.all([
    getAccessibleTrips(userId),
    getActiveTripId(userId),
  ]);

  return (
    <div className="px-4 pt-6 pb-28">

      {/* Page title */}
      <h1 className="text-[30px] font-extrabold text-ink tracking-tight leading-none mb-5">
        More
      </h1>

      {/* Trip switcher */}
      <TripSwitcher trips={trips} currentTripId={activeTripId} />

      {/* Nav sections */}
      <div className="bg-surface-card rounded-card border border-line overflow-hidden divide-y divide-line-subtle mb-4">
        {sections.map((section) => (
          <Link
            key={section.href}
            href={section.href}
            className="flex items-center gap-4 px-4 py-4 active:bg-surface-raised transition-colors"
          >
            <div className="w-9 h-9 rounded-panel bg-surface-chip flex items-center justify-center flex-shrink-0">
              {section.icon}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-ink">{section.label}</p>
              <p className="text-xs text-ink-muted truncate">{section.description}</p>
            </div>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#CBD5E1" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="9 18 15 12 9 6" />
            </svg>
          </Link>
        ))}
      </div>

      {/* Sign out */}
      <form
        action={async () => {
          "use server";
          await signOut({ redirectTo: "/login" });
        }}
      >
        <button
          type="submit"
          className="w-full flex items-center gap-4 px-4 py-4 bg-surface-card rounded-card border border-line active:bg-surface-raised transition-colors text-left"
        >
          <div className="w-9 h-9 rounded-panel bg-brand-red/10 flex items-center justify-center flex-shrink-0">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#D92D27" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
              <polyline points="16 17 21 12 16 7"/>
              <line x1="21" y1="12" x2="9" y2="12"/>
            </svg>
          </div>
          <p className="text-sm font-medium text-brand-red">Sign out</p>
        </button>
      </form>

      {session?.user?.email && (
        <p className="text-center text-xs text-ink-muted mt-4">
          {session.user.email}
        </p>
      )}

    </div>
  );
}
