import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

// Password gate: only people with APP_USER / APP_PASSWORD can open the app.
// The values live in Vercel's Environment Variables, never in this code.
export function proxy(req: NextRequest) {
  const user = process.env.APP_USER;
  const pass = process.env.APP_PASSWORD;

  if (user && pass) {
    const auth = req.headers.get("authorization");
    if (auth?.startsWith("Basic ")) {
      const [u, ...rest] = atob(auth.slice(6)).split(":");
      if (u === user && rest.join(":") === pass) {
        return NextResponse.next();
      }
    }
  }

  return new NextResponse("Login required", {
    status: 401,
    headers: { "WWW-Authenticate": 'Basic realm="CarpetGuard", charset="UTF-8"' },
  });
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
