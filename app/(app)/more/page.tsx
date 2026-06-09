import { auth, signOut } from "@/lib/auth";
import Link from "next/link";
import TripSwitcher from "@/components/TripSwitcher";
import { getAccessibleTrips, getActiveTripId } from "@/lib/getActiveTrip";

const sections = [
  {
    href: "/trips",
    label: "Trips",
    description: "Manage trips and team members",
    icon: "🌍",
  },
  {
    href: "/events",
    label: "Events",
    description: "Summits and stops for this trip",
    icon: "📍",
  },
  {
    href: "/hotels",
    label: "Hotels",
    description: "Hotel assignments and rooming lists",
    icon: "🏨",
  },
  {
    href: "/arrivals",
    label: "Arrivals",
    description: "Inbound flight tracking board",
    icon: "✈️",
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
    <div className="px-4 pt-6 pb-24">
      <h1 className="text-xl font-semibold text-gray-900 mb-4">More</h1>

      {/* Trip switcher */}
      <TripSwitcher trips={trips} currentTripId={activeTripId} />

      <div className="bg-white rounded-2xl shadow-sm divide-y divide-gray-100">
        {sections.map((section) => (
          <Link
            key={section.href}
            href={section.href}
            className="flex items-center gap-4 px-4 py-4 active:bg-gray-50 transition-colors"
          >
            <span className="text-2xl w-8 text-center">{section.icon}</span>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-900">{section.label}</p>
              <p className="text-xs text-gray-400 truncate">{section.description}</p>
            </div>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#D1D5DB" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
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
        className="mt-4"
      >
        <button
          type="submit"
          className="w-full flex items-center gap-4 px-4 py-4 bg-white rounded-2xl shadow-sm active:bg-gray-50 transition-colors text-left"
        >
          <span className="text-2xl w-8 text-center">🚪</span>
          <p className="text-sm font-medium text-red-500">Sign Out</p>
        </button>
      </form>

      {session?.user?.email && (
        <p className="text-center text-xs text-gray-300 mt-3">{session.user.email}</p>
      )}
    </div>
  );
}
