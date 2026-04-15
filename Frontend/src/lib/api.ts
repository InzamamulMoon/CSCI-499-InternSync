import type { UserProfile, InternshipMatch } from "../types";

const MATCH_URL = "http://127.0.0.1:5000/match";

export async function fetchMatches(
  userProfile: UserProfile,
): Promise<InternshipMatch[]> {
  const response = await fetch(MATCH_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ user_profile: userProfile }),
  });

  const data: unknown = await response.json();

  if (!response.ok) {
    const msg =
      typeof data === "object" &&
      data !== null &&
      "error" in data &&
      typeof (data as { error: unknown }).error === "string"
        ? (data as { error: string }).error
        : `Match request failed (${response.status})`;
    throw new Error(msg);
  }

  if (!Array.isArray(data)) {
    throw new Error("Invalid match response: expected a JSON array");
  }

  return data as InternshipMatch[];
}
