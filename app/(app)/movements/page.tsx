// TODO: Fetch movements from db, wire up check-in

export default function MovementsPage() {
  return (
    <div className="px-4 pt-6">
      <h1 className="text-xl font-semibold text-gray-900 mb-4">Movements</h1>

      {/* Placeholder */}
      <div className="bg-white rounded-2xl shadow-sm">
        <div className="px-4 py-8 text-center">
          <p className="text-gray-400 text-sm">No movements yet.</p>
          <p className="text-gray-300 text-xs mt-1">Movements will appear here once data is imported.</p>
        </div>
      </div>
    </div>
  );
}
