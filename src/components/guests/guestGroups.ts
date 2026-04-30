/**
 * Shared definitions for guest groups. Used by:
 *  - GuestListPage (filter row + chip on each row)
 *  - GuestDetailSheet (group picker)
 *  - GuestImportDialog (default group on bulk-imported guests)
 *  - GroupMessageComposer (audience targeting)
 *
 * The DB stores `group_label` as free-text, but the UI presents this curated
 * set of presets. Custom labels are still rendered (just with a default tone).
 */

export type GroupKey = "family" | "friend" | "coworker" | "partner" | "other";

export interface GroupPreset {
  key: GroupKey;
  label: string;
}

export const GROUP_PRESETS: GroupPreset[] = [
  { key: "family", label: "Family" },
  { key: "friend", label: "Friend" },
  { key: "coworker", label: "Coworker" },
  { key: "partner", label: "Partner" },
  { key: "other", label: "Other" },
];

/**
 * Tailwind classes for the colored chip representing a group. Tones come from
 * the design system (mint / lavender / peach / warm) so chips fit visually.
 */
export const groupChipClasses = (key: string | null | undefined): string => {
  switch (key) {
    case "family":
      return "bg-rose-100 text-rose-900";
    case "friend":
      return "bg-lavender text-lavender-foreground";
    case "coworker":
      return "bg-sky-100 text-sky-900";
    case "partner":
      return "bg-mint text-mint-foreground";
    case "other":
      return "bg-muted text-foreground/70";
    default:
      // Custom label fallback — neutral
      return "bg-muted text-foreground/70";
  }
};

export const groupLabelText = (key: string | null | undefined): string => {
  if (!key) return "";
  const preset = GROUP_PRESETS.find((g) => g.key === key);
  if (preset) return preset.label;
  // Custom label — show as-is, capitalized
  return key.charAt(0).toUpperCase() + key.slice(1);
};
