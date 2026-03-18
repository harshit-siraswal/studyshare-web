import type { Metadata } from "next";
import { NoticesClient } from "@/components/NoticesClient";

export const metadata: Metadata = {
  title: "Notices",
};

export default function NoticesPage() {
  return <NoticesClient />;
}

