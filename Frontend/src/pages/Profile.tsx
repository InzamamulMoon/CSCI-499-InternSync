import { type KeyboardEvent, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import AppNav from "../components/AppNav";
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

function TagField({
  label,
  placeholder,
  tags,
  input,
  setInput,
  onAdd,
  onRemove,
  onKeyDown,
}: {
  label: string;
  placeholder: string;
  tags: string[];
  input: string;
  setInput: (v: string) => void;
  onAdd: () => void;
  onRemove: (tag: string) => void;
  onKeyDown: (e: KeyboardEvent<HTMLInputElement>) => void;
}) {
  return (
    <div className="mb-6">
      <label className="mb-1 block text-sm font-medium text-cf-text">{label}</label>
      <div className="flex flex-wrap gap-2 rounded-lg border border-cf-border bg-slate-50/80 p-2">
        {tags.map((tag) => (
          <span key={tag} className="cf-tag">
            {tag}
            <button
              type="button"
              className="text-amber-700 hover:text-amber-950"
              onClick={() => onRemove(tag)}
            >
              ×
            </button>
          </span>
        ))}
        <input
          className="min-w-[8rem] flex-1 border-0 bg-transparent text-sm outline-none"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={onKeyDown}
          onBlur={onAdd}
          placeholder={placeholder}
        />
      </div>
    </div>
  );
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
      <div className="cf-page flex min-h-screen items-center justify-center p-4">
        <p className="text-sm text-cf-muted">Loading profile from server…</p>
      </div>
    );
  }

  return (
    <div className="cf-page">
      <AppNav
        title="Your profile"
        subtitle="Tags and background used for internship matching"
      />

      <main className="mx-auto max-w-xl p-4">
        {loadError && <p className="cf-alert-warn mb-4">{loadError}</p>}

        <div className="cf-card p-5">
          <TagField
            label="Languages (comma-separated tags)"
            placeholder="e.g. Python, TypeScript"
            tags={languages}
            input={langInput}
            setInput={setLangInput}
            onAdd={() => addTags(langInput, "languages", setLangInput)}
            onRemove={(tag) =>
              setProfile((p) => ({
                ...p,
                languages: p.languages.filter((t) => t !== tag),
              }))
            }
            onKeyDown={(e) =>
              onTagKeyDown(e, langInput, "languages", languages, setLangInput)
            }
          />

          <TagField
            label="Courses (comma-separated tags)"
            placeholder="e.g. CSCI 335"
            tags={courses}
            input={courseInput}
            setInput={setCourseInput}
            onAdd={() => addTags(courseInput, "courses", setCourseInput)}
            onRemove={(tag) =>
              setProfile((p) => ({
                ...p,
                courses: p.courses.filter((t) => t !== tag),
              }))
            }
            onKeyDown={(e) =>
              onTagKeyDown(e, courseInput, "courses", courses, setCourseInput)
            }
          />

          <TagField
            label="Interests (comma-separated tags)"
            placeholder="e.g. NLP, backend"
            tags={interests}
            input={interestInput}
            setInput={setInterestInput}
            onAdd={() => addTags(interestInput, "interests", setInterestInput)}
            onRemove={(tag) =>
              setProfile((p) => ({
                ...p,
                interests: p.interests.filter((t) => t !== tag),
              }))
            }
            onKeyDown={(e) =>
              onTagKeyDown(
                e,
                interestInput,
                "interests",
                interests,
                setInterestInput,
              )
            }
          />

          <div className="mb-6">
            <label
              htmlFor="unique-bg"
              className="mb-1 block text-sm font-medium text-cf-text"
            >
              Unique background & projects
            </label>
            <p className="mb-2 text-xs text-cf-muted">
              Extra stuff for NLP / embeddings (projects, jobs, etc.)
            </p>
            <textarea
              id="unique-bg"
              rows={8}
              className="cf-input"
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
              className="cf-btn-primary"
            >
              {saving ? "Saving…" : "Save profile"}
            </button>
            <Link to="/" className="cf-btn-secondary inline-block text-center">
              View your matches
            </Link>
          </div>

          {saveNotice === "ok" && (
            <p className="cf-alert-success mt-4">
              Profile saved to the database. Click <strong>View your matches</strong>{" "}
              to refresh listings (needs at least one language, course, or interest
              tag).
            </p>
          )}
          {saveNotice === "err" && (
            <p className="cf-alert-error mt-4">
              Could not save profile. Check that PostgreSQL and Flask are running.
            </p>
          )}
        </div>
      </main>
    </div>
  );
}
