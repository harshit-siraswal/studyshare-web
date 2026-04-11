import { useEffect, useRef, useState } from "react";
import type { KeyboardEvent } from "react";
import {
  BookOpen,
  Check,
  Copy,
  Filter,
  GraduationCap,
  Loader2,
  MessageSquare,
  RefreshCcw,
  Send,
  Sparkles,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import { useAuth } from "@/context/AuthContext";
import { useCollege } from "@/context/CollegeContext";
import { toast } from "sonner";
import {
  ApiError,
  formatAiTokenQuotaMessage,
  isAiTokenQuotaExceededPayload,
  queryRag,
  type RagFilters,
  type RagFollowUpAction,
  type RagSource,
} from "@/lib/api";
import BrandLoader from "@/components/BrandLoader";
import BrandMark from "@/components/BrandMark";

interface ChatMessage {
  role: "user" | "assistant";
  content: string;
  sources?: RagSource[];
  followUps?: RagFollowUpAction[];
  cached?: boolean;
  noLocal?: boolean;
  quizPaper?: QuizPaper;
}

interface QuizQuestion {
  question: string;
  options: string[];
  correctAnswerIndex?: number;
}

interface QuizPaper {
  subject: string;
  questions: QuizQuestion[];
  totalQuestions: number;
}

const DEFAULT_FILTERS: RagFilters = {
  source_type: "both",
};

const SUGGESTIONS = [
  "Summarize Unit 2 from my latest PDF.",
  "Give me 5 MCQs on Operating Systems with answers.",
  "Explain stack vs queue with a real-world example.",
  "List key formulas from my notes for quick revision.",
];

const QUESTION_PAPER_INTENT_PATTERN =
  /\b(quiz|mcq|question\s*paper|questionpaper|mock\s*test|practice\s*test|assessment|exam\s*questions?)\b/i;

function extractJsonCandidate(raw: string): string | null {
  const fenced = raw.match(/```(?:json)?\s*([\s\S]*?)```/i);
  if (fenced?.[1]) return fenced[1].trim();

  const firstBrace = raw.indexOf("{");
  const lastBrace = raw.lastIndexOf("}");
  if (firstBrace >= 0 && lastBrace > firstBrace) {
    return raw.slice(firstBrace, lastBrace + 1).trim();
  }

  const firstBracket = raw.indexOf("[");
  const lastBracket = raw.lastIndexOf("]");
  if (firstBracket >= 0 && lastBracket > firstBracket) {
    return raw.slice(firstBracket, lastBracket + 1).trim();
  }

  return null;
}

function toOptionArray(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value
    .map((item) => String(item || "").trim())
    .filter((item) => item.length > 0)
    .slice(0, 4);
}

function toCorrectIndex(value: unknown): number | undefined {
  if (typeof value === "number" && Number.isInteger(value)) {
    if (value >= 0 && value <= 3) return value;
    if (value >= 1 && value <= 4) return value - 1;
  }
  if (typeof value === "string") {
    const normalized = value.trim().toUpperCase();
    const alphaIndex = ["A", "B", "C", "D"].indexOf(normalized);
    if (alphaIndex >= 0) return alphaIndex;
    const parsed = Number.parseInt(normalized, 10);
    if (Number.isInteger(parsed)) {
      if (parsed >= 0 && parsed <= 3) return parsed;
      if (parsed >= 1 && parsed <= 4) return parsed - 1;
    }
  }
  return undefined;
}

function parseQuizPaper(rawAnswer: string): QuizPaper | null {
  const candidate = extractJsonCandidate(rawAnswer);
  if (!candidate) return null;

  let parsed: unknown;
  try {
    parsed = JSON.parse(candidate);
  } catch {
    return null;
  }

  const parsedObject =
    typeof parsed === "object" && parsed !== null ? (parsed as Record<string, unknown>) : null;

  const sourceQuestions = Array.isArray(parsed)
    ? parsed
    : Array.isArray(parsedObject?.questions)
      ? parsedObject.questions
      : Array.isArray(parsedObject?.mcq)
        ? parsedObject.mcq
        : [];

  if (!Array.isArray(sourceQuestions) || sourceQuestions.length === 0) {
    return null;
  }

  const questions: QuizQuestion[] = sourceQuestions
    .map((entry: unknown) => {
      const row = typeof entry === "object" && entry !== null ? (entry as Record<string, unknown>) : {};
      const question = String(row.question || row.prompt || "").trim();
      const options = toOptionArray(row.options || row.choices);
      if (!question || options.length < 2) return null;

      return {
        question,
        options,
        correctAnswerIndex: toCorrectIndex(
          row.correctAnswerIndex ?? row.correct_answer_index ?? row.correct_answer ?? row.answer
        ),
      };
    })
    .filter((entry: QuizQuestion | null): entry is QuizQuestion => !!entry)
    .slice(0, 25);

  if (questions.length === 0) return null;

  return {
    subject: String(parsedObject?.subject || parsedObject?.topic || "Practice Quiz").trim() || "Practice Quiz",
    questions,
    totalQuestions:
      typeof parsedObject?.total_questions === "number" && parsedObject.total_questions > 0
        ? parsedObject.total_questions
        : questions.length,
  };
}

function buildQuizSummary(paper: QuizPaper): string {
  return `Question paper generated for ${paper.subject}. Tap "Start Quiz" to attempt ${paper.questions.length} questions.`;
}

const AIRagChat = ({
  className,
  variant = "rich",
  compact = false,
}: {
  className?: string;
  variant?: "rich" | "minimal";
  compact?: boolean;
}) => {
  const { user } = useAuth();
  const { selectedCollegeId, selectedCollege } = useCollege();
  const collegeLabel = selectedCollege?.name || "Your College";
  const isMinimal = variant === "minimal";
  const isCompact = compact;
  const isSimpleMinimal = isMinimal && !isCompact;
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [question, setQuestion] = useState("");
  const [filters, setFilters] = useState<RagFilters>(DEFAULT_FILTERS);
  const [showFilters, setShowFilters] = useState(false);
  const [loading, setLoading] = useState(false);
  const [copiedMessageId, setCopiedMessageId] = useState<string | null>(null);
  const [regeneratingMessageIndex, setRegeneratingMessageIndex] = useState<number | null>(null);
  const [copiedConversation, setCopiedConversation] = useState(false);
  const [activeQuiz, setActiveQuiz] = useState<{
    paper: QuizPaper;
    currentIndex: number;
    selected: Record<number, number>;
    submitted: boolean;
  } | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, loading]);

  const getHistoryForRequest = (historyMessages: ChatMessage[] = messages) => {
    return historyMessages.slice(-10).map((msg) => ({
      role: msg.role,
      content: msg.content,
    }));
  };

  const buildQueryFromFollowUp = (action: RagFollowUpAction) => {
    switch (action.type) {
      case "find_related_topics":
        return "Find related topics from my current materials.";
      case "get_more_details":
        return "Give me more details from the cited materials.";
      case "rephrase_question":
        return "Help me rephrase my previous question for better matching.";
      case "watch_video_segments":
        return "Show the most relevant video segments with timestamps.";
      default:
        return "";
    }
  };

  const handleAsk = async (presetQuestion?: string) => {
    if (!user) return;
    if (loading) return;
    const q = (presetQuestion || question).trim();
    if (!q) return;

    if (!presetQuestion) {
      setQuestion("");
    }
    setMessages((prev) => [...prev, { role: "user", content: q }]);
    setLoading(true);

    const wantsQuestionPaper = QUESTION_PAPER_INTENT_PATTERN.test(q);

    try {
      const response = await queryRag(q, {
        collegeId: selectedCollegeId || undefined,
        allowWeb: false,
        filters,
        history: [...getHistoryForRequest(), { role: "user", content: q }],
        generationMode: wantsQuestionPaper ? "question_paper" : "answer",
      });

      const quizPaper = parseQuizPaper(response.answer || "");
      const assistantContent = quizPaper ? buildQuizSummary(quizPaper) : response.answer || "No answer returned.";

      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: assistantContent,
          sources: response.sources || [],
          followUps: response.follow_ups || [],
          cached: response.cached,
          noLocal: response.no_local,
          quizPaper: quizPaper || undefined,
        },
      ]);
    } catch (error: unknown) {
      let message = error instanceof Error ? error.message : "Failed to get AI response.";
      if (error instanceof ApiError && isAiTokenQuotaExceededPayload(error.payload)) {
        message = `${formatAiTokenQuotaMessage(error.payload)} Check your profile for token balance.`;
      }
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

  const handleFollowUpAction = async (action: RagFollowUpAction, message: ChatMessage) => {
    if (loading) return;

    if (action.type === "search_web") {
      const query = encodeURIComponent(
        `${messages.filter((m) => m.role === "user").slice(-1)[0]?.content || "study topic"}`
      );
      window.open(`https://www.google.com/search?q=${query}`, "_blank", "noopener,noreferrer");
      return;
    }

    if (action.type === "show_full_pdfs") {
      const firstSource = message.sources?.find((source) => source.file_url);
      if (firstSource?.file_url) {
        window.open(firstSource.file_url, "_blank", "noopener,noreferrer");
      }
      return;
    }

    if (action.type === "filter_results") {
      setShowFilters((prev) => !prev);
      return;
    }

    if (action.type === "watch_video_segments") {
      const video = message.sources?.find((source) => source.video_url);
      if (video?.video_url) {
        window.open(video.video_url, "_blank", "noopener,noreferrer");
      }
      return;
    }

    const nextQuestion = buildQueryFromFollowUp(action);
    if (nextQuestion) {
      await handleAsk(nextQuestion);
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

  const latestAssistantIndex = (() => {
    for (let idx = messages.length - 1; idx >= 0; idx -= 1) {
      if (messages[idx].role === "assistant") return idx;
    }
    return -1;
  })();

  const handleCopyMessage = async (messageId: string, content: string) => {
    const value = content.trim();
    if (!value) return;
    try {
      await navigator.clipboard.writeText(value);
      setCopiedMessageId(messageId);
      window.setTimeout(() => {
        setCopiedMessageId((prev) => (prev === messageId ? null : prev));
      }, 1600);
    } catch {
      toast.error("Failed to copy message");
    }
  };

  const handleRegenerate = async (assistantIndex: number) => {
    if (loading) return;
    if (assistantIndex !== latestAssistantIndex) {
      toast.error("Only the latest AI message can be regenerated.");
      return;
    }

    let userIndex = -1;
    for (let idx = assistantIndex - 1; idx >= 0; idx -= 1) {
      if (messages[idx].role === "user") {
        userIndex = idx;
        break;
      }
    }

    if (userIndex < 0) {
      toast.error("No user prompt found for regeneration.");
      return;
    }

    const originalQuestion = messages[userIndex]?.content?.trim();
    if (!originalQuestion) {
      toast.error("Cannot regenerate an empty question.");
      return;
    }

    const truncatedMessages = messages.slice(0, assistantIndex);
    setRegeneratingMessageIndex(assistantIndex);
    setMessages(truncatedMessages);
    setLoading(true);

    const wantsQuestionPaper = QUESTION_PAPER_INTENT_PATTERN.test(originalQuestion);

    try {
      const response = await queryRag(originalQuestion, {
        collegeId: selectedCollegeId || undefined,
        allowWeb: false,
        filters,
        history: getHistoryForRequest(truncatedMessages),
        generationMode: wantsQuestionPaper ? "question_paper" : "answer",
      });

      const quizPaper = parseQuizPaper(response.answer || "");
      const assistantContent = quizPaper ? buildQuizSummary(quizPaper) : response.answer || "No answer returned.";

      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: assistantContent,
          sources: response.sources || [],
          followUps: response.follow_ups || [],
          cached: response.cached,
          noLocal: response.no_local,
          quizPaper: quizPaper || undefined,
        },
      ]);
    } catch (error: unknown) {
      let message = error instanceof Error ? error.message : "Failed to regenerate AI response.";
      if (error instanceof ApiError && isAiTokenQuotaExceededPayload(error.payload)) {
        message = `${formatAiTokenQuotaMessage(error.payload)} Check your profile for token balance.`;
      }
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: message,
        },
      ]);
    } finally {
      setLoading(false);
      setRegeneratingMessageIndex(null);
    }
  };

  const handleCopyConversation = async () => {
    if (!messages.length) {
      toast.error("No chat messages to copy yet.");
      return;
    }

    const transcript = messages
      .map((msg) => {
        const roleLabel = msg.role === "user" ? "You" : "StudyShare AI";
        const value = msg.noLocal ? getAssistantDisplayContent(msg) : msg.content;
        return `${roleLabel}:\n${value.trim()}`;
      })
      .join("\n\n");

    if (!transcript.trim()) {
      toast.error("No chat messages to copy yet.");
      return;
    }

    try {
      await navigator.clipboard.writeText(transcript);
      setCopiedConversation(true);
      window.setTimeout(() => setCopiedConversation(false), 1800);
    } catch {
      toast.error("Failed to copy conversation");
    }
  };

  const handleStartQuiz = (paper: QuizPaper) => {
    setActiveQuiz({
      paper,
      currentIndex: 0,
      selected: {},
      submitted: false,
    });
  };

  const handleSelectQuizOption = (optionIndex: number) => {
    setActiveQuiz((prev) => {
      if (!prev || prev.submitted) return prev;
      return {
        ...prev,
        selected: {
          ...prev.selected,
          [prev.currentIndex]: optionIndex,
        },
      };
    });
  };

  const handleMoveQuiz = (direction: -1 | 1) => {
    setActiveQuiz((prev) => {
      if (!prev) return prev;
      const nextIndex = Math.max(0, Math.min(prev.currentIndex + direction, prev.paper.questions.length - 1));
      return {
        ...prev,
        currentIndex: nextIndex,
      };
    });
  };

  const handleSubmitQuiz = () => {
    setActiveQuiz((prev) => (prev ? { ...prev, submitted: true } : prev));
  };

  const activeQuizQuestion = activeQuiz ? activeQuiz.paper.questions[activeQuiz.currentIndex] : null;
  const activeQuizScore = activeQuiz
    ? activeQuiz.paper.questions.reduce((sum, question, index) => {
        const selected = activeQuiz.selected[index];
        if (typeof selected !== "number") return sum;
        if (typeof question.correctAnswerIndex !== "number") return sum;
        return question.correctAnswerIndex === selected ? sum + 1 : sum;
      }, 0)
    : 0;

  const activeFilterParts = [
    filters.semester ? `Sem ${filters.semester}` : "",
    filters.branch || "",
    filters.subject || "",
    filters.source_type && filters.source_type !== "both" ? filters.source_type.toUpperCase() : "",
  ].filter(Boolean);
  const hasActiveFilters = activeFilterParts.length > 0;

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
      "I couldn't find a relevant match in your uploaded materials for that question.",
      "",
      "Try:",
      "- Mention the unit/chapter name",
      "- Use a keyword from the source title",
      "- Add filters like semester, branch, or subject",
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
        isCompact ? "gap-2 p-2" : isMinimal ? "gap-2 p-2 sm:p-3" : "gap-4 p-4 sm:p-6",
        className
      )}
    >
      {!isCompact && (
        !isMinimal ? (
          <div className="relative overflow-hidden rounded-3xl border border-border/60 bg-gradient-to-br from-card/90 via-background/80 to-card/70 p-4 shadow-card sm:p-6">
            <div className="absolute -right-8 -top-8 h-32 w-32 rounded-full bg-primary/10 blur-2xl" />
            <div className="absolute bottom-0 left-1/3 h-24 w-24 rounded-full bg-accent/10 blur-2xl" />
            <div className="relative flex flex-col gap-4 sm:flex-row sm:items-center">
              <div className="flex-1 space-y-3 pr-8 sm:pr-16">
                <div className="inline-flex items-center gap-2 rounded-full border border-border/60 bg-background/60 px-3 py-1 text-[11px] uppercase tracking-[0.2em] text-muted-foreground">
                  <Sparkles className="h-3 w-3 text-primary" />
                  StudyShare AI Buddy
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
              <div className="relative flex h-32 w-full max-w-[190px] items-center justify-center self-center sm:h-36 sm:self-auto">
                <BrandMark size={152} className="drop-shadow-[0_14px_30px_rgba(0,0,0,0.2)]" alt="StudyShare AI" />
              </div>
            </div>
          </div>
        ) : (
          <div className="flex items-center justify-between px-1 pb-1">
            <h2 className="text-sm font-semibold text-foreground">StudyShare AI</h2>
            <p className="max-w-[60%] truncate text-right text-xs text-muted-foreground">{collegeLabel}</p>
          </div>
        )
      )}

      <div className="flex min-h-0 flex-1 flex-col gap-3">
        <ScrollArea
          className={cn(
            "relative flex-1",
            isMinimal
              ? "rounded-2xl border border-border/50 bg-background/30"
              : "rounded-3xl border border-border/60 bg-gradient-to-b from-background/80 via-background/60 to-background/40 shadow-card"
          )}
        >
          <div ref={scrollRef} className={cn("relative space-y-4", isMinimal ? "space-y-6 p-3 sm:p-4" : "p-4 sm:p-6")}>
            {messages.length === 0 && !loading && (
              isCompact ? (
                <div className="rounded-xl border border-dashed border-border/70 bg-muted/20 p-3">
                  <p className="text-sm font-medium text-foreground">Ask a question about this document</p>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {SUGGESTIONS.slice(0, 3).map((suggestion) => (
                      <button
                        key={`compact-${suggestion}`}
                        type="button"
                        onClick={() => handleSuggestion(suggestion)}
                        className="rounded-full border border-border/60 bg-background/80 px-3 py-1 text-xs text-muted-foreground transition hover:border-primary/60 hover:text-primary"
                      >
                        {suggestion}
                      </button>
                    ))}
                  </div>
                </div>
              ) : isMinimal ? (
                <div className="mx-auto w-full max-w-2xl rounded-2xl border border-border/60 bg-background/80 p-4 text-center sm:p-5">
                  <p className="text-sm font-medium text-foreground">How can I help with your studies today?</p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    Ask from your notes, PDFs, and lectures. I will answer with references.
                  </p>
                  <div className="mt-3 flex flex-wrap justify-center gap-2">
                    {SUGGESTIONS.slice(0, 2).map((suggestion) => (
                      <button
                        key={`minimal-${suggestion}`}
                        type="button"
                        onClick={() => handleSuggestion(suggestion)}
                        className="rounded-full border border-border/60 bg-background px-3 py-1 text-xs text-muted-foreground transition hover:border-primary/60 hover:text-primary"
                      >
                        {suggestion}
                      </button>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="rounded-2xl border border-dashed border-border/70 bg-background/40 p-4 sm:p-6">
                  <div className="flex flex-col gap-4 md:flex-row md:items-center">
                    <div className="flex-1 space-y-2">
                      <p className="text-xs uppercase tracking-[0.3em] text-muted-foreground">Getting started</p>
                      <h3 className="font-editorial text-xl text-foreground">
                        Drop a question to begin
                      </h3>
                      <p className="text-sm text-muted-foreground">
                        I answer using your uploaded materials with inline source citations.
                      </p>
                      <div className="mt-3 flex flex-wrap gap-2">
                        {SUGGESTIONS.map((suggestion) => (
                          <button
                            key={suggestion}
                            type="button"
                            onClick={() => handleSuggestion(suggestion)}
                            className="rounded-full border border-border/60 bg-background/70 px-3 py-1 text-xs text-foreground transition hover:border-primary/60 hover:text-primary"
                          >
                            {suggestion}
                          </button>
                        ))}
                      </div>
                    </div>
                    <div className="flex w-full max-w-[220px] items-center justify-center md:justify-end">
                      <BrandMark size={160} className="opacity-90 drop-shadow-[0_18px_35px_rgba(0,0,0,0.2)]" alt="StudyShare" />
                    </div>
                  </div>
                </div>
              )
            )}

            {messages.map((msg, idx) => {
              const isUser = msg.role === "user";
              const displayContent = msg.noLocal ? getAssistantDisplayContent(msg) : msg.content;
              const messageId = `${msg.role}-${idx}`;
              const canRegenerate = msg.role === "assistant" && idx === latestAssistantIndex;
              const isRegenerating = regeneratingMessageIndex === idx;
              return (
                <div key={`${msg.role}-${idx}`} className={cn("flex w-full", isUser ? "justify-end" : "justify-start")}>
                  <div
                    className={cn(
                      "text-sm",
                      isMinimal
                        ? isUser
                          ? "max-w-[88%] rounded-2xl border border-primary/20 bg-primary/10 px-4 py-3 text-foreground"
                          : "w-full max-w-full px-1 py-1 text-foreground"
                        : "w-full max-w-[90%] rounded-2xl px-4 py-3 shadow-sm sm:max-w-[80%]",
                      !isMinimal && isUser && "bg-gradient-primary text-primary-foreground shadow-glow",
                      !isMinimal && !isUser && "border border-border/60 bg-card/70 text-foreground"
                    )}
                  >
                    {!isUser && !isMinimal && (
                      <div className="mb-2 flex flex-wrap items-center gap-2 text-[11px] uppercase tracking-[0.2em] text-muted-foreground">
                        <Sparkles className="h-3 w-3 text-primary" />
                        StudyShare AI
                        {msg.noLocal && (
                          <span className="rounded-full bg-muted px-2 py-0.5 text-[10px] tracking-normal">
                            No local match
                          </span>
                        )}
                        {msg.cached && (
                          <span className="rounded-full bg-primary/10 px-2 py-0.5 text-[10px] tracking-normal text-primary">
                            Cached
                          </span>
                        )}
                      </div>
                    )}

                    {!isUser && isMinimal && (msg.noLocal || msg.cached) && (
                      <div className="mb-2 flex flex-wrap items-center gap-2 text-[10px] text-muted-foreground">
                        {msg.noLocal && (
                          <span className="rounded-full bg-muted px-2 py-0.5">
                            No local match
                          </span>
                        )}
                        {msg.cached && (
                          <span className="rounded-full bg-primary/10 px-2 py-0.5 text-primary">
                            Cached
                          </span>
                        )}
                      </div>
                    )}

                    {renderMessageContent(displayContent)}

                    {msg.role === "assistant" && msg.quizPaper && (
                      <div className="mt-3 rounded-xl border border-border/60 bg-background/70 p-3">
                        <div className="text-xs text-muted-foreground">
                          {msg.quizPaper.subject} • {msg.quizPaper.questions.length} questions
                        </div>
                        <button
                          type="button"
                          onClick={() => handleStartQuiz(msg.quizPaper as QuizPaper)}
                          className="mt-2 inline-flex items-center gap-1.5 rounded-full border border-primary/40 bg-primary/10 px-3 py-1 text-xs text-primary transition hover:border-primary hover:bg-primary/20"
                        >
                          Start Quiz
                        </button>
                      </div>
                    )}

                    <div className={cn("mt-3 flex flex-wrap items-center gap-2", isUser && "justify-end")}>
                      <button
                        type="button"
                        onClick={() => void handleCopyMessage(messageId, displayContent)}
                        className={cn(
                          "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] transition",
                          copiedMessageId === messageId
                            ? "border-primary/50 bg-primary/10 text-primary"
                            : "border-border/60 bg-background/70 text-muted-foreground hover:border-primary/60 hover:text-primary"
                        )}
                      >
                        {copiedMessageId === messageId ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
                        {copiedMessageId === messageId ? "Copied" : "Copy"}
                      </button>
                      {canRegenerate && (
                        <button
                          type="button"
                          onClick={() => void handleRegenerate(idx)}
                          disabled={loading}
                          className={cn(
                            "inline-flex items-center gap-1.5 rounded-full border border-border/60 bg-background/70 px-2.5 py-1 text-[11px] text-muted-foreground transition hover:border-primary/60 hover:text-primary",
                            loading && "cursor-not-allowed opacity-60"
                          )}
                        >
                          {isRegenerating ? (
                            <Loader2 className="h-3 w-3 animate-spin" />
                          ) : (
                            <RefreshCcw className="h-3 w-3" />
                          )}
                          {isRegenerating ? "Regenerating..." : "Regenerate"}
                        </button>
                      )}
                    </div>

                    {msg.role === "assistant" && msg.sources && msg.sources.length > 0 && (
                      <div
                        className={cn(
                          "mt-4 space-y-2",
                          isMinimal && "rounded-xl border border-border/60 bg-background/70 p-3"
                        )}
                      >
                        <div className="text-xs font-semibold text-muted-foreground">
                          {isMinimal ? "References" : "Sources"}
                        </div>
                        <div className={cn("grid gap-2", isMinimal ? "grid-cols-1" : "sm:grid-cols-2")}>
                          {msg.sources.map((s, sidx) => (
                            <div
                              key={`${s.file_id}-${sidx}`}
                              className={cn(
                                "rounded-xl border p-2 text-xs text-muted-foreground",
                                isMinimal ? "border-border/50 bg-background" : "border-border/60 bg-background/60"
                              )}
                            >
                              <div className="font-medium text-foreground">{s.title}</div>
                              {s.pages && (
                                <div className="text-[11px] text-muted-foreground">
                                  Pages {s.pages.start}-{s.pages.end}
                                </div>
                              )}
                              {s.timestamp && (
                                <div className="text-[11px] text-muted-foreground">
                                  Time {s.timestamp}
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
                              {s.video_url && (
                                <a
                                  href={s.video_url}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="mt-1 inline-flex items-center gap-1 text-primary hover:underline"
                                >
                                  Open video
                                </a>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {msg.role === "assistant" && msg.followUps && msg.followUps.length > 0 && (
                      <div className="mt-3 flex flex-wrap gap-2">
                        {msg.followUps.map((action) => (
                          <button
                            key={`${action.type}-${action.label}`}
                            type="button"
                            onClick={() => void handleFollowUpAction(action, msg)}
                            className={cn(
                              "rounded-full border border-border/60 px-3 py-1 transition hover:border-primary/60 hover:text-primary",
                              isMinimal
                                ? "bg-background text-xs text-muted-foreground"
                                : "bg-background/60 text-[11px] text-muted-foreground"
                            )}
                          >
                            {action.label}
                          </button>
                        ))}
                      </div>
                    )}

                    {msg.role === "assistant" && msg.noLocal && (
                      <div className="mt-3 rounded-lg bg-muted/50 px-3 py-2 text-xs text-muted-foreground">
                        Tip: Add a unit or chapter keyword for better matches.
                      </div>
                    )}
                  </div>
                </div>
              );
            })}

            {loading && (
              isMinimal ? (
                <div className="flex items-center gap-2 px-1 py-1 text-sm text-muted-foreground">
                  <Loader2 className="h-3.5 w-3.5 animate-spin text-primary" />
                  Thinking...
                </div>
              ) : (
                <div className="relative overflow-hidden rounded-2xl border border-border/60 bg-card/70 px-4 py-4 text-sm shadow-card">
                  <div className="absolute -left-10 top-0 h-32 w-32 rounded-full bg-primary/10 blur-2xl" />
                  <div className="absolute bottom-0 right-10 h-24 w-24 rounded-full bg-accent/10 blur-2xl" />
                  <div className="relative flex flex-col gap-3 sm:flex-row sm:items-center">
                    <BrandLoader size={80} label="Crafting your answer" />
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
              )
            )}
          </div>
        </ScrollArea>

        <div
          className={cn(
            "border border-border/60 p-3",
            isMinimal ? "rounded-2xl bg-background/95 p-2.5 sm:p-3" : "rounded-2xl bg-card/70 shadow-card"
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
          {!isCompact && !isMinimal && (
            <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
              <button
                type="button"
                onClick={() => setShowFilters((prev) => !prev)}
                className="inline-flex items-center gap-2 rounded-full border border-border/60 bg-background/70 px-3 py-1 text-[11px] text-muted-foreground transition hover:border-primary/60 hover:text-primary"
              >
                <Filter className="h-3 w-3" />
                Filters
              </button>
              <div className="text-[11px] text-muted-foreground">
                {hasActiveFilters
                  ? `Active: ${activeFilterParts.join(", ")}`
                  : "No active filters"}
              </div>
            </div>
          )}
          {!isCompact && !isMinimal && showFilters && (
            <div className="mb-3 grid gap-2 rounded-xl border border-border/60 bg-background/60 p-3 sm:grid-cols-2">
              <label className="text-xs text-muted-foreground">
                Semester
                <select
                  value={filters.semester || ""}
                  onChange={(e) => setFilters((prev) => ({ ...prev, semester: e.target.value || undefined }))}
                  className="mt-1 w-full rounded-lg border border-border/60 bg-background px-2 py-1 text-sm"
                >
                  <option value="">All</option>
                  {Array.from({ length: 8 }).map((_, idx) => (
                    <option key={`sem-${idx + 1}`} value={`${idx + 1}`}>
                      {idx + 1}
                    </option>
                  ))}
                </select>
              </label>
              <label className="text-xs text-muted-foreground">
                Branch
                <select
                  value={filters.branch || ""}
                  onChange={(e) => setFilters((prev) => ({ ...prev, branch: e.target.value || undefined }))}
                  className="mt-1 w-full rounded-lg border border-border/60 bg-background px-2 py-1 text-sm"
                >
                  <option value="">All</option>
                  {["CSE", "ECE", "EEE", "Mechanical", "Civil", "Chemical", "IT", "AIML"].map((value) => (
                    <option key={value} value={value}>
                      {value}
                    </option>
                  ))}
                </select>
              </label>
              <label className="text-xs text-muted-foreground">
                Source Type
                <select
                  value={filters.source_type || "both"}
                  onChange={(e) =>
                    setFilters((prev) => ({
                      ...prev,
                      source_type: (e.target.value as RagFilters["source_type"]) || "both",
                    }))
                  }
                  className="mt-1 w-full rounded-lg border border-border/60 bg-background px-2 py-1 text-sm"
                >
                  <option value="both">Both</option>
                  <option value="pdf">PDFs</option>
                  <option value="youtube">Videos</option>
                </select>
              </label>
              <label className="text-xs text-muted-foreground">
                Subject
                <input
                  value={filters.subject || ""}
                  onChange={(e) => setFilters((prev) => ({ ...prev, subject: e.target.value || undefined }))}
                  placeholder="e.g. Chemistry"
                  className="mt-1 w-full rounded-lg border border-border/60 bg-background px-2 py-1 text-sm"
                />
              </label>
              <div className="sm:col-span-2">
                <button
                  type="button"
                  onClick={() => setFilters(DEFAULT_FILTERS)}
                  className="rounded-full border border-border/60 bg-background/80 px-3 py-1 text-[11px] text-muted-foreground transition hover:border-primary/60 hover:text-primary"
                >
                  Clear filters
                </button>
              </div>
            </div>
          )}
          {messages.length > 0 && (
            <div className="mb-2 flex justify-end">
              <button
                type="button"
                onClick={() => void handleCopyConversation()}
                className={cn(
                  "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] transition",
                  copiedConversation
                    ? "border-primary/50 bg-primary/10 text-primary"
                    : "border-border/60 bg-background/70 text-muted-foreground hover:border-primary/60 hover:text-primary"
                )}
              >
                {copiedConversation ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
                {copiedConversation ? "Copied All" : "Copy Full Chat"}
              </button>
            </div>
          )}
          <div className="flex items-end gap-2">
            <Textarea
              ref={inputRef}
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={isMinimal ? "Message StudyShare AI..." : "Ask about any topic in your PDFs or video transcripts..."}
              className={cn(
                isCompact
                  ? "min-h-[64px] resize-none rounded-xl border border-border/60 bg-background focus-visible:ring-2 focus-visible:ring-primary/40"
                  : isMinimal
                    ? "min-h-[60px] max-h-[180px] resize-none rounded-2xl border border-border/70 bg-background px-3 py-3 text-sm focus-visible:ring-2 focus-visible:ring-primary/30"
                    : "min-h-[84px] resize-none rounded-2xl border border-border/60 bg-background/70 focus-visible:ring-2 focus-visible:ring-primary/40",
                isMinimal && "bg-background"
              )}
            />
            <Button
              onClick={() => void handleAsk()}
              disabled={loading || !question.trim()}
              className={cn(
                isMinimal ? "h-10 w-10 shrink-0 rounded-xl transition" : "h-12 w-12 rounded-2xl transition",
                isMinimal
                  ? "bg-primary text-primary-foreground hover:shadow-hover"
                  : "bg-gradient-primary text-primary-foreground shadow-glow hover:shadow-hover",
                loading && "animate-pulse"
              )}
            >
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
            </Button>
          </div>
          {isSimpleMinimal && (
            <p className="mt-2 px-1 text-[11px] text-muted-foreground">
              Press Enter to send, Shift + Enter for a new line.
            </p>
          )}
        </div>
      </div>

      {activeQuiz && activeQuizQuestion && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="w-full max-w-2xl rounded-2xl border border-border/60 bg-background p-4 shadow-card sm:p-6">
            <div className="flex items-center justify-between gap-2">
              <div>
                <div className="text-xs uppercase tracking-[0.18em] text-muted-foreground">Quiz Mode</div>
                <h3 className="font-editorial text-xl text-foreground">{activeQuiz.paper.subject}</h3>
              </div>
              <button
                type="button"
                onClick={() => setActiveQuiz(null)}
                className="rounded-full border border-border/60 px-3 py-1 text-xs text-muted-foreground transition hover:border-primary/60 hover:text-primary"
              >
                Close
              </button>
            </div>

            {activeQuiz.submitted && (
              <div className="mt-3 rounded-xl border border-primary/30 bg-primary/10 px-3 py-2 text-sm text-primary">
                Score: {activeQuizScore} / {activeQuiz.paper.questions.length}
              </div>
            )}

            <div className="mt-4 text-xs text-muted-foreground">
              Question {activeQuiz.currentIndex + 1} of {activeQuiz.paper.questions.length}
            </div>
            <div className="mt-1 text-base font-medium text-foreground">{activeQuizQuestion.question}</div>

            <div className="mt-3 space-y-2">
              {activeQuizQuestion.options.map((option, optionIndex) => {
                const selected = activeQuiz.selected[activeQuiz.currentIndex] === optionIndex;
                const isCorrect =
                  activeQuiz.submitted && typeof activeQuizQuestion.correctAnswerIndex === "number"
                    ? activeQuizQuestion.correctAnswerIndex === optionIndex
                    : false;
                const isWrongSelected =
                  activeQuiz.submitted && selected && typeof activeQuizQuestion.correctAnswerIndex === "number"
                    ? activeQuizQuestion.correctAnswerIndex !== optionIndex
                    : false;

                return (
                  <button
                    key={`quiz-option-${optionIndex}`}
                    type="button"
                    onClick={() => handleSelectQuizOption(optionIndex)}
                    disabled={activeQuiz.submitted}
                    className={cn(
                      "w-full rounded-xl border px-3 py-2 text-left text-sm transition",
                      selected
                        ? "border-primary/60 bg-primary/10 text-foreground"
                        : "border-border/60 bg-background text-foreground hover:border-primary/40",
                      isCorrect && "border-emerald-500/60 bg-emerald-500/10",
                      isWrongSelected && "border-rose-500/60 bg-rose-500/10",
                      activeQuiz.submitted && "cursor-default"
                    )}
                  >
                    {option}
                  </button>
                );
              })}
            </div>

            <div className="mt-4 flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => handleMoveQuiz(-1)}
                  disabled={activeQuiz.currentIndex === 0}
                  className="rounded-full border border-border/60 px-3 py-1 text-xs text-muted-foreground transition hover:border-primary/60 hover:text-primary disabled:cursor-not-allowed disabled:opacity-50"
                >
                  Previous
                </button>
                <button
                  type="button"
                  onClick={() => handleMoveQuiz(1)}
                  disabled={activeQuiz.currentIndex >= activeQuiz.paper.questions.length - 1}
                  className="rounded-full border border-border/60 px-3 py-1 text-xs text-muted-foreground transition hover:border-primary/60 hover:text-primary disabled:cursor-not-allowed disabled:opacity-50"
                >
                  Next
                </button>
              </div>

              {!activeQuiz.submitted ? (
                <button
                  type="button"
                  onClick={handleSubmitQuiz}
                  className="rounded-full border border-primary/40 bg-primary/10 px-3 py-1 text-xs text-primary transition hover:border-primary hover:bg-primary/20"
                >
                  Submit Quiz
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => setActiveQuiz(null)}
                  className="rounded-full border border-border/60 px-3 py-1 text-xs text-muted-foreground transition hover:border-primary/60 hover:text-primary"
                >
                  Done
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AIRagChat;
