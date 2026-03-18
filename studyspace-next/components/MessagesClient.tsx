'use client';

import { useMemo, useState } from "react";
import Link from "next/link";
import { ArrowLeft, MessageSquare, Search } from "lucide-react";
import { mockChats } from "@/lib/mockMessages";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

export function MessagesClient() {
  const [searchQuery, setSearchQuery] = useState("");

  const filteredChats = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    if (!query) return mockChats;

    return mockChats.filter((chat) =>
      [chat.name, chat.username, chat.lastMessage]
        .filter(Boolean)
        .some((value) => value.toLowerCase().includes(query)),
    );
  }, [searchQuery]);

  return (
    <main className="min-h-screen bg-background">
      <div className="mx-auto flex w-full max-w-5xl flex-col gap-6 px-4 py-6 sm:px-6 lg:px-8">
        <section className="flex flex-col gap-4 rounded-3xl border border-border/60 bg-card/70 p-6 shadow-sm sm:flex-row sm:items-start sm:justify-between">
          <div className="space-y-3">
            <Button variant="ghost" className="-ml-3 w-fit px-3" asChild>
              <Link href="/study">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to study
              </Link>
            </Button>
            <div className="space-y-2">
              <div className="flex flex-wrap items-center gap-2">
                <Badge variant="secondary">Messages</Badge>
                <Badge variant="outline">Legacy mock flow</Badge>
              </div>
              <h1 className="text-3xl font-semibold tracking-tight">Direct messages</h1>
              <p className="max-w-2xl text-sm text-muted-foreground sm:text-base">
                The original React app only shipped a mocked direct-message experience, so this Next.js batch ports that behavior faithfully while we keep the real social/chat work focused on chatrooms.
              </p>
            </div>
          </div>
          <Card className="border-border/60 sm:min-w-72">
            <CardContent className="grid grid-cols-2 gap-4 p-4 text-center sm:grid-cols-1 sm:text-left">
              <div>
                <div className="text-2xl font-semibold">{mockChats.length}</div>
                <div className="text-xs text-muted-foreground">Conversations</div>
              </div>
              <div>
                <div className="text-2xl font-semibold">
                  {mockChats.reduce((count, chat) => count + chat.unread, 0)}
                </div>
                <div className="text-xs text-muted-foreground">Unread</div>
              </div>
            </CardContent>
          </Card>
        </section>

        <Card className="border-border/60">
          <CardContent className="p-4">
            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={searchQuery}
                onChange={(event) => setSearchQuery(event.target.value)}
                placeholder="Search conversations"
                className="pl-9"
              />
            </div>
          </CardContent>
        </Card>

        <section className="space-y-4">
          {filteredChats.length === 0 ? (
            <Card className="border-dashed border-border/70">
              <CardContent className="flex min-h-56 flex-col items-center justify-center gap-3 p-8 text-center">
                <MessageSquare className="h-10 w-10 text-muted-foreground" />
                <div className="space-y-1">
                  <h2 className="text-xl font-semibold">No matching conversations</h2>
                  <p className="text-sm text-muted-foreground">
                    Try a broader search to bring the mock message threads back into view.
                  </p>
                </div>
              </CardContent>
            </Card>
          ) : (
            filteredChats.map((chat) => (
              <Link
                key={chat.id}
                href={`/messages/${encodeURIComponent(chat.username)}`}
                className="block"
              >
                <Card className="border-border/60 transition-colors hover:bg-accent/20">
                  <CardContent className="flex items-center gap-4 p-5">
                    <div className="relative">
                      <Avatar className="h-12 w-12 border">
                        <AvatarFallback className="bg-primary/10 text-primary">
                          {chat.name.slice(0, 1).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      {chat.online ? (
                        <span className="absolute bottom-0 right-0 h-3 w-3 rounded-full border-2 border-background bg-emerald-500" />
                      ) : null}
                    </div>

                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between gap-3">
                        <div className="min-w-0">
                          <p className="truncate font-semibold">{chat.name}</p>
                          <p className="truncate text-sm text-muted-foreground">@{chat.username}</p>
                        </div>
                        <div className="text-right text-xs text-muted-foreground">
                          <div>{chat.time}</div>
                          {chat.online ? <div className="text-emerald-600">Online</div> : null}
                        </div>
                      </div>
                      <div className="mt-2 flex items-center justify-between gap-3">
                        <p className="truncate text-sm text-muted-foreground">{chat.lastMessage}</p>
                        {chat.unread > 0 ? (
                          <span className="inline-flex h-6 min-w-6 items-center justify-center rounded-full bg-primary px-2 text-xs font-semibold text-primary-foreground">
                            {chat.unread}
                          </span>
                        ) : null}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))
          )}
        </section>
      </div>
    </main>
  );
}
