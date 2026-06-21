import { handlers } from "@/auth";
import { applyAuthUrlFromRequest } from "@/lib/auth-url";

export async function GET(request: Request) {
  applyAuthUrlFromRequest(request.url);
  return handlers.GET(request);
}

export async function POST(request: Request) {
  applyAuthUrlFromRequest(request.url);
  return handlers.POST(request);
}
