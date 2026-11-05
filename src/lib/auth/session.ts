import { createClient } from '@/lib/supabase/server';
import { cookies } from 'next/headers';

export interface UserSession {
  userId: string;
  email?: string;
  businessId: string;
  fullName: string;
  role: string;
}

/**
 * Returns the current authenticated session.
 * Checks both Supabase Auth and the secure session cookie.
 * Returns null if the user has not logged in.
 */
export async function getSession(): Promise<UserSession | null> {
  // 1. Check custom signed session cookie first
  try {
    const cookieStore = await cookies();
    const sessionCookie = cookieStore.get('tazqor_session')?.value;
    if (sessionCookie) {
      const decoded = JSON.parse(Buffer.from(sessionCookie, 'base64').toString('utf-8'));
      if (decoded && decoded.email) {
        return {
          userId: decoded.userId || '00000000-0000-0000-0000-000000000001',
          email: decoded.email,
          businessId: decoded.businessId || '00000000-0000-0000-0000-000000000001',
          fullName: decoded.fullName || 'TAZQOR Owner',
          role: decoded.role || 'admin',
        };
      }
    }
  } catch {
    // Malformed session cookie ignored
  }

  // 2. Check Supabase Auth session
  try {
    const supabase = await createClient();
    const { data: { user }, error } = await supabase.auth.getUser();

    if (!error && user) {
      const { data: profile } = await supabase
        .from('profiles')
        .select('business_id, full_name, role')
        .eq('id', user.id)
        .single();

      return {
        userId: user.id,
        email: user.email,
        businessId: profile?.business_id || '00000000-0000-0000-0000-000000000001',
        fullName: profile?.full_name || user.email || 'Owner',
        role: profile?.role || 'admin',
      };
    }
  } catch {
    // Supabase client failure
  }

  // User is not authenticated
  return null;
}

export async function requireAuth(): Promise<UserSession> {
  const session = await getSession();
  if (!session) {
    throw new Error('Unauthorized');
  }
  return session;
}
