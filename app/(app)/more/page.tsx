import Link from "next/link";

const sections = [
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

export default function MorePage() {
  return (
    <div className="px-4 pt-6">
      <h1 className="text-xl font-semibold text-gray-900 mb-4">More</h1>

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
    </div>
  );
}
