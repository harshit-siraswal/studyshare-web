import type { Metadata } from "next";
import { AiChatClient } from "@/components/AiChatClient";

export const metadata: Metadata = {
  title: "AI Chat",
};

export default function AiChatPage() {
  return <AiChatClient />;
}
