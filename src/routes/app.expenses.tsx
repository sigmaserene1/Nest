import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { CheckCircle2, FilePlus2, Loader2, Search, Users } from "lucide-react";
import { toast } from "sonner";
import { AppShell, Card } from "@/components/nest/app-shell";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { CATEGORIES, fmtRelative, fmtUSD, getMember, shortAddress } from "@/lib/nest-data";
import { useNestChain } from "@/lib/chain/nest-chain";
import { useNestWrites } from "@/lib/chain/writes";

export const Route = createFileRoute("/app/expenses")({
  component: LedgerPage,
  head: () => ({
    meta: [
      { title: "Onchain ledger · Nest" },
      {
        name: "description",
        content: "Immutable obligations recorded in a Nest Treasury V2 contract.",
      },
    ],
  }),
});

function LedgerPage() {
  const { expenses, members, me } = useNestChain();
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState<string>("All");
  const [open, setOpen] = useState(false);

  const filtered = useMemo(
    () =>
      expenses.filter((expense) => {
        const matchesCategory = category === "All" || expense.category === category;
        const query = search.trim().toLowerCase();
        return (
          matchesCategory &&
          (!query || expense.title.toLowerCase().includes(query) || expense.id.includes(query))
        );
      }),
    [category, expenses, search],
  );

  return (
    <AppShell
      greeting={
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <div className="protocol-label">Immutable obligations</div>
            <h1 className="mt-2 text-2xl font-semibold">Onchain ledger</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Each row changes contract net positions immediately.
            </p>
          </div>
          <Button onClick={() => setOpen(true)} disabled={members.length < 2}>
            <FilePlus2 /> Record obligation
          </Button>
        </div>
      }
    >
      {members.length < 2 && (
        <div className="mb-4 flex items-start gap-3 rounded-lg border border-amber-400/25 bg-amber-400/5 p-4 text-sm">
          <Users className="mt-0.5 h-4 w-4 text-amber-300" />
          <div>
            <div className="font-medium text-amber-200">Add another wallet first</div>
            <p className="mt-1 text-xs text-muted-foreground">
              An obligation must assign at least one share to a member other than its payer.
            </p>
          </div>
        </div>
      )}

      <Card className="!p-0">
        <div className="flex flex-col gap-3 border-b border-border p-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="relative w-full sm:max-w-xs">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search title or ID"
              className="h-9 pl-9"
            />
          </div>
          <div className="flex gap-1 overflow-x-auto">
            {["All", ...CATEGORIES].map((item) => (
              <button
                type="button"
                key={item}
                onClick={() => setCategory(item)}
                className={`shrink-0 rounded-md px-2.5 py-2 text-[11px] font-medium transition ${category === item ? "bg-primary/12 text-primary" : "text-muted-foreground hover:bg-muted"}`}
              >
                {item}
              </button>
            ))}
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[780px] text-left text-xs">
            <thead className="border-b border-border text-muted-foreground">
              <tr>
                <th className="px-5 py-3 font-medium">Obligation</th>
                <th className="px-3 py-3 font-medium">Payer</th>
                <th className="px-3 py-3 font-medium">Participants</th>
                <th className="px-3 py-3 font-medium">Reference</th>
                <th className="px-3 py-3 font-medium">Time</th>
                <th className="px-5 py-3 text-right font-medium">Amount</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filtered.map((expense) => (
                <tr key={expense.id} className="transition hover:bg-muted/25">
                  <td className="px-5 py-4">
                    <div className="font-medium">{expense.title}</div>
                    <div className="mt-1 text-[10px] text-muted-foreground">{expense.category}</div>
                  </td>
                  <td className="px-3 py-4">
                    <div>{getMember(expense.payerId).name}</div>
                    <div className="mt-1 font-mono text-[9px] text-muted-foreground">
                      {shortAddress(expense.payerId)}
                    </div>
                  </td>
                  <td className="px-3 py-4 text-muted-foreground">
                    {expense.splitAmong.length} wallets
                  </td>
                  <td className="px-3 py-4 font-mono text-[10px] text-muted-foreground">
                    OBL-{expense.id.padStart(5, "0")}
                  </td>
                  <td className="px-3 py-4 text-muted-foreground">{fmtRelative(expense.date)}</td>
                  <td className="protocol-value px-5 py-4 text-right font-medium">
                    {fmtUSD(expense.amount)}
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-5 py-12 text-center text-muted-foreground">
                    No matching onchain obligations.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>

      <RecordDialog
        open={open}
        onOpenChange={setOpen}
        members={members.map((member) => ({ id: member.id, name: member.name }))}
        me={me}
      />
    </AppShell>
  );
}

function RecordDialog({
  open,
  onOpenChange,
  members,
  me,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  members: { id: string; name: string }[];
  me: string | null;
}) {
  const { addExpense } = useNestWrites();
  const [title, setTitle] = useState("");
  const [amount, setAmount] = useState("");
  const [category, setCategory] = useState<(typeof CATEGORIES)[number]>("Other");
  const [selected, setSelected] = useState<string[]>([]);
  const [busy, setBusy] = useState(false);
  const [step, setStep] = useState("");

  const activeSelected = selected.length > 0 ? selected : members.map((member) => member.id);
  const numericAmount = Number(amount);
  const hasDebtor = activeSelected.some((id) => id !== me);
  const canSubmit =
    title.trim().length > 0 && numericAmount > 0 && activeSelected.length > 0 && hasDebtor && !busy;

  const toggle = (id: string) => {
    const current = activeSelected;
    setSelected(current.includes(id) ? current.filter((item) => item !== id) : [...current, id]);
  };

  const submit = async () => {
    if (!canSubmit) return;
    setBusy(true);
    setStep("");
    try {
      const hash = await addExpense(
        { title: title.trim(), category, amount: numericAmount, participants: activeSelected },
        setStep,
      );
      toast.success("Obligation finalized on Arc", {
        description: `${hash.slice(0, 10)}...${hash.slice(-6)}`,
      });
      setTitle("");
      setAmount("");
      setSelected([]);
      onOpenChange(false);
    } catch (error) {
      toast.error("Transaction failed", { description: (error as Error).message });
    } finally {
      setBusy(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-xl">
        <DialogHeader>
          <DialogTitle>Record onchain obligation</DialogTitle>
          <DialogDescription>
            The payer is your connected wallet. Equal shares update every selected member's net
            position.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-2 sm:grid-cols-[1fr_150px]">
          <label>
            <span className="protocol-label">Description</span>
            <Input
              value={title}
              onChange={(event) => setTitle(event.target.value)}
              maxLength={120}
              className="mt-2"
              placeholder="Design tools · August"
            />
          </label>
          <label>
            <span className="protocol-label">Amount (USDC)</span>
            <Input
              value={amount}
              onChange={(event) => setAmount(event.target.value)}
              inputMode="decimal"
              className="protocol-value mt-2"
              placeholder="0.00"
            />
          </label>
        </div>
        <label className="block">
          <span className="protocol-label">Category</span>
          <select
            value={category}
            onChange={(event) => setCategory(event.target.value as (typeof CATEGORIES)[number])}
            className="mt-2 h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
          >
            {CATEGORIES.map((item) => (
              <option key={item}>{item}</option>
            ))}
          </select>
        </label>
        <div>
          <div className="flex items-center justify-between">
            <span className="protocol-label">Split across</span>
            <span className="text-[10px] text-muted-foreground">
              {activeSelected.length} selected
            </span>
          </div>
          <div className="mt-2 divide-y divide-border rounded-md border border-border">
            {members.map((member) => {
              const checked = activeSelected.includes(member.id);
              return (
                <label
                  key={member.id}
                  className="flex cursor-pointer items-center gap-3 px-3 py-2.5 text-sm"
                >
                  <Checkbox checked={checked} onCheckedChange={() => toggle(member.id)} />
                  <span className="min-w-0 flex-1 truncate">
                    {member.name}
                    {member.id === me ? " (payer)" : ""}
                  </span>
                  <span className="protocol-value text-xs text-muted-foreground">
                    {checked && numericAmount > 0
                      ? fmtUSD(numericAmount / activeSelected.length)
                      : "--"}
                  </span>
                </label>
              );
            })}
          </div>
        </div>
        <div className="flex items-start gap-2 rounded-md border border-sky-400/20 bg-sky-400/5 p-3 text-xs text-muted-foreground">
          <CheckCircle2 className="mt-0.5 h-3.5 w-3.5 shrink-0 text-sky-300" /> No funds move now.
          The contract writes the obligation and updates net balances; settlement happens later in
          USDC.
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={busy}>
            Cancel
          </Button>
          <Button onClick={submit} disabled={!canSubmit}>
            {busy ? <Loader2 className="animate-spin" /> : <FilePlus2 />}
            {busy ? step || "Writing to Arc" : "Record obligation"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
