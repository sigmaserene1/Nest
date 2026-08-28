import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Check, Copy, KeyRound, Loader2, Pencil, ShieldCheck, UserPlus, Users } from "lucide-react";
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
import { useNestChain } from "@/lib/chain/nest-chain";
import { useNestWrites } from "@/lib/chain/writes";
import { buildInviteLink, isAddress } from "@/lib/chain/config";
import { fmtUSD, shortAddress } from "@/lib/nest-data";

export const Route = createFileRoute("/app/members")({
  component: AccessPage,
  head: () => ({ meta: [{ title: "Treasury access · Nest" }] }),
});

function AccessPage() {
  const { members, net, me, myName, owner, isAdmin, contractAddress, roomId } = useNestChain();
  const [open, setOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [copied, setCopied] = useState(false);

  const copyInvite = async () => {
    if (!contractAddress) return;
    await navigator.clipboard?.writeText(buildInviteLink(contractAddress, roomId ?? 1));
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1400);
  };

  return (
    <AppShell
      greeting={
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <div className="protocol-label">Contract membership</div>
            <h1 className="mt-2 text-2xl font-semibold">Access control</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Onchain state is public; only active members can write this treasury ledger.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button variant="ghost" onClick={() => setProfileOpen(true)}>
              <Pencil /> Edit my name
            </Button>
            <Button variant="outline" onClick={copyInvite}>
              {copied ? <Check /> : <Copy />}
              {copied ? "Invite copied" : "Copy invite"}
            </Button>
            {isAdmin && (
              <Button onClick={() => setOpen(true)}>
                <UserPlus /> Add wallet
              </Button>
            )}
          </div>
        </div>
      }
    >
      <Card className="!p-0">
        <div className="grid grid-cols-[1fr_auto] items-center border-b border-border px-5 py-4">
          <div>
            <div className="protocol-label">Active wallets</div>
            <h2 className="mt-1 text-base font-semibold">Treasury members</h2>
          </div>
          <span className="protocol-value text-sm">{members.length} / 64</span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[680px] text-left text-xs">
            <thead className="border-b border-border text-muted-foreground">
              <tr>
                <th className="px-5 py-3 font-medium">Member</th>
                <th className="px-3 py-3 font-medium">Wallet</th>
                <th className="px-3 py-3 font-medium">Role</th>
                <th className="px-3 py-3 font-medium">State</th>
                <th className="px-5 py-3 text-right font-medium">Net position</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {members.map((member) => {
                const isOwner = member.id === owner;
                const isMe = member.id === me;
                const balance = net[member.id] ?? 0;
                const role = isOwner ? "Owner" : member.admin ? "Admin" : "Member";
                return (
                  <tr key={member.id} className="hover:bg-muted/25">
                    <td className="px-5 py-4">
                      <div className="font-medium">
                        {member.name}
                        {isMe ? " (you)" : ""}
                      </div>
                    </td>
                    <td className="px-3 py-4 font-mono text-[10px] text-muted-foreground">
                      {shortAddress(member.id)}
                    </td>
                    <td className="px-3 py-4">
                      <span
                        className={`inline-flex items-center gap-1.5 rounded-md border px-2 py-1 text-[10px] ${isOwner || member.admin ? "border-primary/25 bg-primary/10 text-primary" : "border-border text-muted-foreground"}`}
                      >
                        {isOwner || member.admin ? (
                          <KeyRound className="h-3 w-3" />
                        ) : (
                          <Users className="h-3 w-3" />
                        )}
                        {role}
                      </span>
                    </td>
                    <td className="px-3 py-4">
                      <span className="inline-flex items-center gap-1.5 text-emerald-300">
                        <span className="h-1.5 w-1.5 rounded-full bg-emerald-300" /> Active onchain
                      </span>
                    </td>
                    <td
                      className={`protocol-value px-5 py-4 text-right font-medium ${balance < 0 ? "text-amber-300" : balance > 0 ? "text-emerald-300" : ""}`}
                    >
                      {balance > 0 ? "+" : ""}
                      {fmtUSD(balance)}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Card>

      <div className="mt-4 flex items-start gap-2 text-[11px] text-muted-foreground">
        <ShieldCheck className="mt-0.5 h-3.5 w-3.5 text-primary" /> Invite links reveal the treasury
        address but do not grant membership. An admin transaction must add the wallet first.
      </div>
      <AddMemberDialog open={open} onOpenChange={setOpen} />
      <EditProfileDialog
        key={myName ?? "unnamed"}
        open={profileOpen}
        onOpenChange={setProfileOpen}
        currentName={myName ?? ""}
      />
    </AppShell>
  );
}

function EditProfileDialog({
  open,
  onOpenChange,
  currentName,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  currentName: string;
}) {
  const { claimName } = useNestWrites();
  const [name, setName] = useState(currentName);
  const [busy, setBusy] = useState(false);

  const submit = async () => {
    if (!name.trim() || busy) return;
    setBusy(true);
    try {
      await claimName(name.trim());
      toast.success("Display name updated onchain");
      onOpenChange(false);
    } catch (error) {
      toast.error("Profile transaction failed", { description: (error as Error).message });
    } finally {
      setBusy(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Edit onchain display name</DialogTitle>
          <DialogDescription>
            This public name is stored in the treasury contract.
          </DialogDescription>
        </DialogHeader>
        <label>
          <span className="protocol-label">Display name</span>
          <Input
            value={name}
            onChange={(event) => setName(event.target.value)}
            className="mt-2"
            maxLength={60}
          />
        </label>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={busy}>
            Cancel
          </Button>
          <Button onClick={submit} disabled={busy || !name.trim()}>
            {busy ? <Loader2 className="animate-spin" /> : <Pencil />}
            {busy ? "Writing to Arc" : "Update name"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function AddMemberDialog({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const { inviteMember } = useNestWrites();
  const [address, setAddress] = useState("");
  const [name, setName] = useState("");
  const [admin, setAdmin] = useState(false);
  const [busy, setBusy] = useState(false);
  const [step, setStep] = useState("");
  const canSubmit = isAddress(address) && name.trim().length > 0 && !busy;

  const submit = async () => {
    if (!canSubmit) return;
    setBusy(true);
    setStep("");
    try {
      await inviteMember(address as `0x${string}`, name.trim(), admin, setStep);
      toast.success("Wallet added to the treasury");
      setAddress("");
      setName("");
      setAdmin(false);
      onOpenChange(false);
    } catch (error) {
      toast.error("Member transaction failed", { description: (error as Error).message });
    } finally {
      setBusy(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add a wallet onchain</DialogTitle>
          <DialogDescription>
            This transaction grants the wallet access to this treasury contract.
          </DialogDescription>
        </DialogHeader>
        <label>
          <span className="protocol-label">Wallet address</span>
          <Input
            value={address}
            onChange={(event) => setAddress(event.target.value)}
            className="mt-2 font-mono text-xs"
            placeholder="0x..."
          />
        </label>
        <label>
          <span className="protocol-label">Display name</span>
          <Input
            value={name}
            onChange={(event) => setName(event.target.value)}
            className="mt-2"
            placeholder="Alex"
            maxLength={60}
          />
        </label>
        <label className="flex items-start gap-3 rounded-md border border-border p-3">
          <Checkbox checked={admin} onCheckedChange={(value) => setAdmin(value === true)} />
          <span>
            <span className="block text-sm font-medium">Treasury admin</span>
            <span className="mt-1 block text-xs text-muted-foreground">
              Can add members. Ownership and funds are unchanged.
            </span>
          </span>
        </label>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={busy}>
            Cancel
          </Button>
          <Button onClick={submit} disabled={!canSubmit}>
            {busy ? <Loader2 className="animate-spin" /> : <UserPlus />}
            {busy ? step || "Writing to Arc" : "Add wallet"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
