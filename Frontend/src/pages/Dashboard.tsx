import { useState, useEffect, startTransition } from "react";
import { Link, useLocation } from "react-router-dom";
import type { InternshipMatch } from "../types";
import { fetchMatches, loadProfileFromApi } from "../lib/api";
import {
  profileReadyForMatching,
  storedProfileHasContent,
} from "../lib/profileStorage";
import { addMatchToToApply } from "../lib/kanbanStorage";

function scoreColor(score: number) {
  if (score > 80) return "bg-green-200 text-green-900";
  if (score >= 50) return "bg-yellow-200 text-yellow-900";
  return "bg-gray-300 text-gray-800";
}

function MatchCardSkeleton() {
  return (
    <div className="flex animate-pulse flex-col rounded-lg border border-gray-200 bg-white p-4 shadow">
      <div className="mb-3 h-5 w-2/3 rounded bg-gray-200" />
      <div className="mb-2 h-4 w-1/2 rounded bg-gray-200" />
      <div className="mb-4 h-16 rounded bg-gray-100" />
      <div className="mt-auto h-8 rounded bg-gray-200" />
    </div>
  );
}

export default function Dashboard() {
  const location = useLocation();
  const [matches, setMatches] = useState<InternshipMatch[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [noProfile, setNoProfile] = useState(false);
  const [needsTags, setNeedsTags] = useState(false);
  const [trackMessage, setTrackMessage] = useState<string | null>(null);
  const [tracking, setTracking] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setLoading(true);
      setError(null);

      let profile;
      try {
        const payload = await loadProfileFromApi();
        profile = payload
          ? {
              languages: payload.languages,
              courses: payload.courses,
              interests: payload.interests,
              unique_background: payload.unique_background,
            }
          : null;
      } catch (err: unknown) {
        if (cancelled) return;
        startTransition(() => {
          setMatches([]);
          setError(
            err instanceof Error ? err.message : "Could not load profile",
          );
          setLoading(false);
        });
        return;
      }

      if (cancelled) return;

      if (!profile || !storedProfileHasContent(profile)) {
        startTransition(() => {
          setNeedsTags(false);
          setNoProfile(true);
          setMatches([]);
          setLoading(false);
        });
        return;
      }

      if (!profileReadyForMatching(profile)) {
        startTransition(() => {
          setNoProfile(false);
          setNeedsTags(true);
          setMatches([]);
          setLoading(false);
        });
        return;
      }

      startTransition(() => {
        setNoProfile(false);
        setNeedsTags(false);
      });

      try {
        const results = await fetchMatches(profile);
        if (cancelled) return;
        setMatches(results);
        if (results.length === 0) {
          setError(
            "No matches returned. Seed the database (see Backend/DEMO_SETUP.md).",
          );
        }
      } catch (err: unknown) {
        if (cancelled) return;
        setMatches([]);
        setError(err instanceof Error ? err.message : "Could not load matches");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    void load();
    return () => {
      cancelled = true;
    };
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
          <>
            <p className="mb-4 rounded border border-blue-200 bg-blue-50 p-3 text-sm text-blue-900">
              Loading profile and analyzing matches…
            </p>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
              {[1, 2, 3, 4, 5, 6].map((n) => (
                <MatchCardSkeleton key={n} />
              ))}
            </div>
          </>
        )}

        {noProfile && !loading && (
          <p className="mb-4 rounded border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900">
            No saved profile yet.{" "}
            <Link to="/profile" className="font-medium underline">
              Open Profile
            </Link>{" "}
            and click Save profile (stored in the database).
          </p>
        )}

        {needsTags && !loading && !noProfile && (
          <p className="mb-4 rounded border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900">
            Add at least one tag under{" "}
            <strong>Languages</strong>, <strong>Courses</strong>, or{" "}
            <strong>Interests</strong> so we can score listings.{" "}
            <Link to="/profile" className="font-medium underline">
              Edit profile
            </Link>
          </p>
        )}

        {error && !loading && (
          <p className="mb-4 rounded border border-red-200 bg-red-50 p-3 text-sm text-red-800">
            {error} — is Flask running on{" "}
            <code className="rounded bg-red-100 px-1">127.0.0.1:5000</code> and
            PostgreSQL seeded?
          </p>
        )}

        {trackMessage && (
          <p className="mb-4 rounded border border-green-200 bg-green-50 p-2 text-sm text-green-900">
            {trackMessage}
          </p>
        )}

        {!loading && matches.length > 0 && (
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
            {matches.map((match: InternshipMatch, index: number) => (
              <div
                key={`${match.company}-${match.role}-${match.terms ?? ""}-${index}`}
                className="flex flex-col rounded-lg border border-gray-200 bg-white p-4 shadow"
              >
                <div className="mb-3 flex justify-between gap-2">
                  <div className="min-w-0">
                    <h2 className="truncate text-lg font-bold text-gray-900">
                      {match.company}
                    </h2>
                    <p className="text-sm font-medium text-blue-800">{match.role}</p>
                    {match.listing_tags && match.listing_tags.length > 0 ? (
                      <div
                        className="mt-1.5 flex flex-wrap gap-1"
                        title="Skills or stacks mentioned in the listing"
                      >
                        {match.listing_tags.map((tag, ti) => (
                          <span
                            key={`${tag}-${ti}`}
                            className="rounded-md bg-indigo-50 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-indigo-900 ring-1 ring-indigo-100"
                          >
                            {tag}
                          </span>
                        ))}
                      </div>
                    ) : null}
                    <p className="mt-1.5 text-sm text-gray-600">{match.location}</p>
                    {(match.terms || match.age) && (
                      <p className="mt-1 text-xs text-gray-500">
                        {match.terms ? (
                          <span className="mr-3">
                            <span className="font-semibold text-gray-600">Season:</span>{" "}
                            {match.terms}
                          </span>
                        ) : null}
                        {match.age ? (
                          <span>
                            <span className="font-semibold text-gray-600">Posted:</span>{" "}
                            {match.age}
                          </span>
                        ) : null}
                      </p>
                    )}
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
                {match.application_links && match.application_links.length > 0 ? (
                  <div className="mt-3 border-t border-gray-100 pt-3">
                    <div className="mb-1.5 text-xs font-semibold text-gray-500">
                      Apply
                    </div>
                    <ul className="flex flex-col gap-1">
                      {match.application_links.slice(0, 3).map((url, li) => (
                        <li key={`${url}-${li}`}>
                          <a
                            href={url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="block truncate text-xs font-medium text-blue-700 underline hover:text-blue-900"
                          >
                            {url.replace(/^https?:\/\//, "").slice(0, 48)}
                            {url.length > 56 ? "…" : ""}
                          </a>
                        </li>
                      ))}
                    </ul>
                  </div>
                ) : null}
                <div className="mt-3 flex flex-wrap items-center gap-2 border-t border-gray-100 pt-3">
                  <button
                    type="button"
                    disabled={tracking}
                    className="rounded bg-gray-900 px-3 py-1.5 text-xs font-medium text-white hover:bg-gray-800 disabled:opacity-60"
                    onClick={() => {
                      setTracking(true);
                      void addMatchToToApply(match)
                        .then((added) => {
                          setTrackMessage(
                            added
                              ? "Added to Kanban → To Apply"
                              : "Already in To Apply",
                          );
                          window.setTimeout(() => setTrackMessage(null), 2600);
                        })
                        .finally(() => setTracking(false));
                    }}
                  >
                    Track application
                  </button>
                  <Link
                    to="/tracker"
                    className="text-xs font-medium text-blue-700 underline hover:text-blue-900"
                  >
                    Open tracker
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
