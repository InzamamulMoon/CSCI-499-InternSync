import { useState, useEffect, startTransition } from "react";
import { Link, useLocation } from "react-router-dom";
import AppNav from "../components/AppNav";
import type { InternshipMatch } from "../types";
import { fetchMatches, loadProfileFromApi } from "../lib/api";
import {
  profileReadyForMatching,
  storedProfileHasContent,
} from "../lib/profileStorage";
import { addMatchToToApply } from "../lib/kanbanStorage";

function scoreColor(score: number) {
  if (score > 80) return "bg-emerald-100 text-emerald-900 ring-1 ring-emerald-200";
  if (score >= 50) return "bg-cf-highlight text-amber-900 ring-1 ring-amber-200";
  return "bg-slate-100 text-slate-700 ring-1 ring-slate-200";
}

function MatchCardSkeleton() {
  return (
    <div className="cf-card flex animate-pulse flex-col p-4">
      <div className="mb-3 h-5 w-2/3 rounded bg-slate-200" />
      <div className="mb-2 h-4 w-1/2 rounded bg-slate-200" />
      <div className="mb-4 h-16 rounded bg-slate-100" />
      <div className="mt-auto h-8 rounded bg-slate-200" />
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
    <div className="cf-page">
      <AppNav
        title="Match dashboard"
        subtitle="Matches based on your saved profile"
      />

      <main className="mx-auto max-w-5xl p-4">
        {loading && (
          <>
            <p className="cf-alert-info mb-4">
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
          <p className="cf-alert-warn mb-4">
            No saved profile yet.{" "}
            <Link to="/profile" className="font-medium underline">
              Open Profile
            </Link>{" "}
            and click Save profile (stored in the database).
          </p>
        )}

        {needsTags && !loading && !noProfile && (
          <p className="cf-alert-warn mb-4">
            Add at least one tag under{" "}
            <strong>Languages</strong>, <strong>Courses</strong>, or{" "}
            <strong>Interests</strong> so we can score listings.{" "}
            <Link to="/profile" className="font-medium underline">
              Edit profile
            </Link>
          </p>
        )}

        {error && !loading && (
          <p className="cf-alert-error mb-4">
            {error} — is Flask running on{" "}
            <code className="rounded bg-red-100 px-1">127.0.0.1:5000</code> and
            PostgreSQL seeded?
          </p>
        )}

        {trackMessage && (
          <p className="cf-alert-success mb-4">{trackMessage}</p>
        )}

        {!loading && matches.length > 0 && (
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
            {matches.map((match: InternshipMatch, index: number) => (
              <div
                key={`${match.company}-${match.role}-${match.terms ?? ""}-${index}`}
                className="cf-card cf-card-accent flex flex-col p-4 transition-shadow hover:shadow-lg"
              >
                <div className="mb-3 flex justify-between gap-2">
                  <div className="min-w-0">
                    <h2 className="truncate text-lg font-bold text-cf-text">
                      {match.company}
                    </h2>
                    <p className="text-sm font-medium text-cf-primary">
                      {match.role}
                    </p>
                    {match.listing_tags && match.listing_tags.length > 0 ? (
                      <div
                        className="mt-2 flex flex-wrap gap-1"
                        title="Skills or stacks mentioned in the listing"
                      >
                        {match.listing_tags.map((tag, ti) => (
                          <span
                            key={`${tag}-${ti}`}
                            className="rounded-md bg-cf-highlight px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-amber-900"
                          >
                            {tag}
                          </span>
                        ))}
                      </div>
                    ) : null}
                    <p className="mt-1.5 text-sm text-cf-muted">{match.location}</p>
                    {(match.terms || match.age) && (
                      <p className="mt-1 text-xs text-slate-500">
                        {match.terms ? (
                          <span className="mr-3">
                            <span className="font-semibold">Season:</span>{" "}
                            {match.terms}
                          </span>
                        ) : null}
                        {match.age ? (
                          <span>
                            <span className="font-semibold">Posted:</span>{" "}
                            {match.age}
                          </span>
                        ) : null}
                      </p>
                    )}
                  </div>
                  <div
                    className={
                      "shrink-0 rounded-lg px-2 py-1 text-sm font-bold " +
                      scoreColor(match.score)
                    }
                  >
                    {match.score}%
                  </div>
                </div>
                <div className="mt-auto rounded-lg bg-slate-50 p-3 text-sm text-slate-700">
                  <div className="mb-1 text-xs font-semibold text-cf-muted">
                    Why this matched
                  </div>
                  {match.explanation.suggestion}
                </div>
                {match.application_links && match.application_links.length > 0 ? (
                  <div className="mt-3 border-t border-cf-border pt-3">
                    <div className="mb-1.5 text-xs font-semibold text-cf-muted">
                      Apply
                    </div>
                    <ul className="flex flex-col gap-1">
                      {match.application_links.slice(0, 3).map((url, li) => (
                        <li key={`${url}-${li}`}>
                          <a
                            href={url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="cf-link block truncate text-xs"
                          >
                            {url.replace(/^https?:\/\//, "").slice(0, 48)}
                            {url.length > 56 ? "…" : ""}
                          </a>
                        </li>
                      ))}
                    </ul>
                  </div>
                ) : null}
                <div className="mt-3 flex flex-wrap items-center gap-2 border-t border-cf-border pt-3">
                  <button
                    type="button"
                    disabled={tracking}
                    className="cf-btn-accent"
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
                  <Link to="/tracker" className="cf-link text-xs">
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
