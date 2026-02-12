import { useEffect, useRef, useState } from "react";
import type { KeyboardEvent } from "react";
import { BookOpen, GraduationCap, Loader2, MessageSquare, Send, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import { useAuth } from "@/context/AuthContext";
import { useCollege } from "@/context/CollegeContext";
import { queryRag } from "@/lib/api";
import BrandLoader from "@/components/BrandLoader";
import BrandMark from "@/components/BrandMark";

interface RagSource {
  file_id: string;
  title: string;
  pages?: { start: number; end: number };
  score?: number;
  file_url?: string | null;
}

interface ChatMessage {
  role: "user" | "assistant";
  content: string;
  sources?: RagSource[];
  cached?: boolean;
  noLocal?: boolean;
}

const SUGGESTIONS = [
  "Summarize Unit 2 from my latest PDF.",
  "Give me 5 MCQs on Operating Systems with answers.",
  "Explain stack vs queue with a real-world example.",
  "List key formulas from my notes for quick revision.",
];

const AIRagChat = ({
  className,
  variant = "rich",
}: {
  className?: string;
  variant?: "rich" | "minimal";
}) => {
  const { user } = useAuth();
  const { selectedCollegeId } = useCollege();
  const isMinimal = variant === "minimal";
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [question, setQuestion] = useState("");
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, loading]);

  const handleAsk = async () => {
    if (!user) return;
    if (loading) return;
    const q = question.trim();
    if (!q) return;

    setQuestion("");
    setMessages((prev) => [...prev, { role: "user", content: q }]);
    setLoading(true);

    try {
      const response = await queryRag(q, {
        collegeId: selectedCollegeId || undefined,
        allowWeb: true,
      });

      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: response.answer || "No answer returned.",
          sources: response.sources || [],
          cached: response.cached,
          noLocal: response.no_local,
        },
      ]);
    } catch (error: unknown) {
      const message =
        error instanceof Error ? error.message : "Failed to get AI response.";
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: message,
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      if (!loading) void handleAsk();
    }
  };

  const handleSuggestion = (text: string) => {
    setQuestion(text);
    requestAnimationFrame(() => inputRef.current?.focus());
  };

  const getAssistantDisplayContent = (msg: ChatMessage) => {
    if (msg.role !== "assistant") return msg.content;
    if (!msg.noLocal) return msg.content;

    const discardPatterns: RegExp[] = [
      /can't\s+directly\s+access\s+your\s+local\s+files/i,
      /cannot\s+directly\s+access\s+your\s+local\s+files/i,
      /access\s+your\s+local\s+files/i,
      /specific\s+pdfs?/i,
      /copy\s+and\s+paste/i,
      /paste\s+the\s+text/i,
    ];

    const cleaned = msg.content
      .split(/\r?\n/)
      .map((line) => line.trim())
      .filter((line) => line.length > 0)
      .filter((line) => !discardPatterns.some((re) => re.test(line)))
      .join("\n")
      .trim();

    if (cleaned.length >= 40) return cleaned;

    return [
      "I couldn’t find a relevant match in your PDFs for that question.",
      "",
      "Try:",
      "- Mention the unit/chapter name",
      "- Use a keyword from the PDF title",
      "- Ask while viewing the PDF (and use OCR in AI Studio if it’s a scan)",
    ].join("\n");
  };

  const renderMessageContent = (content: string) => {
    const lines = content.split(/\n+/).filter((line) => line.trim().length > 0);
    const hasBullets = lines.some((line) => /^[-*]\s+/.test(line.trim()));
    if (!hasBullets) {
      return <div className="whitespace-pre-wrap leading-relaxed">{content}</div>;
    }

    return (
      <div className="space-y-2">
        {lines.map((line, lineIdx) => {
          const trimmed = line.trim();
          const bulletMatch = trimmed.match(/^[-*]\s+(.*)/);
          const labelMatch = trimmed.match(/^([A-Za-z][A-Za-z ]{1,24}):\s*(.*)$/);

          if (bulletMatch) {
            return (
              <div key={`bullet-${lineIdx}`} className="flex items-start gap-2">
                <span className="mt-2 h-1.5 w-1.5 rounded-full bg-primary/70" />
                <span className="flex-1">{bulletMatch[1]}</span>
              </div>
            );
          }

          if (labelMatch) {
            return (
              <div key={`label-${lineIdx}`} className="flex flex-wrap gap-2">
                <span className="rounded-full bg-primary/10 px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wide text-primary">
                  {labelMatch[1]}
                </span>
                <span className="flex-1">{labelMatch[2]}</span>
              </div>
            );
          }

          return (
            <div key={`line-${lineIdx}`} className="whitespace-pre-wrap leading-relaxed">
              {trimmed}
            </div>
          );
        })}
      </div>
    );
  };

  if (!user) {
    return (
      <div className="text-sm text-muted-foreground">
        Please login to use AI chat.
      </div>
    );
  }

  return (
    <div
      className={cn(
        "flex h-full flex-col",
        isMinimal ? "gap-3 p-4 sm:p-5" : "gap-4 p-4 sm:p-6",
        className
      )}
    >
      {!isMinimal ? (
        <div className="relative overflow-hidden rounded-3xl border border-border/60 bg-gradient-to-br from-card/90 via-background/80 to-card/70 p-4 shadow-card sm:p-6">
          <div className="absolute -right-8 -top-8 h-32 w-32 rounded-full bg-primary/10 blur-2xl" />
          <div className="absolute bottom-0 left-1/3 h-24 w-24 rounded-full bg-accent/10 blur-2xl" />
          <div className="relative flex flex-col gap-4 sm:flex-row sm:items-center">
            <div className="flex-1 space-y-3 pr-8 sm:pr-16">
              <div className="inline-flex items-center gap-2 rounded-full border border-border/60 bg-background/60 px-3 py-1 text-[11px] uppercase tracking-[0.2em] text-muted-foreground">
                <Sparkles className="h-3 w-3 text-primary" />
                Studyspace AI Buddy
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Ask, revise, and learn faster.</p>
                <h2 className="mt-1 font-editorial text-2xl text-foreground sm:text-3xl">
                  Ask anything from your PDFs
                </h2>
              </div>
              <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
                <span className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-3 py-1">
                  <BookOpen className="h-3 w-3 text-primary" />
                  PDF-first answers
                </span>
                <span className="inline-flex items-center gap-1 rounded-full bg-accent/10 px-3 py-1 text-accent-foreground">
                  <GraduationCap className="h-3 w-3" />
                  Exam-ready format
                </span>
                <span className="inline-flex items-center gap-1 rounded-full bg-muted px-3 py-1">
                  <MessageSquare className="h-3 w-3" />
                  Smart follow-ups
                </span>
              </div>
            </div>
            <div className="relative h-32 w-full max-w-[190px] self-center sm:h-36 sm:self-auto">
              <div className="flex h-full w-full items-center justify-center rounded-3xl bg-primary/5">
                <BrandMark size={140} className="drop-shadow-[0_14px_30px_rgba(0,0,0,0.2)]" alt="Studyshare AI" />
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-[11px] uppercase tracking-[0.3em] text-muted-foreground">AI Chat</p>
            <h2 className="mt-1 text-xl font-semibold text-foreground">Ask about your PDFs</h2>
            <p className="text-xs text-muted-foreground">Minimal, focused answers grounded in your study files.</p>
          </div>
          <div className="flex items-center gap-2 rounded-full border border-border/60 bg-background/70 px-3 py-1 text-[11px] text-muted-foreground">
            <Sparkles className="h-3 w-3 text-primary" />
            {selectedCollege?.name || "Your College"}
          </div>
        </div>
      )}

      <div className="flex min-h-0 flex-1 flex-col gap-3">
        <ScrollArea
          className={cn(
            "relative flex-1",
            isMinimal
              ? "rounded-2xl border border-border/60 bg-background"
              : "rounded-3xl border border-border/60 bg-gradient-to-b from-background/80 via-background/60 to-background/40 shadow-card"
          )}
        >
          <div ref={scrollRef} className={cn("relative space-y-4", isMinimal ? "p-4" : "p-4 sm:p-6")}>
            {messages.length === 0 && !loading && (
              <div
                className={cn(
                  "rounded-2xl border border-dashed border-border/70 p-4 sm:p-6",
                  isMinimal ? "bg-muted/20" : "bg-background/40"
                )}
              >
                <div className={cn("flex flex-col gap-4", isMinimal ? "" : "md:flex-row md:items-center")}>
                  <div className="flex-1 space-y-2">
                    <p className="text-xs uppercase tracking-[0.3em] text-muted-foreground">Getting started</p>
                    <h3 className={cn("text-xl text-foreground", !isMinimal && "font-editorial")}>
                      Drop a question to begin
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      I will scan your PDFs first. If nothing is found, I will answer generally.
                    </p>
                    <div className="mt-3 flex flex-wrap gap-2">
                      {SUGGESTIONS.map((suggestion) => (
                        <button
                          key={suggestion}
                          type="button"
                          onClick={() => handleSuggestion(suggestion)}
                          className={cn(
                            "rounded-full border border-border/60 px-3 py-1 text-xs transition",
                            isMinimal
                              ? "bg-background/80 text-muted-foreground hover:border-primary/60 hover:text-primary"
                              : "bg-background/70 text-foreground hover:border-primary/60 hover:text-primary"
                          )}
                        >
                          {suggestion}
                        </button>
                      ))}
                    </div>
                  </div>
                  {!isMinimal && (
                    <div className="flex w-full max-w-[220px] items-center justify-center md:justify-end">
                      <BrandMark size={160} className="opacity-90 drop-shadow-[0_18px_35px_rgba(0,0,0,0.2)]" alt="Studyshare" />
                    </div>
                  )}
                </div>
              </div>
            )}

            {messages.map((msg, idx) => {
              const isUser = msg.role === "user";
              const displayContent = msg.noLocal ? getAssistantDisplayContent(msg) : msg.content;
              return (
                <div key={`${msg.role}-${idx}`} className={cn("flex", isUser ? "justify-end" : "justify-start")}>
                  <div
                    className={cn(
                      "w-full max-w-[90%] rounded-2xl px-4 py-3 text-sm shadow-sm sm:max-w-[80%]",
                      isUser
                        ? isMinimal
                          ? "border border-primary/20 bg-primary/10 text-foreground"
                          : "bg-gradient-primary text-primary-foreground shadow-glow"
                        : "border border-border/60 bg-card/70 text-foreground"
                    )}
                  >
                    {!isUser && (
                      <div
                        className={cn(
                          "mb-2 flex flex-wrap items-center gap-2 text-[11px] uppercase tracking-[0.2em] text-muted-foreground",
                          isMinimal && "text-[10px] tracking-[0.18em]"
                        )}
                      >
                        <Sparkles className="h-3 w-3 text-primary" />
                        Studyspace AI
                        {msg.noLocal && (
                          <span className="rounded-full bg-muted px-2 py-0.5 text-[10px] tracking-normal">
                            No PDF match
                          </span>
                        )}
                        {msg.cached && (
                          <span className="rounded-full bg-primary/10 px-2 py-0.5 text-[10px] tracking-normal text-primary">
                            Cached
                          </span>
                        )}
                      </div>
                    )}

                    {renderMessageContent(displayContent)}

                    {msg.role === "assistant" && msg.sources && msg.sources.length > 0 && (
                      <div className="mt-4 space-y-2">
                        <div className="text-xs font-semibold text-muted-foreground">Sources</div>
                        <div className="grid gap-2 sm:grid-cols-2">
                          {msg.sources.map((s, sidx) => (
                            <div
                              key={`${s.file_id}-${sidx}`}
                              className="rounded-xl border border-border/60 bg-background/60 p-2 text-xs text-muted-foreground"
                            >
                              <div className="font-medium text-foreground">{s.title}</div>
                              {s.pages && (
                                <div className="text-[11px] text-muted-foreground">
                                  Pages {s.pages.start}-{s.pages.end}
                                </div>
                              )}
                              {s.file_url && (
                                <a
                                  href={s.file_url}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="mt-1 inline-flex items-center gap-1 text-primary hover:underline"
                                >
                                  Open source
                                </a>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {msg.role === "assistant" && msg.noLocal && (
                      <div className="mt-3 rounded-lg bg-muted/50 px-3 py-2 text-xs text-muted-foreground">
                        Tip: Add a unit/chapter keyword or mention the PDF title.
                      </div>
                    )}
                  </div>
                </div>
              );
            })}

            {loading && (
              <div
                className={cn(
                  "relative overflow-hidden rounded-2xl border px-4 py-4 text-sm",
                  isMinimal ? "border-border/60 bg-muted/30" : "border-border/60 bg-card/70 shadow-card"
                )}
              >
                {!isMinimal && (
                  <>
                    <div className="absolute -left-10 top-0 h-32 w-32 rounded-full bg-primary/10 blur-2xl" />
                    <div className="absolute bottom-0 right-10 h-24 w-24 rounded-full bg-accent/10 blur-2xl" />
                  </>
                )}
                <div className="relative flex flex-col gap-3 sm:flex-row sm:items-center">
                  <BrandLoader size={isMinimal ? 60 : 80} label={isMinimal ? "Thinking..." : "Crafting your answer"} />
                  <div className="flex-1 space-y-2">
                    <div className="flex items-center gap-2 text-[11px] uppercase tracking-[0.2em] text-muted-foreground">
                      <Sparkles className="h-3 w-3 text-primary" />
                      Scanning your notes
                    </div>
                    <div className="h-3 w-28 rounded-full bg-[linear-gradient(90deg,rgba(255,255,255,0.05),rgba(255,255,255,0.2),rgba(255,255,255,0.05))] bg-[length:200%_100%] animate-shimmer motion-reduce:animate-none" />
                    <div className="h-3 w-48 rounded-full bg-[linear-gradient(90deg,rgba(255,255,255,0.05),rgba(255,255,255,0.2),rgba(255,255,255,0.05))] bg-[length:200%_100%] animate-shimmer motion-reduce:animate-none" />
                  </div>
                </div>
              </div>
            )}
          </div>
        </ScrollArea>

        <div
          className={cn(
            "rounded-2xl border border-border/60 p-3",
            isMinimal ? "bg-background/80" : "bg-card/70 shadow-card"
          )}
        >
          {!isMinimal && (
            <div className="flex flex-wrap gap-2 pb-3">
              {SUGGESTIONS.map((suggestion) => (
                <button
                  key={`chip-${suggestion}`}
                  type="button"
                  onClick={() => handleSuggestion(suggestion)}
                  className={cn(
                    "rounded-full border border-border/60 px-3 py-1 text-[11px] transition",
                    "bg-background/80 text-muted-foreground hover:border-primary/60 hover:text-primary"
                  )}
                >
                  {suggestion}
                </button>
              ))}
            </div>
          )}
          <div className="flex items-end gap-2">
            <Textarea
              ref={inputRef}
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Ask about any topic in your PDFs..."
              className={cn(
                "min-h-[84px] resize-none rounded-2xl border border-border/60 bg-background/70 focus-visible:ring-2 focus-visible:ring-primary/40",
                isMinimal && "bg-background"
              )}
            />
            <Button
              onClick={() => void handleAsk()}
              disabled={loading || !question.trim()}
              className={cn(
                "h-12 w-12 rounded-2xl transition",
                isMinimal
                  ? "bg-primary text-primary-foreground hover:shadow-hover"
                  : "bg-gradient-primary text-primary-foreground shadow-glow hover:shadow-hover",
                loading && "animate-pulse"
              )}
            >
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AIRagChat;
