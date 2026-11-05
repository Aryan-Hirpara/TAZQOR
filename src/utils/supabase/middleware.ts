import { createServerClient } from "@supabase/ssr";
import { type NextRequest, NextResponse } from "next/server";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://ghkwaxnipetdcleyzsvs.supabase.co";
const supabaseKey =
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
  "placeholder_key";

export const updateSession = async (request: NextRequest) => {
  const { pathname } = request.nextUrl;

  // Create an unmodified response
  let supabaseResponse = NextResponse.next({
    request: {
      headers: request.headers,
    },
  });

  let user = null;

  try {
    const supabase = createServerClient(supabaseUrl, supabaseKey, {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
          supabaseResponse = NextResponse.next({
            request,
          });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
        },
      },
    });

    const { data } = await supabase.auth.getUser();
    user = data?.user || null;
  } catch {
    // Supabase auth check notice
  }

  // Check custom session cookie
  const customSessionCookie = request.cookies.get("tazqor_session")?.value;
  let hasValidCustomSession = false;

  if (customSessionCookie) {
    try {
      const decoded = JSON.parse(Buffer.from(customSessionCookie, "base64").toString("utf-8"));
      if (decoded && decoded.email) {
        hasValidCustomSession = true;
      }
    } catch {
      // invalid cookie
    }
  }

  const isAuthenticated = !!(user || hasValidCustomSession);
  const isLoginPage = pathname === "/login";

  // If already authenticated and trying to visit login page -> redirect to dashboard
  if (isAuthenticated && isLoginPage) {
    const redirectUrl = new URL("/dashboard", request.url);
    return NextResponse.redirect(redirectUrl);
  }

  // If visiting root '/'
  if (pathname === "/") {
    const target = isAuthenticated ? "/dashboard" : "/login";
    return NextResponse.redirect(new URL(target, request.url));
  }

  // If NOT authenticated and visiting any protected page -> redirect to /login
  if (!isAuthenticated && !isLoginPage) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("returnUrl", pathname);
    return NextResponse.redirect(loginUrl);
  }

  return supabaseResponse;
};

export const createClient = updateSession;
