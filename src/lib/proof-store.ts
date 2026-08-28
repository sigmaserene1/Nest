// Verified expense receipts.
//
// A receipt image is hashed in the browser with SHA-256 — that digest is the
// content address of the file. The digest (never the raw image) is what gets
// attached to the expense record, so anyone holding the original file can prove
// it is byte-identical to the one that was logged. The image itself is kept
// locally until a pinning provider is connected.

import { readStore, useLocalStore, writeStore } from "./local-store";

export type ExpenseProof = {
  expenseId: string;
  /** Hex SHA-256 digest of the uploaded file — the content address. */
  digest: string;
  fileName: string;
  fileType: string;
  size: number;
  addedAt: string;
  /** Local preview (data URL). Replaced by a gateway URL once pinning is live. */
  preview?: string;
  /** Set when the digest has been anchored to a pinning network. */
  cid?: string;
};

const KEY = "nest.proofs.v1";
const EMPTY: Record<string, ExpenseProof> = {};

export async function sha256Hex(file: Blob): Promise<string> {
  const buf = await file.arrayBuffer();
  const digest = await crypto.subtle.digest("SHA-256", buf);
  return Array.from(new Uint8Array(digest))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

export function readAsDataUrl(file: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(new Error("Could not read that file."));
    reader.readAsDataURL(file);
  });
}

export function getProof(expenseId: string): ExpenseProof | undefined {
  return readStore<Record<string, ExpenseProof>>(KEY, EMPTY)[expenseId];
}

export function saveProof(proof: ExpenseProof) {
  const all = readStore<Record<string, ExpenseProof>>(KEY, EMPTY);
  writeStore(KEY, { ...all, [proof.expenseId]: proof });
}

export function removeProof(expenseId: string) {
  const all = readStore<Record<string, ExpenseProof>>(KEY, EMPTY);
  const next = { ...all };
  delete next[expenseId];
  writeStore(KEY, next);
}

export function useProofs() {
  const [all] = useLocalStore<Record<string, ExpenseProof>>(KEY, EMPTY);
  return all;
}

export function shortDigest(d: string) {
  return `${d.slice(0, 10)}…${d.slice(-8)}`;
}
