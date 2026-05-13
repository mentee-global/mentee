// Throttled client error reporter. Sends a small JSON payload to the
// backend's public /api/error/report endpoint. Uses raw fetch (not the
// axios instance) so we don't inject auth headers into a public route.

import { API_URL } from "./consts";

const REPORTED = new Map(); // key -> last sent timestamp (ms)
const THROTTLE_MS = 60_000;
const KEY_LIMIT = 200; // cap the map so it doesn't grow forever

const trimMap = () => {
  if (REPORTED.size <= KEY_LIMIT) return;
  const cutoff = REPORTED.size - KEY_LIMIT;
  let i = 0;
  for (const k of REPORTED.keys()) {
    if (i++ >= cutoff) break;
    REPORTED.delete(k);
  }
};

export const reportClientError = (payload = {}) => {
  try {
    const message = String(payload.message || "unknown");
    const stack = payload.stack || "";
    const firstFrame = stack.split("\n")[1] || "";
    const key = `${message}|${firstFrame}`;
    const last = REPORTED.get(key) || 0;
    if (Date.now() - last < THROTTLE_MS) return;
    REPORTED.set(key, Date.now());
    trimMap();

    const body = JSON.stringify({
      source: "frontend",
      endpoint:
        payload.endpoint ||
        (typeof window !== "undefined" ? window.location.pathname : ""),
      message,
      stack,
      user_agent: typeof navigator !== "undefined" ? navigator.userAgent : "",
      url: typeof window !== "undefined" ? window.location.href : "",
      user_email: payload.user_email,
      user_role: payload.user_role,
    });

    fetch(`${API_URL}error/report`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body,
      keepalive: true,
    }).catch(() => {});
  } catch (_) {
    // swallow — error reporting must never raise
  }
};

export default reportClientError;
