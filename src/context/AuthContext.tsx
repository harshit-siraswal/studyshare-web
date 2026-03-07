import { createContext, useContext, useEffect, useState } from "react";
import { auth } from "../firebase";
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
}

const AuthContext = createContext<AuthContextType | null>(null);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [isBanned, setIsBanned] = useState(false);
  const [banReason, setBanReason] = useState<string | null>(null);
  const [isPremium, setIsPremium] = useState(false); // [NEW]
  const [subscriptionTier, setSubscriptionTier] = useState<'free' | 'pro' | 'max'>('free');

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (firebaseUser) => {
      setUser(firebaseUser);

      if (!firebaseUser) {
        setIsBanned(false);
        setBanReason(null);
        setIsPremium(false);
        setSubscriptionTier('free');
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
            tier = userRow.subscription_tier;
          }
        }
        setSubscriptionTier(tier);
        setIsPremium(tier !== 'free');
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
  };

  return (
    <AuthContext.Provider value={{ user, loading, isBanned, banReason, logout, isPremium, subscriptionTier }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside AuthProvider");
  return ctx;
};
