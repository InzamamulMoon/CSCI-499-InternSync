import { type KeyboardEvent, useCallback, useState } from "react";
import type { UserProfile } from "../types";

//Have the functionality to add and remove tags
function TagField({
  id,
  label,
  description,
  tags,
  draft,
  onDraftChange,
  onAddTags,
  onRemoveTag,
}: {
  id: string;
  label: string;
  description: string;
  tags: string[];
  draft: string;
  onDraftChange: (value: string) => void;
  onAddTags: (values: string[]) => void;
  onRemoveTag: (value: string) => void;
}) {

  //use call back to commit the draft when user presses enter or comma
  const commitDraft = useCallback(() => {
    const parts = draft
      .split(",")

      //use map to trim the parts, filter empty parts and add tags
      .map((s) => s.trim())
      .filter(Boolean);
    if (parts.length) {
      onAddTags(parts);
      onDraftChange("");
    }
  }, [draft, onAddTags, onDraftChange]);

  //handle key down events
  const onKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" || e.key === ",") {
      e.preventDefault();
      commitDraft();
    }
    if (e.key === "Backspace" && !draft && tags.length) {
      onRemoveTag(tags[tags.length - 1]);
    }
  };

  //if the user clicks on the container, focus the input
  return (
    <div className="space-y-2">
      <div className="flex flex-col gap-0.5 sm:flex-row sm:items-baseline sm:justify-between">
        <label
          htmlFor={id}
          className="text-sm font-semibold tracking-tight text-slate-800"
        >
          {label}
        </label>
        <span className="text-xs font-medium text-slate-500">
          {description}
        </span>
      </div>
      <div
        className="flex min-h-[3rem] flex-wrap items-center gap-2 rounded-xl border border-slate-200 bg-slate-50/80 px-3 py-2 shadow-inner shadow-slate-200/40 transition focus-within:border-indigo-300 focus-within:bg-white focus-within:ring-2 focus-within:ring-indigo-500/20"
        onClick={() => document.getElementById(id)?.focus()}
        role="group"
        aria-label={label}
      >
        {tags.map((tag) => (
          <span
            key={tag}
            className="inline-flex items-center gap-1 rounded-lg bg-white px-2.5 py-1 text-sm font-medium text-slate-700 shadow-sm ring-1 ring-slate-200/80 transition hover:ring-slate-300"
          >
            {tag}
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onRemoveTag(tag);
              }}
              className="ml-0.5 rounded-md p-0.5 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
              aria-label={`Remove ${tag}`}
            >
              ×
            </button>
          </span>
        ))}
        <input
          id={id}
          type="text"
          value={draft}
          onChange={(e) => onDraftChange(e.target.value)}
          onKeyDown={onKeyDown}
          onBlur={commitDraft}
          placeholder="Type and press Enter or comma…"
          className="min-w-[12rem] flex-1 bg-transparent py-1 text-sm text-slate-800 outline-none placeholder:text-slate-400"
        />
      </div>
    </div>
  );
}

//unique tags should be added to the existing tags. not case sensitive
function mergeUnique(existing: string[], incoming: string[]) {
  const set = new Set(existing.map((t) => t.toLowerCase()));
  const next = [...existing];
  for (const t of incoming) {
    const k = t.toLowerCase();
    if (!set.has(k)) {
      set.add(k);
      next.push(t);
    }
  }
  return next;
}

//Profile Page component
export default function Profile() {
  const [languages, setLanguages] = useState<string[]>([]);
  const [courses, setCourses] = useState<string[]>([]);
  const [interests, setInterests] = useState<string[]>([]);
  const [langDraft, setLangDraft] = useState("");
  const [courseDraft, setCourseDraft] = useState("");
  const [interestDraft, setInterestDraft] = useState("");
  const [uniqueBackground, setUniqueBackground] = useState("");

  //save function to log profile
  const handleSave = () => {
    const profile: UserProfile = {
      languages,
      courses,
      interests,
      unique_background: uniqueBackground.trim(),
    };
    console.log("InternSync profile (mock save)", profile);
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-100 via-white to-slate-50 px-4 py-10 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-2xl">
        <header className="mb-8 text-center sm:text-left">
          <p className="text-xs font-semibold uppercase tracking-widest text-indigo-600">
            InternSync
          </p>
          <h1 className="mt-1 text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">
            Your technical profile
          </h1>
          <p className="mt-2 max-w-xl text-sm leading-relaxed text-slate-600">
            Capture languages, coursework, and interests as tags. The richer
            your narrative below, the better our NLP matcher can surface
            non-traditional strengths.
          </p>
        </header>

        <div className="rounded-2xl border border-slate-100 bg-white p-6 shadow-lg shadow-slate-200/60 ring-1 ring-slate-900/5 sm:p-8">
          <div className="space-y-8">
            <TagField
              id="profile-languages"
              label="Languages & frameworks"
              description="Comma-separated tags"
              tags={languages}
              draft={langDraft}
              onDraftChange={setLangDraft}
              onAddTags={(vals) => setLanguages((prev) => mergeUnique(prev, vals))}
              onRemoveTag={(tag) =>
                setLanguages((prev) => prev.filter((t) => t !== tag))
              }
            />

            <TagField
              id="profile-courses"
              label="Courses"
              description="e.g. CSCI 335, ML seminar"
              tags={courses}
              draft={courseDraft}
              onDraftChange={setCourseDraft}
              onAddTags={(vals) => setCourses((prev) => mergeUnique(prev, vals))}
              onRemoveTag={(tag) =>
                setCourses((prev) => prev.filter((t) => t !== tag))
              }
            />

            <TagField
              id="profile-interests"
              label="Interests"
              description="Domains you care about"
              tags={interests}
              draft={interestDraft}
              onDraftChange={setInterestDraft}
              onAddTags={(vals) =>
                setInterests((prev) => mergeUnique(prev, vals))
              }
              onRemoveTag={(tag) =>
                setInterests((prev) => prev.filter((t) => t !== tag))
              }
            />

            <div className="space-y-2">
              <label
                htmlFor="unique-background"
                className="text-sm font-semibold tracking-tight text-slate-800"
              >
                Unique background & projects
              </label>
              <p className="text-xs font-medium text-slate-500">
                Side projects, work history, community roles, or anything that
                does not fit a checkbox — used for embedding-based matching.
              </p>
              <textarea
                id="unique-background"
                value={uniqueBackground}
                onChange={(e) => setUniqueBackground(e.target.value)}
                rows={8}
                placeholder="Example: Shipped a campus events PWA used by 2k students; contributed docs to an OSS CLI; former barista learning CS as a second career…"
                className="w-full resize-y rounded-xl border border-slate-200 bg-slate-50/80 px-4 py-3 text-sm leading-relaxed text-slate-800 shadow-inner shadow-slate-200/40 outline-none transition placeholder:text-slate-400 focus:border-indigo-300 focus:bg-white focus:ring-2 focus:ring-indigo-500/20"
              />
            </div>
          </div>

          <div className="mt-10 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-end">
            <button
              type="button"
              onClick={handleSave}
              className="inline-flex items-center justify-center rounded-xl bg-indigo-600 px-5 py-3 text-sm font-semibold text-white shadow-md shadow-indigo-600/25 transition hover:bg-indigo-500 hover:shadow-lg hover:shadow-indigo-500/30 active:scale-[0.98] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600"
            >
              Save profile
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
