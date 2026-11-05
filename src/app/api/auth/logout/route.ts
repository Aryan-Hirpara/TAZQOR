import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

export async function POST(request: NextRequest) {
  try {
    const cookieStore = await cookies();
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://ghkwaxnipetdcleyzsvs.supabase.co";
    const supabaseAnonKey =
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
      process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
      "placeholder";

    try {
      const supabase = createServerClient(supabaseUrl, supabaseAnonKey, {
        cookies: {
          getAll() {
            return cookieStore.getAll();
          },
          setAll(cookiesToSet) {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          },
        },
      });
      await supabase.auth.signOut();
    } catch {
      // Supabase sign-out best effort
    }

    const response = NextResponse.json({ success: true });

    // Clear session cookies
    response.cookies.set({
      name: "tazqor_session",
      value: "",
      httpOnly: true,
      path: "/",
      maxAge: 0,
      expires: new Date(0),
    });

    return response;
  } catch (err: any) {
    return NextResponse.json({ error: "Logout failed" }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  const res = NextResponse.redirect(new URL("/login", request.url));
  res.cookies.set({
    name: "tazqor_session",
    value: "",
    httpOnly: true,
    path: "/",
    maxAge: 0,
    expires: new Date(0),
  });
  return res;
}

