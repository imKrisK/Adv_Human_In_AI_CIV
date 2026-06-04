import type { LiveEvent } from "@/lib/prototype-data";

export type LiveEventOverride = {
  cycleAnchorIso?: string;
  primaryMissionId?: string;
  windowOverrides?: Record<string, { durationMinutes: number }>;
};

export function applyEventOverride(
  base: LiveEvent,
  override: LiveEventOverride | null,
): LiveEvent {
  if (!override) return base;

  return {
    ...base,
    ...(override.cycleAnchorIso
      ? { cycleAnchorIso: override.cycleAnchorIso }
      : {}),
    ...(override.primaryMissionId
      ? { primaryMissionId: override.primaryMissionId }
      : {}),
    windows: override.windowOverrides
      ? base.windows.map((w) => {
          const wo = override.windowOverrides?.[w.id];
          return wo ? { ...w, durationMinutes: wo.durationMinutes } : w;
        })
      : base.windows,
  };
}
