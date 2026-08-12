import { apiOptions, proxyBima } from "../_shared";

export const preferredRegion = "lhr1";

export function OPTIONS() {
  return apiOptions();
}

export function POST(request: Request) {
  return proxyBima(request, "/api/places");
}
