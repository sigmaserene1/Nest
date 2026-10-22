// Shopping-receipt style view of an onchain payment, plus a print/download
// helper that opens a clean paper receipt in a new tab (Save as PDF).

import { ShieldCheck } from "lucide-react";
import type { Receipt } from "@/lib/receipts-store";

const short = (a: string) => (a.length > 14 ? `${a.slice(0, 8)}…${a.slice(-6)}` : a);

export function receiptRef(hash: string) {
  return `ARC-${hash.slice(2, 8).toUpperCase()}-${hash.slice(-6).toUpperCase()}`;
}

function fmtStamp(iso: string) {
  return new Date(iso).toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

function kindLabel(kind: Receipt["kind"], note?: string) {
  if (note) return note;
  switch (kind) {
    case "settle":
      return "Expense settlement";
    case "rent":
      return "Rent share";
    case "qr":
      return "QR payment";
    case "pay":
      return "Payment";
    default:
      return "USDC transfer";
  }
}

/** Faux barcode made of deterministic bars derived from the tx hash. */
function Barcode({ seed, className = "" }: { seed: string; className?: string }) {
  const bars: number[] = [];
  for (let i = 2; i < Math.min(seed.length, 66) && bars.length < 40; i += 1) {
    const code = seed.charCodeAt(i);
    bars.push((code % 3) + 1);
  }
  return (
    <div className={`flex h-10 items-stretch justify-center gap-[2px] ${className}`} aria-hidden>
      {bars.map((w, i) => (
        <span
          key={i}
          className="bg-foreground"
          style={{ width: `${w}px`, opacity: i % 5 === 0 ? 0.85 : 1 }}
        />
      ))}
    </div>
  );
}

function Zigzag({ flip = false }: { flip?: boolean }) {
  return (
    <div
      aria-hidden
      className={`h-2.5 w-full ${flip ? "rotate-180" : ""}`}
      style={{
        background:
          "linear-gradient(-45deg, var(--card) 6px, transparent 0), linear-gradient(45deg, var(--card) 6px, transparent 0)",
        backgroundSize: "12px 12px",
        backgroundRepeat: "repeat-x",
      }}
    />
  );
}

export type ReceiptPaperMeta = {
  counterpartyName: string;
  direction: "sent" | "received";
  networkLabel: string;
  explorerUrl: string;
};

export function ReceiptPaper({
  receipt,
  meta,
}: {
  receipt: Receipt;
  meta: ReceiptPaperMeta;
}) {
  const reference = receiptRef(receipt.hash);
  return (
    <div className="mx-auto w-full max-w-[340px]">
      <Zigzag />
      <div className="border-x border-border/70 bg-card px-6 pb-6 pt-5 font-mono text-foreground shadow-sm">
        {/* Header */}
        <div className="text-center">
          <div className="text-lg font-bold tracking-[0.3em]">NEST</div>
          <div className="mt-1 text-[10px] uppercase tracking-[0.22em] text-muted-foreground">
            Payment receipt
          </div>
          <div className="mt-2 inline-flex items-center gap-1.5 rounded-full bg-success/10 px-2.5 py-1 font-sans text-[9px] font-bold uppercase tracking-[0.14em] text-success">
            <ShieldCheck className="h-3 w-3" />
            Onchain verified
          </div>
        </div>

        <div className="my-4 border-t border-dashed border-border" />

        {/* Meta rows */}
        <div className="space-y-1.5 text-[11px] leading-relaxed">
          <div className="flex justify-between gap-3">
            <span className="text-muted-foreground">REF</span>
            <span className="font-bold">{reference}</span>
          </div>
          <div className="flex justify-between gap-3">
            <span className="text-muted-foreground">DATE</span>
            <span>{fmtStamp(receipt.date)}</span>
          </div>
          <div className="flex justify-between gap-3">
            <span className="text-muted-foreground">NETWORK</span>
            <span>Arc {meta.networkLabel}</span>
          </div>
        </div>

        <div className="my-4 border-t border-dashed border-border" />

        {/* Parties */}
        <div className="space-y-1.5 text-[11px] leading-relaxed">
          <div className="flex justify-between gap-3">
            <span className="text-muted-foreground">FROM</span>
            <span className="text-right">{short(receipt.from)}</span>
          </div>
          <div className="flex justify-between gap-3">
            <span className="text-muted-foreground">TO</span>
            <span className="text-right">
              {meta.counterpartyName} · {short(receipt.to)}
            </span>
          </div>
        </div>

        <div className="my-4 border-t border-dashed border-border" />

        {/* Line item */}
        <div className="text-[10px] font-bold uppercase tracking-[0.18em] text-muted-foreground">
          Item
        </div>
        <div className="mt-1.5 flex items-baseline justify-between gap-3 text-[12px]">
          <span className="min-w-0 flex-1 truncate">{kindLabel(receipt.kind, receipt.note)}</span>
          <span className="shrink-0 font-bold tabular-nums">
            {receipt.amount.toFixed(2)} USDC
          </span>
        </div>

        <div className="my-4 border-t-2 border-foreground/70" />

        {/* Total */}
        <div className="flex items-baseline justify-between">
          <span className="text-[12px] font-bold uppercase tracking-[0.18em]">
            Total {meta.direction === "sent" ? "paid" : "received"}
          </span>
          <span className="text-xl font-bold tabular-nums">
            ${receipt.amount.toFixed(2)}
          </span>
        </div>
        <div className="mt-1 text-right text-[10px] text-muted-foreground">
          Settled in native USDC · 1 USDC = 1 USD
        </div>

        {/* Paid stamp */}
        <div className="mt-5 flex justify-center">
          <span
            className="inline-block -rotate-6 rounded-md border-[2.5px] border-success px-4 py-1 text-sm font-bold uppercase tracking-[0.3em] text-success"
            style={{ boxShadow: "inset 0 0 0 1px color-mix(in oklab, var(--success) 35%, transparent)" }}
          >
            {meta.direction === "sent" ? "Paid" : "Received"}
          </span>
        </div>

        <div className="my-5 border-t border-dashed border-border" />

        {/* Proof */}
        <div className="text-center">
          <Barcode seed={receipt.hash} />
          <div className="mt-2 break-all text-[9px] leading-relaxed text-muted-foreground">
            TX {receipt.hash}
          </div>
          <div className="mt-3 text-[9px] uppercase tracking-[0.18em] text-muted-foreground">
            Verify on the Arc explorer
          </div>
          <div className="mt-1 break-all text-[9px] text-muted-foreground">{meta.explorerUrl}</div>
        </div>

        <div className="mt-5 text-center font-sans text-[9px] text-muted-foreground">
          Thank you for settling up with Nest 🪺
        </div>
      </div>
      <Zigzag flip />
    </div>
  );
}

/**
 * Opens a clean paper receipt in a new tab and triggers the print dialog,
 * where the visitor chooses "Save as PDF". Must be called synchronously from
 * a click handler so the popup is not blocked.
 */
export function openReceiptPrint(receipt: Receipt, meta: ReceiptPaperMeta) {
  const w = window.open("", "_blank");
  if (!w) return;
  const reference = receiptRef(receipt.hash);
  const esc = (s: string) =>
    s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
  const bars = Array.from({ length: 40 }, (_, i) => {
    const code = receipt.hash.charCodeAt(2 + (i % Math.max(1, receipt.hash.length - 2))) || 1;
    const width = (code % 3) + 1;
    return `<span style="display:inline-block;width:${width}px;background:#111;opacity:${i % 5 === 0 ? 0.85 : 1}"></span>`;
  }).join("");

  w.document.write(`<!doctype html>
<html><head><meta charset="utf-8"><title>Nest receipt ${reference}</title>
<style>
  @page { size: A4; margin: 14mm; }
  * { box-sizing: border-box; margin: 0; }
  body { font-family: "Courier New", ui-monospace, monospace; background: #eceef3; color: #111;
         display: flex; justify-content: center; padding: 24px 12px; }
  .paper { width: 340px; background: #fff; padding: 28px 26px 30px;
           box-shadow: 0 10px 40px rgba(15,23,42,.12); }
  .c { text-align: center; }
  .brand { font-size: 22px; font-weight: 700; letter-spacing: .3em; }
  .sub { font-size: 10px; letter-spacing: .22em; text-transform: uppercase; color: #6b7280; margin-top: 4px; }
  .badge { display: inline-block; margin-top: 10px; font-family: system-ui, sans-serif; font-size: 9px;
           font-weight: 700; letter-spacing: .14em; text-transform: uppercase; color: #059669;
           background: #ecfdf5; border-radius: 999px; padding: 4px 10px; }
  .dash { border-top: 1px dashed #c8cdd8; margin: 16px 0; }
  .solid { border-top: 2px solid #111; margin: 16px 0; }
  .row { display: flex; justify-content: space-between; gap: 12px; font-size: 11px; margin: 5px 0; }
  .row .k { color: #6b7280; }
  .item-label { font-size: 10px; font-weight: 700; letter-spacing: .18em; text-transform: uppercase; color: #6b7280; }
  .total { display: flex; justify-content: space-between; align-items: baseline; }
  .total .t { font-size: 12px; font-weight: 700; letter-spacing: .18em; text-transform: uppercase; }
  .total .v { font-size: 24px; font-weight: 700; }
  .stamp { display: inline-block; transform: rotate(-6deg); border: 3px solid #059669; color: #059669;
           border-radius: 6px; padding: 5px 16px; font-size: 15px; font-weight: 700;
           letter-spacing: .3em; text-transform: uppercase; }
  .bars { display: flex; height: 40px; align-items: stretch; justify-content: center; gap: 2px; }
  .tiny { font-size: 9px; color: #6b7280; word-break: break-all; line-height: 1.5; }
  .thanks { font-family: system-ui, sans-serif; font-size: 9px; color: #6b7280; margin-top: 20px; }
</style></head><body>
<div class="paper">
  <div class="c">
    <div class="brand">NEST</div>
    <div class="sub">Payment receipt</div>
    <div class="badge">✓ Onchain verified</div>
  </div>
  <div class="dash"></div>
  <div class="row"><span class="k">REF</span><b>${reference}</b></div>
  <div class="row"><span class="k">DATE</span><span>${esc(fmtStamp(receipt.date))}</span></div>
  <div class="row"><span class="k">NETWORK</span><span>Arc ${esc(meta.networkLabel)}</span></div>
  <div class="dash"></div>
  <div class="row"><span class="k">FROM</span><span>${esc(short(receipt.from))}</span></div>
  <div class="row"><span class="k">TO</span><span>${esc(meta.counterpartyName)} · ${esc(short(receipt.to))}</span></div>
  <div class="dash"></div>
  <div class="item-label">Item</div>
  <div class="row" style="font-size:12px;margin-top:6px">
    <span>${esc(kindLabel(receipt.kind, receipt.note))}</span>
    <b>${receipt.amount.toFixed(2)} USDC</b>
  </div>
  <div class="solid"></div>
  <div class="total">
    <span class="t">Total ${meta.direction === "sent" ? "paid" : "received"}</span>
    <span class="v">$${receipt.amount.toFixed(2)}</span>
  </div>
  <div class="tiny" style="text-align:right;margin-top:4px">Settled in native USDC · 1 USDC = 1 USD</div>
  <div class="c" style="margin-top:22px"><span class="stamp">${meta.direction === "sent" ? "Paid" : "Received"}</span></div>
  <div class="dash" style="margin-top:22px"></div>
  <div class="c">
    <div class="bars">${bars}</div>
    <div class="tiny" style="margin-top:8px">TX ${esc(receipt.hash)}</div>
    <div class="tiny" style="margin-top:10px;text-transform:uppercase;letter-spacing:.18em">Verify on the Arc explorer</div>
    <div class="tiny" style="margin-top:4px">${esc(meta.explorerUrl)}</div>
  </div>
  <div class="c thanks">Thank you for settling up with Nest</div>
</div>
<script>window.addEventListener('load', function () { setTimeout(function () { window.print(); }, 250); });</script>
</body></html>`);
  w.document.close();
}
