'use client';

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, Check, CheckCheck, Image, MessageSquare, MoreVertical, Paperclip, Phone, Send, Smile, Video } from "lucide-react";
import { mockChats, mockMessages, type MockMessage } from "@/lib/mockMessages";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

export function MessageThreadClient() {
  const params = useParams();
  const router = useRouter();
  const username = String(params.username || "").trim();
  const currentChat = useMemo(
    () => mockChats.find((chat) => chat.username === username),
    [username],
  );

  const [newMessage, setNewMessage] = useState("");
  const [messages, setMessages] = useState<MockMessage[]>([]);
  const scrollRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!username) {
      router.replace("/messages");
      return;
    }

    setMessages(mockMessages[username] || []);
  }, [router, username]);

  useEffect(() => {
    const node = scrollRef.current;
    if (!node) return;
    node.scrollTop = node.scrollHeight;
  }, [messages]);

  function handleSendMessage() {
    const content = newMessage.trim();
    if (!content) return;

    setMessages((prev) => [
      ...prev,
      {
        id: prev.length + 1,
        content,
        sender: "me",
        time: new Date().toLocaleTimeString("en-US", {
          hour: "numeric",
          minute: "2-digit",
        }),
        status: "sent",
      },
    ]);
    setNewMessage("");
  }

  if (!currentChat) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-background px-4">
        <Card className="w-full max-w-lg border-border/60">
          <CardContent className="space-y-3 p-8 text-center">
            <MessageSquare className="mx-auto h-10 w-10 text-muted-foreground" />
            <h1 className="text-2xl font-semibold">Conversation not found</h1>
            <p className="text-sm text-muted-foreground">
              That legacy message thread does not exist anymore.
            </p>
            <Button asChild>
              <Link href="/messages">Back to messages</Link>
            </Button>
          </CardContent>
        </Card>
      </main>
    );
  }

  return (
    <main className="flex min-h-screen flex-col bg-background">
      <header className="sticky top-0 z-30 border-b border-border bg-background/90 backdrop-blur-xl">
        <div className="mx-auto flex w-full max-w-5xl items-center gap-3 px-4 py-3 sm:px-6 lg:px-8">
          <Button variant="ghost" size="icon" asChild>
            <Link href="/messages">
              <ArrowLeft className="h-5 w-5" />
            </Link>
          </Button>

          <Link
            href={`/profile/${encodeURIComponent(currentChat.username)}`}
            className="flex min-w-0 flex-1 items-center gap-3"
          >
            <div className="relative">
              <Avatar className="h-11 w-11 border">
                <AvatarFallback className="bg-primary/10 text-primary">
                  {currentChat.name.slice(0, 1).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              {currentChat.online ? (
                <span className="absolute bottom-0 right-0 h-3 w-3 rounded-full border-2 border-background bg-emerald-500" />
              ) : null}
            </div>
            <div className="min-w-0">
              <h1 className="truncate font-semibold">{currentChat.name}</h1>
              <p className="truncate text-xs text-muted-foreground">
                {currentChat.online ? "Online" : "Offline"} • Mock legacy thread
              </p>
            </div>
          </Link>

          <div className="flex items-center gap-1">
            <Button variant="ghost" size="icon">
              <Phone className="h-5 w-5" />
            </Button>
            <Button variant="ghost" size="icon">
              <Video className="h-5 w-5" />
            </Button>
            <Button variant="ghost" size="icon">
              <MoreVertical className="h-5 w-5" />
            </Button>
          </div>
        </div>
      </header>

      <section className="mx-auto flex w-full max-w-5xl flex-1 flex-col px-4 py-4 sm:px-6 lg:px-8">
        <Card className="flex min-h-[calc(100vh-180px)] flex-1 flex-col overflow-hidden border-border/60">
          <CardContent className="flex min-h-0 flex-1 flex-col p-0">
            <div ref={scrollRef} className="flex-1 space-y-4 overflow-y-auto px-4 py-5 sm:px-6">
              {messages.map((message) => (
                <div
                  key={`${message.id}-${message.time}`}
                  className={cn(
                    "flex",
                    message.sender === "me" ? "justify-end" : "justify-start",
                  )}
                >
                  <div
                    className={cn(
                      "max-w-[85%] rounded-2xl px-4 py-3 text-sm shadow-sm sm:max-w-[70%]",
                      message.sender === "me"
                        ? "rounded-br-md bg-primary text-primary-foreground"
                        : "rounded-bl-md bg-muted text-foreground",
                    )}
                  >
                    <p className="whitespace-pre-wrap">{message.content}</p>
                    <div
                      className={cn(
                        "mt-2 flex items-center gap-1 text-[11px]",
                        message.sender === "me" ? "justify-end text-primary-foreground/80" : "text-muted-foreground",
                      )}
                    >
                      <span>{message.time}</span>
                      {message.sender === "me" ? (
                        message.status === "read" ? (
                          <CheckCheck className="h-3 w-3 text-sky-300" />
                        ) : (
                          <Check className="h-3 w-3" />
                        )
                      ) : null}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="border-t border-border bg-background px-4 py-4 sm:px-6">
              <div className="flex items-center gap-2">
                <Button variant="ghost" size="icon" className="shrink-0">
                  <Smile className="h-5 w-5" />
                </Button>
                <Button variant="ghost" size="icon" className="shrink-0">
                  <Paperclip className="h-5 w-5" />
                </Button>
                <Input
                  value={newMessage}
                  onChange={(event) => setNewMessage(event.target.value)}
                  onKeyDown={(event) => {
                    if (event.key === "Enter") {
                      event.preventDefault();
                      handleSendMessage();
                    }
                  }}
                  placeholder="Type a message..."
                  className="flex-1"
                />
                <Button variant="ghost" size="icon" className="shrink-0">
                  <Image className="h-5 w-5" />
                </Button>
                <Button
                  type="button"
                  size="icon"
                  onClick={handleSendMessage}
                  disabled={!newMessage.trim()}
                  className="shrink-0"
                >
                  <Send className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </section>
    </main>
  );
}
