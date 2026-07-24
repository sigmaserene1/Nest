import type { Member } from "@/lib/nest-data";

export function MemberAvatar({ member, size = 32, ring = false }: { member: Member; size?: number; ring?: boolean }) {
  const initials = member.name
    .split(" ")
    .map((p) => p[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
  return (
    <span
      className={`inline-grid place-items-center rounded-full text-[11px] font-semibold text-white ${ring ? "ring-2 ring-background" : ""}`}
      style={{ width: size, height: size, backgroundColor: member.color, fontSize: Math.max(10, size * 0.36) }}
      aria-label={member.name}
    >
      {initials}
    </span>
  );
}

export function AvatarStack({ members, max = 4, size = 26 }: { members: Member[]; max?: number; size?: number }) {
  const shown = members.slice(0, max);
  const extra = members.length - shown.length;
  return (
    <span className="inline-flex items-center -space-x-1.5">
      {shown.map((m) => (
        <MemberAvatar key={m.id} member={m} size={size} ring />
      ))}
      {extra > 0 && (
        <span
          className="inline-grid place-items-center rounded-full bg-surface text-[10px] font-semibold text-muted-foreground ring-2 ring-background"
          style={{ width: size, height: size }}
        >
          +{extra}
        </span>
      )}
    </span>
  );
}
