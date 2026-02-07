import { useEffect, useRef, useState } from "react";
import { Loader2, Send, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import { useAuth } from "@/context/AuthContext";
import { useCollege } from "@/context/CollegeContext";
import { queryRag } from "@/lib/api";

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

const AIRagChat = ({ className }: { className?: string }) => {
  const { user } = useAuth();
  const { selectedCollege } = useCollege();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [question, setQuestion] = useState("");
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, loading]);

  const handleAsk = async () => {
    if (!user) return;
    const q = question.trim();
    if (!q) return;

    setQuestion("");
    setMessages((prev) => [...prev, { role: "user", content: q }]);
    setLoading(true);

    try {
      const response = await queryRag(q, {
        collegeId: selectedCollege?.domain,
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
    } catch (error: any) {
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: error?.message || "Failed to get AI response.",
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      if (!loading) void handleAsk();
    }
  };

  if (!user) {
    return (
      <div className="text-sm text-muted-foreground">
        Please login to use AI chat.
      </div>
    );
  }

  return (
    <div className={cn("flex h-full flex-col gap-3", className)}>
      <div className="flex items-center gap-2 text-sm font-semibold">
        <Sparkles className="h-4 w-4 text-primary" />
        Ask AI about your PDFs
      </div>

      <ScrollArea className="flex-1 rounded-md border bg-background/60">
        <div ref={scrollRef} className="p-3 space-y-3">
          {messages.length === 0 && (
            <div className="text-xs text-muted-foreground">
              Ask a question and I will answer using your college PDFs.
            </div>
          )}

          {messages.map((msg, idx) => (
            <div
              key={`${msg.role}-${idx}`}
              className={cn(
                "rounded-lg p-3 text-sm",
                msg.role === "user"
                  ? "bg-primary/10 text-foreground"
                  : "bg-muted text-foreground"
              )}
            >
              <div className="whitespace-pre-wrap">{msg.content}</div>

              {msg.role === "assistant" && msg.sources && msg.sources.length > 0 && (
                <div className="mt-3 space-y-2">
                  <div className="text-xs font-semibold text-muted-foreground">Sources</div>
                  {msg.sources.map((s, sidx) => (
                    <div key={`${s.file_id}-${sidx}`} className="text-xs text-muted-foreground">
                      <span className="font-medium text-foreground">{s.title}</span>
                      {s.pages && (
                        <span className="ml-1">
                          (p. {s.pages.start}-{s.pages.end})
                        </span>
                      )}
                      {s.file_url && (
                        <a
                          href={s.file_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="ml-2 text-primary hover:underline"
                        >
                          Open
                        </a>
                      )}
                    </div>
                  ))}
                </div>
              )}

              {msg.role === "assistant" && msg.cached && (
                <div className="mt-2 text-[10px] uppercase tracking-wide text-muted-foreground">
                  Cached result
                </div>
              )}
            </div>
          ))}

          {loading && (
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <Loader2 className="h-3 w-3 animate-spin" />
              Thinking…
            </div>
          )}
        </div>
      </ScrollArea>

      <div className="flex items-end gap-2">
        <Textarea
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Ask about any topic in your PDFs..."
          className="min-h-[70px] resize-none"
        />
        <Button onClick={handleAsk} disabled={loading || !question.trim()}>
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
        </Button>
      </div>
    </div>
  );
};

export default AIRagChat;
