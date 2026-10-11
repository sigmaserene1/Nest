import type { Member } from "@/lib/nest-data";
import {
  profileAvatarMeta,
  useProfileAvatar,
  type ProfileAvatarId,
} from "@/lib/profile-avatar";

function AvatarGlyph({ id, size }: { id: ProfileAvatarId; size: number }) {
  const stroke = Math.max(1.4, size * 0.045);
  const common = {
    fill: "none",
    stroke: "currentColor",
    strokeWidth: stroke,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
  };

  if (id === "orbit") {
    return (
      <svg viewBox="0 0 48 48" className="h-[62%] w-[62%]" aria-hidden>
        <circle cx="24" cy="24" r="6.5" fill="currentColor" />
        <ellipse cx="24" cy="24" rx="17" ry="8.5" {...common} />
        <ellipse cx="24" cy="24" rx="8.5" ry="17" {...common} transform="rotate(36 24 24)" />
      </svg>
    );
  }
  if (id === "ember") {
    return (
      <svg viewBox="0 0 48 48" className="h-[62%] w-[62%]" aria-hidden>
        <path d="M27 7c2.5 8-4 10-1.2 16 1.9 4 8.2 2.5 8.2 10.2C34 39 29.8 43 24 43c-7 0-12-4.8-12-11.5 0-6.2 4.5-10.3 8.7-14.4.2 5 2.4 7.4 5 8.3-1.6-6.3 1.3-11 1.3-18.4Z" fill="currentColor" opacity=".96" />
      </svg>
    );
  }
  if (id === "mint") {
    return (
      <svg viewBox="0 0 48 48" className="h-[64%] w-[64%]" aria-hidden>
        <path d="M39 10C24 10 12 18.5 10 34c10 2.5 23-2.2 29-24Z" fill="currentColor" opacity=".95" />
        <path d="M13 35c7-8 14-13 23-20" {...common} />
      </svg>
    );
  }
  if (id === "sky") {
    return (
      <svg viewBox="0 0 48 48" className="h-[64%] w-[64%]" aria-hidden>
        <path d="M8 29c5-9 11-13.5 18-13.5 6.7 0 10.6 3.1 14 8.5-5 8.7-11.3 13-18.7 13C15.1 37 11 34.5 8 29Z" fill="currentColor" opacity=".95" />
        <circle cx="27" cy="24.5" r="4.2" fill="rgba(15,23,42,.28)" />
      </svg>
    );
  }
  if (id === "rose") {
    return (
      <svg viewBox="0 0 48 48" className="h-[64%] w-[64%]" aria-hidden>
        <path d="M24 8c3.5 4.4 4.8 8 4 11.2 3.8-2.1 7.1-2 10 .4-1 4.7-3.6 7.7-7.6 9 2.7 2.6 3.4 5.8 2 9.6-4.7-.2-7.7-2-9-5.5-1.9 3.3-5 5-9.3 4.8-1.2-4.2-.2-7.5 3-9.8-4.2-1.2-6.8-4-7.5-8.4 3-2.5 6.5-2.5 10.4-.2C19.3 15.5 20.7 11.8 24 8Z" fill="currentColor" opacity=".96" />
        <circle cx="24" cy="24" r="4.2" fill="rgba(15,23,42,.25)" />
      </svg>
    );
  }
  if (id === "solar") {
    return (
      <svg viewBox="0 0 48 48" className="h-[64%] w-[64%]" aria-hidden>
        <circle cx="24" cy="24" r="8" fill="currentColor" />
        {[0,45,90,135].map((deg) => (
          <path key={deg} d="M24 5v7M24 36v7" {...common} transform={`rotate(${deg} 24 24)`} />
        ))}
      </svg>
    );
  }
  if (id === "aqua") {
    return (
      <svg viewBox="0 0 48 48" className="h-[64%] w-[64%]" aria-hidden>
        <path d="M9 29c5.2-5.7 10.2-8.5 15-8.5S33.8 23.3 39 29c-5.2 5.7-10.2 8.5-15 8.5S14.2 34.7 9 29Z" fill="currentColor" opacity=".95" />
        <path d="M11 20c4.3-4.2 8.6-6.3 13-6.3S32.7 15.8 37 20" {...common} />
      </svg>
    );
  }
  if (id === "violet") {
    return (
      <svg viewBox="0 0 48 48" className="h-[64%] w-[64%]" aria-hidden>
        <path d="M24 7 38 15v18L24 41 10 33V15L24 7Z" {...common} />
        <path d="m24 14 8 4.5v10L24 33l-8-4.5v-10L24 14Z" fill="currentColor" />
      </svg>
    );
  }
  if (id === "lime") {
    return (
      <svg viewBox="0 0 48 48" className="h-[64%] w-[64%]" aria-hidden>
        <path d="M24 8c1.7 5.5 5.1 8.8 10.3 10-5.2 1.8-8.6 5.2-10.3 10.2-1.7-5-5.1-8.4-10.3-10.2C18.9 16.8 22.3 13.5 24 8Z" fill="currentColor" />
        <path d="M34 27c.8 2.8 2.6 4.6 5.2 5.5-2.6.9-4.4 2.7-5.2 5.4-.9-2.7-2.7-4.5-5.3-5.4 2.6-.9 4.4-2.7 5.3-5.5Z" fill="currentColor" opacity=".75" />
      </svg>
    );
  }
  return (
    <svg viewBox="0 0 48 48" className="h-[64%] w-[64%]" aria-hidden>
      <path d="M12 34V14l12 12 12-12v20" {...common} />
      <circle cx="24" cy="26" r="5" fill="currentColor" />
    </svg>
  );
}

export function ProfileAvatarGraphic({
  avatarId,
  size = 48,
  ring = false,
  label,
}: {
  avatarId: ProfileAvatarId;
  size?: number;
  ring?: boolean;
  label?: string;
}) {
  const meta = profileAvatarMeta(avatarId);
  return (
    <span
      className={`relative inline-grid shrink-0 place-items-center overflow-hidden rounded-full ${
        ring ? "ring-[3px] ring-background shadow-soft" : ""
      }`}
      style={{
        width: size,
        height: size,
        background: `linear-gradient(145deg,${meta.from},${meta.to})`,
        color: meta.accent,
      }}
      aria-label={label ?? meta.label}
    >
      <span
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            "radial-gradient(circle at 28% 18%,rgba(255,255,255,.42),transparent 28%),linear-gradient(160deg,transparent 42%,rgba(0,0,0,.13))",
        }}
      />
      <span className="relative grid h-full w-full place-items-center">
        <AvatarGlyph id={avatarId} size={size} />
      </span>
    </span>
  );
}

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
  const avatarId = useProfileAvatar(member.id);
  const dot = Math.max(8, Math.round(size * 0.26));

  return (
    <span className="relative inline-flex shrink-0" style={{ width: size, height: size }}>
      {showEmoji ? (
        <span
          className={`inline-grid place-items-center rounded-full ${
            ring ? "ring-[3px] ring-background shadow-soft" : ""
          }`}
          style={{
            width: size,
            height: size,
            background: member.gradient,
            fontSize: Math.max(14, size * 0.52),
          }}
          aria-label={member.name}
        >
          {member.emoji}
        </span>
      ) : (
        <ProfileAvatarGraphic avatarId={avatarId} size={size} ring={ring} label={member.name} />
      )}
      {online && (
        <span
          className="absolute -bottom-0 -right-0 rounded-full bg-emerald-500 ring-2 ring-background"
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
          className="inline-grid place-items-center rounded-full bg-card text-[11px] font-semibold text-muted-foreground ring-[3px] ring-background shadow-soft"
          style={{ width: size, height: size }}
        >
          +{extra}
        </span>
      )}
    </span>
  );
}
