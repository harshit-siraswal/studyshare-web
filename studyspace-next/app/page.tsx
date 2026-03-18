import type { Metadata } from "next";
import { AdalineNavbar } from "@/components/landing/AdalineNavbar";
import { LandingScene } from "@/components/LandingScene";

export const metadata: Metadata = {
  title: "Studyspace - Your Collaborative Study Platform",
  description: "Join Studyspace to collaborate, share resources, and study smarter.",
};

export default function LandingPage() {
  return (
    <>
      <AdalineNavbar />
      <LandingScene />
    </>
  );
}
