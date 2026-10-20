import { useSyncExternalStore } from "react";
import { pullAccountCache, pushAccountCache } from "@/lib/account-cache";

export const PROFILE_AVATARS = [
  { id: "orbit", label: "Orbit", from: "#5B5BD6", to: "#9B8CFF", accent: "#FFFFFF" },
  { id: "ember", label: "Ember", from: "#F97316", to: "#FB7185", accent: "#FFF7ED" },
  { id: "mint", label: "Mint", from: "#10B981", to: "#2DD4BF", accent: "#ECFDF5" },
  { id: "sky", label: "Sky", from: "#0EA5E9", to: "#6366F1", accent: "#EFF6FF" },
  { id: "rose", label: "Rose", from: "#EC4899", to: "#A855F7", accent: "#FDF2F8" },
  { id: "solar", label: "Solar", from: "#F59E0B", to: "#F97316", accent: "#FFFBEB" },
  { id: "aqua", label: "Aqua", from: "#06B6D4", to: "#14B8A6", accent: "#ECFEFF" },
  { id: "violet", label: "Violet", from: "#7C3AED", to: "#4F46E5", accent: "#F5F3FF" },
  { id: "lime", label: "Lime", from: "#65A30D", to: "#10B981", accent: "#F7FEE7" },
  { id: "night", label: "Night", from: "#0F172A", to: "#334155", accent: "#E2E8F0" },
] as const;

export type ProfileAvatarId = (typeof PROFILE_AVATARS)[number]["id"];

const KEY = (wallet: string) => `nest.profile.avatar.${wallet.toLowerCase()}`;
const DISPLAY_NAME_KEY = (wallet: string) => `nest.profile.display-name.${wallet.toLowerCase()}`;
const PROFILE_NOTE_KEY = (wallet: string) => `nest.profile.note.${wallet.toLowerCase()}`;
const EVENT = "nest:profile-avatar";
const DETAILS_EVENT = "nest:profile-details";

export type ProfileDetails = {
  displayName: string;
  note: string;
};

function hashAddress(value: string) {
  let h = 2166136261;
  const v = value.toLowerCase();
  for (let i = 0; i < v.length; i++) {
    h ^= v.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

export function defaultAvatarFor(wallet: string): ProfileAvatarId {
  return PROFILE_AVATARS[hashAddress(wallet || "nest") % PROFILE_AVATARS.length].id;
}

export function isProfileAvatarId(value: unknown): value is ProfileAvatarId {
  return PROFILE_AVATARS.some((avatar) => avatar.id === value);
}

export function getProfileAvatar(wallet: string): ProfileAvatarId {
  if (!wallet) return "orbit";
  if (typeof window === "undefined") return defaultAvatarFor(wallet);
  const saved = window.localStorage.getItem(KEY(wallet));
  return isProfileAvatarId(saved) ? saved : defaultAvatarFor(wallet);
}

export function setProfileAvatarLocal(wallet: string, avatar: ProfileAvatarId) {
  if (typeof window === "undefined" || !wallet) return;
  window.localStorage.setItem(KEY(wallet), avatar);
  window.dispatchEvent(new CustomEvent(EVENT, { detail: { wallet: wallet.toLowerCase() } }));
}

export async function saveProfileAvatar(wallet: string, avatar: ProfileAvatarId) {
  setProfileAvatarLocal(wallet, avatar);
  await pushAccountCache("global", { preferences: { profileAvatar: avatar } });
}

export async function restoreProfileAvatar(wallet: string) {
  if (!wallet) return getProfileAvatar(wallet);
  const cache = await pullAccountCache("global");
  const remote = cache?.preferences?.profileAvatar;
  if (isProfileAvatarId(remote)) {
    setProfileAvatarLocal(wallet, remote);
    return remote;
  }
  return getProfileAvatar(wallet);
}

function cleanProfileText(value: unknown, maxLength: number) {
  return typeof value === "string" ? value.trim().slice(0, maxLength) : "";
}

export function getProfileDisplayName(wallet: string): string {
  if (!wallet || typeof window === "undefined") return "";
  return cleanProfileText(window.localStorage.getItem(DISPLAY_NAME_KEY(wallet)), 60);
}

export function getProfileNote(wallet: string): string {
  if (!wallet || typeof window === "undefined") return "";
  return cleanProfileText(window.localStorage.getItem(PROFILE_NOTE_KEY(wallet)), 140);
}

export function setProfileDetailsLocal(wallet: string, details: ProfileDetails) {
  if (typeof window === "undefined" || !wallet) return;

  const displayName = cleanProfileText(details.displayName, 60);
  const note = cleanProfileText(details.note, 140);

  if (displayName) window.localStorage.setItem(DISPLAY_NAME_KEY(wallet), displayName);
  else window.localStorage.removeItem(DISPLAY_NAME_KEY(wallet));
  if (note) window.localStorage.setItem(PROFILE_NOTE_KEY(wallet), note);
  else window.localStorage.removeItem(PROFILE_NOTE_KEY(wallet));

  window.dispatchEvent(
    new CustomEvent(DETAILS_EVENT, { detail: { wallet: wallet.toLowerCase() } }),
  );
}

export async function saveProfileDetails(wallet: string, details: ProfileDetails) {
  setProfileDetailsLocal(wallet, details);
  await pushAccountCache("global", {
    preferences: {
      profileDisplayName: cleanProfileText(details.displayName, 60) || null,
      profileNote: cleanProfileText(details.note, 140) || null,
    },
  });
}

export async function restoreProfileDetails(wallet: string): Promise<ProfileDetails> {
  const local = {
    displayName: getProfileDisplayName(wallet),
    note: getProfileNote(wallet),
  };
  if (!wallet) return local;

  const cache = await pullAccountCache("global");
  const preferences = cache?.preferences;
  if (!preferences || typeof preferences !== "object") return local;

  const remote = preferences as Record<string, unknown>;
  const details = {
    displayName: cleanProfileText(remote.profileDisplayName, 60),
    note: cleanProfileText(remote.profileNote, 140),
  };
  if ("profileDisplayName" in remote || "profileNote" in remote) {
    setProfileDetailsLocal(wallet, details);
    return details;
  }
  return local;
}

function subscribe(listener: () => void) {
  if (typeof window === "undefined") return () => undefined;
  const onStorage = (event: StorageEvent) => {
    if (
      event.key?.startsWith("nest.profile.avatar.") ||
      event.key?.startsWith("nest.profile.display-name.") ||
      event.key?.startsWith("nest.profile.note.")
    ) {
      listener();
    }
  };
  window.addEventListener("storage", onStorage);
  window.addEventListener(EVENT, listener);
  window.addEventListener(DETAILS_EVENT, listener);
  return () => {
    window.removeEventListener("storage", onStorage);
    window.removeEventListener(EVENT, listener);
    window.removeEventListener(DETAILS_EVENT, listener);
  };
}

export function useProfileAvatar(wallet: string): ProfileAvatarId {
  return useSyncExternalStore(
    subscribe,
    () => getProfileAvatar(wallet),
    () => defaultAvatarFor(wallet),
  );
}

export function useProfileDisplayName(wallet: string): string {
  return useSyncExternalStore(
    subscribe,
    () => getProfileDisplayName(wallet),
    () => "",
  );
}

export function useProfileNote(wallet: string): string {
  return useSyncExternalStore(
    subscribe,
    () => getProfileNote(wallet),
    () => "",
  );
}

export function profileAvatarMeta(id: ProfileAvatarId) {
  return PROFILE_AVATARS.find((avatar) => avatar.id === id) ?? PROFILE_AVATARS[0];
}
