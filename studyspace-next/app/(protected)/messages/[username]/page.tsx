import type { Metadata } from "next";
import { MessageThreadClient } from "@/components/MessageThreadClient";

export const metadata: Metadata = { title: "Messages" };

export default function MessageThreadPage() {
  return <MessageThreadClient />;
}
