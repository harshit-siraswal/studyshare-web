import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

import {
  GraduationCap,
  Mail,
  Lock,
  User,
  ArrowLeft,
  Eye,
  EyeOff,
} from "lucide-react";

import { toast } from "sonner";

import { auth, db } from "../firebase";
import {
  GoogleAuthProvider,
  signInWithPopup,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  updateProfile,
  sendEmailVerification,
  sendPasswordResetEmail
} from "firebase/auth";
import { doc, setDoc } from "firebase/firestore";
import { useAuth } from "@/context/AuthContext";
import { SEO } from "@/components/SEO";

const Auth = () => {
  const navigate = useNavigate();
  const { user, loading, isBanned, banReason, logout } = useAuth();

  const [isLogin, setIsLogin] = useState(true);
  const [verificationPending, setVerificationPending] = useState(false);
  const [resendingEmail, setResendingEmail] = useState(false);
  const [forgotPasswordMode, setForgotPasswordMode] = useState(false);
  const [sendingResetEmail, setSendingResetEmail] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
  });

  const selectedCollege = JSON.parse(
    localStorage.getItem("selectedCollege") || "{}"
  );

  // Redirect to /study only when user is authenticated, email verified, AND NOT banned
  useEffect(() => {
    if (!loading && user) {
      // Don't redirect if user is banned - they'll see the ban message
      if (isBanned) {
        return;
      }

      // Google auth users are auto-verified, email/password users need to verify
      if (user.emailVerified) {
        navigate("/study", { replace: true });
      } else {
        // User exists but email not verified - show verification pending
        setVerificationPending(true);
      }
    }
  }, [user, loading, isBanned, navigate]);

  // Handle resend verification email
  const handleResendVerification = async () => {
    if (!user) return;

    setResendingEmail(true);
    try {
      await sendEmailVerification(user);
      toast.success("Verification email sent! Check your inbox.");
    } catch (error: any) {
      console.error("Resend error:", error);
      if (error.code === "auth/too-many-requests") {
        toast.error("Too many requests. Please wait a few minutes.");
      } else {
        toast.error("Failed to send verification email");
      }
    } finally {
      setResendingEmail(false);
    }
  };

  // Refresh user to check if verified
  const handleCheckVerification = async () => {
    if (!user) return;

    try {
      await user.reload();
      if (user.emailVerified) {
        toast.success("Email verified! Redirecting...");
        navigate("/study", { replace: true });
      } else {
        toast.info("Email not verified yet. Check your inbox.");
      }
    } catch (error) {
      console.error("Reload error:", error);
      toast.error("Please try again");
    }
  };

  /* ---------------------------------------------------------------- */
  /* 🔵 GOOGLE LOGIN — FIREBASE ONLY */
  /* ---------------------------------------------------------------- */
  const handleGoogleLogin = async () => {
    try {
      const provider = new GoogleAuthProvider();
      provider.setCustomParameters({ prompt: "select_account" });

      const result = await signInWithPopup(auth, provider);
      const user = result.user;

      const selectedCollege = JSON.parse(
        localStorage.getItem("selectedCollege") || "{}"
      );

      await setDoc(
        doc(db, "users", user.uid),
        {
          name: user.displayName || "",
          email: user.email || "",
          photoURL: user.photoURL || "",
          college: selectedCollege?.name || "",
          createdAt: new Date(),
        },
        { merge: true }
      );

      toast.success("Signed in with Google");
    } catch (err) {
      console.error(err);
      toast.error("Google sign-in failed");
    }
  };


  /* ---------------------------------------------------------------- */
  /* 🔴 EMAIL LOGIN (STILL MOCK — SAFE) */
  /* ---------------------------------------------------------------- */
  /* ---------------------------------------------------------------- */
  /* 🔵 EMAIL LOGIN — FIREBASE AUTH */
  /* ---------------------------------------------------------------- */
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.email || !formData.password) {
      toast.error("Please fill in all required fields");
      return;
    }

    if (!isLogin && !formData.name) {
      toast.error("Please enter your name");
      return;
    }

    try {
      if (isLogin) {
        // LOGIN
        await signInWithEmailAndPassword(auth, formData.email, formData.password);
        toast.success("Welcome back!");
      } else {
        // SIGN UP
        const userCredential = await createUserWithEmailAndPassword(
          auth,
          formData.email,
          formData.password
        );
        const user = userCredential.user;

        // Update profile name
        await updateProfile(user, {
          displayName: formData.name,
        });

        // Save to Firestore (matching Google Login pattern)
        const selectedCollege = JSON.parse(
          localStorage.getItem("selectedCollege") || "{}"
        );

        await setDoc(
          doc(db, "users", user.uid),
          {
            name: formData.name,
            email: user.email || "",
            photoURL: "",
            college: selectedCollege?.name || "",
            createdAt: new Date(),
          },
          { merge: true }
        );

        // Send verification email
        await sendEmailVerification(user);

        toast.success("Account created! Check your email to verify.");
        setVerificationPending(true);
      }
    } catch (error: any) {
      console.error("Auth error:", error);
      if (error.code === "auth/email-already-in-use") {
        toast.error("Email is already registered");
      } else if (error.code === "auth/wrong-password") {
        toast.error("Invalid password");
      } else if (error.code === "auth/user-not-found") {
        toast.error("Account not found");
      } else if (error.code === "auth/weak-password") {
        toast.error("Password should be at least 6 characters");
      } else {
        toast.error(error.message || "Authentication failed");
      }
    }
  };

  // Show verification pending UI if user exists but email not verified
  if (verificationPending && user && !user.emailVerified) {
    return (
      <div className="min-h-screen bg-gradient-hero flex items-center justify-center p-4">
        <SEO
          title="Verify Email"
          description="Verify your email to access your StudyShare account."
          noIndex
        />
        <div className="w-full max-w-md">
          <Card>
            <CardHeader className="text-center">
              <div className="flex justify-center mb-4">
                <div className="p-3 rounded-2xl bg-amber-500">
                  <Mail className="w-7 h-7 text-white" />
                </div>
              </div>
              <CardTitle>Verify Your Email</CardTitle>
              <CardDescription className="mt-2">
                We've sent a verification email to:
                <span className="block mt-2 font-medium text-foreground">
                  {user.email}
                </span>
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-muted-foreground text-center">
                Click the link in the email to verify your account.
                Check your spam folder if you don't see it.
              </p>

              <Button
                className="w-full"
                onClick={handleCheckVerification}
              >
                I've Verified - Continue
              </Button>

              <Button
                variant="outline"
                className="w-full"
                onClick={handleResendVerification}
                disabled={resendingEmail}
              >
                {resendingEmail ? "Sending..." : "Resend Verification Email"}
              </Button>

              <div className="text-center">
                <Button
                  variant="link"
                  onClick={async () => {
                    await auth.signOut();
                    setVerificationPending(false);
                  }}
                  className="text-muted-foreground"
                >
                  Use a different email
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  // Show banned message if user is banned
  if (isBanned && user) {
    return (
      <div className="min-h-screen bg-gradient-hero flex items-center justify-center p-4">
        <SEO
          title="Account Access Restricted"
          description="Account access status for StudyShare."
          noIndex
        />
        <div className="w-full max-w-md">
          <Card className="border-red-500/50 bg-red-50 dark:bg-red-900/20">
            <CardHeader className="text-center">
              <div className="flex justify-center mb-4">
                <div className="p-3 rounded-2xl bg-red-500">
                  <Lock className="w-7 h-7 text-white" />
                </div>
              </div>
              <CardTitle className="text-red-600 dark:text-red-400">
                Account Banned
              </CardTitle>
              <CardDescription className="text-red-500/80 dark:text-red-400/80">
                Your access to StudyShare has been suspended.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="p-4 bg-red-100 dark:bg-red-900/40 rounded-lg text-center">
                <p className="text-sm font-medium text-red-700 dark:text-red-300">
                  Reason:
                </p>
                <p className="text-sm text-red-600 dark:text-red-400 mt-1">
                  {banReason || "You have been banned by an administrator."}
                </p>
              </div>
              <p className="text-xs text-center text-muted-foreground">
                If you believe this is a mistake, please contact the administrator.
              </p>
              <Button
                variant="outline"
                className="w-full border-red-500/50 text-red-600 hover:bg-red-100"
                onClick={async () => {
                  await logout();
                  window.location.reload();
                }}
              >
                Sign Out
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-hero flex items-center justify-center p-4">
      <SEO
        title="Sign In"
        description="Sign in to StudyShare with your college account to access resources, notices, chatrooms, and AI study tools."
        noIndex
      />
      <div className="w-full max-w-md">
        {/* Back button */}
        <Button
          variant="ghost"
          className="mb-6 text-muted-foreground"
          onClick={() => navigate("/")}
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to college selection
        </Button>

        <Card>
          <CardHeader className="text-center">
            <div className="flex justify-center mb-4">
              <div className="p-3 rounded-2xl bg-primary">
                <GraduationCap className="w-7 h-7 text-white" />
              </div>
            </div>

            <CardTitle>
              {isLogin ? "Welcome back" : "Create account"}
            </CardTitle>

            <CardDescription>
              {selectedCollege?.name && (
                <span className="block mt-2 text-primary font-medium">
                  {selectedCollege.name}
                </span>
              )}
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-4">
            {/* Google Login */}
            <Button
              type="button"
              variant="outline"
              className="w-full h-11"
              onClick={handleGoogleLogin}
            >
              Continue with Google
            </Button>

            <div className="text-center text-xs text-muted-foreground">
              Or continue with email
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              {!isLogin && (
                <div className="relative">
                  <User className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Full name"
                    value={formData.name}
                    onChange={(e) =>
                      setFormData({ ...formData, name: e.target.value })
                    }
                    className="pl-10"
                  />
                </div>
              )}

              <div className="relative">
                <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  type="email"
                  placeholder="Email"
                  value={formData.email}
                  onChange={(e) =>
                    setFormData({ ...formData, email: e.target.value })
                  }
                  className="pl-10"
                />
              </div>

              <div className="relative">
                <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  type={showPassword ? "text" : "password"}
                  placeholder="Password"
                  value={formData.password}
                  onChange={(e) =>
                    setFormData({ ...formData, password: e.target.value })
                  }
                  className="pl-10 pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-3 text-muted-foreground hover:text-foreground"
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </button>
              </div>

              {isLogin && !forgotPasswordMode && (
                <div className="text-left">
                  <Button
                    type="button"
                    variant="link"
                    className="text-sm text-muted-foreground hover:text-primary p-0 h-auto"
                    onClick={() => setForgotPasswordMode(true)}
                  >
                    Forgot password?
                  </Button>
                </div>
              )}

              {forgotPasswordMode ? (
                <div className="space-y-3">
                  <Button
                    type="button"
                    className="w-full"
                    disabled={sendingResetEmail || !formData.email}
                    onClick={async () => {
                      if (!formData.email) {
                        toast.error("Please enter your email");
                        return;
                      }
                      setSendingResetEmail(true);
                      try {
                        await sendPasswordResetEmail(auth, formData.email);
                        toast.success("Password reset email sent! Check your inbox.");
                        setForgotPasswordMode(false);
                      } catch (error: any) {
                        console.error("Reset error:", error);
                        if (error.code === "auth/user-not-found") {
                          toast.error("No account found with this email");
                        } else if (error.code === "auth/too-many-requests") {
                          toast.error("Too many requests. Please wait.");
                        } else {
                          toast.error("Failed to send reset email");
                        }
                      } finally {
                        setSendingResetEmail(false);
                      }
                    }}
                  >
                    {sendingResetEmail ? "Sending..." : "Send Reset Email"}
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    className="w-full"
                    onClick={() => setForgotPasswordMode(false)}
                  >
                    Back to Sign in
                  </Button>
                </div>
              ) : (
                <Button type="submit" className="w-full">
                  {isLogin ? "Sign in" : "Sign up"}
                </Button>
              )}
            </form>

            <div className="text-center text-sm">
              {isLogin ? "Don't have an account?" : "Already have an account?"}
              <Button
                variant="link"
                onClick={() => setIsLogin(!isLogin)}
              >
                {isLogin ? "Sign up" : "Sign in"}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Auth;
