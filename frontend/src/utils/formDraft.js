// Lightweight localStorage-backed form draft persistence.
// All operations are best-effort: private-browsing or quota-exceeded errors
// are swallowed so the calling form never breaks.

const PREFIX = "mentee_draft_v1_";

export const loadDraft = (key) => {
  if (!key) return null;
  try {
    const raw = localStorage.getItem(PREFIX + key);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch (_) {
    return null;
  }
};

export const saveDraft = (key, values) => {
  if (!key) return;
  try {
    localStorage.setItem(PREFIX + key, JSON.stringify(values));
  } catch (_) {
    // private mode / quota — ignore
  }
};

export const clearDraft = (key) => {
  if (!key) return;
  try {
    localStorage.removeItem(PREFIX + key);
  } catch (_) {
    // ignore
  }
};
