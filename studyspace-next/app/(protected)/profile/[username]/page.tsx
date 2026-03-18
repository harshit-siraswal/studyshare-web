import type { Metadata } from "next";
import { UserProfileClient } from "@/components/UserProfileClient";

export const metadata: Metadata = {
  title: "Profile",
};

export default function UserProfilePage() {
  return <UserProfileClient />;
}
