import { proxyBima } from "../../../_shared";

type Context = { params: Promise<{ kind: string; code: string }> };

export async function GET(request: Request, { params }: Context) {
  const { kind, code } = await params;
  if (kind !== "manage" && kind !== "participant") {
    return Response.json({ error: "Type de lien court invalide." }, { status: 404 });
  }
  return proxyBima(
    request,
    `/api/short/${encodeURIComponent(kind)}/${encodeURIComponent(code)}`,
  );
}
