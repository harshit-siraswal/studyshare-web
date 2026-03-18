import type { Metadata } from "next";
import { AuthClient } from "@/components/AuthClient";

export const metadata: Metadata = {
  title: "Sign In",
  description: "Sign in or create your Studyspace account.",
};

export default function AuthPage() {
  return <AuthClient />;
}
