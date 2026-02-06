import { useState } from "react";
import { Loader2, Sparkles, HelpCircle, Layers } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/context/AuthContext";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { getAiFlashcards, getAiQuiz, getAiSummary } from "@/lib/api";

type OutputType = "summary" | "quiz" | "flashcards";

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
}

const AIStudyTools = ({ resourceId, className }: AIStudyToolsProps) => {
  const { user } = useAuth();
  const [active, setActive] = useState<OutputType>("summary");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [cachedMap, setCachedMap] = useState<Partial<Record<OutputType, boolean>>>({});
  const [summary, setSummary] = useState<string | null>(null);
  const [quiz, setQuiz] = useState<QuizQuestion[] | null>(null);
  const [flashcards, setFlashcards] = useState<Flashcard[] | null>(null);

  const handleGenerate = async (type: OutputType) => {
    if (!user) {
      toast.error("Please login to use AI tools");
      return;
    }

    setActive(type);
    setLoading(true);
    setError(null);

    try {
      if (type === "summary") {
        const result = await getAiSummary(resourceId);
        setSummary(typeof result.data === "string" ? result.data : JSON.stringify(result.data));
        setCachedMap((prev) => ({ ...prev, summary: !!result.cached }));
      } else if (type === "quiz") {
        const result = await getAiQuiz(resourceId);
        setQuiz(Array.isArray(result.data) ? result.data : []);
        setCachedMap((prev) => ({ ...prev, quiz: !!result.cached }));
      } else {
        const result = await getAiFlashcards(resourceId);
        setFlashcards(Array.isArray(result.data) ? result.data : []);
        setCachedMap((prev) => ({ ...prev, flashcards: !!result.cached }));
      }
    } catch (err: any) {
      setError(err.message || "AI request failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={cn("flex flex-col gap-3", className)}>
      <div className="flex items-center justify-between">
        <div className="text-sm font-semibold">AI Study Tools</div>
        <div className="text-xs text-muted-foreground">PDF-only</div>
      </div>

      <Tabs value={active} onValueChange={(v) => setActive(v as OutputType)}>
        <TabsList className="w-full">
          <TabsTrigger value="summary" className="flex-1">
            <Sparkles className="w-3.5 h-3.5 mr-1" />
            Summary
          </TabsTrigger>
          <TabsTrigger value="quiz" className="flex-1">
            <HelpCircle className="w-3.5 h-3.5 mr-1" />
            Quiz
          </TabsTrigger>
          <TabsTrigger value="flashcards" className="flex-1">
            <Layers className="w-3.5 h-3.5 mr-1" />
            Cards
          </TabsTrigger>
        </TabsList>

        <div className="flex items-center justify-between mt-2">
          <div className="text-xs text-muted-foreground">
            {cachedMap[active] ? "Cached result" : "Fresh result"}
          </div>
          <Button
            size="sm"
            variant="secondary"
            onClick={() => handleGenerate(active)}
            disabled={loading}
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Generate"}
          </Button>
        </div>

        {error && (
          <div className="text-xs text-red-500 mt-2">{error}</div>
        )}

        <TabsContent value="summary" className="mt-2">
          {summary ? (
            <div className="text-sm whitespace-pre-wrap leading-relaxed">{summary}</div>
          ) : (
            <div className="text-xs text-muted-foreground">Generate a summary from this PDF.</div>
          )}
        </TabsContent>

        <TabsContent value="quiz" className="mt-2 space-y-2">
          {quiz && quiz.length > 0 ? (
            quiz.map((q, idx) => (
              <div key={`${idx}-${q.question}`} className="rounded-md border p-2">
                <div className="text-sm font-medium">
                  {idx + 1}. {q.question}
                </div>
                <ul className="mt-1 text-xs text-muted-foreground space-y-0.5">
                  {q.options?.map((opt, oidx) => (
                    <li key={`${idx}-opt-${oidx}`}>{opt}</li>
                  ))}
                </ul>
                <div className="text-xs text-muted-foreground mt-1">
                  Correct: {q.correct}
                </div>
              </div>
            ))
          ) : (
            <div className="text-xs text-muted-foreground">Generate MCQs from this PDF.</div>
          )}
        </TabsContent>

        <TabsContent value="flashcards" className="mt-2 space-y-2">
          {flashcards && flashcards.length > 0 ? (
            flashcards.map((card, idx) => (
              <div key={`${idx}-${card.front}`} className="rounded-md border p-2">
                <div className="text-sm font-medium">{card.front}</div>
                <div className="text-xs text-muted-foreground mt-1">{card.back}</div>
              </div>
            ))
          ) : (
            <div className="text-xs text-muted-foreground">Generate flashcards from this PDF.</div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default AIStudyTools;
