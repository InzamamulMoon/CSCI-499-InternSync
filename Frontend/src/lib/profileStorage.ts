import type { UserProfile } from "../types";

export const USER_PROFILE_STORAGE_KEY = "internsync_user_profile";

export const emptyUserProfile: UserProfile = {
  languages: [],
  courses: [],
  interests: [],
  unique_background: "",
};

export function parseUserProfile(raw: unknown): UserProfile {
  if (!raw || typeof raw !== "object") return emptyUserProfile;
  const r = raw as Partial<UserProfile>;
  const asStrings = (arr: unknown) =>
    Array.isArray(arr) ? arr.filter((x): x is string => typeof x === "string") : [];
  return {
    languages: asStrings(r.languages),
    courses: asStrings(r.courses),
    interests: asStrings(r.interests),
    unique_background:
      typeof r.unique_background === "string" ? r.unique_background : "",
  };
}

/** Any saved fields (including narrative only) */
export function storedProfileHasContent(p: UserProfile): boolean {
  return (
    p.languages.length > 0 ||
    p.courses.length > 0 ||
    p.interests.length > 0 ||
    p.unique_background.trim().length > 0
  );
}

/** Dashboard only loads /match when there is at least one skill tag (avoids 0% wall-of-cards). */
export function profileReadyForMatching(p: UserProfile): boolean {
  return (
    p.languages.length > 0 ||
    p.courses.length > 0 ||
    p.interests.length > 0
  );
}

export function readUserProfileFromStorage(): UserProfile | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(USER_PROFILE_STORAGE_KEY);
    if (raw == null) return null;
    return parseUserProfile(JSON.parse(raw) as unknown);
  } catch {
    return null;
  }
}
