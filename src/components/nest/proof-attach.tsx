// Attach a verifiable receipt image to an expense.
// The file is hashed with SHA-256 in the browser; that digest is the proof that
// travels with the expense. Anyone with the original file can re-hash it and
// confirm it matches — no trust in Nest required.

import { useRef, useState } from "react";
import { FileCheck2, Loader2, Paperclip, ShieldCheck, Trash2, Upload } from "lucide-react";
import { toast } from "sonner";
import {
  getProof,
  readAsDataUrl,
  removeProof,
  saveProof,
  sha256Hex,
  shortDigest,
  useProofs,
} from "@/lib/proof-store";

const MAX_BYTES = 2_500_000;

export function ProofAttach({ expenseId }: { expenseId: string }) {
  const proofs = useProofs();
  const proof = proofs[expenseId];
  const inputRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [verified, setVerified] = useState<null | boolean>(null);

  async function onPick(file: File | undefined) {
    if (!file) return;
    if (file.size > MAX_BYTES) {
      toast.error("Receipt must be under 2.5 MB.");
      return;
    }
    setBusy(true);
    try {
      const digest = await sha256Hex(file);
      const preview = file.type.startsWith("image/") ? await readAsDataUrl(file) : undefined;
      saveProof({
        expenseId,
        digest,
        fileName: file.name,
        fileType: file.type || "application/octet-stream",
        size: file.size,
        addedAt: new Date().toISOString(),
        preview,
      });
      toast.success("Receipt hashed and attached.");
    } catch {
      toast.error("Could not hash that file.");
    } finally {
      setBusy(false);
    }
  }

  async function onVerify(file: File | undefined) {
    if (!file) return;
    const existing = getProof(expenseId);
    if (!existing) return;
    setBusy(true);
    try {
      const digest = await sha256Hex(file);
      setVerified(digest === existing.digest);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="rounded-2xl border border-dashed p-3">
      <div className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
        <ShieldCheck className="h-3.5 w-3.5" /> Verified receipt
      </div>

      {!proof ? (
        <>
          <p className="mt-2 text-xs text-muted-foreground">
            Attach a photo of the bill. Nest stores its SHA-256 content hash so the record is
            tamper-evident.
          </p>
          <input
            ref={inputRef}
            type="file"
            accept="image/*,application/pdf"
            className="hidden"
            onChange={(e) => void onPick(e.target.files?.[0])}
          />
          <button
            onClick={() => inputRef.current?.click()}
            disabled={busy}
            className="mt-3 inline-flex items-center gap-2 rounded-lg bg-muted px-3 py-2 text-xs font-bold disabled:opacity-50"
          >
            {busy ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Upload className="h-3.5 w-3.5" />}
            Upload receipt
          </button>
        </>
      ) : (
        <div className="mt-2 space-y-3">
          <div className="flex items-center gap-3">
            {proof.preview ? (
              <img
                src={proof.preview}
                alt={`Receipt for expense ${expenseId}`}
                loading="lazy"
                className="h-14 w-14 rounded-lg object-cover"
              />
            ) : (
              <span className="grid h-14 w-14 place-items-center rounded-lg bg-muted">
                <Paperclip className="h-5 w-5 text-muted-foreground" />
              </span>
            )}
            <div className="min-w-0 flex-1">
              <div className="truncate text-sm font-semibold">{proof.fileName}</div>
              <div className="mt-0.5 break-all font-mono text-[11px] text-muted-foreground">
                sha256:{shortDigest(proof.digest)}
              </div>
            </div>
            <button
              onClick={() => {
                removeProof(expenseId);
                setVerified(null);
              }}
              className="grid h-8 w-8 place-items-center rounded-full bg-muted"
              aria-label="Remove receipt proof"
            >
              <Trash2 className="h-3.5 w-3.5" />
            </button>
          </div>

          <label className="inline-flex cursor-pointer items-center gap-2 rounded-lg bg-muted px-3 py-2 text-xs font-bold">
            {busy ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <FileCheck2 className="h-3.5 w-3.5" />
            )}
            Verify a copy
            <input
              type="file"
              className="hidden"
              onChange={(e) => void onVerify(e.target.files?.[0])}
            />
          </label>

          {verified !== null && (
            <div
              className={`rounded-lg p-2 text-xs font-semibold ${
                verified ? "bg-emerald-50 text-emerald-700" : "bg-red-50 text-red-700"
              }`}
            >
              {verified
                ? "Hash matches — this is the original receipt."
                : "Hash mismatch — that file is not the attached receipt."}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
