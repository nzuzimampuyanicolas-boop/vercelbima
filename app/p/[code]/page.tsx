import { BimaApp } from "../../page";

export default async function ParticipantShortLinkPage({ params }: { params: Promise<{ code: string }> }) {
  const { code } = await params;
  return <BimaApp initialParticipantShortCode={code} />;
}
