import type { UserProfile, InternshipMatch } from "../types";
import { API_BASE } from "./config";
import { ensureDemoUserId } from "./demoUser";
import type { KanbanBoard } from "./kanbanStorage";
import { emptyKanbanBoard, parseBoard } from "./kanbanStorage";

async function parseError(res: Response): Promise<string> {
  const data: unknown = await res.json().catch(() => null);
  if (
    typeof data === "object" &&
    data !== null &&
    "error" in data &&
    typeof (data as { error: unknown }).error === "string"
  ) {
    return (data as { error: string }).error;
  }
  return `Request failed (${res.status})`;
}

export async function fetchMatches(
  userProfile: UserProfile,
): Promise<InternshipMatch[]> {
  const response = await fetch(`${API_BASE}/match`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ user_profile: userProfile }),
  });

  const data: unknown = await response.json();

  if (!response.ok) {
    throw new Error(
      typeof data === "object" &&
        data !== null &&
        "error" in data &&
        typeof (data as { error: unknown }).error === "string"
        ? (data as { error: string }).error
        : `Match request failed (${response.status})`,
    );
  }

  if (!Array.isArray(data)) {
    throw new Error("Invalid match response: expected a JSON array");
  }

  return data as InternshipMatch[];
}

export type ProfilePayload = UserProfile & { kanban_board?: KanbanBoard | null };

export async function loadProfileFromApi(): Promise<ProfilePayload | null> {
  const userId = await ensureDemoUserId();
  const response = await fetch(
    `${API_BASE}/profile/load?user_id=${encodeURIComponent(String(userId))}`,
  );

  if (response.status === 404) {
    return null;
  }

  if (!response.ok) {
    throw new Error(await parseError(response));
  }

  const data: unknown = await response.json();
  if (typeof data !== "object" || data === null) {
    throw new Error("Invalid profile response");
  }

  const d = data as Record<string, unknown>;
  const kanbanRaw = d.kanban_board;
  return {
    languages: Array.isArray(d.languages)
      ? d.languages.filter((x): x is string => typeof x === "string")
      : [],
    courses: Array.isArray(d.courses)
      ? d.courses.filter((x): x is string => typeof x === "string")
      : [],
    interests: Array.isArray(d.interests)
      ? d.interests.filter((x): x is string => typeof x === "string")
      : [],
    unique_background:
      typeof d.unique_background === "string" ? d.unique_background : "",
    kanban_board:
      kanbanRaw != null ? parseBoard(kanbanRaw) : emptyKanbanBoard(),
  };
}

export async function saveProfileToApi(
  profile: UserProfile,
  kanbanBoard?: KanbanBoard,
): Promise<void> {
  const userId = await ensureDemoUserId();
  const body: Record<string, unknown> = {
    user_id: userId,
    languages: profile.languages,
    courses: profile.courses,
    interests: profile.interests,
    unique_background: profile.unique_background,
  };
  if (kanbanBoard) {
    body.kanban_board = kanbanBoard;
  }

  const response = await fetch(`${API_BASE}/profile/save`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    throw new Error(await parseError(response));
  }
}

export async function loadKanbanFromApi(): Promise<KanbanBoard> {
  const payload = await loadProfileFromApi();
  return payload?.kanban_board ?? emptyKanbanBoard();
}

export async function saveKanbanToApi(board: KanbanBoard): Promise<void> {
  const existing = (await loadProfileFromApi()) ?? {
    languages: [],
    courses: [],
    interests: [],
    unique_background: "",
  };
  const { kanban_board: _k, ...profile } = existing;
  await saveProfileToApi(profile, board);
}
