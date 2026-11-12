import { getSession, type UserSession } from "@/lib/auth/session";
import { createAdminClient, createClient } from "@/lib/supabase/server";

type ServerDbResult =
  | { ok: true; session: UserSession; db: NonNullable<ReturnType<typeof createAdminClient>> | Awaited<ReturnType<typeof createClient>>; isAdmin: boolean }
  | { ok: false; status: 401; error: string };

/**
 * Verifies the user session and returns a privileged Supabase client when
 * SUPABASE_SERVICE_ROLE_KEY is configured, falling back to the cookie-scoped SSR client.
 */
export async function getAuthenticatedRouteDb(): Promise<ServerDbResult> {
  const session = await getSession();
  if (!session) {
    return { ok: false, status: 401, error: "Authentication required" };
  }

  const admin = createAdminClient();
  if (admin) {
    return { ok: true, session, db: admin, isAdmin: true };
  }

  const ssrClient = await createClient();
  return { ok: true, session, db: ssrClient, isAdmin: false };
}

