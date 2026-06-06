// TODO: Fetch attendees from db, wire up search

export default function AttendeesPage() {
  return (
    <div className="px-4 pt-6">
      <h1 className="text-xl font-semibold text-gray-900 mb-4">Attendees</h1>

      {/* Search bar */}
      <div className="relative mb-4">
        <input
          type="search"
          placeholder="Search by name..."
          className="w-full bg-white border border-gray-200 rounded-xl px-4 py-2.5 text-sm pr-10 focus:outline-none focus:ring-2 focus:ring-[#0C2340]"
        />
      </div>

      {/* Placeholder list */}
      <div className="bg-white rounded-2xl shadow-sm divide-y divide-gray-100">
        <div className="px-4 py-8 text-center">
          <p className="text-gray-400 text-sm">No attendees loaded yet.</p>
          <p className="text-gray-300 text-xs mt-1">Run the import script to load data.</p>
        </div>
      </div>
    </div>
  );
}
