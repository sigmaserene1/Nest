export type NestSignupDraft = {
  displayName: string;
  workspaceName: string;
  email?: string;
  createdAt: number;
};

const KEY = "nest.signup.pending";
const MAX_AGE = 24 * 60 * 60 * 1000;

export function saveSignupDraft(input: {
  displayName: string;
  workspaceName: string;
  email?: string;
}) {
  if (typeof window === "undefined") return;
  const draft: NestSignupDraft = {
    displayName: input.displayName.trim(),
    workspaceName: input.workspaceName.trim(),
    email: input.email?.trim() || undefined,
    createdAt: Date.now(),
  };
  window.localStorage.setItem(KEY, JSON.stringify(draft));
}

export function readSignupDraft(): NestSignupDraft | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = JSON.parse(window.localStorage.getItem(KEY) ?? "null") as NestSignupDraft | null;
    if (
      !raw ||
      !raw.displayName ||
      !raw.workspaceName ||
      Date.now() - raw.createdAt > MAX_AGE
    ) {
      window.localStorage.removeItem(KEY);
      return null;
    }
    return raw;
  } catch {
    window.localStorage.removeItem(KEY);
    return null;
  }
}

export function clearSignupDraft() {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(KEY);
}
