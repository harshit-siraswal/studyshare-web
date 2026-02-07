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
}: AIStudyToolsProps) => {
  const { user } = useAuth();
  const { selectedCollege } = useCollege();
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
  const [showAnswers, setShowAnswers] = useState(true);
  const [flippedCards, setFlippedCards] = useState<Record<number, boolean>>({});
  const [copied, setCopied] = useState(false);

  const summaryParsed = useMemo(() => (summary ? parseSummary(summary) : null), [summary]);

  const handleGenerate = async (type: OutputType) => {
    if (!user) {
      toast.error("Please login to use AI tools");
      return;
    }

    setActive(type);
    setLoading(true);
    setError(null);

    try {
      const collegeId = selectedCollege?.domain;
      const options = {
        collegeId,
        useOcr: useOcr || forceOcr,
        forceOcr,
        ocrProvider,
        force: freshRun,
      };

      if (type === "summary") {
        const result = await getAiSummary(resourceId, options);
        setSummary(typeof result.data === "string" ? result.data : JSON.stringify(result.data));
        setCachedMap((prev) => ({ ...prev, summary: !!result.cached }));
      } else if (type === "quiz") {
        const result = await getAiQuiz(resourceId, options);
        setQuiz(Array.isArray(result.data) ? result.data : []);
        setCachedMap((prev) => ({ ...prev, quiz: !!result.cached }));
      } else {
        const result = await getAiFlashcards(resourceId, options);
        setFlashcards(Array.isArray(result.data) ? result.data : []);
        setCachedMap((prev) => ({ ...prev, flashcards: !!result.cached }));
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

  const toggleFlip = (idx: number) => {
    setFlippedCards((prev) => ({ ...prev, [idx]: !prev[idx] }));
  };

  const meta = OUTPUT_META[active];
  const ActiveIcon = meta.icon;

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
              </div>
            </div>
          </div>

          {error && (
            <div className="mt-3 flex items-center gap-2 rounded-xl border border-red-500/30 bg-red-500/10 px-3 py-2 text-xs text-red-200">
              <Wand2 className="h-4 w-4" />
              {error}
            </div>
          )}

          <TabsContent value="summary" className="mt-3">
            <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
              {summary ? (
                <div className="space-y-4 text-sm leading-relaxed">
                  {summaryParsed?.bullets?.length ? (
                    <ul className="space-y-2">
                      {summaryParsed.bullets.map((item, idx) => (
                        <li key={`${idx}-${item}`} className="flex gap-2">
                          <span className="mt-1 h-2 w-2 rounded-full bg-primary/70" />
                          <span>{item}</span>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <div className="space-y-3">
                      {(summaryParsed?.paragraphs || [summary]).map((block, idx) => (
                        <p key={`${idx}-${block}`} className="text-sm text-foreground/90">
                          {block}
                        </p>
                      ))}
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
                  <div className="grid gap-4">
                    {quiz.map((q, idx) => {
                      const correctIndex = getCorrectIndex(q);
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
                              const isCorrect = showAnswers && oidx === correctIndex;
                              return (
                                <div
                                  key={`${idx}-opt-${oidx}`}
                                  className={cn(
                                    "flex items-center gap-2 rounded-lg border px-3 py-2 text-xs",
                                    "border-white/10 bg-white/5",
                                    isCorrect && "border-emerald-400/40 bg-emerald-400/10 text-emerald-100"
                                  )}
                                >
                                  <span className="text-[11px] font-semibold text-muted-foreground">
                                    {String.fromCharCode(65 + oidx)}
                                  </span>
                                  <span>{opt}</span>
                                </div>
                              );
                            })}
                          </div>
                          {showAnswers && correctIndex >= 0 && (
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
                <div className="grid gap-3">
                  {flashcards.map((card, idx) => {
                    const flipped = !!flippedCards[idx];
                    return (
                      <button
                        key={`${idx}-${card.front}`}
                        type="button"
                        onClick={() => toggleFlip(idx)}
                        className={cn(
                          "group relative text-left rounded-2xl border border-white/10 bg-gradient-to-br from-white/10 via-white/5 to-transparent p-4 transition",
                          "hover:border-primary/40 hover:bg-white/10",
                          flipped && "border-primary/50"
                        )}
                        aria-pressed={flipped}
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-[11px] uppercase tracking-[0.2em] text-muted-foreground">
                            Card {idx + 1}
                          </span>
                          <span className="text-[11px] text-primary/80">
                            {flipped ? "Back" : "Front"}
                          </span>
                        </div>
                        <div className="mt-3 text-sm font-semibold text-foreground">
                          {flipped ? card.back : card.front}
                        </div>
                        <div className="mt-3 text-[11px] text-muted-foreground">
                          Tap to {flipped ? "see front" : "reveal answer"}
                        </div>
                      </button>
                    );
                  })}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center gap-2 py-10 text-center text-xs text-muted-foreground">
                  <Layers className="h-6 w-6 text-primary" />
                  <p>Generate recall-ready flashcards from the document.</p>
                </div>
              )}
            </div>
          </TabsContent>

          <div className="mt-3 rounded-xl border border-white/10 bg-black/30 px-3 py-2 text-[11px] text-muted-foreground">
            Tip: If the output feels off, enable <span className="text-primary">Use OCR</span> or run a <span className="text-primary">Fresh run</span>.
          </div>
        </Tabs>
      </div>
    </div>
  );
};

export default AIStudyTools;
