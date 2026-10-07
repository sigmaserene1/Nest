
import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { formatUnits, isAddress, parseUnits, type Address } from "viem";
import { useAccount, usePublicClient, useReadContract, useWalletClient } from "wagmi";
import { toast } from "sonner";
import {
  BadgeDollarSign,
  CalendarClock,
  CheckCheck,
  Coins,
  HandCoins,
  Loader2,
  ShieldCheck,
  Target,
  UsersRound,
  Vault,
} from "lucide-react";
import { AppShell, Card } from "@/components/nest/app-shell";
import { NEST_TREASURY_V3_ABI } from "@/contracts/nest-treasury-v3-artifact";
import { ERC20_ABI, USDC_ADDRESS } from "@/lib/wagmi";
import { useArcWallet } from "@/hooks/use-arc-wallet";

export const Route = createFileRoute("/app/treasury")({
  component: TreasuryPage,
  head: () => ({
    meta: [
      { title: "Treasury · Nest" },
      {
        name: "description",
        content:
          "Shared USDC treasury, multi-approval payments, recurring payouts, milestone escrow and delegated budgets.",
      },
    ],
  }),
});

type Module = "deposit" | "proposal" | "recurring" | "milestone" | "budget";

const moduleMeta: Record<Module, { label: string; icon: typeof Vault; body: string }> = {
  deposit: {
    label: "Shared treasury",
    icon: Vault,
    body: "Pool USDC into a workspace-controlled balance instead of paying only from individual wallets.",
  },
  proposal: {
    label: "Multi-approval pay",
    icon: CheckCheck,
    body: "Create a payment that requires the workspace's N-of-M manager approval threshold.",
  },
  recurring: {
    label: "Recurring payout",
    icon: CalendarClock,
    body: "Schedule payroll, retainers or subscriptions from the treasury on a fixed interval.",
  },
  milestone: {
    label: "Milestone escrow",
    icon: Target,
    body: "Reserve treasury USDC for a deliverable and release it only after enough managers approve.",
  },
  budget: {
    label: "Delegated budget",
    icon: BadgeDollarSign,
    body: "Give a member a capped spend allowance for a defined period without handing over the treasury.",
  },
};

function TreasuryPage() {
  const { address, isConnected } = useAccount();
  const { data: walletClient } = useWalletClient();
  const arc = useArcWallet();
  const publicClient = usePublicClient({ chainId: arc.arcChain.id });

  const configured =
    arc.environment === "mainnet"
      ? (import.meta.env.VITE_NEST_TREASURY_V3_MAINNET_ADDRESS as string | undefined)
      : (import.meta.env.VITE_NEST_TREASURY_V3_ADDRESS as string | undefined);

  const treasuryAddress =
    configured && isAddress(configured) ? (configured as Address) : null;

  const [module, setModule] = useState<Module>("deposit");
  const [busy, setBusy] = useState<string | null>(null);
  const [workspaceName, setWorkspaceName] = useState("");
  const [workspaceIdInput, setWorkspaceIdInput] = useState("");
  const [amount, setAmount] = useState("");
  const [recipient, setRecipient] = useState("");
  const [memo, setMemo] = useState("");
  const [threshold, setThreshold] = useState("2");
  const [intervalDays, setIntervalDays] = useState("30");
  const [executions, setExecutions] = useState("12");
  const [targetId, setTargetId] = useState("");
  const [spender, setSpender] = useState("");
  const [periodDays, setPeriodDays] = useState("7");

  const workspaceQuery = useReadContract({
    address: treasuryAddress ?? undefined,
    abi: NEST_TREASURY_V3_ABI,
    functionName: "getUserWorkspaces",
    args: address ? [address] : undefined,
    chainId: arc.arcChain.id,
    query: {
      enabled: Boolean(treasuryAddress && address),
      refetchInterval: 15_000,
    },
  });

  const workspaces = (workspaceQuery.data ?? []) as readonly {
    id: bigint;
    name: string;
    owner: Address;
    createdAt: bigint;
    approvalThreshold: number;
    managerCount: number;
    availableTreasury: bigint;
    reservedTreasury: bigint;
  }[];

  const selectedId = useMemo(() => {
    const explicit = Number(workspaceIdInput);
    if (Number.isInteger(explicit) && explicit > 0) return BigInt(explicit);
    return workspaces[0]?.id ?? null;
  }, [workspaceIdInput, workspaces]);

  const activeWorkspace =
    workspaces.find((w) => w.id === selectedId) ?? workspaces[0] ?? null;

  const requireWrite = () => {
    if (!treasuryAddress) throw new Error("Treasury V3 is not deployed for this Arc network yet.");
    if (!address || !walletClient || !publicClient) throw new Error("Connect your Arc wallet first.");
    if (!selectedId) throw new Error("Create or select a Treasury workspace first.");
    return { account: address, walletClient, publicClient, workspaceId: selectedId };
  };

  const waitWrite = async (label: string, functionName: string, args: readonly unknown[]) => {
    const ctx = requireWrite();
    setBusy(label);
    try {
      const hash = await ctx.walletClient.writeContract({
        address: treasuryAddress!,
        abi: NEST_TREASURY_V3_ABI,
        functionName: functionName as never,
        args: args as never,
        account: ctx.account,
        chain: arc.arcChain,
      });
      const receipt = await ctx.publicClient.waitForTransactionReceipt({ hash });
      if (receipt.status !== "success") throw new Error("Transaction reverted on Arc.");
      await workspaceQuery.refetch();
      toast.success(label.replace("…", "") + " confirmed");
      return hash;
    } finally {
      setBusy(null);
    }
  };

  const createWorkspace = async () => {
    const name = workspaceName.trim();
    if (!name) return toast.error("Enter a workspace name.");
    if (!treasuryAddress || !address || !walletClient || !publicClient) {
      return toast.error("Treasury V3 is not configured or wallet is disconnected.");
    }
    try {
      setBusy("Creating treasury…");
      const hash = await walletClient.writeContract({
        address: treasuryAddress,
        abi: NEST_TREASURY_V3_ABI,
        functionName: "createWorkspace",
        args: [name],
        account: address,
        chain: arc.arcChain,
      });
      const receipt = await publicClient.waitForTransactionReceipt({ hash });
      if (receipt.status !== "success") throw new Error("Workspace creation reverted.");
      setWorkspaceName("");
      await workspaceQuery.refetch();
      toast.success("Treasury workspace created");
    } catch (error) {
      toast.error((error as Error).message.split("\n")[0]);
    } finally {
      setBusy(null);
    }
  };

  const deposit = async () => {
    const number = Number(amount);
    if (!Number.isFinite(number) || number <= 0) return toast.error("Enter a positive USDC amount.");
    try {
      const ctx = requireWrite();
      const units = parseUnits(number.toFixed(6), 6);
      const allowance = (await ctx.publicClient.readContract({
        address: USDC_ADDRESS,
        abi: ERC20_ABI,
        functionName: "allowance",
        args: [ctx.account, treasuryAddress!],
      })) as bigint;

      if (allowance < units) {
        setBusy("Approving USDC…");
        const approveHash = await ctx.walletClient.writeContract({
          address: USDC_ADDRESS,
          abi: ERC20_ABI,
          functionName: "approve",
          args: [treasuryAddress!, units],
          account: ctx.account,
          chain: arc.arcChain,
        });
        await ctx.publicClient.waitForTransactionReceipt({ hash: approveHash });
      }

      await waitWrite("Depositing treasury USDC…", "deposit", [ctx.workspaceId, units]);
      setAmount("");
    } catch (error) {
      toast.error((error as Error).message.split("\n")[0]);
      setBusy(null);
    }
  };

  const createProposal = async () => {
    const number = Number(amount);
    if (!isAddress(recipient) || !Number.isFinite(number) || number <= 0) {
      return toast.error("Enter a valid recipient and amount.");
    }
    try {
      const ctx = requireWrite();
      await waitWrite("Creating approval request…", "createPaymentProposal", [
        ctx.workspaceId,
        recipient as Address,
        parseUnits(number.toFixed(6), 6),
        memo.trim(),
        BigInt(Math.floor(Date.now() / 1000) + 7 * 86400),
      ]);
      setAmount("");
      setMemo("");
    } catch (error) {
      toast.error((error as Error).message.split("\n")[0]);
    }
  };

  const createRecurring = async () => {
    const number = Number(amount);
    const days = Number(intervalDays);
    const count = Number(executions);
    if (!isAddress(recipient) || !Number.isFinite(number) || number <= 0) {
      return toast.error("Enter a valid recipient and amount.");
    }
    if (!Number.isFinite(days) || days <= 0 || !Number.isInteger(count) || count < 0) {
      return toast.error("Enter a valid interval and execution count.");
    }

    try {
      const ctx = requireWrite();
      const now = Math.floor(Date.now() / 1000);
      await waitWrite("Creating recurring payment…", "createRecurringPayment", [
        ctx.workspaceId,
        recipient as Address,
        parseUnits(number.toFixed(6), 6),
        BigInt(Math.floor(days * 86400)),
        BigInt(now + Math.floor(days * 86400)),
        count,
        memo.trim(),
      ]);
      setAmount("");
      setMemo("");
    } catch (error) {
      toast.error((error as Error).message.split("\n")[0]);
    }
  };

  const createMilestone = async () => {
    const number = Number(amount);
    if (!isAddress(recipient) || !Number.isFinite(number) || number <= 0 || !memo.trim()) {
      return toast.error("Enter recipient, amount and milestone description.");
    }
    try {
      const ctx = requireWrite();
      await waitWrite("Locking milestone escrow…", "createMilestone", [
        ctx.workspaceId,
        recipient as Address,
        parseUnits(number.toFixed(6), 6),
        memo.trim(),
      ]);
      setAmount("");
      setMemo("");
    } catch (error) {
      toast.error((error as Error).message.split("\n")[0]);
    }
  };

  const setBudget = async () => {
    const number = Number(amount);
    const days = Number(periodDays);
    if (
      !isAddress(spender) ||
      !Number.isFinite(number) ||
      number <= 0 ||
      !Number.isFinite(days) ||
      days <= 0
    ) {
      return toast.error("Enter a valid member, limit and period.");
    }

    try {
      const ctx = requireWrite();
      await waitWrite("Saving delegated budget…", "setBudgetPolicy", [
        ctx.workspaceId,
        spender as Address,
        parseUnits(number.toFixed(6), 6),
        BigInt(Math.floor(days * 86400)),
      ]);
      setAmount("");
    } catch (error) {
      toast.error((error as Error).message.split("\n")[0]);
    }
  };

  const setWorkspaceThreshold = async () => {
    const value = Number(threshold);
    if (!Number.isInteger(value) || value < 1 || value > 65535) {
      return toast.error("Enter a valid approval threshold.");
    }
    try {
      const ctx = requireWrite();
      await waitWrite("Updating approval threshold…", "setApprovalThreshold", [
        ctx.workspaceId,
        value,
      ]);
    } catch (error) {
      toast.error((error as Error).message.split("\n")[0]);
    }
  };

  const actOnId = async (
    kind:
      | "approveProposal"
      | "executeProposal"
      | "approveMilestone"
      | "releaseMilestone"
      | "executeRecurringPayment",
  ) => {
    const id = Number(targetId);
    if (!Number.isInteger(id) || id <= 0) return toast.error("Enter a valid onchain item ID.");
    try {
      await waitWrite("Submitting treasury action…", kind, [BigInt(id)]);
    } catch (error) {
      toast.error((error as Error).message.split("\n")[0]);
    }
  };

  if (!treasuryAddress) {
    return (
      <AppShell greeting={<h1 className="text-xl font-bold">Treasury V3</h1>}>
        <div className="mx-auto max-w-2xl space-y-4">
          <Card className="!p-5 sm:!p-6">
            <div className="flex items-start gap-4">
              <span className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-brand-soft text-brand">
                <Vault className="h-5 w-5" />
              </span>
              <div>
                <h2 className="text-base font-bold">Treasury V3 contract is ready to deploy</h2>
                <p className="mt-2 text-sm leading-6 text-muted-foreground">
                  The app and onchain modules are present, but this Arc environment does not have a configured Treasury V3 address yet.
                </p>
                <code className="mt-3 block rounded-xl bg-muted p-3 text-xs">
                  {arc.environment === "mainnet"
                    ? "VITE_NEST_TREASURY_V3_MAINNET_ADDRESS"
                    : "VITE_NEST_TREASURY_V3_ADDRESS"}
                </code>
              </div>
            </div>
          </Card>
          <AdvancedFeatureGrid />
        </div>
      </AppShell>
    );
  }

  const available = activeWorkspace ? Number(formatUnits(activeWorkspace.availableTreasury, 6)) : 0;
  const reserved = activeWorkspace ? Number(formatUnits(activeWorkspace.reservedTreasury, 6)) : 0;

  return (
    <AppShell
      greeting={
        <div>
          <div className="text-sm font-medium text-muted-foreground">Programmable money controls</div>
          <h1 className="text-2xl font-bold tracking-tight sm:text-[28px]">Treasury</h1>
        </div>
      }
    >
      <div className="mt-5 grid gap-4 lg:grid-cols-[1.25fr_.75fr]">
        <Card className="!p-5 sm:!p-6">
          {activeWorkspace ? (
            <>
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                  <div className="text-xs font-bold uppercase tracking-[0.14em] text-brand">
                    {activeWorkspace.name}
                  </div>
                  <div className="mt-2 text-3xl font-bold tracking-[-0.04em]">
                    {"$" + available.toLocaleString(undefined, { maximumFractionDigits: 2 })}
                  </div>
                  <div className="mt-1 text-xs text-muted-foreground">Available treasury USDC</div>
                </div>
                <div className="rounded-2xl bg-muted/60 px-4 py-3 text-right">
                  <div className="text-[10px] font-bold uppercase text-muted-foreground">Reserved</div>
                  <div className="mt-1 text-sm font-bold">
                    {"$" + reserved.toLocaleString(undefined, { maximumFractionDigits: 2 })}
                  </div>
                </div>
              </div>
              <div className="mt-5 grid grid-cols-2 gap-3">
                <Stat label="Approvals required" value={String(activeWorkspace.approvalThreshold)} />
                <Stat label="Managers" value={String(activeWorkspace.managerCount)} />
              </div>
            </>
          ) : (
            <div>
              <div className="text-base font-bold">Create your first treasury workspace</div>
              <p className="mt-1 text-sm text-muted-foreground">
                Treasury V3 is separate from legacy expense rooms so advanced custody rules cannot change old homes.
              </p>
            </div>
          )}
        </Card>

        <Card className="!p-5">
          <div className="text-sm font-bold">Workspace</div>
          <input
            value={workspaceName}
            onChange={(e) => setWorkspaceName(e.target.value)}
            placeholder="e.g. Nest Studio Treasury"
            className="mt-3 min-h-12 w-full rounded-2xl border bg-background px-4 text-base outline-none focus:border-brand/40 sm:text-sm"
          />
          <button
            onClick={() => void createWorkspace()}
            disabled={!isConnected || !!busy}
            className="mt-2 inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-2xl bg-foreground px-4 text-sm font-bold text-background disabled:opacity-50"
          >
            {busy === "Creating treasury…" ? <Loader2 className="h-4 w-4 animate-spin" /> : <UsersRound className="h-4 w-4" />}
            Create workspace
          </button>
          {workspaces.length > 1 ? (
            <input
              value={workspaceIdInput}
              onChange={(e) => setWorkspaceIdInput(e.target.value.replace(/\D/g, ""))}
              placeholder={"Workspace ID · default " + workspaces[0].id.toString()}
              inputMode="numeric"
              className="mt-3 min-h-11 w-full rounded-xl border bg-background px-3 text-sm"
            />
          ) : null}
        </Card>
      </div>

      <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-5">
        {(Object.keys(moduleMeta) as Module[]).map((key) => {
          const meta = moduleMeta[key];
          const Icon = meta.icon;
          const active = module === key;
          return (
            <button
              key={key}
              onClick={() => {
                setModule(key);
                setAmount("");
                setMemo("");
              }}
              className={
                "min-h-[86px] rounded-2xl border p-3 text-left transition active:scale-[0.98] " +
                (active ? "border-brand/35 bg-brand/5" : "border-border bg-card")
              }
            >
              <Icon className={"h-4 w-4 " + (active ? "text-brand" : "text-muted-foreground")} />
              <div className="mt-2 text-xs font-bold">{meta.label}</div>
            </button>
          );
        })}
      </div>

      <Card className="mt-4 !p-5 sm:!p-6">
        <div className="flex items-start gap-3">
          {(() => {
            const Icon = moduleMeta[module].icon;
            return <Icon className="mt-0.5 h-5 w-5 shrink-0 text-brand" />;
          })()}
          <div>
            <h2 className="text-base font-bold">{moduleMeta[module].label}</h2>
            <p className="mt-1 text-sm leading-6 text-muted-foreground">{moduleMeta[module].body}</p>
          </div>
        </div>

        {module === "deposit" ? (
          <div className="mt-5 grid gap-3 sm:grid-cols-[1fr_auto]">
            <AmountInput value={amount} onChange={setAmount} />
            <ActionButton busy={busy} label="Deposit USDC" icon={HandCoins} onClick={() => void deposit()} />
          </div>
        ) : null}

        {module === "proposal" ? (
          <div className="mt-5 space-y-3">
            <RecipientInput value={recipient} onChange={setRecipient} />
            <AmountInput value={amount} onChange={setAmount} />
            <MemoInput value={memo} onChange={setMemo} placeholder="e.g. Q4 contractor payment" />
            <ActionButton busy={busy} label="Create approval request" icon={CheckCheck} onClick={() => void createProposal()} />
          </div>
        ) : null}

        {module === "recurring" ? (
          <div className="mt-5 space-y-3">
            <RecipientInput value={recipient} onChange={setRecipient} />
            <AmountInput value={amount} onChange={setAmount} />
            <div className="grid gap-3 sm:grid-cols-2">
              <NumberInput label="Every N days" value={intervalDays} onChange={setIntervalDays} />
              <NumberInput label="Executions · 0 = unlimited" value={executions} onChange={setExecutions} />
            </div>
            <MemoInput value={memo} onChange={setMemo} placeholder="e.g. Monthly retainer" />
            <ActionButton busy={busy} label="Create recurring payment" icon={CalendarClock} onClick={() => void createRecurring()} />
          </div>
        ) : null}

        {module === "milestone" ? (
          <div className="mt-5 space-y-3">
            <RecipientInput value={recipient} onChange={setRecipient} />
            <AmountInput value={amount} onChange={setAmount} />
            <MemoInput value={memo} onChange={setMemo} placeholder="e.g. Release after production launch" />
            <ActionButton busy={busy} label="Lock milestone funds" icon={Target} onClick={() => void createMilestone()} />
          </div>
        ) : null}

        {module === "budget" ? (
          <div className="mt-5 space-y-3">
            <label className="block text-xs font-bold text-muted-foreground">
              Member / spender
              <input
                value={spender}
                onChange={(e) => setSpender(e.target.value.trim())}
                placeholder="0x…"
                className="mt-1.5 min-h-12 w-full rounded-2xl border bg-background px-4 text-base outline-none focus:border-brand/40 sm:text-sm"
              />
            </label>
            <AmountInput value={amount} onChange={setAmount} label="Period limit (USDC)" />
            <NumberInput label="Period length (days)" value={periodDays} onChange={setPeriodDays} />
            <ActionButton busy={busy} label="Activate budget policy" icon={ShieldCheck} onClick={() => void setBudget()} />
          </div>
        ) : null}
      </Card>

      <div className="mt-4 grid gap-4 lg:grid-cols-2">
        <Card className="!p-5">
          <div className="flex items-center gap-2 text-sm font-bold">
            <ShieldCheck className="h-4 w-4 text-brand" /> Approval policy
          </div>
          <p className="mt-1 text-xs leading-5 text-muted-foreground">
            Set how many managers must approve payment proposals and escrow releases.
          </p>
          <div className="mt-3 flex gap-2">
            <input
              value={threshold}
              onChange={(e) => setThreshold(e.target.value.replace(/\D/g, ""))}
              inputMode="numeric"
              className="min-h-11 min-w-0 flex-1 rounded-xl border bg-background px-3 text-sm"
            />
            <button
              onClick={() => void setWorkspaceThreshold()}
              disabled={!!busy}
              className="rounded-xl bg-foreground px-4 text-xs font-bold text-background disabled:opacity-50"
            >
              Save
            </button>
          </div>
        </Card>

        <Card className="!p-5">
          <div className="flex items-center gap-2 text-sm font-bold">
            <Coins className="h-4 w-4 text-brand" /> Operate an onchain item
          </div>
          <p className="mt-1 text-xs leading-5 text-muted-foreground">
            Approve or execute an existing proposal, milestone or due recurring payment by ID.
          </p>
          <input
            value={targetId}
            onChange={(e) => setTargetId(e.target.value.replace(/\D/g, ""))}
            placeholder="Onchain item ID"
            inputMode="numeric"
            className="mt-3 min-h-11 w-full rounded-xl border bg-background px-3 text-sm"
          />
          <div className="mt-2 grid grid-cols-2 gap-2 sm:grid-cols-3">
            <MiniAction label="Approve payment" onClick={() => void actOnId("approveProposal")} />
            <MiniAction label="Execute payment" onClick={() => void actOnId("executeProposal")} />
            <MiniAction label="Approve milestone" onClick={() => void actOnId("approveMilestone")} />
            <MiniAction label="Release milestone" onClick={() => void actOnId("releaseMilestone")} />
            <MiniAction label="Run recurring" onClick={() => void actOnId("executeRecurringPayment")} />
          </div>
        </Card>
      </div>

      <div className="mt-4">
        <AdvancedFeatureGrid />
      </div>
    </AppShell>
  );
}

function AdvancedFeatureGrid() {
  return (
    <div className="grid gap-3 sm:grid-cols-2">
      {(Object.keys(moduleMeta) as Module[]).map((key) => {
        const meta = moduleMeta[key];
        const Icon = meta.icon;
        return (
          <Card key={key} className="!p-4">
            <div className="flex items-start gap-3">
              <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-brand-soft text-brand">
                <Icon className="h-4 w-4" />
              </span>
              <div>
                <div className="text-sm font-bold">{meta.label}</div>
                <p className="mt-1 text-xs leading-5 text-muted-foreground">{meta.body}</p>
              </div>
            </div>
          </Card>
        );
      })}
    </div>
  );
}

function AmountInput({
  value,
  onChange,
  label = "Amount (USDC)",
}: {
  value: string;
  onChange: (value: string) => void;
  label?: string;
}) {
  return (
    <label className="block text-xs font-bold text-muted-foreground">
      {label}
      <input
        value={value}
        onChange={(e) => onChange(e.target.value.replace(/[^0-9.]/g, ""))}
        inputMode="decimal"
        placeholder="0.00"
        className="mt-1.5 min-h-12 w-full rounded-2xl border bg-background px-4 text-base font-semibold outline-none focus:border-brand/40 sm:text-sm"
      />
    </label>
  );
}

function RecipientInput({ value, onChange }: { value: string; onChange: (value: string) => void }) {
  return (
    <label className="block text-xs font-bold text-muted-foreground">
      Recipient
      <input
        value={value}
        onChange={(e) => onChange(e.target.value.trim())}
        placeholder="0x…"
        className="mt-1.5 min-h-12 w-full rounded-2xl border bg-background px-4 text-base outline-none focus:border-brand/40 sm:text-sm"
      />
    </label>
  );
}

function MemoInput({
  value,
  onChange,
  placeholder,
}: {
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
}) {
  return (
    <label className="block text-xs font-bold text-muted-foreground">
      Note / purpose
      <input
        value={value}
        maxLength={200}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="mt-1.5 min-h-12 w-full rounded-2xl border bg-background px-4 text-base outline-none focus:border-brand/40 sm:text-sm"
      />
    </label>
  );
}

function NumberInput({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <label className="block text-xs font-bold text-muted-foreground">
      {label}
      <input
        value={value}
        onChange={(e) => onChange(e.target.value.replace(/\D/g, ""))}
        inputMode="numeric"
        className="mt-1.5 min-h-12 w-full rounded-2xl border bg-background px-4 text-base outline-none focus:border-brand/40 sm:text-sm"
      />
    </label>
  );
}

function ActionButton({
  busy,
  label,
  icon: Icon,
  onClick,
}: {
  busy: string | null;
  label: string;
  icon: typeof Vault;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      disabled={!!busy}
      className="inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-2xl btn-gradient px-4 text-sm font-bold disabled:opacity-50 sm:w-auto"
    >
      {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Icon className="h-4 w-4" />}
      {busy ?? label}
    </button>
  );
}

function MiniAction({ label, onClick }: { label: string; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="min-h-10 rounded-xl border border-border bg-background px-3 text-[11px] font-bold transition active:scale-[0.98] hover:border-brand/35"
    >
      {label}
    </button>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl bg-muted/55 p-3">
      <div className="text-[10px] font-bold uppercase tracking-[0.1em] text-muted-foreground">
        {label}
      </div>
      <div className="mt-1 text-lg font-bold">{value}</div>
    </div>
  );
}
