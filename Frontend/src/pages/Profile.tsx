import { type KeyboardEvent, useState } from "react";
import type { UserProfile } from "../types";
import { fetchMatches } from "../lib/api";
import { useLocalStorage } from "../hooks/useLocalStorage";
import {
  emptyUserProfile,
  parseUserProfile,
  USER_PROFILE_STORAGE_KEY,
} from "../lib/profileStorage";

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
  const [profile, setProfile] = useLocalStorage<UserProfile>(
    USER_PROFILE_STORAGE_KEY,
    emptyUserProfile,
    parseUserProfile,
  );

  const [langInput, setLangInput] = useState("");
  const [courseInput, setCourseInput] = useState("");
  const [interestInput, setInterestInput] = useState("");

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
    const toSave: UserProfile = {
      languages: profile.languages,
      courses: profile.courses,
      interests: profile.interests,
      unique_background: profile.unique_background.trim(),
    };
    setProfile(toSave);
    console.log("InternSync profile saved to localStorage", toSave);
    try {
      const results = await fetchMatches(toSave);
      console.log("Matches received:", results);
    } catch (error) {
      console.log("Error fetching matches:", error);
    }
  }

  const { languages, courses, interests, unique_background } = profile;

  return (
    <div className="min-h-screen bg-gray-100 p-4">
      <div className="mx-auto max-w-xl">
        <h1 className="mb-1 text-2xl font-bold text-gray-900">InternSync</h1>
        <p className="mb-6 text-sm text-gray-600">Your profile (for matching)</p>

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

          <button
            type="button"
            onClick={handleSave}
            className="rounded bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
          >
            Save profile
          </button>
        </div>
      </div>
    </div>
  );
}
