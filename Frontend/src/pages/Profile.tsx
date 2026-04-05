import { type KeyboardEvent, useState } from "react";
import type { UserProfile } from "../types";
import { fetchMatches } from "../lib/api";

// helper: add tags from comma-separated input, skip duplicates (case insensitive)
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
  const [languages, setLanguages] = useState<string[]>([]);
  const [courses, setCourses] = useState<string[]>([]);
  const [interests, setInterests] = useState<string[]>([]);
  const [langInput, setLangInput] = useState("");
  const [courseInput, setCourseInput] = useState("");
  const [interestInput, setInterestInput] = useState("");
  const [uniqueBackground, setUniqueBackground] = useState("");

  function addTags(
    raw: string,
    current: string[],
    setList: (v: string[]) => void,
    setInput: (v: string) => void,
  ) {
    const parts = raw
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);
    if (parts.length === 0) return;
    setList(mergeUnique(current, parts));
    setInput("");
  }

  function onTagKeyDown(
    e: KeyboardEvent<HTMLInputElement>,
    raw: string,
    current: string[],
    setList: (v: string[]) => void,
    setInput: (v: string) => void,
  ) {
    if (e.key === "Enter" || e.key === ",") {
      e.preventDefault();
      addTags(raw, current, setList, setInput);
    }
    if (e.key === "Backspace" && raw === "" && current.length > 0) {
      setList(current.slice(0, -1));
    }
  }

  async function handleSave() {
    const profile: UserProfile = {
      languages,
      courses,
      interests,
      unique_background: uniqueBackground.trim(),
    };
    console.log("InternSync profile (mock save)", profile);
    try {
      const results = await fetchMatches(profile);
      console.log("Matches received:", results);
    } catch (error) {
      console.log("Error fetching matches:", error);
    }
  }

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
                      setLanguages(languages.filter((t) => t !== tag))
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
                  onTagKeyDown(e, langInput, languages, setLanguages, setLangInput)
                }
                onBlur={() =>
                  addTags(langInput, languages, setLanguages, setLangInput)
                }
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
                      setCourses(courses.filter((t) => t !== tag))
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
                  onTagKeyDown(e, courseInput, courses, setCourses, setCourseInput)
                }
                onBlur={() =>
                  addTags(courseInput, courses, setCourses, setCourseInput)
                }
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
                      setInterests(interests.filter((t) => t !== tag))
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
                    interests,
                    setInterests,
                    setInterestInput,
                  )
                }
                onBlur={() =>
                  addTags(
                    interestInput,
                    interests,
                    setInterests,
                    setInterestInput,
                  )
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
              value={uniqueBackground}
              onChange={(e) => setUniqueBackground(e.target.value)}
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
