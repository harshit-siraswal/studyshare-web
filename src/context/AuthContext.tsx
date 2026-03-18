import { createContext, useContext, useEffect, useState } from "react";
import { auth } from "../firebase";
import { onAuthStateChanged, signOut, User as FirebaseUser } from "firebase/auth";
import { ApiError, UserInfo, getMe } from "@/lib/api";

export interface AuthUser {
  uid: string;
  email: string;
  role: string;
  collegeDomain: string | null;
  isCollegeUser: boolean;
  displayName: string;
  photoURL: string | null;
  avatarUrl: string | null;
  branch: string;
  semester: string;
  name: string;
  isBanned: boolean;
  banReason: string | null;
  emailVerified: boolean;
  reload: () => Promise<void>;
}

interface AuthContextType {
  user: AuthUser | null;
  loading: boolean;
  isBanned: boolean;
  banReason: string | null;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

function buildAuthUser(
  firebaseUser: FirebaseUser,
  me: UserInfo | null = null,
  overrides: Partial<Pick<AuthUser, "isBanned" | "banReason">> = {},
): AuthUser {
  const email = me?.email || firebaseUser.email || "";
  const displayName =
    me?.profile?.displayName?.trim() ||
    firebaseUser.displayName ||
    email.split("@")[0] ||
    "User";
  const avatarUrl =
    me?.profile?.avatarUrl?.trim() ||
    firebaseUser.photoURL ||
    null;
  const collegeDomain =
    me?.collegeDomain ??
    (email.includes("@") ? email.split("@")[1]?.toLowerCase() ?? null : null);
  const isBanned = overrides.isBanned ?? Boolean(me?.isBanned);
  const banReason = overrides.banReason ?? me?.banReason ?? null;

  return {
    uid: me?.uid || firebaseUser.uid,
    email,
    role: me?.role || "COLLEGE_USER",
    collegeDomain,
    isCollegeUser: Boolean(me?.isCollegeUser),
    displayName,
    photoURL: avatarUrl,
    avatarUrl,
    branch: me?.profile?.branch?.trim() || "",
    semester: me?.profile?.semester?.trim() || "",
    name: displayName,
    isBanned,
    banReason,
    emailVerified: firebaseUser.emailVerified,
    reload: () => firebaseUser.reload(),
  };
}

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [isBanned, setIsBanned] = useState(false);
  const [banReason, setBanReason] = useState<string | null>(null);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (firebaseUser) => {
      if (!firebaseUser) {
        setUser(null);
        setIsBanned(false);
        setBanReason(null);
        setLoading(false);
        return;
      }

      setLoading(true);

      try {
        const me = await getMe();
        const nextUser = buildAuthUser(firebaseUser, me);
        setUser(nextUser);
        setIsBanned(nextUser.isBanned);
        setBanReason(nextUser.banReason);
      } catch (error) {
        console.error("Error fetching auth identity:", error);

        if (error instanceof ApiError && error.status === 403) {
          const reason =
            (typeof error.payload?.reason === "string" && error.payload.reason.trim()) ||
            (typeof error.payload?.message === "string" && error.payload.message.trim()) ||
            "You have been banned by an administrator";
          const bannedUser = buildAuthUser(firebaseUser, null, {
            isBanned: true,
            banReason: reason,
          });
          setUser(bannedUser);
          setIsBanned(true);
          setBanReason(reason);
        } else {
          const fallbackUser = buildAuthUser(firebaseUser);
          setUser(fallbackUser);
          setIsBanned(false);
          setBanReason(null);
        }
      } finally {
        setLoading(false);
      }
    });

    return () => unsub();
  }, []);

  const logout = async () => {
    await signOut(auth);
    setUser(null);
    setIsBanned(false);
    setBanReason(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        isBanned,
        banReason,
        logout,
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
