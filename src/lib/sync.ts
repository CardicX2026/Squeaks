// Client calls to the Squeaks server API. All game value is decided on the server.
export type Me = { handle: string | null; cheese: number; points: number; best_score: number; runs: number; streak: number; can_claim_daily: boolean };

async function call<T>(token: string, path: string, init?: RequestInit): Promise<T> {
  const r = await fetch(`/api/squeaks${path}`, { ...init, headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}`, ...(init?.headers || {}) } });
  const j = await r.json().catch(() => ({}));
  if (!r.ok) throw new Error((j as { error?: string }).error || `HTTP ${r.status}`);
  return j as T;
}
export const fetchMe = (token: string) => call<Me>(token, "/me");
export const runStart = (token: string) => call<{ run_id: string }>(token, "/run/start", { method: "POST", body: "{}" });
export const runFinish = (token: string, run_id: string, score: number, cheese: number) =>
  call<{ score: number; cheese: number; points: number; best_score: number; balances: { cheese: number; points: number } }>(token, "/run/finish", { method: "POST", body: JSON.stringify({ run_id, score, cheese }) });
