import { prisma } from "@/lib/db";
import { applyEventOverride, type LiveEventOverride } from "@/lib/event-config-shared";

export type { LiveEventOverride };
export { applyEventOverride };

const EVENT_CONFIG_ID = "concord-breach";

export async function readEventConfig(): Promise<LiveEventOverride | null> {
  try {
    const row = await prisma.eventConfig.findUnique({
      where: { id: EVENT_CONFIG_ID },
    });
    if (!row) return null;
    return JSON.parse(row.configJson) as LiveEventOverride;
  } catch {
    return null;
  }
}

export async function writeEventConfig(
  override: LiveEventOverride,
  updatedBy?: string,
): Promise<void> {
  await prisma.eventConfig.upsert({
    where: { id: EVENT_CONFIG_ID },
    create: {
      id: EVENT_CONFIG_ID,
      configJson: JSON.stringify(override),
      updatedBy: updatedBy ?? null,
    },
    update: {
      configJson: JSON.stringify(override),
      updatedBy: updatedBy ?? null,
    },
  });
}
