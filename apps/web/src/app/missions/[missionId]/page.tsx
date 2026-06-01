import type { Metadata } from "next";
import { notFound } from "next/navigation";

import MissionPrototypePanel from "@/app/missions/mission-prototype-panel";
import { getMissionFlow, missionFlows } from "@/lib/playable-slice";

type MissionPageProps = {
  params: Promise<{ missionId: string }>;
};

export async function generateStaticParams() {
  return missionFlows.map((mission) => ({
    missionId: mission.id,
  }));
}

export async function generateMetadata({
  params,
}: MissionPageProps): Promise<Metadata> {
  const { missionId } = await params;
  const mission = getMissionFlow(missionId);

  if (!mission) {
    return {
      title: "Mission",
    };
  }

  return {
    title: mission.name,
    description: mission.overview,
  };
}

export default async function MissionPage({ params }: MissionPageProps) {
  const { missionId } = await params;
  const mission = getMissionFlow(missionId);

  if (!mission) {
    notFound();
  }

  return (
    <div className="main-shell py-10 md:py-14">
      <MissionPrototypePanel missionId={missionId} />
    </div>
  );
}