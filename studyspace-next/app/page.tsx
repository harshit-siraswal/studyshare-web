import type { Metadata } from "next";
import { SelectCollegeClient } from "@/components/SelectCollegeClient";

export const metadata: Metadata = {
  title: "Select Your College",
  description: "Choose your college to get started on Studyspace.",
};

export default function LandingPage() {
  return <SelectCollegeClient />;
}
