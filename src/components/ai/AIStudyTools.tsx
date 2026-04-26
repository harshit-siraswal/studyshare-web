import { useMemo, useState } from "react";
import {
  Loader2,
  Sparkles,
  HelpCircle,
  Layers,
  MessageSquare,
  Wand2,
  RefreshCcw,
  Eye,
  EyeOff,
  ClipboardCopy,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Download,
  Settings2,
} from "lucide-react";
import { jsPDF } from "jspdf";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { useAuth } from "@/context/AuthContext";
import { useCollege } from "@/context/CollegeContext";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import {
  ApiError,
  formatAiTokenQuotaMessage,
  getAiFlashcards,
  getAiQuiz,
  getAiSummary,
  isAiTokenQuotaExceededPayload,
  queryRag,
} from "@/lib/api";
import BrandLoader from "@/components/BrandLoader";
import AIRagChat from "@/components/ai/AIRagChat";
import { extractYouTubeId } from "@/lib/youtube";

type OutputType = "summary" | "quiz" | "flashcards" | "chat";

type OcrProvider = "google_vision";
type AiOptions = {
  force?: boolean;
  includeSource?: boolean;
  videoUrl?: string;
};

interface QuizQuestion {
  question: string;
  options: string[];
  correct: string;
}

interface Flashcard {
  front: string;
  back: string;
}

interface AIStudyToolsProps {
  resourceId: string;
  className?: string;
  resourceTitle?: string;
  resourceType?: "notes" | "pyq" | "video";
  videoUrl?: string;
}

type SummaryBlockKind = "heading" | "bullet" | "paragraph";

interface SummaryBlock {
  kind: SummaryBlockKind;
  text: string;
}

interface ParsedSummary {
  blocks: SummaryBlock[];
  bullets: string[];
  paragraphs: string[];
  plainText: string;
}

const OUTPUT_META: Record<OutputType, { label: string; helper: string; icon: typeof Sparkles }> = {
  summary: {
    label: "Summary",
    helper: "Clean, exam-focused digest of key concepts.",
    icon: Sparkles,
  },
  quiz: {
    label: "Quiz",
    helper: "10 medium-level MCQs with clear answers.",
    icon: HelpCircle,
  },
  flashcards: {
    label: "Flashcards",
    helper: "Flip-style flashcards for rapid recall.",
    icon: Layers,
  },
  chat: {
    label: "Chat",
    helper: "Ask context-grounded questions from this resource.",
    icon: MessageSquare,
  },
};

function normalizeOcrProvider(provider: unknown): OcrProvider | null {
  if (provider === "google_vision" || provider === "google") return "google_vision";
  return null;
}

function getOcrProviderLabel(provider: OcrProvider | null): string {
  if (provider === "google_vision") return "Google Vision";
  return "";
}

function normalizeVideoSummaryUrl(url: string | undefined): string | undefined {
  if (!url) return undefined;
  const trimmed = url.trim();
  if (!trimmed) return undefined;
  const youtubeId = extractYouTubeId(trimmed);
  if (youtubeId) {
    return `https://www.youtube.com/watch?v=${youtubeId}`;
  }
  return trimmed;
}

function shouldFallbackToRagSummary(summaryText: string): boolean {
  const normalized = summaryText.trim();
  if (!normalized) return true;

  const lowercase = normalized.toLowerCase();
  const noContentPatterns = [
    "can't directly access your local files",
    "cannot directly access your local files",
    "access your local files",
    "no local match",
    "no answer returned",
    "ai request failed",
    "failed to get ai response",
  ];
  if (noContentPatterns.some((pattern) => lowercase.includes(pattern))) return true;

  if ((normalized.startsWith("{") && normalized.endsWith("}")) || (normalized.startsWith("[") && normalized.endsWith("]"))) {
    return true;
  }

  return normalized.split(/\s+/).filter(Boolean).length < 24;
}

function coerceSummaryText(value: unknown): string {
  if (typeof value === "string") return value;
  if (value == null) return "";

  const serialized = JSON.stringify(value);
  if (typeof serialized === "string") return serialized;

  return String(value ?? "");
}

const SUMMARY_BULLET_PREFIX_RE = /^([-*\u2022]|\d+[.)])\s+/;

function summaryPlain(input: string): string {
  return input
    .replace(/\*\*([^*]+)\*\*/g, "$1")
    .replace(/__([^_]+)__/g, "$1")
    .replace(/`([^`]+)`/g, "$1")
    .replace(/\[(.*?)\]\((.*?)\)/g, "$1")
    .replace(/^\s*>+\s?/, "")
    .replace(/\s+/g, " ")
    .trim();
}

function parseSummary(summary: string): ParsedSummary {
  const lines = summary.replace(/\r/g, "").split("\n");
  const blocks: SummaryBlock[] = [];

  for (const rawLine of lines) {
    const trimmedRaw = rawLine.trim();
    if (!trimmedRaw) continue;

    const isBullet = SUMMARY_BULLET_PREFIX_RE.test(trimmedRaw);
    const line = summaryPlain(
      trimmedRaw
        .replace(/^#+\s*/, "")
        .replace(SUMMARY_BULLET_PREFIX_RE, "")
    );
    if (!line) continue;

    const headingCandidate = line.replace(/[:\-\s]+$/, "").trim();
    const headingWords = headingCandidate.split(/\s+/).filter(Boolean).length;
    const looksLikeHeading =
      trimmedRaw.startsWith("#") ||
      (!isBullet && trimmedRaw.endsWith(":")) ||
      (!isBullet && headingWords > 0 && headingWords <= 7 && /^[A-Z]/.test(headingCandidate));

    if (looksLikeHeading && headingCandidate) {
      blocks.push({ kind: "heading", text: headingCandidate });
    } else if (isBullet) {
      blocks.push({ kind: "bullet", text: line });
    } else {
      blocks.push({ kind: "paragraph", text: line });
    }
  }

  if (!blocks.length) {
    const fallback = summaryPlain(summary.replace(/^[*-]\s*/gm, ""));
    if (fallback) {
      blocks.push({ kind: "paragraph", text: fallback });
    }
  }

  const bullets = blocks.filter((block) => block.kind === "bullet").map((block) => block.text);
  const paragraphs = blocks
    .filter((block) => block.kind === "paragraph")
    .map((block) => block.text);

  return {
    blocks,
    bullets,
    paragraphs,
    plainText: blocks.map((block) => block.text).join("\n").trim(),
  };
}

function getCorrectIndex(question: QuizQuestion) {
  const correct = question.correct?.trim();
  if (!correct) return -1;
  const letter = correct.toUpperCase();
  if (letter.length === 1 && letter >= "A" && letter <= "D") {
    return letter.charCodeAt(0) - 65;
  }
  const idx = question.options?.findIndex(
    (opt) => opt.trim().toLowerCase() === correct.toLowerCase()
  );
  return idx ?? -1;
}

function extractSummaryThemes(parsed: ParsedSummary | null) {
  if (!parsed) return [] as string[];
  const sourceBlocks = parsed.blocks
    .filter((block) => block.kind !== "heading")
    .map((block) => block.text);
  const blocks = (sourceBlocks.length ? sourceBlocks : parsed.blocks.map((block) => block.text)).filter(Boolean);
  const themes: string[] = [];
  const seen = new Set<string>();

  for (const block of blocks) {
    const words = block
      .replace(/[^a-zA-Z0-9\s]/g, " ")
      .split(/\s+/)
      .map((word) => word.trim())
      .filter((word) => word.length > 3);
    if (!words.length) continue;
    const theme = words.slice(0, 2).join(" ");
    const key = theme.toLowerCase();
    if (!seen.has(key)) {
      seen.add(key);
      themes.push(theme.charAt(0).toUpperCase() + theme.slice(1));
    }
    if (themes.length >= 4) break;
  }

  return themes;
}

const AIStudyTools = ({
  resourceId,
  className,
  resourceTitle,
  resourceType = "notes",
  videoUrl,
}: AIStudyToolsProps) => {
  const { user } = useAuth();
  const { selectedCollegeId } = useCollege();
  const usesTranscript = resourceType === "video";
  const isYouTubeVideo = useMemo(() => {
    if (!videoUrl) return false;
    return /(?:youtu\.be|youtube\.com|youtube-nocookie\.com)/i.test(videoUrl);
  }, [videoUrl]);
  const shouldUseTranscript = usesTranscript && isYouTubeVideo;
  const [active, setActive] = useState<OutputType>("summary");
  const [loading, setLoading] = useState(false);
  const [loadingType, setLoadingType] = useState<OutputType | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [quotaLimit, setQuotaLimit] = useState<{
    remaining: number;
    used: number;
    budget: number;
  } | null>(null);
  const [cachedMap, setCachedMap] = useState<Partial<Record<OutputType, boolean>>>({});
  const [summary, setSummary] = useState<string | null>(null);
  const [quiz, setQuiz] = useState<QuizQuestion[] | null>(null);
  const [flashcards, setFlashcards] = useState<Flashcard[] | null>(null);
  const [freshRun, setFreshRun] = useState(true);
  const [showAnswers, setShowAnswers] = useState(false);
  const [selectedAnswers, setSelectedAnswers] = useState<Record<number, number>>({});
  const [activeQuizIndex, setActiveQuizIndex] = useState(0);
  const [activeCardIndex, setActiveCardIndex] = useState(0);
  const [isCardFlipped, setIsCardFlipped] = useState(false);
  const [cardDirection, setCardDirection] = useState<"next" | "prev" | null>(null);
  const [copied, setCopied] = useState(false);
  const [sourceText, setSourceText] = useState<string | null>(null);
  const [sourceType, setSourceType] = useState<"primary" | "ocr" | "transcript" | null>(null);
  const [sourceProvider, setSourceProvider] = useState<OcrProvider | null>(null);
  const [showSource, setShowSource] = useState(false);
  const [showOptions, setShowOptions] = useState(false);

  const summaryParsed = useMemo(() => (summary ? parseSummary(summary) : null), [summary]);
  const summaryThemes = useMemo(() => extractSummaryThemes(summaryParsed), [summaryParsed]);
  const summaryPlainText = useMemo(
    () => summaryParsed?.plainText || (summary ? summaryPlain(summary) : ""),
    [summaryParsed, summary]
  );
  const summaryWordCount = useMemo(
    () => (summaryPlainText ? summaryPlainText.split(/\s+/).filter(Boolean).length : 0),
    [summaryPlainText]
  );

  const handleGenerate = async (type: OutputType, override?: AiOptions) => {
    if (!user) {
      toast.error("Please login to use AI tools");
      return;
    }
    if (type === "chat") {
      setActive("chat");
      return;
    }

    setActive(type);
    setLoading(true);
    setLoadingType(type);
    setError(null);
    setQuotaLimit(null);
    setSourceText(null);
    setSourceType(null);
    setSourceProvider(null);
    setShowSource(false);

    try {
      const collegeId = selectedCollegeId || undefined;
      const resolvedVideoUrl = normalizeVideoSummaryUrl(override?.videoUrl ?? videoUrl);
      const hasVideoUrl = Boolean(resolvedVideoUrl && resolvedVideoUrl.trim().length > 0);
      const shouldUseVideoTranscript = usesTranscript && hasVideoUrl;
      const options = {
        collegeId,
        force: override?.force ?? freshRun,
        includeSource: override?.includeSource ?? false,
        videoUrl: shouldUseVideoTranscript ? resolvedVideoUrl : undefined,
      };
      if (type === "summary") {
        const result = await getAiSummary(resourceId, options);
        let summaryText = coerceSummaryText(result.data).trim();
        if (!summaryText) {
          throw new Error("No summary was returned for this resource.");
        }
        let sourceTextValue = result.source?.text ?? null;
        let sourceTypeValue = result.source?.type ?? "primary";
        let sourceProviderValue = normalizeOcrProvider(result.source?.ocrProvider);
        let showSourceValue = Boolean(result.source?.text);

        if (shouldUseVideoTranscript && shouldFallbackToRagSummary(summaryText)) {
          const ragFallback = await queryRag(
            [
              "Generate clean, exam-ready study notes from this YouTube video.",
              "Return concise headings and bullet points only.",
              `Video URL: ${resolvedVideoUrl}`,
            ].join("\n"),
            {
              collegeId,
              allowWeb: true,
              filters: { source_type: "youtube" },
              videoUrl: resolvedVideoUrl,
            }
          );
          if (ragFallback?.answer?.trim()) {
            summaryText = ragFallback.answer.trim();
            if (ragFallback.sources?.length) {
              showSourceValue = true;
              sourceTypeValue = "transcript";
              sourceProviderValue = null;
              sourceTextValue = ragFallback.sources
                .map((source) => source.title)
                .filter(Boolean)
                .join("\n");
            }
          }
        }

        setSummary(summaryText);
        if (showSourceValue && sourceTextValue) {
          setSourceText(sourceTextValue);
          setSourceType(sourceTypeValue);
          setSourceProvider(sourceProviderValue);
          setShowSource(true);
        } else if (shouldUseVideoTranscript && shouldFallbackToRagSummary(summaryText)) {
          setError(
            "Unable to extract enough transcript context for this video. Try Fresh run or use a different YouTube link."
          );
        } else if (result.source?.text) {
          setSourceText(result.source.text);
          setSourceType(result.source.type ?? "primary");
          setSourceProvider(normalizeOcrProvider(result.source.ocrProvider));
          setShowSource(true);
        }
        setCachedMap((prev) => ({ ...prev, summary: !!result.cached }));
      } else if (type === "quiz") {
        const result = await getAiQuiz(resourceId, options);
        setQuiz(Array.isArray(result.data) ? result.data : []);
        if (result.source?.text) {
          setSourceText(result.source.text);
          setSourceType(result.source.type ?? "primary");
          setSourceProvider(normalizeOcrProvider(result.source.ocrProvider));
          setShowSource(true);
        }
        setSelectedAnswers({});
        setActiveQuizIndex(0);
        setCachedMap((prev) => ({ ...prev, quiz: !!result.cached }));
      } else {
        const result = await getAiFlashcards(resourceId, options);
        setFlashcards(Array.isArray(result.data) ? result.data : []);
        if (result.source?.text) {
          setSourceText(result.source.text);
          setSourceType(result.source.type ?? "primary");
          setSourceProvider(normalizeOcrProvider(result.source.ocrProvider));
          setShowSource(true);
        }
        setActiveCardIndex(0);
        setIsCardFlipped(false);
        setCardDirection(null);
        setCachedMap((prev) => ({ ...prev, flashcards: !!result.cached }));
      }
    } catch (err: unknown) {
      if (err instanceof ApiError && isAiTokenQuotaExceededPayload(err.payload)) {
        const balance = err.payload.balance || {};
        setQuotaLimit({
          remaining: Number(balance.remaining_tokens ?? 0),
          used: Number(balance.used_tokens ?? 0),
          budget: Number(balance.budget_tokens ?? 0),
        });
        setError(formatAiTokenQuotaMessage(err.payload));
      } else {
        setError(err instanceof Error ? err.message : "AI request failed");
      }
    } finally {
      setLoading(false);
      setLoadingType(null);
    }
  };

  const handleCopySummary = async () => {
    if (!summaryPlainText) return;
    try {
      await navigator.clipboard.writeText(summaryPlainText);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      toast.error("Failed to copy summary");
    }
  };

  const handleExportSummary = () => {
    if (!summaryParsed?.blocks.length) return;

    try {
      const parsedBlocks = summaryParsed.blocks;
      const firstHeadingIndex = parsedBlocks.findIndex((block) => block.kind === "heading");
      const doc = new jsPDF({ unit: "pt", format: "a4", compress: true });
      const pageWidth = doc.internal.pageSize.getWidth();
      const pageHeight = doc.internal.pageSize.getHeight();
      const marginX = 48;
      const contentWidth = pageWidth - marginX * 2;
      const footerY = pageHeight - 22;
      const generatedAt = new Date().toLocaleString("en-IN", {
        dateStyle: "medium",
        timeStyle: "short",
      });
      const renderHeader = () => {
        doc.setFillColor(13, 148, 136);
        doc.roundedRect(28, 24, pageWidth - 56, 96, 14, 14, "F");
        doc.setFillColor(15, 118, 110);
        doc.roundedRect(pageWidth - 168, 24, 140, 96, 14, 14, "F");
        doc.setTextColor(255, 255, 255);
        doc.setFont("helvetica", "bold");
        doc.setFontSize(18);
        doc.text("StudyShare AI Summary", marginX, 56);
        doc.setFont("helvetica", "normal");
        doc.setFontSize(10.5);
        doc.text(resourceTitle ? `From ${resourceTitle}` : "From selected learning resource", marginX, 78, {
          maxWidth: contentWidth - 28,
        });
        doc.setFontSize(9.5);
        doc.text(`Generated ${generatedAt}`, marginX, 96);
      };
      const addFooter = () => {
        const totalPages = doc.getNumberOfPages();
        for (let page = 1; page <= totalPages; page += 1) {
          doc.setPage(page);
          doc.setDrawColor(226, 232, 240);
          doc.line(marginX, pageHeight - 32, pageWidth - marginX, pageHeight - 32);
          doc.setTextColor(100, 116, 139);
          doc.setFont("helvetica", "normal");
          doc.setFontSize(9);
          doc.text("studyshare.in", marginX, footerY);
          doc.text(`Page ${page} of ${totalPages}`, pageWidth - marginX, footerY, { align: "right" });
        }
      };

      renderHeader();
      let y = 154;
      const ensureSpace = (neededHeight: number) => {
        if (y + neededHeight <= pageHeight - 48) return;
        doc.addPage();
        renderHeader();
        y = 154;
      };

      doc.setTextColor(15, 23, 42);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(14);
      doc.text("Key Points", marginX, y);
      y += 20;

      parsedBlocks.forEach((block, index) => {
        if (block.kind === "heading") {
          const lines = doc.splitTextToSize(block.text, contentWidth);
          const isMainHeading = firstHeadingIndex === index;
          const fontSize = isMainHeading ? 15 : 12.5;
          const lineHeight = isMainHeading ? 19 : 16;
          ensureSpace(lines.length * lineHeight + 12);
          doc.setTextColor(15, 118, 110);
          doc.setFont("helvetica", "bold");
          doc.setFontSize(fontSize);
          doc.text(lines, marginX, y);
          y += lines.length * lineHeight + 6;
          return;
        }

        if (block.kind === "bullet") {
          const indent = 14;
          const lines = doc.splitTextToSize(block.text, contentWidth - indent);
          const lineHeight = 15;
          ensureSpace(lines.length * lineHeight + 10);
          doc.setFillColor(20, 184, 166);
          doc.circle(marginX + 3, y - 5, 2.2, "F");
          doc.setFont("helvetica", "normal");
          doc.setFontSize(11);
          doc.setTextColor(51, 65, 85);
          doc.text(lines, marginX + indent, y);
          y += lines.length * lineHeight + 4;
          return;
        }

        const lines = doc.splitTextToSize(block.text, contentWidth);
        const lineHeight = 15;
        ensureSpace(lines.length * lineHeight + 10);
        doc.setFont("helvetica", "normal");
        doc.setFontSize(11);
        doc.setTextColor(51, 65, 85);
        doc.text(lines, marginX, y);
        y += lines.length * lineHeight + 4;
      });

      if (summaryThemes.length) {
        ensureSpace(54);
        y += 8;
        doc.setDrawColor(226, 232, 240);
        doc.line(marginX, y, pageWidth - marginX, y);
        y += 18;
        doc.setTextColor(15, 23, 42);
        doc.setFont("helvetica", "bold");
        doc.setFontSize(12);
        doc.text("Main Themes", marginX, y);
        y += 14;
        doc.setTextColor(71, 85, 105);
        doc.setFont("helvetica", "normal");
        doc.setFontSize(10.5);
        doc.text(doc.splitTextToSize(summaryThemes.join(" | "), contentWidth), marginX, y);
      }

      addFooter();
      const fileSafeTitle = (resourceTitle || "ai-summary")
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-+|-+$/g, "");
      doc.save(`${fileSafeTitle || "ai-summary"}-summary.pdf`);
    } catch {
      toast.error("Failed to export summary");
    }
  };

  const toggleFlip = () => {
    setIsCardFlipped((prev) => !prev);
  };

  const handleNextCard = (totalCards: number) => {
    if (activeCardIndex >= totalCards - 1) return;
    setCardDirection("next");
    setActiveCardIndex((prev) => prev + 1);
    setIsCardFlipped(false);
  };

  const handlePrevCard = () => {
    if (activeCardIndex <= 0) return;
    setCardDirection("prev");
    setActiveCardIndex((prev) => prev - 1);
    setIsCardFlipped(false);
  };

  const meta = OUTPUT_META[active];
  const isLoadingSummary = loading && loadingType === "summary";
  const isLoadingQuiz = loading && loadingType === "quiz";
  const isLoadingFlashcards = loading && loadingType === "flashcards";

    return (
    <div
      className={cn(
        "flex h-full min-h-0 flex-col overflow-hidden rounded-xl border border-border bg-card",
        className
      )}
    >
      <div className="flex h-full min-h-0 flex-col font-ai">
        <Tabs value={active} onValueChange={(v) => setActive(v as OutputType)} className="flex h-full min-h-0 flex-col">
          <div className="border-b border-border/70 bg-card/70 px-2">
            <div className="flex items-center gap-2 py-2">
              <TabsList className="grid h-11 flex-1 grid-cols-4 rounded-none bg-transparent p-0">
                {(["summary", "quiz", "flashcards", "chat"] as OutputType[]).map((type) => {
                  const Icon = OUTPUT_META[type].icon;
                  return (
                    <TabsTrigger
                      key={type}
                      value={type}
                      className="h-11 gap-1 rounded-none border-b-2 border-transparent text-xs font-medium text-muted-foreground data-[state=active]:border-primary data-[state=active]:bg-muted/30 data-[state=active]:text-foreground"
                    >
                      <Icon className="h-3.5 w-3.5" />
                      <span className="hidden sm:inline">{OUTPUT_META[type].label}</span>
                    </TabsTrigger>
                  );
                })}
              </TabsList>

              {active === "chat" ? (
                <Badge variant="secondary" className="hidden sm:inline-flex text-[11px]">
                  Live chat
                </Badge>
              ) : (
                <Button
                  size="sm"
                  variant="secondary"
                  onClick={() => handleGenerate(active)}
                  disabled={loading}
                  className="h-8 rounded-md px-3 text-xs"
                >
                  {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Generate"}
                </Button>
              )}

              <Button
                size="icon"
                variant="ghost"
                onClick={() => setShowOptions((prev) => !prev)}
                className="h-8 w-8 rounded-md border border-border bg-muted/30"
                title={showOptions ? "Hide options" : "Show options"}
              >
                <Settings2 className="h-3.5 w-3.5" />
              </Button>
            </div>

            {showOptions && (
              <div className="flex flex-wrap items-center gap-3 border-t border-border/60 py-2 text-[11px] text-muted-foreground">
                <span className="rounded-full border border-border bg-muted/40 px-2 py-1">
                  {meta.helper}
                </span>
                <label className="flex items-center gap-2">
                  Fresh run
                  <Switch checked={freshRun} onCheckedChange={setFreshRun} />
                </label>
                <span className="rounded-full border border-border bg-muted/40 px-2 py-1">
                  {isYouTubeVideo ? "Using YouTube transcript" : "OCR disabled on web AI Studio"}
                </span>
                <span className="ml-auto hidden md:inline text-muted-foreground/80">
                  {active === "chat" ? "Live mode" : cachedMap[active] ? "Cached result" : "Fresh result"}
                </span>
              </div>
            )}
          </div>

          <div className="flex-1 min-h-0 overflow-y-auto p-2 sm:p-3">
          {error && (
            <div className="mb-2 flex items-center gap-2 rounded-xl border border-red-500/30 bg-red-500/10 px-3 py-2 text-xs text-red-700 dark:text-red-300">
              <Wand2 className="h-4 w-4" />
              <div className="flex flex-1 items-center justify-between gap-3">
                <div className="space-y-1">
                  <span>{error}</span>
                  {quotaLimit && (
                    <div className="text-[11px] text-red-700/90 dark:text-red-200/90">
                      Used {quotaLimit.used} • Remaining {quotaLimit.remaining} / {quotaLimit.budget}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          <TabsContent value="summary" className="mt-0">
            <div className="rounded-2xl border border-border bg-background/70 p-4">
              {isLoadingSummary ? (
                <div className="flex min-h-[220px] items-center justify-center">
                  <BrandLoader label="Summarizing your notes..." />
                </div>
              ) : summary ? (
                <div className="space-y-5 text-sm leading-relaxed">
                  <div className="space-y-1">
                    <div className="text-xl font-semibold text-foreground">Quick Summary</div>
                    <p className="text-xs text-muted-foreground">
                      {resourceTitle ? `Generated from ${resourceTitle}` : "Generated from your selected content"}
                    </p>
                  </div>

                  <div className="space-y-3">
                    <div className="text-base font-semibold text-foreground">Key Points</div>
                    <div className="space-y-2.5">
                      {(summaryParsed?.blocks || [{ kind: "paragraph" as const, text: summaryPlain(summary) }]).map(
                        (block, idx) => {

                          if (block.kind === "heading") {
                            return (
                              <p
                                key={idx}
                                className={cn(
                                  "font-semibold text-foreground",
                                  idx === 0 ? "text-base" : "pt-1 text-sm"
                                )}
                              >
                                {block.text}
                              </p>
                            );
                          }


                          if (block.kind === "bullet") {
                            return (
                              <div key={idx} className="flex gap-3">
                                <span className="mt-1.5 h-1.5 w-1.5 rounded-full bg-primary/80" />
                                <span className="text-sm text-foreground/90">{block.text}</span>
                              </div>
                            );
                          }

                          return (
                            <p key={idx} className="text-sm text-foreground/90">
                              {block.text}
                            </p>
                          );
                        }
                      )}
                    </div>
                  </div>

                  {summaryThemes.length > 0 && (
                    <div className="space-y-2 border-t border-border/70 pt-4">
                      <div className="text-base font-semibold text-foreground">Main Themes</div>
                      <div className="flex flex-wrap gap-2">
                        {summaryThemes.map((theme) => (
                          <span
                            key={theme}
                            className="rounded-full border border-border bg-muted/40 px-3 py-1 text-xs text-foreground/90"
                          >
                            {theme}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="space-y-3 border-t border-border/70 pt-4">
                    <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
                      <span>
                        <span className="font-semibold text-foreground">Words:</span>{" "}
                        {summaryWordCount.toLocaleString()}
                      </span>
                      <span>
                        <span className="font-semibold text-foreground">Blocks:</span>{" "}
                        {summaryParsed?.blocks.length || 1}
                      </span>
                      {cachedMap.summary && <span className="text-xs">Cached result</span>}
                    </div>
                    <div className="flex flex-wrap items-center gap-2">
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={handleCopySummary}
                        className="h-8 rounded-md border border-border bg-muted/40 text-xs text-foreground hover:bg-muted"
                      >
                        {copied ? (
                          <CheckCircle2 className="h-3.5 w-3.5" />
                        ) : (
                          <ClipboardCopy className="h-3.5 w-3.5" />
                        )}
                        <span className="ml-1">{copied ? "Copied" : "Copy"}</span>
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleGenerate("summary")}
                        className="h-8 rounded-md border border-border bg-muted/40 text-xs text-foreground hover:bg-muted"
                      >
                        <RefreshCcw className="h-3.5 w-3.5" />
                        <span className="ml-1">Regenerate</span>
                      </Button>
                    </div>
                    <Button
                      onClick={handleExportSummary}
                      className="h-10 w-full rounded-md"
                    >
                      <Download className="h-3.5 w-3.5" />
                      <span className="ml-2">Export PDF</span>
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center gap-2 py-10 text-center text-xs text-muted-foreground">
                  <Sparkles className="h-6 w-6 text-primary" />
                  <p>Generate a clean, exam-ready summary from this document.</p>
                </div>
              )}
            </div>
          </TabsContent>

          <TabsContent value="quiz" className="mt-0">
            <div className="rounded-2xl border border-border bg-background/70 p-4">
              {isLoadingQuiz ? (
                <div className="flex min-h-[220px] items-center justify-center">
                  <BrandLoader label="Building your quiz..." />
                </div>
              ) : quiz && quiz.length > 0 ? (
                (() => {
                  const currentQuestion = quiz[activeQuizIndex];
                  const correctIndex = currentQuestion ? getCorrectIndex(currentQuestion) : -1;
                  const selected = selectedAnswers[activeQuizIndex];
                  const hasSelection = selected !== undefined;

                  if (!currentQuestion) return null;

                  return (
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <div className="text-xs text-muted-foreground">{quiz.length} questions</div>
                        <div className="flex items-center gap-2">
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => setShowAnswers((prev) => !prev)}
                            className="h-8 rounded-md border border-border bg-muted/40 text-xs text-foreground hover:bg-muted"
                          >
                            {showAnswers ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                            <span className="ml-1">{showAnswers ? "Hide" : "Show"} answers</span>
                          </Button>
                        </div>
                      </div>

                      <div className="flex items-center justify-between gap-3">
                        <div className="text-sm font-semibold text-foreground">
                          Question {activeQuizIndex + 1} of {quiz.length}
                        </div>
                        <div className="flex max-w-[220px] items-center gap-1 overflow-x-auto pb-1">
                          {quiz.map((_, idx) => (
                            <span
                              key={`quiz-progress-${idx}`}
                              className={cn(
                                "h-2 w-8 shrink-0 rounded-full",
                                idx <= activeQuizIndex ? "bg-primary" : "bg-muted"
                              )}
                            />
                          ))}
                        </div>
                      </div>

                      <div className="rounded-xl border border-border bg-card/70 p-4">
                        <div className="text-sm font-semibold leading-relaxed text-foreground">
                          {currentQuestion.question}
                        </div>
                        <div className="mt-3 grid gap-2">
                          {currentQuestion.options?.map((opt, oidx) => {
                            const isSelected = selected === oidx;
                            const isCorrect = oidx === correctIndex;
                            const revealCorrect = showAnswers || hasSelection;
                            const isRightSelected = hasSelection && isSelected && isCorrect;
                            const isWrongSelected = hasSelection && isSelected && !isCorrect;
                            const showCorrect = revealCorrect && isCorrect;
                            return (
                              <button
                                key={`${activeQuizIndex}-opt-${oidx}`}
                                type="button"
                                onClick={() =>
                                  setSelectedAnswers((prev) => ({ ...prev, [activeQuizIndex]: oidx }))
                                }
                                className={cn(
                                  "flex w-full items-center gap-2 rounded-lg border px-3 py-2 text-left text-xs transition",
                                  "border-border bg-background/70",
                                  showCorrect && "border-primary/50 bg-primary/10 text-foreground",
                                  isWrongSelected && "border-rose-400/50 bg-rose-500/10 text-rose-800 dark:text-rose-100",
                                  isRightSelected && "border-primary/60 bg-primary/15 text-foreground"
                                )}
                                aria-pressed={isSelected}
                              >
                                <span className="text-[11px] font-semibold text-muted-foreground">
                                  {String.fromCharCode(65 + oidx)}
                                </span>
                                <span>{opt}</span>
                              </button>
                            );
                          })}
                        </div>
                        {(showAnswers || hasSelection) && correctIndex >= 0 && (
                          <div className="mt-2 text-[11px] text-primary">
                            Correct: {String.fromCharCode(65 + correctIndex)}
                          </div>
                        )}
                      </div>

                      <div className="flex items-center gap-2 pt-1">
                        {activeQuizIndex > 0 && (
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => setActiveQuizIndex((prev) => Math.max(prev - 1, 0))}
                            className="h-10 rounded-md border border-border bg-muted/40 px-4 text-xs text-foreground hover:bg-muted"
                          >
                            Previous
                          </Button>
                        )}
                        {activeQuizIndex < quiz.length - 1 ? (
                          <Button
                            onClick={() => setActiveQuizIndex((prev) => Math.min(prev + 1, quiz.length - 1))}
                            disabled={!hasSelection}
                            className="h-10 flex-1 rounded-md"
                          >
                            Next
                          </Button>
                        ) : (
                          <Button
                            onClick={() => handleGenerate("quiz")}
                            className="h-10 flex-1 rounded-md"
                          >
                            <RefreshCcw className="h-3.5 w-3.5" />
                            <span className="ml-2">Regenerate Quiz</span>
                          </Button>
                        )}
                      </div>
                    </div>
                  );
                })()
              ) : (
                <div className="flex flex-col items-center justify-center gap-2 py-10 text-center text-xs text-muted-foreground">
                  <HelpCircle className="h-6 w-6 text-primary" />
                  <p>Generate MCQs aligned with your notes and exam format.</p>
                </div>
              )}
            </div>
          </TabsContent>

          <TabsContent value="flashcards" className="mt-0">
            <div className="rounded-2xl border border-border bg-background/70 p-4">
              {isLoadingFlashcards ? (
                <div className="flex min-h-[220px] items-center justify-center">
                  <BrandLoader label="Creating flashcards..." />
                </div>
              ) : flashcards && flashcards.length > 0 ? (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="text-xs text-muted-foreground">
                      Card {activeCardIndex + 1} of {flashcards.length}
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={handlePrevCard}
                        disabled={activeCardIndex === 0}
                        className="h-8 rounded-md border border-border bg-muted/40 text-xs text-foreground hover:bg-muted"
                      >
                        <ChevronLeft className="h-3.5 w-3.5" />
                        <span className="ml-1">Prev</span>
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleNextCard(flashcards.length)}
                        disabled={activeCardIndex >= flashcards.length - 1}
                        className="h-8 rounded-md border border-border bg-muted/40 text-xs text-foreground hover:bg-muted"
                      >
                        <span className="mr-1">Next</span>
                        <ChevronRight className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </div>
                  <div
                    key={`${activeCardIndex}-${cardDirection}`}
                    className={cn(
                      "rounded-2xl",
                      cardDirection === "next" && "animate-in fade-in slide-in-from-right-4 duration-300",
                      cardDirection === "prev" && "animate-in fade-in slide-in-from-left-4 duration-300",
                      !cardDirection && "animate-in fade-in duration-300"
                    )}
                    style={{ perspective: "1200px" }}
                  >
                    <button
                      type="button"
                      onClick={toggleFlip}
                      className="relative h-56 w-full rounded-2xl text-left sm:h-60"
                      aria-pressed={isCardFlipped}
                    >
                      <div
                        className="relative h-full w-full rounded-2xl border border-border bg-gradient-to-br from-card via-background to-muted/40 p-4 transition-transform duration-500"
                        style={{
                          transformStyle: "preserve-3d",
                          transform: isCardFlipped ? "rotateY(180deg)" : "rotateY(0deg)",
                        }}
                      >
                        <div
                          className="absolute inset-0 flex h-full w-full flex-col rounded-2xl p-4"
                          style={{ backfaceVisibility: "hidden" }}
                        >
                          <div className="flex items-center justify-between">
                            <span className="text-[11px] uppercase tracking-[0.2em] text-muted-foreground">
                              Front
                            </span>
                            <span className="text-[11px] text-primary/80">Tap to flip</span>
                          </div>
                          <div className="mt-4 text-sm font-semibold text-foreground">
                            {flashcards[activeCardIndex]?.front}
                          </div>
                          <div className="mt-auto text-[11px] text-muted-foreground">
                            Try to recall the answer before flipping.
                          </div>
                        </div>
                        <div
                          className="absolute inset-0 flex h-full w-full flex-col rounded-2xl p-4"
                          style={{
                            backfaceVisibility: "hidden",
                            transform: "rotateY(180deg)",
                          }}
                        >
                          <div className="flex items-center justify-between">
                            <span className="text-[11px] uppercase tracking-[0.2em] text-muted-foreground">
                              Back
                            </span>
                            <span className="text-[11px] text-primary/80">Tap to flip</span>
                          </div>
                          <div className="mt-4 text-sm font-semibold text-foreground">
                            {flashcards[activeCardIndex]?.back}
                          </div>
                          <div className="mt-auto text-[11px] text-muted-foreground">
                            Click next to move forward.
                          </div>
                        </div>
                      </div>
                    </button>
                  </div>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center gap-2 py-10 text-center text-xs text-muted-foreground">
                  <Layers className="h-6 w-6 text-primary" />
                  <p>Generate recall-ready flashcards from the document.</p>
                </div>
              )}
            </div>
          </TabsContent>

          <TabsContent value="chat" className="mt-0">
            <div className="h-[560px] rounded-2xl border border-border bg-background/80 p-1">
              <AIRagChat
                variant="minimal"
                compact
                className="h-full rounded-xl border border-border/50 bg-card/40"
              />
            </div>
          </TabsContent>

          {sourceText && sourceType && sourceType !== "primary" && active !== "chat" && (
            <div className="mt-3 rounded-2xl border border-border bg-background/70 p-3">
              <div className="flex items-center justify-between gap-2">
                <div className="text-[11px] uppercase tracking-[0.2em] text-muted-foreground">
                  {sourceType === "transcript" ? "Transcript" : "Source Context"}
                  {sourceProvider ? ` (${getOcrProviderLabel(sourceProvider)})` : ""}
                </div>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => setShowSource((prev) => !prev)}
                  className="h-7 rounded-md border border-border bg-muted/40 text-[11px] text-foreground hover:bg-muted"
                >
                  {showSource ? "Hide" : "Show"}
                </Button>
              </div>
              {showSource && (
                <div className="mt-2 max-h-64 overflow-y-auto rounded-xl border border-border bg-card/70 p-3 text-[11px] leading-relaxed text-foreground/80 whitespace-pre-wrap">
                  {sourceText}
                </div>
              )}
            </div>
          )}

          <div className="mt-2 rounded-xl border border-border bg-muted/30 px-3 py-2 text-[11px] text-muted-foreground">
            Tip: If the output feels off, run a <span className="text-primary">Fresh run</span>.
          </div>
          </div>
        </Tabs>
      </div>
    </div>
  );
};

export default AIStudyTools;
