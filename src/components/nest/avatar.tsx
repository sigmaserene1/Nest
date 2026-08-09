import type { Member } from "@/lib/nest-data";

export function MemberAvatar({
  member,
  size = 36,
  ring = false,
  showEmoji = false,
  online = false,
}: {
  member: Member;
  size?: number;
  ring?: boolean;
  showEmoji?: boolean;
  /** Small presence / wallet-connected indicator. */
  online?: boolean;
}) {
  const initials = member.name
    .split(" ")
    .map((p) => p[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
  const dot = Math.max(8, Math.round(size * 0.26));
  return (
    <span className="relative inline-flex shrink-0" style={{ width: size, height: size }}>
      <span
        className={`relative inline-grid place-items-center overflow-hidden rounded-full font-semibold text-white transition-transform duration-200 ${
          ring ? "ring-[3px] ring-white shadow-soft" : ""
        }`}
        style={{
          width: size,
          height: size,
          background: member.gradient,
          fontSize: Math.max(10, size * 0.36),
        }}
        aria-label={member.name}
      >
        <span
          className="pointer-events-none absolute inset-0"
          style={{
            background:
              "linear-gradient(150deg, rgba(255,255,255,0.34) 0%, rgba(255,255,255,0.06) 45%, rgba(0,0,0,0.12) 100%)",
          }}
        />
        <span className="relative">
          {showEmoji ? <span style={{ fontSize: size * 0.55 }}>{member.emoji}</span> : initials}
        </span>
      </span>
      {online && (
        <span
          className="absolute -bottom-0 -right-0 rounded-full bg-emerald-500 ring-2 ring-white"
          style={{ width: dot, height: dot }}
          aria-hidden
        />
      )}
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
          className="inline-grid place-items-center rounded-full bg-white text-[11px] font-semibold text-muted-foreground ring-[3px] ring-white shadow-soft"
          style={{ width: size, height: size }}
        >
          +{extra}
        </span>
      )}
    </span>
  );
}
