import type { Metadata } from "next";
import { ChatroomClient } from "@/components/ChatroomClient";

export const metadata: Metadata = { title: "Chatroom" };

export default function ChatroomRoomPage() {
  return <ChatroomClient />;
}
