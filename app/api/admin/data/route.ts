import { apiOptions, proxyBima } from "../../_shared";

export const preferredRegion = "lhr1";

export function OPTIONS() {
  return apiOptions();
}

export function GET(request: Request) {
  return proxyBima(request, "/api/admin/data");
}
