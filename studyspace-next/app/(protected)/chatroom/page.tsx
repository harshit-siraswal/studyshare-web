import type { Metadata } from "next";
import { ChatroomListClient } from "@/components/ChatroomListClient";

export const metadata: Metadata = { title: "Chatrooms" };

export default function ChatroomPage() {
  return <ChatroomListClient />;
}
