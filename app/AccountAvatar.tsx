"use client";
/* eslint-disable @next/next/no-img-element -- WeChat profile image hosts are dynamic per account. */

export const accountAvatarPresets = [
  { id: "preset:violet", mark: "✦", label: "星芒紫" },
  { id: "preset:ocean", mark: "⌁", label: "海洋蓝" },
  { id: "preset:mint", mark: "◈", label: "薄荷绿" },
  { id: "preset:sunset", mark: "☼", label: "落日橙" },
  { id: "preset:rose", mark: "◒", label: "玫瑰粉" },
  { id: "preset:ink", mark: "◎", label: "墨色灰" },
] as const;

export const defaultAccountAvatar = accountAvatarPresets[0].id;

function presetFor(value: string | null | undefined) {
  return accountAvatarPresets.find((preset) => preset.id === value);
}

function initials(displayName: string) {
  const name = displayName.trim();
  if (!name) return "IP";
  const parts = name.split(/\s+/).filter(Boolean);
  if (parts.length > 1) return parts.slice(0, 2).map((part) => part[0]).join("").toUpperCase();
  return Array.from(name).slice(0, 2).join("").toUpperCase();
}

export function AccountAvatar({ avatarUrl, displayName, className = "" }: { avatarUrl: string | null | undefined; displayName: string; className?: string }) {
  const preset = presetFor(avatarUrl);
  const remoteAvatar = avatarUrl?.startsWith("https://") ? avatarUrl : null;
  return (
    <span className={`account-avatar ${preset ? `is-${preset.id.slice(7)}` : "is-initials"} ${className}`.trim()} aria-label={`${displayName}的头像`}>
      {remoteAvatar ? <img src={remoteAvatar} alt="" referrerPolicy="no-referrer" /> : <b aria-hidden="true">{preset?.mark ?? initials(displayName)}</b>}
    </span>
  );
}

export function AccountAvatarPicker({ value, displayName, onChange }: { value: string; displayName: string; onChange: (value: string) => void }) {
  return (
    <div className="account-avatar-picker" role="radiogroup" aria-label="选择头像">
      {accountAvatarPresets.map((preset) => (
        <button type="button" role="radio" aria-checked={value === preset.id} className={value === preset.id ? "is-selected" : ""} onClick={() => onChange(preset.id)} key={preset.id} title={preset.label}>
          <AccountAvatar avatarUrl={preset.id} displayName={displayName} />
          <small>{preset.label}</small>
        </button>
      ))}
    </div>
  );
}
