import type { Metadata } from "next";
import { StudyClient } from "@/components/StudyClient";

export const metadata: Metadata = {
  title: "Study",
};

export default function StudyPage() {
  return <StudyClient />;
}
