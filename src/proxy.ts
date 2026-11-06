import { NextResponse, type NextRequest } from "next/server";
import { SESSION_COOKIE, isValidSession } from "@/lib/auth";

export async function proxy(request: NextRequest) {
  // Server Actions check the session themselves and answer with a readable
  // error; redirecting their POST here would only surface as a network failure.
  const isServerAction = request.method === "POST" && request.headers.has("next-action");
  if (isServerAction || (await isValidSession(request.cookies.get(SESSION_COOKIE)?.value))) {
    return NextResponse.next();
  }
  const loginUrl = new URL("/login", request.url);
  const next = request.nextUrl.pathname + request.nextUrl.search;
  if (next !== "/") loginUrl.searchParams.set("next", next);
  return NextResponse.redirect(loginUrl);
}

export const config = {
  matcher: [
    // The manifest and icons stay public: browsers fetch them without the session cookie.
    "/((?!login|_next/static|_next/image|favicon.ico|manifest.webmanifest|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)",
  ],
};
