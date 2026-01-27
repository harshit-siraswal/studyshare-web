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
}

const AuthContext = createContext<AuthContextType | null>(null);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [isBanned, setIsBanned] = useState(false);
  const [banReason, setBanReason] = useState<string | null>(null);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (firebaseUser) => {
      setUser(firebaseUser);

      // Set loading to false immediately so navigation can proceed
      // This fixes the redirect issue where the app was stuck showing "Welcome back"
      setLoading(false);

      // Check ban status asynchronously (non-blocking)
      if (firebaseUser) {
        try {
          const userInfo = await verifyAndGetUser();
          if (userInfo.isBanned) {
            setIsBanned(true);
            setBanReason(userInfo.banReason || 'You have been banned by an administrator');
          } else {
            setIsBanned(false);
            setBanReason(null);
          }
        } catch (error) {
          console.error('Error checking ban status:', error);
          setIsBanned(false);
          setBanReason(null);
        }
      } else {
        setIsBanned(false);
        setBanReason(null);
      }
    });

    return () => unsub();
  }, []);

  const logout = async () => {
    await signOut(auth);
    setIsBanned(false);
    setBanReason(null);
  };

  return (
    <AuthContext.Provider value={{ user, loading, isBanned, banReason, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside AuthProvider");
  return ctx;
};
