import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

// Keeps the Supabase session cookie fresh and protects private pages.
export async function updateSession(request: NextRequest) {
  // Safety net: if the login provider sends the user to "/?code=..." instead of
  // "/auth/callback?code=...", forward the code so the login still completes.
  const code = request.nextUrl.searchParams.get("code");
  if (code && request.nextUrl.pathname === "/") {
    const callback = request.nextUrl.clone();
    callback.pathname = "/auth/callback";
    callback.search = `?code=${encodeURIComponent(code)}&next=/`;
    return NextResponse.redirect(callback);
  }

  let response = NextResponse.next({ request });

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) return response;

  const supabase = createServerClient(url, key, {
    cookies: {
      getAll: () => request.cookies.getAll(),
      setAll: (list) => {
        list.forEach(({ name, value }) => request.cookies.set(name, value));
        response = NextResponse.next({ request });
        list.forEach(({ name, value, options }) => response.cookies.set(name, value, options));
      },
    },
  });

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const protectedPaths = ["/bookings", "/admin", "/profile"];
  if (!user && protectedPaths.some((p) => request.nextUrl.pathname.startsWith(p))) {
    const loginUrl = request.nextUrl.clone();
    loginUrl.pathname = "/login";
    loginUrl.search = `?next=${encodeURIComponent(request.nextUrl.pathname)}`;
    return NextResponse.redirect(loginUrl);
  }

  return response;
}
