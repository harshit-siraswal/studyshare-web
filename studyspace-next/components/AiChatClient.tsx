'use client';

import Link from "next/link";
import { ArrowLeft, Sparkles } from "lucide-react";
import AIRagChat from "@/components/ai/AIRagChat";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useAuth } from "@/context/AuthContext";
import { useCollege } from "@/context/CollegeContext";

export function AiChatClient() {
  const { user, loading } = useAuth();
  const { selectedCollege } = useCollege();

  if (loading) {
    return null;
  }

  if (!user) {
    return null;
  }

  return (
    <main className="min-h-screen bg-background">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-6 px-4 py-6 sm:px-6 lg:px-8">
        <section className="rounded-3xl border border-border/60 bg-card/70 p-6 shadow-sm">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div className="space-y-3">
              <Button variant="ghost" className="-ml-3 w-fit px-3" asChild>
                <Link href="/study">
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Back to study
                </Link>
              </Button>
              <div className="flex flex-wrap items-center gap-2">
                <Badge variant="secondary" className="gap-1">
                  <Sparkles className="h-3.5 w-3.5" />
                  AI Chat
                </Badge>
                {selectedCollege?.name ? <Badge variant="outline">{selectedCollege.name}</Badge> : null}
              </div>
              <div className="space-y-2">
                <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">StudyShare AI</h1>
                <p className="max-w-2xl text-sm text-muted-foreground sm:text-base">
                  Ask questions from your uploaded materials, get cited answers, and keep the whole interaction on the client where it belongs.
                </p>
              </div>
            </div>
          </div>
        </section>

        <Card className="min-h-[70vh] border-border/60 bg-card/40 shadow-sm">
          <CardContent className="h-full p-2 sm:p-3">
            <AIRagChat variant="minimal" className="h-full rounded-2xl" />
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
