import type { Metadata } from "next";
import { ChatPostDetailClient } from "@/components/ChatPostDetailClient";

export const metadata: Metadata = { title: "Post" };

export default function ChatPostDetailPage() {
  return <ChatPostDetailClient />;
}
