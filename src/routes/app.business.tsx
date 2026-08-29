import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { Building2, KeyRound, Landmark, Loader2, ShieldCheck } from "lucide-react";
import { formatUnits, isAddress, parseUnits, type Address } from "viem";
import { useAccount, usePublicClient, useReadContract, useWalletClient } from "wagmi";
import { toast } from "sonner";
import { AppShell, Card } from "@/components/nest/app-shell";
import { NEST_BUSINESS_V2_ABI } from "@/contracts/nest-business-v2-artifact";
import { ERC20_ABI, arcTestnet, USDC_ADDRESS } from "@/lib/wagmi";

export const Route = createFileRoute("/app/business")({
  component: BusinessPage,
  head: () => ({
    meta: [
      { title: "Business controls · Nest" },
      {
        name: "description",
        content:
          "Collateralized USDC credit and capped, revocable settlement-agent policies for Nest Business V2.",
      },
    ],
  }),
});

const rawBusinessAddress = import.meta.env.VITE_NEST_BUSINESS_V2_ADDRESS as string | undefined;
const businessAddress: Address | null =
  rawBusinessAddress && isAddress(rawBusinessAddress) ? (rawBusinessAddress as Address) : null;
const usdc = (amount: bigint | undefined) => Number(formatUnits(amount ?? 0n, 6));

type Action = "supply" | "withdraw" | "borrow" | "repay";
const labels: Record<Action, string> = {
  supply: "Supply collateral",
  withdraw: "Withdraw collateral",
  borrow: "Borrow USDC",
  repay: "Repay credit",
};

function BusinessPage() {
  const { address, isConnected } = useAccount();
  const { data: walletClient } = useWalletClient();
  const publicClient = usePublicClient({ chainId: arcTestnet.id });
  const [action, setAction] = useState<Action>("borrow");
  const [amount, setAmount] = useState("");
  const [workspaceName, setWorkspaceName] = useState("");
  const [agent, setAgent] = useState("");
  const [roomId, setRoomId] = useState("");
  const [runCap, setRunCap] = useState("100");
  const [periodCap, setPeriodCap] = useState("500");
  const [periodHours, setPeriodHours] = useState("24");
  const [expiryDays, setExpiryDays] = useState("30");
  const [busy, setBusy] = useState<string | null>(null);

  const creditQuery = useReadContract({
    address: businessAddress ?? undefined,
    abi: NEST_BUSINESS_V2_ABI,
    functionName: "getCreditPosition",
    args: address ? [address] : undefined,
    chainId: arcTestnet.id,
    query: { enabled: !!businessAddress && !!address, refetchInterval: 20_000 },
  });

  const position = useMemo(() => {
    const value = creditQuery.data as
      | {
          supplied: bigint;
          borrowed: bigint;
          borrowInterest: bigint;
          debt: bigint;
          borrowLimit: bigint;
          available: bigint;
          poolLiquidity: bigint;
        }
      | undefined;
    return {
      supplied: usdc(value?.supplied),
      debt: usdc(value?.debt),
      borrowLimit: usdc(value?.borrowLimit),
      available: usdc(value?.available),
      poolLiquidity: usdc(value?.poolLiquidity),
    };
  }, [creditQuery.data]);

  if (!businessAddress) {
    return (
      <AppShell greeting={<h1 className="text-xl font-bold">Business V2</h1>}>
        <div className="mx-auto max-w-2xl space-y-4">
          <Card className="!p-6">
            <div className="flex items-start gap-4">
              <span className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-brand-soft text-brand">
                <Building2 className="h-5 w-5" />
              </span>
              <div>
                <h2 className="text-base font-bold">Business V2 is ready to deploy</h2>
                <p className="mt-2 text-sm leading-6 text-muted-foreground">
                  Deploy the new contract on Arc Testnet, then set its address as
                  <code className="mx-1 rounded bg-muted px-1.5 py-0.5 text-xs">
                    VITE_NEST_BUSINESS_V2_ADDRESS
                  </code>
                  before publishing. Legacy Nest homes are not changed.
                </p>
              </div>
            </div>
          </Card>
          <Card className="!p-6 text-sm text-muted-foreground">
            <div className="font-bold text-foreground">What V2 activates</div>
            <ul className="mt-3 space-y-2">
              <li>Collateralized USDC credit with an on-chain 50% credit limit.</li>
              <li>Business managers, workspace membership, and real expense settlement.</li>
              <li>
                Revocable agent policies scoped to one workspace, debtor, time window, and spend
                caps.
              </li>
            </ul>
          </Card>
        </div>
      </AppShell>
    );
  }

  const requireWallet = () => {
    if (!address || !walletClient || !publicClient) throw new Error("Connect an Arc wallet first.");
    return { account: address, walletClient, publicClient };
  };

  const ensureAllowance = async (units: bigint) => {
    const { account, walletClient, publicClient } = requireWallet();
    const allowance = (await publicClient.readContract({
      address: USDC_ADDRESS,
      abi: ERC20_ABI,
      functionName: "allowance",
      args: [account, businessAddress],
    })) as bigint;
    if (allowance >= units) return;
    setBusy("Approving USDC…");
    const hash = await walletClient.writeContract({
      address: USDC_ADDRESS,
      abi: ERC20_ABI,
      functionName: "approve",
      args: [businessAddress, units],
      account,
      chain: arcTestnet,
    });
    const receipt = await publicClient.waitForTransactionReceipt({ hash });
    if (receipt.status !== "success") throw new Error("USDC approval failed.");
  };

  const runCreditAction = async () => {
    const number = Number(amount);
    if (!Number.isFinite(number) || number <= 0)
      return toast.error("Enter a positive USDC amount.");
    try {
      const { account, walletClient, publicClient } = requireWallet();
      const units = parseUnits(number.toFixed(6), 6);
      if (action === "supply" || action === "repay") await ensureAllowance(units);
      setBusy("Confirm in wallet…");
      const hash = await walletClient.writeContract({
        address: businessAddress,
        abi: NEST_BUSINESS_V2_ABI,
        functionName: action,
        args: [units],
        account,
        chain: arcTestnet,
      });
      const receipt = await publicClient.waitForTransactionReceipt({ hash });
      if (receipt.status !== "success") throw new Error("Transaction reverted on Arc.");
      setAmount("");
      await creditQuery.refetch();
      toast.success(`${labels[action]} confirmed`);
    } catch (error) {
      toast.error((error as Error).message.split("\n")[0]);
    } finally {
      setBusy(null);
    }
  };

  const saveAgentPolicy = async () => {
    const workspace = Number(roomId);
    const run = Number(runCap);
    const period = Number(periodCap);
    const hours = Number(periodHours);
    const days = Number(expiryDays);
    if (!Number.isInteger(workspace) || workspace < 1 || !isAddress(agent)) {
      return toast.error("Enter a valid workspace ID and agent address.");
    }
    if (![run, period, hours, days].every((value) => Number.isFinite(value) && value > 0)) {
      return toast.error("Enter positive policy limits.");
    }
    if (period < run || hours < 1)
      return toast.error("Period cap must cover a run and be at least one hour.");
    try {
      const { account, walletClient, publicClient } = requireWallet();
      // The contract itself still restricts this allowance to genuine open
      // shares, the configured agent, and the policy caps. Without an ERC-20
      // allowance, an otherwise-valid scheduled settlement would revert.
      await ensureAllowance(parseUnits(period.toFixed(6), 6));
      setBusy("Saving policy…");
      const now = Math.floor(Date.now() / 1000);
      const hash = await walletClient.writeContract({
        address: businessAddress,
        abi: NEST_BUSINESS_V2_ABI,
        functionName: "setAgentPolicy",
        args: [
          BigInt(workspace),
          agent as Address,
          BigInt(now),
          BigInt(now + Math.floor(days * 86_400)),
          parseUnits(run.toFixed(6), 6),
          parseUnits(period.toFixed(6), 6),
          BigInt(Math.floor(hours * 3_600)),
        ],
        account,
        chain: arcTestnet,
      });
      const receipt = await publicClient.waitForTransactionReceipt({ hash });
      if (receipt.status !== "success") throw new Error("Policy transaction reverted on Arc.");
      toast.success("Capped settlement policy is active.");
    } catch (error) {
      toast.error((error as Error).message.split("\n")[0]);
    } finally {
      setBusy(null);
    }
  };

  const createWorkspace = async () => {
    const name = workspaceName.trim();
    if (!name || name.length > 80)
      return toast.error("Enter a workspace name up to 80 characters.");
    try {
      const { account, walletClient, publicClient } = requireWallet();
      setBusy("Creating workspace…");
      const hash = await walletClient.writeContract({
        address: businessAddress,
        abi: NEST_BUSINESS_V2_ABI,
        functionName: "createBusinessRoom",
        args: [name],
        account,
        chain: arcTestnet,
      });
      const receipt = await publicClient.waitForTransactionReceipt({ hash });
      if (receipt.status !== "success") throw new Error("Workspace transaction reverted on Arc.");
      setWorkspaceName("");
      toast.success("Business workspace created. Use its ID to configure the agent.");
    } catch (error) {
      toast.error((error as Error).message.split("\n")[0]);
    } finally {
      setBusy(null);
    }
  };

  return (
    <AppShell greeting={<h1 className="text-xl font-bold">Business V2</h1>}>
      <div className="space-y-4">
        <Card className="!p-6">
          <div className="font-bold">New business workspace</div>
          <p className="mt-1 text-sm text-muted-foreground">
            V2 workspaces are separate from your legacy Nest homes. Their creator starts as the
            workspace owner and manager.
          </p>
          <div className="mt-4 flex gap-2">
            <input
              value={workspaceName}
              onChange={(event) => setWorkspaceName(event.target.value)}
              placeholder="e.g. Nest Studio"
              maxLength={80}
              className="min-w-0 flex-1 rounded-lg border bg-background px-3 py-3 text-sm"
            />
            <button
              onClick={createWorkspace}
              disabled={!isConnected || !!busy}
              className="rounded-lg bg-foreground px-4 py-3 text-sm font-bold text-background disabled:opacity-50"
            >
              Create workspace
            </button>
          </div>
        </Card>

        <Card className="!p-6">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div className="flex items-start gap-3">
              <Landmark className="mt-0.5 h-5 w-5 text-brand" />
              <div>
                <div className="font-bold">USDC credit line</div>
                <p className="mt-1 text-sm text-muted-foreground">
                  Supply collateral, then borrow up to 50% of your supplied USDC. Borrow interest is
                  accrued onchain at 8% APR.
                </p>
              </div>
            </div>
            <div className="text-right text-xs text-muted-foreground">
              Pool liquidity
              <div className="mt-1 text-lg font-bold text-foreground">
                ${position.poolLiquidity.toFixed(2)}
              </div>
            </div>
          </div>
        </Card>

        <div className="grid gap-3 sm:grid-cols-4">
          <Stat label="Collateral" value={position.supplied} />
          <Stat label="Credit limit" value={position.borrowLimit} />
          <Stat label="Available" value={position.available} />
          <Stat label="Debt" value={position.debt} />
        </div>

        <Card>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
            {(Object.keys(labels) as Action[]).map((key) => (
              <button
                key={key}
                onClick={() => setAction(key)}
                className={`rounded-lg border px-3 py-2 text-xs font-bold ${
                  action === key
                    ? "border-foreground bg-foreground text-background"
                    : "border-border"
                }`}
              >
                {labels[key]}
              </button>
            ))}
          </div>
          <div className="mt-4 flex gap-2">
            <input
              value={amount}
              onChange={(event) => setAmount(event.target.value.replace(/[^0-9.]/g, ""))}
              inputMode="decimal"
              placeholder="0.00 USDC"
              className="min-w-0 flex-1 rounded-lg border bg-background px-3 py-3 text-sm"
            />
            <button
              onClick={runCreditAction}
              disabled={!isConnected || !!busy}
              className="inline-flex items-center gap-2 rounded-lg btn-gradient px-4 py-3 text-sm font-bold disabled:opacity-50"
            >
              {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
              {busy ?? labels[action]}
            </button>
          </div>
        </Card>

        <Card className="!p-6">
          <div className="flex items-start gap-3">
            <KeyRound className="mt-0.5 h-5 w-5 text-brand" />
            <div>
              <div className="font-bold">Capped settlement agent</div>
              <p className="mt-1 text-sm text-muted-foreground">
                This authorizes one agent key to settle only your existing workspace debts. It
                cannot transfer to arbitrary addresses, create expenses, or exceed these onchain
                limits.
              </p>
            </div>
          </div>
          <div className="mt-5 grid gap-3 sm:grid-cols-2">
            <Field label="Business workspace ID">
              <input
                value={roomId}
                onChange={(event) => setRoomId(event.target.value)}
                inputMode="numeric"
              />
            </Field>
            <Field label="Agent session-key address">
              <input
                value={agent}
                onChange={(event) => setAgent(event.target.value.trim())}
                placeholder="0x…"
              />
            </Field>
            <Field label="Maximum per run (USDC)">
              <input
                value={runCap}
                onChange={(event) => setRunCap(event.target.value)}
                inputMode="decimal"
              />
            </Field>
            <Field label="Maximum per period (USDC)">
              <input
                value={periodCap}
                onChange={(event) => setPeriodCap(event.target.value)}
                inputMode="decimal"
              />
            </Field>
            <Field label="Period (hours)">
              <input
                value={periodHours}
                onChange={(event) => setPeriodHours(event.target.value)}
                inputMode="numeric"
              />
            </Field>
            <Field label="Policy expires (days)">
              <input
                value={expiryDays}
                onChange={(event) => setExpiryDays(event.target.value)}
                inputMode="numeric"
              />
            </Field>
          </div>
          <button
            onClick={saveAgentPolicy}
            disabled={!isConnected || !!busy}
            className="mt-4 inline-flex items-center gap-2 rounded-lg bg-foreground px-4 py-3 text-sm font-bold text-background disabled:opacity-50"
          >
            <ShieldCheck className="h-4 w-4" /> Save onchain policy
          </button>
        </Card>
      </div>
    </AppShell>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <Card className="!p-4">
      <div className="text-xs text-muted-foreground">{label}</div>
      <div className="mt-1 text-lg font-bold">${value.toFixed(2)}</div>
    </Card>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block text-xs font-semibold text-muted-foreground">
      {label}
      <div className="mt-1 [&_input]:w-full [&_input]:rounded-lg [&_input]:border [&_input]:bg-background [&_input]:px-3 [&_input]:py-2.5 [&_input]:text-sm [&_input]:text-foreground">
        {children}
      </div>
    </label>
  );
}
