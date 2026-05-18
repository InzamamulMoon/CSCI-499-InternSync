import { type KeyboardEvent, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import type { UserProfile } from "../types";
import { loadProfileFromApi, saveProfileToApi } from "../lib/api";
import { emptyUserProfile } from "../lib/profileStorage";

function mergeUnique(existing: string[], incoming: string[]) {
  const seen = new Set(existing.map((t) => t.toLowerCase()));
  const out = [...existing];
  for (const t of incoming) {
    const key = t.toLowerCase();
    if (!seen.has(key)) {
      seen.add(key);
      out.push(t);
    }
  }
  return out;
}

export default function Profile() {
  const [profile, setProfile] = useState<UserProfile>(emptyUserProfile);
  const [langInput, setLangInput] = useState("");
  const [courseInput, setCourseInput] = useState("");
  const [interestInput, setInterestInput] = useState("");
  const [saveNotice, setSaveNotice] = useState<"ok" | "err" | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadProfileFromApi()
      .then((p) => {
        if (p) {
          const { kanban_board: _k, ...rest } = p;
          setProfile(rest);
        }
      })
      .catch((err: unknown) => {
        setLoadError(
          err instanceof Error ? err.message : "Could not load profile",
        );
      })
      .finally(() => setLoading(false));
  }, []);

  function addTags(
    raw: string,
    field: "languages" | "courses" | "interests",
    setInput: (v: string) => void,
  ) {
    const parts = raw
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);
    if (parts.length === 0) return;
    setProfile((p) => ({
      ...p,
      [field]: mergeUnique(p[field], parts),
    }));
    setInput("");
  }

  function onTagKeyDown(
    e: KeyboardEvent<HTMLInputElement>,
    raw: string,
    field: "languages" | "courses" | "interests",
    current: string[],
    setInput: (v: string) => void,
  ) {
    if (e.key === "Enter" || e.key === ",") {
      e.preventDefault();
      addTags(raw, field, setInput);
    }
    if (e.key === "Backspace" && raw === "" && current.length > 0) {
      setProfile((p) => ({
        ...p,
        [field]: p[field].slice(0, -1),
      }));
    }
  }

  async function handleSave() {
    setSaveNotice(null);
    const toSave: UserProfile = {
      languages: profile.languages,
      courses: profile.courses,
      interests: profile.interests,
      unique_background: profile.unique_background.trim(),
    };
    setSaving(true);
    try {
      await saveProfileToApi(toSave);
      setProfile(toSave);
      setSaveNotice("ok");
    } catch {
      setSaveNotice("err");
    } finally {
      setSaving(false);
    }
  }

  const { languages, courses, interests, unique_background } = profile;

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-100 p-4">
        <p className="text-sm text-gray-600">Loading profile from server…</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 p-4">
      <div className="mx-auto max-w-xl">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
          <div>
            <h1 className="mb-1 text-2xl font-bold text-gray-900">InternSync</h1>
            <p className="text-sm text-gray-600">Your profile (for matching)</p>
          </div>
          <Link
            to="/"
            className="text-sm font-medium text-blue-700 underline hover:text-blue-900"
          >
            ← Back to matches
          </Link>
        </div>

        {loadError && (
          <p className="mb-4 rounded border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900">
            {loadError} — is the backend running? See Backend/DEMO_SETUP.md
          </p>
        )}

        <div className="rounded-lg border border-gray-200 bg-white p-4 shadow">
          <div className="mb-6">
            <label className="mb-1 block text-sm font-medium text-gray-800">
              Languages (comma-separated tags)
            </label>
            <div className="mb-2 flex flex-wrap gap-2 rounded border border-gray-300 bg-gray-50 p-2">
              {languages.map((tag) => (
                <span
                  key={tag}
                  className="inline-flex items-center gap-1 rounded bg-white px-2 py-1 text-sm shadow-sm"
                >
                  {tag}
                  <button
                    type="button"
                    className="text-gray-500 hover:text-gray-800"
                    onClick={() =>
                      setProfile((p) => ({
                        ...p,
                        languages: p.languages.filter((t) => t !== tag),
                      }))
                    }
                  >
                    ×
                  </button>
                </span>
              ))}
              <input
                className="min-w-[8rem] flex-1 border-0 bg-transparent text-sm outline-none"
                value={langInput}
                onChange={(e) => setLangInput(e.target.value)}
                onKeyDown={(e) =>
                  onTagKeyDown(e, langInput, "languages", languages, setLangInput)
                }
                onBlur={() => addTags(langInput, "languages", setLangInput)}
                placeholder="e.g. Python, TypeScript"
              />
            </div>
          </div>

          <div className="mb-6">
            <label className="mb-1 block text-sm font-medium text-gray-800">
              Courses (comma-separated tags)
            </label>
            <div className="mb-2 flex flex-wrap gap-2 rounded border border-gray-300 bg-gray-50 p-2">
              {courses.map((tag) => (
                <span
                  key={tag}
                  className="inline-flex items-center gap-1 rounded bg-white px-2 py-1 text-sm shadow-sm"
                >
                  {tag}
                  <button
                    type="button"
                    className="text-gray-500 hover:text-gray-800"
                    onClick={() =>
                      setProfile((p) => ({
                        ...p,
                        courses: p.courses.filter((t) => t !== tag),
                      }))
                    }
                  >
                    ×
                  </button>
                </span>
              ))}
              <input
                className="min-w-[8rem] flex-1 border-0 bg-transparent text-sm outline-none"
                value={courseInput}
                onChange={(e) => setCourseInput(e.target.value)}
                onKeyDown={(e) =>
                  onTagKeyDown(e, courseInput, "courses", courses, setCourseInput)
                }
                onBlur={() => addTags(courseInput, "courses", setCourseInput)}
                placeholder="e.g. CSCI 335"
              />
            </div>
          </div>

          <div className="mb-6">
            <label className="mb-1 block text-sm font-medium text-gray-800">
              Interests (comma-separated tags)
            </label>
            <div className="mb-2 flex flex-wrap gap-2 rounded border border-gray-300 bg-gray-50 p-2">
              {interests.map((tag) => (
                <span
                  key={tag}
                  className="inline-flex items-center gap-1 rounded bg-white px-2 py-1 text-sm shadow-sm"
                >
                  {tag}
                  <button
                    type="button"
                    className="text-gray-500 hover:text-gray-800"
                    onClick={() =>
                      setProfile((p) => ({
                        ...p,
                        interests: p.interests.filter((t) => t !== tag),
                      }))
                    }
                  >
                    ×
                  </button>
                </span>
              ))}
              <input
                className="min-w-[8rem] flex-1 border-0 bg-transparent text-sm outline-none"
                value={interestInput}
                onChange={(e) => setInterestInput(e.target.value)}
                onKeyDown={(e) =>
                  onTagKeyDown(
                    e,
                    interestInput,
                    "interests",
                    interests,
                    setInterestInput,
                  )
                }
                onBlur={() =>
                  addTags(interestInput, "interests", setInterestInput)
                }
                placeholder="e.g. NLP, backend"
              />
            </div>
          </div>

          <div className="mb-6">
            <label
              htmlFor="unique-bg"
              className="mb-1 block text-sm font-medium text-gray-800"
            >
              Unique background & projects
            </label>
            <p className="mb-2 text-xs text-gray-500">
              Extra stuff for NLP / embeddings (projects, jobs, etc.)
            </p>
            <textarea
              id="unique-bg"
              rows={8}
              className="w-full rounded border border-gray-300 p-2 text-sm"
              value={unique_background}
              onChange={(e) =>
                setProfile((p) => ({
                  ...p,
                  unique_background: e.target.value,
                }))
              }
              placeholder="Write whatever helps describe you..."
            />
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={() => void handleSave()}
              disabled={saving}
              className="rounded bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-60"
            >
              {saving ? "Saving…" : "Save profile"}
            </button>
            <Link
              to="/"
              className="rounded border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-800 hover:bg-gray-50"
            >
              View your matches
            </Link>
          </div>

          {saveNotice === "ok" && (
            <p className="mt-3 rounded border border-green-200 bg-green-50 p-2 text-sm text-green-900">
              Profile saved to the database. Click <strong>View your matches</strong>{" "}
              to refresh listings (needs at least one language, course, or interest
              tag).
            </p>
          )}
          {saveNotice === "err" && (
            <p className="mt-3 rounded border border-red-200 bg-red-50 p-2 text-sm text-red-800">
              Could not save profile. Check that PostgreSQL and Flask are running.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
