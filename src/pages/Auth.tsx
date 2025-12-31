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
} from "lucide-react";

import { toast } from "sonner";

import { auth, db } from "../firebase";
import { GoogleAuthProvider, signInWithPopup } from "firebase/auth";
import { doc, setDoc } from "firebase/firestore";
import { useAuth } from "@/context/AuthContext";

const Auth = () => {
  const navigate = useNavigate();
  const { user, loading } = useAuth();

  const [isLogin, setIsLogin] = useState(true);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
  });

  const selectedCollege = JSON.parse(
    localStorage.getItem("selectedCollege") || "{}"
  );

  // Redirect to /study when user is authenticated
  useEffect(() => {
    if (!loading && user) {
      navigate("/study", { replace: true });
    }
  }, [user, loading, navigate]);

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
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.email || !formData.password) {
      toast.error("Please fill in all required fields");
      return;
    }

    if (!isLogin && !formData.name) {
      toast.error("Please enter your name");
      return;
    }

    toast.success(isLogin ? "Logged in (mock)" : "Account created (mock)");
  };

  return (
    <div className="min-h-screen bg-gradient-hero flex items-center justify-center p-4">
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
                  type="password"
                  placeholder="Password"
                  value={formData.password}
                  onChange={(e) =>
                    setFormData({ ...formData, password: e.target.value })
                  }
                  className="pl-10"
                />
              </div>

              <Button type="submit" className="w-full">
                {isLogin ? "Sign in" : "Sign up"}
              </Button>
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