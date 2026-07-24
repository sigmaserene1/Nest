import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/nest/app-shell";
import { expenses, fmtUSD, getMember, members } from "@/lib/nest-data";

export const Route = createFileRoute("/app/analytics")({
  head: () => ({
    meta: [
      { title: "Analytics · Nest" },
      { name: "description", content: "Monthly spending trends, category breakdowns, and top contributors for your household." },
      { property: "og:title", content: "Analytics · Nest" },
      { property: "og:description", content: "Household spending analytics." },
    ],
  }),
  component: Analytics,
});

const CATEGORY_COLORS: Record<string, string> = {
  Rent: "oklch(0.585 0.222 27.3)",
  Groceries: "oklch(0.65 0.16 155)",
  Electricity: "oklch(0.78 0.16 75)",
  Internet: "oklch(0.55 0.16 260)",
  Other: "oklch(0.7 0.02 260)",
};

function Analytics() {
  const total = expenses.reduce((s, e) => s + e.amount, 0);
  const byCat = expenses.reduce<Record<string, number>>((acc, e) => {
    acc[e.category] = (acc[e.category] ?? 0) + e.amount;
    return acc;
  }, {});
  const cats = Object.entries(byCat).sort((a, b) => b[1] - a[1]);

  const byPayer = members.map((m) => ({
    id: m.id,
    name: m.name,
    color: m.color,
    total: expenses.filter((e) => e.payerId === m.id).reduce((s, e) => s + e.amount, 0),
  })).sort((a, b) => b.total - a.total);

  // Fake monthly trend
  const trend = [
    { m: "Feb", v: 2420 },
    { m: "Mar", v: 3180 },
    { m: "Apr", v: 2895 },
    { m: "May", v: 3410 },
    { m: "Jun", v: 3020 },
    { m: "Jul", v: total },
  ];
  const maxT = Math.max(...trend.map((t) => t.v));

  return (
    <AppShell title="Analytics">
      <div className="grid gap-3 md:grid-cols-3">
        <StatBig label="July total" value={fmtUSD(total)} sub="+12% vs June" />
        <StatBig label="Avg / member" value={fmtUSD(total / members.length)} sub="This month" />
        <StatBig label="Largest expense" value={fmtUSD(Math.max(...expenses.map((e) => e.amount)))} sub="November Rent" />
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-5">
        {/* Donut */}
        <div className="rounded-2xl border border-border bg-background p-5 lg:col-span-2">
          <h3 className="text-sm font-semibold">By category</h3>
          <div className="mt-6 flex items-center gap-6">
            <Donut segments={cats.map(([k, v]) => ({ value: v, color: CATEGORY_COLORS[k] ?? CATEGORY_COLORS.Other }))} total={total} />
            <ul className="flex-1 space-y-2 text-sm">
              {cats.map(([k, v]) => (
                <li key={k} className="flex items-center gap-2">
                  <span className="h-2.5 w-2.5 rounded-sm" style={{ background: CATEGORY_COLORS[k] ?? CATEGORY_COLORS.Other }} />
                  <span className="flex-1">{k}</span>
                  <span className="text-muted-foreground text-xs">{Math.round((v / total) * 100)}%</span>
                  <span className="font-medium">{fmtUSD(v)}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Trend */}
        <div className="rounded-2xl border border-border bg-background p-5 lg:col-span-3">
          <h3 className="text-sm font-semibold">Spending over time</h3>
          <div className="mt-6 flex h-48 items-end gap-3">
            {trend.map((t) => (
              <div key={t.m} className="flex flex-1 flex-col items-center gap-2">
                <div className="flex w-full flex-1 items-end">
                  <div
                    className="w-full rounded-t-md bg-brand transition-all"
                    style={{ height: `${(t.v / maxT) * 100}%`, opacity: t.m === "Jul" ? 1 : 0.35 }}
                    title={fmtUSD(t.v)}
                  />
                </div>
                <div className="text-[11px] text-muted-foreground">{t.m}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="mt-6 rounded-2xl border border-border bg-background p-5">
        <h3 className="text-sm font-semibold">Top spenders this month</h3>
        <div className="mt-4 space-y-3">
          {byPayer.map((p) => {
            const pct = (p.total / total) * 100;
            return (
              <div key={p.id}>
                <div className="mb-1.5 flex items-center justify-between text-sm">
                  <span>{p.name}</span>
                  <span className="font-medium">{fmtUSD(p.total)} <span className="text-muted-foreground text-xs">({Math.round(pct)}%)</span></span>
                </div>
                <div className="h-2 overflow-hidden rounded-full bg-surface">
                  <div className="h-full rounded-full" style={{ width: `${pct}%`, background: p.color }} />
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </AppShell>
  );
}

function StatBig({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <div className="rounded-2xl border border-border bg-surface p-5">
      <div className="text-[11px] uppercase tracking-wide text-muted-foreground">{label}</div>
      <div className="mt-2 text-2xl font-semibold tracking-tight">{value}</div>
      {sub && <div className="mt-0.5 text-xs text-muted-foreground">{sub}</div>}
    </div>
  );
}

function Donut({ segments, total }: { segments: { value: number; color: string }[]; total: number }) {
  const R = 46;
  const C = 2 * Math.PI * R;
  let offset = 0;
  return (
    <div className="relative" style={{ width: 132, height: 132 }}>
      <svg viewBox="0 0 120 120" className="h-full w-full -rotate-90">
        <circle cx="60" cy="60" r={R} fill="none" stroke="var(--color-surface)" strokeWidth="16" />
        {segments.map((s, i) => {
          const len = (s.value / total) * C;
          const el = (
            <circle
              key={i}
              cx="60"
              cy="60"
              r={R}
              fill="none"
              stroke={s.color}
              strokeWidth="16"
              strokeDasharray={`${len} ${C - len}`}
              strokeDashoffset={-offset}
              strokeLinecap="butt"
            />
          );
          offset += len;
          return el;
        })}
      </svg>
      <div className="absolute inset-0 grid place-items-center text-center">
        <div>
          <div className="text-[10px] uppercase text-muted-foreground">Total</div>
          <div className="text-sm font-semibold">{fmtUSD(total)}</div>
        </div>
      </div>
    </div>
  );
}
