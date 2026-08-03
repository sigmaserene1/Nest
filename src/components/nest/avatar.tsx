import type { Member } from "@/lib/nest-data";

export function MemberAvatar({
  member,
  size = 36,
  ring = false,
  showEmoji = false,
}: {
  member: Member;
  size?: number;
  ring?: boolean;
  showEmoji?: boolean;
}) {
  const initials = member.name
    .split(" ")
    .map((p) => p[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
  return (
    <span
      className={`relative inline-grid place-items-center rounded-full font-semibold text-white ${ring ? "ring-[3px] ring-white shadow-sm" : ""}`}
      style={{
        width: size,
        height: size,
        background: member.gradient,
        fontSize: Math.max(10, size * 0.36),
      }}
      aria-label={member.name}
    >
      {showEmoji ? <span style={{ fontSize: size * 0.55 }}>{member.emoji}</span> : initials}
    </span>
  );
}

export function AvatarStack({
  members,
  max = 4,
  size = 30,
}: {
  members: Member[];
  max?: number;
  size?: number;
}) {
  const shown = members.slice(0, max);
  const extra = members.length - shown.length;
  return (
    <span className="inline-flex items-center -space-x-2">
      {shown.map((m) => (
        <MemberAvatar key={m.id} member={m} size={size} ring />
      ))}
      {extra > 0 && (
        <span
          className="inline-grid place-items-center rounded-full bg-white text-[11px] font-semibold text-muted-foreground ring-[3px] ring-white shadow-sm"
          style={{ width: size, height: size }}
        >
          +{extra}
        </span>
      )}
    </span>
  );
}
