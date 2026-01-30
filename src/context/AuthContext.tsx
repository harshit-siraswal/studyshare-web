import { createContext, useContext, useEffect, useState } from "react";
import { auth } from "../firebase";
import { onAuthStateChanged, signOut, User } from "firebase/auth";
import { verifyAndGetUser } from "@/lib/api";

interface AuthContextType {
  user: User | null;
  loading: boolean;
  isBanned: boolean;
  banReason: string | null;
  logout: () => Promise<void>;
  isPremium: boolean;
}

const AuthContext = createContext<AuthContextType | null>(null);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [isBanned, setIsBanned] = useState(false);
  const [banReason, setBanReason] = useState<string | null>(null);
  const [isPremium, setIsPremium] = useState(false); // [NEW]

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (firebaseUser) => {
      setUser(firebaseUser);

      // Set loading to false immediately so navigation can proceed
      setLoading(false);

      if (firebaseUser) {
        try {
          // Parallel fetch for user info and premium status
          const [userInfo, { data: premiumData }] = await Promise.all([
            verifyAndGetUser(),
            import("../supabase").then(({ supabase }) =>
              supabase.from('premium_users').select('premium_until').eq('id', firebaseUser.uid).maybeSingle()
            )
          ]);

          if (userInfo.isBanned) {
            setIsBanned(true);
            setBanReason(userInfo.banReason || 'You have been banned by an administrator');
          } else {
            setIsBanned(false);
            setBanReason(null);
          }

          // Check premium validity
          if (premiumData) {
            const expiryDate = new Date(premiumData.premium_until);
            setIsPremium(expiryDate > new Date());
          } else {
            setIsPremium(false);
          }
        } catch (error) {
          console.error('Error fetching user status:', error);
          setIsBanned(false);
          setBanReason(null);
          setIsPremium(false);
        }
      } else {
        setIsBanned(false);
        setBanReason(null);
        setIsPremium(false);
      }
    });

    return () => unsub();
  }, []);

  const logout = async () => {
    await signOut(auth);
    setIsBanned(false);
    setBanReason(null);
    setIsPremium(false);
  };

  return (
    <AuthContext.Provider value={{ user, loading, isBanned, banReason, logout, isPremium }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside AuthProvider");
  return ctx;
};
