import { API_BASE } from "./config";

const DEMO_USER_ID_KEY = "internsync_demo_user_id";
const DEMO_EMAIL = "internsync.demo@local";
const DEMO_PASSWORD = "demo-internsync-local";

async function parseError(res: Response): Promise<string> {
  try {
    const data: unknown = await res.json();
    if (
      typeof data === "object" &&
      data !== null &&
      "error" in data &&
      typeof (data as { error: unknown }).error === "string"
    ) {
      return (data as { error: string }).error;
    }
  } catch {
    /* ignore */
  }
  return `Request failed (${res.status})`;
}

export async function ensureDemoUserId(): Promise<number> {
  if (typeof window === "undefined") return 1;

  const cached = window.localStorage.getItem(DEMO_USER_ID_KEY);
  if (cached) {
    const id = Number(cached);
    if (!Number.isNaN(id) && id > 0) return id;
  }

  let loginRes = await fetch(`${API_BASE}/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email: DEMO_EMAIL, password: DEMO_PASSWORD }),
  });

  if (!loginRes.ok) {
    const regRes = await fetch(`${API_BASE}/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: DEMO_EMAIL, password: DEMO_PASSWORD }),
    });
    if (!regRes.ok && regRes.status !== 400) {
      throw new Error(await parseError(regRes));
    }
    loginRes = await fetch(`${API_BASE}/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: DEMO_EMAIL, password: DEMO_PASSWORD }),
    });
  }

  if (!loginRes.ok) {
    throw new Error(await parseError(loginRes));
  }

  const data: unknown = await loginRes.json();
  if (
    typeof data !== "object" ||
    data === null ||
    !("user_id" in data) ||
    typeof (data as { user_id: unknown }).user_id !== "number"
  ) {
    throw new Error("Login response missing user_id");
  }

  const userId = (data as { user_id: number }).user_id;
  window.localStorage.setItem(DEMO_USER_ID_KEY, String(userId));
  return userId;
}
