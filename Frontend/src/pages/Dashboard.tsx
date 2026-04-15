import { useState, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import type { InternshipMatch } from "../types";
import { fetchMatches } from "../lib/api";
import {
  readUserProfileFromStorage,
  profileReadyForMatching,
  storedProfileHasContent,
} from "../lib/profileStorage";

function scoreColor(score: number) {
  if (score > 80) return "bg-green-200 text-green-900";
  if (score >= 50) return "bg-yellow-200 text-yellow-900";
  return "bg-gray-300 text-gray-800";
}

export default function Dashboard() {
  const location = useLocation();
  const [matches, setMatches] = useState<InternshipMatch[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [noProfile, setNoProfile] = useState(false);
  const [needsTags, setNeedsTags] = useState(false);

  useEffect(() => {
    const profile = readUserProfileFromStorage();
    setError(null);
    setNeedsTags(false);
    setNoProfile(false);

    if (!profile || !storedProfileHasContent(profile)) {
      setNoProfile(true);
      setMatches([]);
      setLoading(false);
      return;
    }

    if (!profileReadyForMatching(profile)) {
      setNeedsTags(true);
      setMatches([]);
      setLoading(false);
      return;
    }

    setLoading(true);

    fetchMatches(profile)
      .then((results) => {
        setMatches(results);
      })
      .catch((err: unknown) => {
        setMatches([]);
        setError(err instanceof Error ? err.message : "Could not load matches");
      })
      .finally(() => {
        setLoading(false);
      });
  }, [location.key]);

  return (
    <div className="min-h-screen bg-gray-100">
      <header className="border-b border-gray-200 bg-white p-4">
        <div className="mx-auto flex max-w-5xl flex-wrap items-center justify-between gap-3">
          <div>
            <div className="text-sm font-semibold text-blue-700">InternSync</div>
            <h1 className="text-xl font-bold text-gray-900">Match dashboard</h1>
            <p className="text-sm text-gray-600">
              Live matches from your saved profile + backend /match
            </p>
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
        {loading && (
          <p className="mb-4 rounded border border-blue-200 bg-blue-50 p-3 text-sm text-blue-900">
            Scraping GitHub and analyzing matches…
          </p>
        )}

        {noProfile && !loading && (
          <p className="mb-4 rounded border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900">
            No saved profile yet.{" "}
            <Link to="/profile" className="font-medium underline">
              Open Profile
            </Link>{" "}
            and click Save profile first (runs on localStorage).
          </p>
        )}

        {needsTags && !loading && !noProfile && (
          <p className="mb-4 rounded border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900">
            Add at least one tag under{" "}
            <strong>Languages</strong>, <strong>Courses</strong>, or{" "}
            <strong>Interests</strong> so we can score listings (background alone
            is not enough for this MVP matcher).{" "}
            <Link to="/profile" className="font-medium underline">
              Edit profile
            </Link>
          </p>
        )}

        {error && !loading && (
          <p className="mb-4 rounded border border-red-200 bg-red-50 p-3 text-sm text-red-800">
            {error} — is the Flask backend running on{" "}
            <code className="rounded bg-red-100 px-1">127.0.0.1:5000</code>?
          </p>
        )}

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          {matches.map((match: InternshipMatch) => (
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
