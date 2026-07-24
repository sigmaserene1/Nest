import { createFileRoute } from "@tanstack/react-router";
import { AppShell, Card } from "@/components/nest/app-shell";
import { expenses, members, getMember, fmtUSD, categoryMeta } from "@/lib/nest-data";

export const Route = createFileRoute("/app/analytics")({
  component: Analytics,
  head: () => ({ meta: [{ title: "Insights · Nest" }, { name: "description", content: "See where your home spends money." }] }),
});

function Analytics() {
  const total = expenses.reduce((s, e) => s + e.amount, 0);
  const byCat = expenses.reduce<Record<string, number>>((a, e) => ((a[e.category] = (a[e.category] ?? 0) + e.amount), a), {});
  const catEntries = Object.entries(byCat).sort((a, b) => b[1] - a[1]);

  const byPayer = expenses.reduce<Record<string, number>>((a, e) => ((a[e.payerId] = (a[e.payerId] ?? 0) + e.amount), a), {});
  const maxPayer = Math.max(...Object.values(byPayer));

  // Donut
  const R = 62;
  const C = 2 * Math.PI * R;
  let acc = 0;

  return (
    <AppShell greeting={<div><div className="text-sm font-medium text-muted-foreground">This month</div><h1 className="text-2xl font-bold tracking-tight sm:text-[28px]">Insights</h1></div>}>
      <div className="mt-6 grid gap-5 lg:grid-cols-5">
        <Card className="lg:col-span-3">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-base font-bold">By category</h2>
              <p className="text-xs text-muted-foreground">Total household spending</p>
            </div>
            <span className="rounded-full bg-emerald-50 px-2.5 py-1 text-[11px] font-semibold text-emerald-600">↓ 8% vs last</span>
          </div>
          <div className="mt-6 flex flex-col items-center gap-6 sm:flex-row">
            <svg viewBox="0 0 160 160" className="h-44 w-44 -rotate-90">
              <circle cx="80" cy="80" r={R} strokeWidth="18" stroke="#f1f2f6" fill="none" />
              {catEntries.map(([cat, v]) => {
                const meta = categoryMeta[cat as keyof typeof categoryMeta];
                const len = (v / total) * C;
                const off = C - acc;
                acc += len;
                return (
                  <circle
                    key={cat}
                    cx="80" cy="80" r={R}
                    strokeWidth="18"
                    stroke={meta.color}
                    strokeDasharray={`${len} ${C - len}`}
                    strokeDashoffset={off}
                    strokeLinecap="round"
                    fill="none"
                  />
                );
              })}
              <text x="80" y="76" textAnchor="middle" className="rotate-90 fill-foreground" style={{ transformOrigin: "80px 80px" }} fontSize="14" fontWeight="700">Total</text>
              <text x="80" y="94" textAnchor="middle" className="rotate-90 fill-foreground" style={{ transformOrigin: "80px 80px" }} fontSize="18" fontWeight="800">{fmtUSD(total).replace(".00", "")}</text>
            </svg>
            <ul className="flex-1 space-y-2">
              {catEntries.map(([cat, v]) => {
                const meta = categoryMeta[cat as keyof typeof categoryMeta];
                const pct = ((v / total) * 100).toFixed(0);
                return (
                  <li key={cat} className="flex items-center gap-3 rounded-2xl bg-muted/50 p-2.5">
                    <span className="grid h-9 w-9 place-items-center rounded-xl text-base" style={{ background: meta.bg }}>{meta.icon}</span>
                    <div className="flex-1">
                      <div className="text-sm font-semibold">{cat}</div>
                      <div className="text-[11px] text-muted-foreground">{pct}% of total</div>
                    </div>
                    <div className="text-sm font-bold tabular-nums">{fmtUSD(v)}</div>
                  </li>
                );
              })}
            </ul>
          </div>
        </Card>

        <Card className="lg:col-span-2">
          <h2 className="text-base font-bold">Top contributors</h2>
          <p className="text-xs text-muted-foreground">Who paid for the home</p>
          <ul className="mt-5 space-y-4">
            {members.map((m) => {
              const v = byPayer[m.id] ?? 0;
              const pct = maxPayer ? (v / maxPayer) * 100 : 0;
              return (
                <li key={m.id}>
                  <div className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-2.5">
                      <span className="h-8 w-8"><MemberAvatar32 id={m.id} /></span>
                      <span className="font-semibold">{m.name.split(" ")[0]}</span>
                    </div>
                    <span className="tabular-nums font-semibold">{fmtUSD(v)}</span>
                  </div>
                  <div className="mt-2 h-2 overflow-hidden rounded-full bg-muted">
                    <div className="h-full rounded-full transition-all" style={{ width: `${pct}%`, background: m.gradient }} />
                  </div>
                </li>
              );
            })}
          </ul>
        </Card>
      </div>

      <Card className="mt-5">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-base font-bold">Monthly trend</h2>
            <p className="text-xs text-muted-foreground">Last 6 months</p>
          </div>
        </div>
        <div className="mt-6 flex h-40 items-end justify-between gap-3">
          {[
            { m: "Feb", v: 0.55 }, { m: "Mar", v: 0.7 }, { m: "Apr", v: 0.62 },
            { m: "May", v: 0.85 }, { m: "Jun", v: 0.72 }, { m: "Jul", v: 1.0 },
          ].map((b, i, arr) => {
            const isLast = i === arr.length - 1;
            return (
              <div key={b.m} className="flex flex-1 flex-col items-center gap-2">
                <div className="relative w-full flex-1 rounded-2xl bg-muted/60">
                  <div
                    className={`absolute bottom-0 left-0 right-0 rounded-2xl transition-all ${isLast ? "bg-gradient-to-t from-brand to-orange-400" : "bg-foreground/80"}`}
                    style={{ height: `${b.v * 100}%` }}
                  />
                </div>
                <div className={`text-[11px] font-semibold ${isLast ? "text-brand" : "text-muted-foreground"}`}>{b.m}</div>
              </div>
            );
          })}
        </div>
      </Card>
    </AppShell>
  );
}

function MemberAvatar32({ id }: { id: string }) {
  const m = getMember(id);
  return (
    <span className="inline-grid h-8 w-8 place-items-center rounded-full text-[11px] font-semibold text-white" style={{ background: m.gradient }}>
      {m.name.split(" ").map((p) => p[0]).slice(0, 2).join("")}
    </span>
  );
}
