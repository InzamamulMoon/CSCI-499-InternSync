import type { UserProfile, InternshipMatch } from "../types";

export async function fetchMatches(userProfile: UserProfile): Promise<InternshipMatch[]> {
  const response = await fetch("http://localhost:5000/match", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ user_profile: userProfile }),
  });

  return response.json();
}
