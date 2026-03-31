import { Link } from "react-router-dom";

export default function KanbanTracker() {
  return (
    <div className="min-h-screen bg-white p-4">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
        <h1 className="text-xl font-bold text-gray-900">Application pipeline</h1>
        <Link to="/" className="text-sm text-blue-700 underline hover:text-blue-900">
          Back to matches
        </Link>
      </div>
      <p className="mb-4 text-sm text-gray-600">
        Static layout only — drag-and-drop comes later.
      </p>

      {/* 4 columns in a row (scroll sideways on small screens) */}
      <div className="flex gap-4 overflow-x-auto pb-2">
        <div className="w-72 shrink-0 rounded-lg bg-gray-100 p-3">
          <h2 className="mb-3 border-b border-gray-300 pb-2 text-sm font-bold text-gray-800">
            To Apply
          </h2>
          <div className="space-y-2">
            <div className="rounded border border-gray-200 bg-white p-2 shadow-sm">
              <div className="text-sm font-semibold text-gray-900">Google</div>
              <div className="text-xs text-gray-600">
                Software Engineering Intern, Core Infrastructure
              </div>
            </div>
            <div className="rounded border border-gray-200 bg-white p-2 shadow-sm">
              <div className="text-sm font-semibold text-gray-900">Netflix</div>
              <div className="text-xs text-gray-600">Summer Intern, ML Platform</div>
            </div>
            <div className="rounded border border-gray-200 bg-white p-2 shadow-sm">
              <div className="text-sm font-semibold text-gray-900">Helio Labs</div>
              <div className="text-xs text-gray-600">
                Full-Stack Intern — Internship Matching Product
              </div>
            </div>
          </div>
        </div>

        <div className="w-72 shrink-0 rounded-lg bg-gray-100 p-3">
          <h2 className="mb-3 border-b border-gray-300 pb-2 text-sm font-bold text-gray-800">
            Applied
          </h2>
          <p className="text-xs text-gray-500">No cards yet</p>
        </div>

        <div className="w-72 shrink-0 rounded-lg bg-gray-100 p-3">
          <h2 className="mb-3 border-b border-gray-300 pb-2 text-sm font-bold text-gray-800">
            Interviewing
          </h2>
          <p className="text-xs text-gray-500">No cards yet</p>
        </div>

        <div className="w-72 shrink-0 rounded-lg bg-gray-100 p-3">
          <h2 className="mb-3 border-b border-gray-300 pb-2 text-sm font-bold text-gray-800">
            Offer
          </h2>
          <p className="text-xs text-gray-500">No cards yet</p>
        </div>
      </div>
    </div>
  );
}
