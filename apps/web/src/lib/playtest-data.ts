export const playtestIssueSeverities = [
  "critical",
  "major",
  "polish",
] as const;

export type PlaytestIssueSeverity = (typeof playtestIssueSeverities)[number];

export const playtestFocusAreas = [
  "combat",
  "readability",
  "co-op",
  "progression",
  "ui",
  "stability",
] as const;

export type PlaytestFocusArea = (typeof playtestFocusAreas)[number];

export const playtestSeverityLabels: Record<PlaytestIssueSeverity, string> = {
  critical: "Critical",
  major: "Major",
  polish: "Polish",
};

export const playtestFocusLabels: Record<PlaytestFocusArea, string> = {
  combat: "Combat",
  readability: "Readability",
  "co-op": "Co-op",
  progression: "Progression",
  ui: "UI",
  stability: "Stability",
};