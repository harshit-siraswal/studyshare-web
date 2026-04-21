import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, CheckCircle2 } from "lucide-react";

import { SEO } from "@/components/SEO";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { auth } from "@/firebase";

const EmailVerified = () => {
  const navigate = useNavigate();

  useEffect(() => {
    if (!auth?.currentUser) {
      return;
    }

    void auth.signOut().catch((error) => {
      console.error("Failed to sign out after email verification:", error);
    });
  }, []);

  return (
    <div className="min-h-screen bg-gradient-hero flex items-center justify-center p-4">
      <SEO
        title="Email Verified"
        description="Your StudyShare email has been verified. Sign in again to continue."
        noIndex
      />
      <div className="w-full max-w-md">
        <Button
          variant="ghost"
          className="mb-6 text-muted-foreground"
          onClick={() => navigate("/auth", { replace: true })}
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to sign in
        </Button>

        <Card>
          <CardHeader className="text-center">
            <div className="mb-4 flex justify-center">
              <div className="rounded-2xl bg-emerald-500 p-3">
                <CheckCircle2 className="h-7 w-7 text-white" />
              </div>
            </div>
            <CardTitle>Thank you</CardTitle>
            <CardDescription className="mt-2">
              Your email has been verified successfully.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-center text-sm text-muted-foreground">
              Please try logging in again to continue to StudyShare.
            </p>

            <Button
              className="w-full"
              onClick={() => navigate("/auth", { replace: true })}
            >
              Go to Sign in
            </Button>

            <Button
              variant="outline"
              className="w-full"
              onClick={() => navigate("/", { replace: true })}
            >
              Back to Home
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default EmailVerified;
