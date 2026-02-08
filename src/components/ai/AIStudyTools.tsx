import { useMemo, useState } from "react";
import {
  Loader2,
  Sparkles,
  HelpCircle,
  Layers,
  Wand2,
  RefreshCcw,
  Eye,
  EyeOff,
  ClipboardCopy,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useAuth } from "@/context/AuthContext";
import { useCollege } from "@/context/CollegeContext";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { getAiFlashcards, getAiQuiz, getAiSummary } from "@/lib/api";

type OutputType = "summary" | "quiz" | "flashcards";

type OcrProvider = "google" | "sarvam";
type AiOptions = {
  useOcr?: boolean;
  forceOcr?: boolean;
  ocrProvider?: OcrProvider;
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
    label: "Cards",
    helper: "Flip-style flashcards for rapid recall.",
    icon: Layers,
  },
};

function parseSummary(summary: string) {
  const lines = summary
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);

  const bullets = lines
    .filter((line) => /^[-*]\s+/.test(line) || /^\d+[\).]\s+/.test(line) || /^\u2022\s+/.test(line))
    .map((line) => line.replace(/^[-*]\s+/, "").replace(/^\d+[\).]\s+/, "").replace(/^\u2022\s+/, ""))
    .filter(Boolean);

  if (bullets.length >= 3) {
    return { bullets, paragraphs: [] as string[] };
  }

  const paragraphs = summary
    .split(/\n{2,}/)
    .map((block) => block.trim())
    .filter(Boolean);

  return { bullets: [] as string[], paragraphs };
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

const AIStudyTools = ({
  resourceId,
  className,
  resourceTitle,
  resourceType = "notes",
  videoUrl,
}: AIStudyToolsProps) => {
  const { user } = useAuth();
  const { selectedCollege } = useCollege();
  const supportsOcr = resourceType !== "video";
  const usesTranscript = resourceType === "video";
  const isYouTubeVideo = useMemo(() => {
    if (!videoUrl) return false;
    return /(?:youtu\.be|youtube\.com|youtube-nocookie\.com)/i.test(videoUrl);
  }, [videoUrl]);
  const shouldUseTranscript = usesTranscript && isYouTubeVideo;
  const [active, setActive] = useState<OutputType>("summary");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [cachedMap, setCachedMap] = useState<Partial<Record<OutputType, boolean>>>({});
  const [summary, setSummary] = useState<string | null>(null);
  const [quiz, setQuiz] = useState<QuizQuestion[] | null>(null);
  const [flashcards, setFlashcards] = useState<Flashcard[] | null>(null);
  const [useOcr, setUseOcr] = useState(false);
  const [forceOcr, setForceOcr] = useState(false);
  const [ocrProvider, setOcrProvider] = useState<OcrProvider>("google");
  const [freshRun, setFreshRun] = useState(true);
  const [showAnswers, setShowAnswers] = useState(false);
  const [selectedAnswers, setSelectedAnswers] = useState<Record<number, number>>({});
  const [activeCardIndex, setActiveCardIndex] = useState(0);
  const [isCardFlipped, setIsCardFlipped] = useState(false);
  const [cardDirection, setCardDirection] = useState<"next" | "prev" | null>(null);
  const [copied, setCopied] = useState(false);
  const [sourceText, setSourceText] = useState<string | null>(null);
  const [sourceType, setSourceType] = useState<"primary" | "ocr" | "transcript" | null>(null);
  const [sourceProvider, setSourceProvider] = useState<OcrProvider | null>(null);
  const [showSource, setShowSource] = useState(false);
  const [runMeta, setRunMeta] = useState<
    Partial<Record<OutputType, { usedOcr: boolean; provider: OcrProvider | null }>>
  >({});

  const summaryParsed = useMemo(() => (summary ? parseSummary(summary) : null), [summary]);

  const handleGenerate = async (type: OutputType, override?: AiOptions) => {
    if (!user) {
      toast.error("Please login to use AI tools");
      return;
    }

    setActive(type);
    setLoading(true);
    setError(null);
    setSourceText(null);
    setSourceType(null);
    setSourceProvider(null);
    setShowSource(false);

    try {
      const collegeId = selectedCollege?.domain;
      const options = {
        collegeId,
        useOcr: override?.useOcr ?? (supportsOcr ? (useOcr || forceOcr) : shouldUseTranscript),
        forceOcr: override?.forceOcr ?? (supportsOcr ? forceOcr : false),
        ocrProvider: override?.ocrProvider ?? ocrProvider,
        force: override?.force ?? freshRun,
        includeSource: override?.includeSource ?? (shouldUseTranscript ? true : false),
        videoUrl: override?.videoUrl ?? (shouldUseTranscript ? videoUrl : undefined),
      };
      const usedOcr = supportsOcr ? Boolean(options.useOcr || options.forceOcr) : false;
      const usedProvider = usedOcr && supportsOcr ? (options.ocrProvider ?? null) : null;

      if (type === "summary") {
        const result = await getAiSummary(resourceId, options);
        setSummary(typeof result.data === "string" ? result.data : JSON.stringify(result.data));
        if (result.source?.text) {
          setSourceText(result.source.text);
          setSourceType(result.source.type ?? "ocr");
          setSourceProvider(result.source.ocrProvider ?? null);
          setShowSource(true);
        }
        setCachedMap((prev) => ({ ...prev, summary: !!result.cached }));
        setRunMeta((prev) => ({ ...prev, summary: { usedOcr, provider: usedProvider } }));
      } else if (type === "quiz") {
        const result = await getAiQuiz(resourceId, options);
        setQuiz(Array.isArray(result.data) ? result.data : []);
        if (result.source?.text) {
          setSourceText(result.source.text);
          setSourceType(result.source.type ?? "ocr");
          setSourceProvider(result.source.ocrProvider ?? null);
          setShowSource(true);
        }
        setSelectedAnswers({});
        setCachedMap((prev) => ({ ...prev, quiz: !!result.cached }));
        setRunMeta((prev) => ({ ...prev, quiz: { usedOcr, provider: usedProvider } }));
      } else {
        const result = await getAiFlashcards(resourceId, options);
        setFlashcards(Array.isArray(result.data) ? result.data : []);
        if (result.source?.text) {
          setSourceText(result.source.text);
          setSourceType(result.source.type ?? "ocr");
          setSourceProvider(result.source.ocrProvider ?? null);
          setShowSource(true);
        }
        setActiveCardIndex(0);
        setIsCardFlipped(false);
        setCardDirection(null);
        setCachedMap((prev) => ({ ...prev, flashcards: !!result.cached }));
        setRunMeta((prev) => ({ ...prev, flashcards: { usedOcr, provider: usedProvider } }));
      }
    } catch (err: any) {
      setError(err.message || "AI request failed");
    } finally {
      setLoading(false);
    }
  };

  const handleCopySummary = async () => {
    if (!summary) return;
    try {
      await navigator.clipboard.writeText(summary);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      toast.error("Failed to copy summary");
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

  const handleSarvamOcrRetry = () => {
    const overrides: AiOptions = {
      useOcr: true,
      forceOcr: true,
      ocrProvider: "sarvam",
      force: true,
      includeSource: true,
    };
    setUseOcr(true);
    setForceOcr(true);
    setOcrProvider("sarvam");
    setFreshRun(true);
    handleGenerate(active, overrides);
  };

  const meta = OUTPUT_META[active];
  const ActiveIcon = meta.icon;
  const canRetrySarvam = (type: OutputType) =>
    supportsOcr && runMeta[type]?.usedOcr && runMeta[type]?.provider === "google";

  return (
    <div
      className={cn(
        "relative overflow-hidden rounded-2xl border border-border/60 bg-gradient-to-br from-[#0b1220]/90 via-[#0f172a]/95 to-[#0b0f1d]/90 p-4 shadow-[0_24px_60px_rgba(0,0,0,0.45)]",
        "before:absolute before:inset-0 before:bg-[linear-gradient(115deg,rgba(255,255,255,0.06)_0.5px,transparent_0.5px),linear-gradient(0deg,rgba(255,255,255,0.04)_1px,transparent_1px)] before:bg-[size:32px_32px,32px_32px] before:opacity-40",
        className
      )}
    >
      <div className="relative z-10 flex flex-col gap-4 font-ai">
        <div className="flex items-start justify-between gap-3">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-1 rounded-full bg-primary/15 px-2.5 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-primary">
                AI Lab
              </span>
              {resourceType === "video" ? (
                <Badge variant="secondary" className="text-[11px]">
                  Transcript
                </Badge>
              ) : (
                <Badge variant="secondary" className="text-[11px]">
                  PDF / DOCX / PPTX
                </Badge>
              )}
            </div>
            <div className="font-editorial text-lg text-foreground">Study Studio</div>
            <p className="text-xs text-muted-foreground">
              {resourceTitle ? `Working on "${resourceTitle}"` : "Structured outputs grounded in your document."}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <div className="hidden sm:flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-[11px] text-muted-foreground">
              <span>{cachedMap[active] ? "Cached" : "Fresh"}</span>
              <span className="text-muted-foreground/50">•</span>
              <span>{meta.label}</span>
            </div>
            <Button
              size="sm"
              variant="secondary"
              onClick={() => handleGenerate(active)}
              disabled={loading}
              className="relative overflow-hidden rounded-full border border-white/10 bg-white/10 px-4 text-xs font-semibold"
            >
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Generate"}
            </Button>
          </div>
        </div>

        <Tabs value={active} onValueChange={(v) => setActive(v as OutputType)}>
          <div className="rounded-2xl border border-white/10 bg-white/5 p-3">
            <TabsList className="grid w-full grid-cols-3 rounded-full bg-black/30 p-1">
              {(["summary", "quiz", "flashcards"] as OutputType[]).map((type) => {
                const Icon = OUTPUT_META[type].icon;
                return (
                  <TabsTrigger
                    key={type}
                    value={type}
                    className="gap-2 rounded-full text-xs font-semibold data-[state=active]:bg-white/20 data-[state=active]:text-white"
                  >
                    <Icon className="h-3.5 w-3.5" />
                    {OUTPUT_META[type].label}
                  </TabsTrigger>
                );
              })}
            </TabsList>

            <div className="mt-3 flex flex-wrap items-center gap-3">
              <div className="flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-[11px] text-muted-foreground">
                <ActiveIcon className="h-3.5 w-3.5 text-primary" />
                <span>{meta.helper}</span>
              </div>

              <div className="ml-auto flex flex-wrap items-center gap-3">
                <label className="flex items-center gap-2 text-[11px] text-muted-foreground">
                  Fresh run
                  <Switch checked={freshRun} onCheckedChange={setFreshRun} />
                </label>
                {supportsOcr ? (
                  <>
                    <label className="flex items-center gap-2 text-[11px] text-muted-foreground">
                      Use OCR
                      <Switch
                        checked={useOcr}
                        onCheckedChange={(val) => {
                          setUseOcr(val);
                          if (!val) setForceOcr(false);
                        }}
                      />
                    </label>
                    <label className="flex items-center gap-2 text-[11px] text-muted-foreground">
                      Force OCR
                      <Switch
                        checked={forceOcr}
                        onCheckedChange={(val) => {
                          setForceOcr(val);
                          if (val) setUseOcr(true);
                        }}
                      />
                    </label>
                    <Select value={ocrProvider} onValueChange={(val) => setOcrProvider(val as OcrProvider)}>
                      <SelectTrigger className="h-7 w-[140px] text-[11px] bg-black/30 border-white/10">
                        <SelectValue placeholder="OCR provider" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="google">Google Vision</SelectItem>
                        <SelectItem value="sarvam">Sarvam OCR</SelectItem>
                      </SelectContent>
                    </Select>
                  </>
                ) : (
                  <div className="hidden sm:flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-[11px] text-muted-foreground">
                    {isYouTubeVideo ? "Using YouTube transcript" : "Transcript available for YouTube links"}
                  </div>
                )}
              </div>
            </div>
          </div>

          {error && (
            <div className="mt-3 flex items-center gap-2 rounded-xl border border-red-500/30 bg-red-500/10 px-3 py-2 text-xs text-red-200">
              <Wand2 className="h-4 w-4" />
              <div className="flex flex-1 items-center justify-between gap-3">
                <span>{error}</span>
                {resourceType !== "video" && (
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={handleSarvamOcrRetry}
                    className="h-7 rounded-full border border-white/10 bg-white/10 text-[11px]"
                    disabled={loading}
                  >
                    Run OCR (Sarvam)
                  </Button>
                )}
              </div>
            </div>
          )}

          <TabsContent value="summary" className="mt-3">
            <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
              {summary ? (
                <div className="space-y-4 text-sm leading-relaxed">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="text-[11px] uppercase tracking-[0.3em] text-muted-foreground">
                        Summary
                      </div>
                      <div className="text-base font-semibold text-foreground">
                        {resourceTitle ? "Key Insights" : "Key Highlights"}
                      </div>
                    </div>
                    {cachedMap.summary && (
                      <Badge variant="secondary" className="text-[10px]">
                        cached
                      </Badge>
                    )}
                  </div>
                  {summaryParsed?.bullets?.length ? (
                    <div className="space-y-3">
                      <div className="text-[11px] font-semibold uppercase tracking-[0.2em] text-muted-foreground">
                        Key Takeaways
                      </div>
                      <ul className="space-y-2">
                        {summaryParsed.bullets.map((item, idx) => (
                          <li key={`${idx}-${item}`} className="flex gap-3">
                            <span className="mt-1.5 h-2 w-2 rounded-full bg-primary/70" />
                            <span className="text-sm text-foreground/90">{item}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <div>
                        <div className="text-[11px] font-semibold uppercase tracking-[0.2em] text-muted-foreground">
                          Overview
                        </div>
                        <p className="mt-2 text-sm text-foreground/90">
                          {(summaryParsed?.paragraphs || [summary])[0]}
                        </p>
                      </div>
                      {(summaryParsed?.paragraphs || []).slice(1).length > 0 && (
                        <div>
                          <div className="text-[11px] font-semibold uppercase tracking-[0.2em] text-muted-foreground">
                            More Detail
                          </div>
                          <div className="mt-2 space-y-3">
                            {(summaryParsed?.paragraphs || []).slice(1).map((block, idx) => (
                              <p key={`${idx}-${block}`} className="text-xs text-foreground/80">
                                {block}
                              </p>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                  <div className="flex flex-wrap items-center gap-2">
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={handleCopySummary}
                      className="h-8 rounded-full border border-white/10 bg-white/5 text-xs"
                    >
                      {copied ? (
                        <CheckCircle2 className="h-3.5 w-3.5" />
                      ) : (
                        <ClipboardCopy className="h-3.5 w-3.5" />
                      )}
                      <span className="ml-1">{copied ? "Copied" : "Copy"}</span>
                    </Button>
                    {canRetrySarvam("summary") && (
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={handleSarvamOcrRetry}
                        className="h-8 rounded-full border border-white/10 bg-white/5 text-xs"
                        disabled={loading}
                      >
                        <Wand2 className="h-3.5 w-3.5" />
                        <span className="ml-1">Try Sarvam OCR</span>
                      </Button>
                    )}
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => handleGenerate("summary")}
                      className="h-8 rounded-full border border-white/10 bg-white/5 text-xs"
                    >
                      <RefreshCcw className="h-3.5 w-3.5" />
                      <span className="ml-1">Regenerate</span>
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

          <TabsContent value="quiz" className="mt-3">
            <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
              {quiz && quiz.length > 0 ? (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="text-xs text-muted-foreground">{quiz.length} questions</div>
                    <div className="flex items-center gap-2">
                      {canRetrySarvam("quiz") && (
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={handleSarvamOcrRetry}
                          className="h-8 rounded-full border border-white/10 bg-white/5 text-xs"
                          disabled={loading}
                        >
                          <Wand2 className="h-3.5 w-3.5" />
                          <span className="ml-1">Try Sarvam OCR</span>
                        </Button>
                      )}
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => setShowAnswers((prev) => !prev)}
                        className="h-8 rounded-full border border-white/10 bg-white/5 text-xs"
                      >
                        {showAnswers ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                        <span className="ml-1">{showAnswers ? "Hide" : "Show"} answers</span>
                      </Button>
                    </div>
                  </div>
                  <div className="grid gap-4">
                    {quiz.map((q, idx) => {
                      const correctIndex = getCorrectIndex(q);
                      const selected = selectedAnswers[idx];
                      const hasSelection = selected !== undefined;
                      return (
                        <div key={`${idx}-${q.question}`} className="rounded-xl border border-white/10 bg-black/20 p-4">
                          <div className="flex items-start justify-between gap-3">
                            <div className="text-sm font-semibold text-foreground">
                              <span className="text-primary/80">Q{idx + 1}.</span> {q.question}
                            </div>
                            {cachedMap.quiz && (
                              <Badge variant="secondary" className="text-[10px]">
                                cached
                              </Badge>
                            )}
                          </div>
                          <div className="mt-3 grid gap-2">
                            {q.options?.map((opt, oidx) => {
                              const isSelected = selected === oidx;
                              const isCorrect = oidx === correctIndex;
                              const revealCorrect = showAnswers || hasSelection;
                              const isRightSelected = hasSelection && isSelected && isCorrect;
                              const isWrongSelected = hasSelection && isSelected && !isCorrect;
                              const showCorrect = revealCorrect && isCorrect;
                              return (
                                <button
                                  key={`${idx}-opt-${oidx}`}
                                  type="button"
                                  onClick={() =>
                                    setSelectedAnswers((prev) => ({ ...prev, [idx]: oidx }))
                                  }
                                  className={cn(
                                    "flex w-full items-center gap-2 rounded-lg border px-3 py-2 text-left text-xs transition",
                                    "border-white/10 bg-white/5",
                                    showCorrect && "border-emerald-400/40 bg-emerald-400/10 text-emerald-100",
                                    isWrongSelected && "border-rose-400/50 bg-rose-500/10 text-rose-100",
                                    isRightSelected && "border-emerald-400/60 bg-emerald-400/15 text-emerald-50"
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
                            <div className="mt-2 text-[11px] text-emerald-200">
                              Correct: {String.fromCharCode(65 + correctIndex)}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center gap-2 py-10 text-center text-xs text-muted-foreground">
                  <HelpCircle className="h-6 w-6 text-primary" />
                  <p>Generate MCQs aligned with your notes and exam format.</p>
                </div>
              )}
            </div>
          </TabsContent>

          <TabsContent value="flashcards" className="mt-3">
            <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
              {flashcards && flashcards.length > 0 ? (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="text-xs text-muted-foreground">
                      Card {activeCardIndex + 1} of {flashcards.length}
                    </div>
                    <div className="flex items-center gap-2">
                      {canRetrySarvam("flashcards") && (
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={handleSarvamOcrRetry}
                          className="h-8 rounded-full border border-white/10 bg-white/5 text-xs"
                          disabled={loading}
                        >
                          <Wand2 className="h-3.5 w-3.5" />
                          <span className="ml-1">Try Sarvam OCR</span>
                        </Button>
                      )}
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={handlePrevCard}
                        disabled={activeCardIndex === 0}
                        className="h-8 rounded-full border border-white/10 bg-white/5 text-xs"
                      >
                        <ChevronLeft className="h-3.5 w-3.5" />
                        <span className="ml-1">Prev</span>
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleNextCard(flashcards.length)}
                        disabled={activeCardIndex >= flashcards.length - 1}
                        className="h-8 rounded-full border border-white/10 bg-white/5 text-xs"
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
                        className="relative h-full w-full rounded-2xl border border-white/10 bg-gradient-to-br from-white/10 via-white/5 to-transparent p-4 transition-transform duration-500"
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

          {sourceText && sourceType && sourceType !== "primary" && (
            <div className="mt-3 rounded-2xl border border-white/10 bg-black/30 p-3">
              <div className="flex items-center justify-between gap-2">
                <div className="text-[11px] uppercase tracking-[0.2em] text-muted-foreground">
                  {sourceType === "transcript" ? "Transcript" : "OCR Output"}
                  {sourceProvider ? ` (${sourceProvider})` : ""}
                </div>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => setShowSource((prev) => !prev)}
                  className="h-7 rounded-full border border-white/10 bg-white/10 text-[11px]"
                >
                  {showSource ? "Hide" : "Show"}
                </Button>
              </div>
              {showSource && (
                <div className="mt-2 max-h-64 overflow-y-auto rounded-xl border border-white/10 bg-black/40 p-3 text-[11px] leading-relaxed text-foreground/80 whitespace-pre-wrap">
                  {sourceText}
                </div>
              )}
            </div>
          )}

          <div className="mt-3 rounded-xl border border-white/10 bg-black/30 px-3 py-2 text-[11px] text-muted-foreground">
            {supportsOcr ? (
              <>
                Tip: If the output feels off, enable <span className="text-primary">Use OCR</span> or run a{" "}
                <span className="text-primary">Fresh run</span>.
              </>
            ) : (
              <>
                Tip: If the output feels off, run a{" "}
                <span className="text-primary">Fresh run</span> to re-fetch captions.
              </>
            )}
          </div>
        </Tabs>
      </div>
    </div>
  );
};

export default AIStudyTools;
