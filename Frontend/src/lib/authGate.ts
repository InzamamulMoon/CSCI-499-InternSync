const SIGNED_IN_KEY = "internsync_demo_signed_in";

export function isSignedIn(): boolean {
  if (typeof window === "undefined") return false;
  return window.localStorage.getItem(SIGNED_IN_KEY) === "1";
}

export function markSignedIn(): void {
  window.localStorage.setItem(SIGNED_IN_KEY, "1");
}

export function signOut(): void {
  window.localStorage.removeItem(SIGNED_IN_KEY);
}
