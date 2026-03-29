import { useQuery } from '@tanstack/react-query';
import { getMyProfile } from '@/lib/api';
import { useAuth } from '@/context/AuthContext';

function normalizeProfileRole(role: unknown): string | null {
  if (typeof role !== 'string') return null;
  const normalized = role.trim().toUpperCase();
  return normalized || null;
}

function hasElevatedProfileAccess(profile: any): boolean {
  const normalizedRole = normalizeProfileRole(profile?.role);
  if (normalizedRole === 'TEACHER' || normalizedRole === 'ADMIN' || normalizedRole === 'MODERATOR') {
    return true;
  }

  const capabilities = profile?.admin_capabilities;
  if (capabilities && typeof capabilities === 'object') {
    return Object.values(capabilities).some((value) => value === true);
  }

  return Boolean(profile?.scope_all_colleges) || Boolean(profile?.admin_college_id);
}

function resolveSubscriptionTier(profile: any): 'free' | 'pro' | 'max' {
  const rawTier = typeof profile?.subscription_tier === 'string'
    ? profile.subscription_tier.trim().toLowerCase()
    : '';

  if (rawTier !== 'pro' && rawTier !== 'max') {
    return 'free';
  }

  const endDate = profile?.subscription_end_date
    ? new Date(profile.subscription_end_date)
    : null;

  if (!endDate || endDate > new Date()) {
    return rawTier;
  }

  return 'free';
}

export function useEntitlements() {
  const { user } = useAuth();

  const query = useQuery({
    queryKey: ['entitlements', user?.uid],
    queryFn: getMyProfile,
    enabled: !!user,
    staleTime: 5 * 60 * 1000,
    retry: 1,
  });

  const profile = query.data?.profile ?? null;
  const subscriptionTier = resolveSubscriptionTier(profile);
  const isPremium = subscriptionTier !== 'free';
  const hasElevatedAccess = hasElevatedProfileAccess(profile);

  return {
    ...query,
    profile,
    isPremium,
    subscriptionTier,
    subscriptionEndDate: profile?.subscription_end_date ?? null,
    hasElevatedAccess,
    adminCapabilities: profile?.admin_capabilities ?? null,
    scopeAllColleges: Boolean(profile?.scope_all_colleges),
    adminCollegeId: profile?.admin_college_id ?? null,
  };
}

export default useEntitlements;
