import { BimaApp } from "../../page";

export default async function ManageShortLinkPage({ params }: { params: Promise<{ code: string }> }) {
  const { code } = await params;
  return <BimaApp initialManageShortCode={code} />;
}
