import { BimaApp } from "../../page";

export default async function PublicEventPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  return <BimaApp initialEventSlug={slug} />;
}
