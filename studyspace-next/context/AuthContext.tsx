import { createContext, useContext, useEffect, useState } from "react";
import { auth } from "../lib/firebase-auth";
import { onAuthStateChanged, signOut, User } from "firebase/auth";
import { ApiError, getMyProfile, verifyAndGetUser } from "@/lib/api";

interface AuthContextType {
  user: User | null;
  loading: boolean;
  isBanned: boolean;
  banReason: string | null;
  logout: () => Promise<void>;
  isPremium: boolean;
  subscriptionTier: 'free' | 'pro' | 'max';
  profileRole: string | null;
  hasElevatedAccess: boolean;
}

const AuthContext = createContext<AuthContextType | null>(null);

function normalizeProfileRole(role: unknown): string | null {
  if (typeof role !== 'string') return null;
  const normalized = role.trim().toUpperCase();
  return normalized || null;
}

function normalizeSubscriptionTier(tier: unknown): 'free' | 'pro' | 'max' {
  if (tier === 'pro' || tier === 'max') {
    return tier;
  }
  return 'free';
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

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [isBanned, setIsBanned] = useState(false);
  const [banReason, setBanReason] = useState<string | null>(null);
  const [isPremium, setIsPremium] = useState(false); // [NEW]
  const [subscriptionTier, setSubscriptionTier] = useState<'free' | 'pro' | 'max'>('free');
  const [profileRole, setProfileRole] = useState<string | null>(null);
  const [hasElevatedAccess, setHasElevatedAccess] = useState(false);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (firebaseUser) => {
      setUser(firebaseUser);

      if (!firebaseUser) {
        setIsBanned(false);
        setBanReason(null);
        setIsPremium(false);
        setSubscriptionTier('free');
        setProfileRole(null);
        setHasElevatedAccess(false);
        setLoading(false);
        return;
      }

      setLoading(true);

      try {
        // Parallel fetch for user info and subscription status
        const [userInfo, profileResult] = await Promise.all([
          verifyAndGetUser(),
          getMyProfile(),
        ]);
        const userRow = profileResult?.profile;
        const normalizedRole = normalizeProfileRole(userRow?.role);

        if (userInfo.isBanned) {
          setIsBanned(true);
          setBanReason(userInfo.banReason || 'You have been banned by an administrator');
        } else {
          setIsBanned(false);
          setBanReason(null);
        }

        // Check subscription validity
        let tier: 'free' | 'pro' | 'max' = 'free';
        if (userRow?.subscription_tier && userRow.subscription_tier !== 'free') {
          const endDate = userRow.subscription_end_date
            ? new Date(userRow.subscription_end_date)
            : null;
          if (!endDate || endDate > new Date()) {
            tier = normalizeSubscriptionTier(userRow.subscription_tier);
          }
        }
        setSubscriptionTier(tier);
        setIsPremium(tier !== 'free');
        setProfileRole(normalizedRole);
        setHasElevatedAccess(hasElevatedProfileAccess(userRow));
      } catch (error) {
        console.error('Error fetching user status:', error);

        if (error instanceof ApiError && error.status === 403) {
          const reason =
            (typeof error.payload?.reason === 'string' && error.payload.reason.trim()) ||
            (typeof error.payload?.message === 'string' && error.payload.message.trim()) ||
            'You have been banned by an administrator';
          setIsBanned(true);
          setBanReason(reason);
        } else {
          setIsBanned(false);
          setBanReason(null);
        }

        setIsPremium(false);
        setSubscriptionTier('free');
        setProfileRole(null);
        setHasElevatedAccess(false);
      } finally {
        setLoading(false);
      }
    });

    return () => unsub();
  }, []);

  const logout = async () => {
    await signOut(auth);
    setIsBanned(false);
    setBanReason(null);
    setIsPremium(false);
    setSubscriptionTier('free');
    setProfileRole(null);
    setHasElevatedAccess(false);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        isBanned,
        banReason,
        logout,
        isPremium,
        subscriptionTier,
        profileRole,
        hasElevatedAccess,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside AuthProvider");
  return ctx;
};
