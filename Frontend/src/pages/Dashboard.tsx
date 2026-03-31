import { Link } from "react-router-dom";
import type { InternshipMatch } from "../types";
import { mockInternships } from "../lib/mockData";

// green = strong match, yellow = ok, gray/red-ish = weak
function scoreColor(score: number) {
  if (score > 80) return "bg-green-200 text-green-900";
  if (score >= 50) return "bg-yellow-200 text-yellow-900";
  return "bg-gray-300 text-gray-800";
}

export default function Dashboard() {
  return (
    <div className="min-h-screen bg-gray-100">
      <header className="border-b border-gray-200 bg-white p-4">
        <div className="mx-auto flex max-w-5xl flex-wrap items-center justify-between gap-3">
          <div>
            <div className="text-sm font-semibold text-blue-700">InternSync</div>
            <h1 className="text-xl font-bold text-gray-900">Match dashboard</h1>
            <p className="text-sm text-gray-600">Mock data from our API shape</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Link
              to="/tracker"
              className="rounded border border-gray-300 bg-white px-3 py-2 text-sm text-gray-800 hover:bg-gray-50"
            >
              Tracker
            </Link>
            <Link
              to="/profile"
              className="rounded bg-gray-900 px-3 py-2 text-sm text-white hover:bg-gray-800"
            >
              Edit profile
            </Link>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-5xl p-4">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          {mockInternships.map((match: InternshipMatch) => (
            <div
              key={match.company + match.role}
              className="flex flex-col rounded-lg border border-gray-200 bg-white p-4 shadow"
            >
              <div className="mb-3 flex justify-between gap-2">
                <div className="min-w-0">
                  <h2 className="truncate text-lg font-bold text-gray-900">
                    {match.company}
                  </h2>
                  <p className="text-sm font-medium text-blue-800">{match.role}</p>
                  <p className="text-sm text-gray-600">{match.location}</p>
                </div>
                <div
                  className={
                    "shrink-0 rounded px-2 py-1 text-sm font-bold " +
                    scoreColor(match.score)
                  }
                >
                  {match.score}%
                </div>
              </div>
              <div className="mt-auto rounded bg-gray-50 p-3 text-sm text-gray-700">
                <div className="mb-1 text-xs font-semibold text-gray-500">
                  Why this matched
                </div>
                {match.explanation.suggestion}
              </div>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}
