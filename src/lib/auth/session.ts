import { createClient } from '@/lib/supabase/server';

export interface UserSession {
  userId: string;
  email?: string;
  businessId: string;
  fullName: string;
  role: string;
}

/**
 * Returns the current authenticated session and associated business.
 * For local development/demo when Supabase is not yet configured,
 * it returns a fallback demo session so the application can be explored and tested.
 */
export async function getSession(): Promise<UserSession | null> {
  const supabase = await createClient();
  const { data: { user }, error } = await supabase.auth.getUser();

  if (error || !user) {
    // If running in development without live Supabase auth configured,
    // provide a development session for local UI & workflow testing
    if (process.env.NODE_ENV === 'development' || !process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL.includes('placeholder')) {
      return {
        userId: '00000000-0000-0000-0000-000000000000',
        email: 'owner@tazqor.com',
        businessId: '00000000-0000-0000-0000-000000000001',
        fullName: 'TAZQOR Owner',
        role: 'admin',
      };
    }
    return null;
  }

  // Fetch business profile
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

export async function requireAuth(): Promise<UserSession> {
  const session = await getSession();
  if (!session) {
    throw new Error('Unauthorized');
  }
  return session;
}

