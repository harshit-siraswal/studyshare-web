import {
  AlertTriangle,
  BookOpen,
  Check,
  Circle,
  Gauge,
  Globe2,
  Loader2,
  PlayCircle,
  Sparkles,
} from "lucide-react";
import { cn } from "@/lib/utils";

export type AiLiveActivityStatus =
  | "pending"
  | "active"
  | "completed"
  | "warning"
  | "failed";

export type AiAnswerOrigin =
  | "notes_only"
  | "notes_plus_web"
  | "web_only"
  | "insufficient_notes";

export interface AiLiveActivitySource {
  title: string;
  kind: "notes" | "web" | "video";
  page?: number;
  timestamp?: string;
  url?: string | null;
  fileId?: string | null;
}

export interface AiLiveActivityStep {
  id: string;
  title: string;
  status: AiLiveActivityStatus;
  description?: string;
  sources?: AiLiveActivitySource[];
}

interface AILivePlanCardProps {
  title: string;
  steps: AiLiveActivityStep[];
  answerOrigin?: AiAnswerOrigin;
  isRunning?: boolean;
  metrics?: {
    retrievalScore?: number;
    confidenceScore?: number;
  };
  className?: string;
}

const statusConfig: Record<
  AiLiveActivityStatus,
  {
    label: string;
    tone: string;
    dot: string;
    icon: typeof Circle;
    iconClassName?: string;
  }
> = {
  pending: {
    label: "Queued",
    tone: "text-muted-foreground",
    dot: "bg-muted/70",
    icon: Circle,
  },
  active: {
    label: "Running",
    tone: "text-primary",
    dot: "bg-primary shadow-[0_0_18px_rgba(45,212,191,0.35)]",
    icon: Loader2,
    iconClassName: "animate-spin",
  },
  completed: {
    label: "Done",
    tone: "text-emerald-400",
    dot: "bg-emerald-400",
    icon: Check,
  },
  warning: {
    label: "Needs review",
    tone: "text-amber-400",
    dot: "bg-amber-400",
    icon: AlertTriangle,
  },
  failed: {
    label: "Failed",
    tone: "text-destructive",
    dot: "bg-destructive",
    icon: AlertTriangle,
  },
};

const originSummary: Record<AiAnswerOrigin, string> = {
  notes_only: "Grounded in your notes",
  notes_plus_web: "Notes expanded with web context",
  web_only: "Resolved from broader web context",
  insufficient_notes: "Notes were only partially grounded",
};

const clampPercent = (value?: number) => {
  if (typeof value !== "number" || Number.isNaN(value)) return null;
  const normalized = value > 1 ? value : value * 100;
  const clamped = Math.max(0, Math.min(100, normalized));
  return `${Math.round(clamped)}%`;
};

const formatSourceMeta = (source: AiLiveActivitySource) => {
  const bits: string[] = [];
  if (typeof source.page === "number") bits.push(`p.${source.page}`);
  if (source.timestamp?.trim()) bits.push(source.timestamp.trim());
  return bits.join(" ");
};

const sourceIcon = (kind: AiLiveActivitySource["kind"]) => {
  switch (kind) {
    case "web":
      return Globe2;
    case "video":
      return PlayCircle;
    case "notes":
    default:
      return BookOpen;
  }
};

const summaryLabel = ({
  answerOrigin,
  completedCount,
  totalCount,
  isRunning,
}: {
  answerOrigin?: AiAnswerOrigin;
  completedCount: number;
  totalCount: number;
  isRunning: boolean;
}) => {
  const progress = `${completedCount} of ${totalCount} steps complete`;
  if (answerOrigin) {
    return `${originSummary[answerOrigin]} - ${progress}`;
  }
  return isRunning ? `Tracing the answer live - ${progress}` : progress;
};

const SourceChip = ({ source }: { source: AiLiveActivitySource }) => {
  const Icon = sourceIcon(source.kind);
  const meta = formatSourceMeta(source);
  const href = source.url?.trim() || "";
  const content = (
    <>
      <Icon className="h-3.5 w-3.5 text-muted-foreground" />
      <span className="truncate">{source.title}</span>
      {meta ? <span className="text-muted-foreground/80">{meta}</span> : null}
    </>
  );

  if (href) {
    return (
      <a
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex max-w-full items-center gap-2 rounded-full border border-border/70 bg-background/85 px-3 py-1.5 text-[11px] font-medium text-foreground/90 transition hover:border-primary/40 hover:text-primary"
      >
        {content}
      </a>
    );
  }

  return (
    <div className="inline-flex max-w-full items-center gap-2 rounded-full border border-border/70 bg-background/70 px-3 py-1.5 text-[11px] font-medium text-foreground/85">
      {content}
    </div>
  );
};

const StepRow = ({
  step,
  isLast,
}: {
  step: AiLiveActivityStep;
  isLast: boolean;
}) => {
  const config = statusConfig[step.status];
  const StatusIcon = config.icon;

  return (
    <div className="relative flex gap-4">
      <div className="flex w-7 flex-col items-center">
        <div
          className={cn(
            "z-10 flex h-7 w-7 items-center justify-center rounded-full border border-white/5 bg-card/80",
            step.status === "active" && "shadow-[0_0_0_6px_rgba(45,212,191,0.08)]"
          )}
        >
          <span className={cn("absolute h-2.5 w-2.5 rounded-full", config.dot)} />
          <StatusIcon
            className={cn(
              "relative h-3.5 w-3.5",
              config.tone,
              config.iconClassName
            )}
          />
        </div>
        {!isLast ? (
          <div className="mt-2 h-full w-px bg-gradient-to-b from-border via-border/60 to-transparent" />
        ) : null}
      </div>

      <div className="min-w-0 flex-1 pb-5">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <p className="text-sm font-semibold text-foreground">{step.title}</p>
          <span className={cn("text-[11px] font-medium", config.tone)}>
            {config.label}
          </span>
        </div>
        {step.description ? (
          <p className="mt-1.5 text-xs leading-5 text-muted-foreground">
            {step.description}
          </p>
        ) : null}
        {step.sources?.length ? (
          <div className="mt-3 flex flex-wrap gap-2">
            {step.sources.map((source, index) => (
              <SourceChip
                key={`${step.id}-${source.kind}-${source.title}-${index}`}
                source={source}
              />
            ))}
          </div>
        ) : null}
      </div>
    </div>
  );
};

const EmptyTrace = () => (
  <div className="rounded-3xl border border-dashed border-border/70 bg-background/45 p-4">
    <p className="text-sm font-semibold text-foreground">Your AI work trace appears here</p>
    <p className="mt-1 text-xs leading-5 text-muted-foreground">
      Ask a question and StudyShare will show how it searched your materials,
      ranked evidence, and assembled the final answer.
    </p>
    <div className="mt-4 flex flex-wrap gap-2">
      <span className="rounded-full border border-border/70 bg-background/70 px-3 py-1 text-[11px] text-muted-foreground">
        Note retrieval
      </span>
      <span className="rounded-full border border-border/70 bg-background/70 px-3 py-1 text-[11px] text-muted-foreground">
        Evidence merge
      </span>
      <span className="rounded-full border border-border/70 bg-background/70 px-3 py-1 text-[11px] text-muted-foreground">
        Response draft
      </span>
    </div>
  </div>
);

const AILivePlanCard = ({
  title,
  steps,
  answerOrigin,
  isRunning = false,
  metrics,
  className,
}: AILivePlanCardProps) => {
  const totalCount = steps.length || 3;
  const completedCount = steps.filter((step) => step.status === "completed").length;
  const progress = steps.length
    ? Math.max(completedCount + (isRunning ? 0.35 : 0), 0) / totalCount
    : 0;
  const retrieval = clampPercent(metrics?.retrievalScore);
  const confidence = clampPercent(metrics?.confidenceScore);

  return (
    <div
      className={cn(
        "relative overflow-hidden rounded-[28px] border border-border/60 bg-[radial-gradient(circle_at_top_left,rgba(45,212,191,0.10),transparent_38%),linear-gradient(180deg,rgba(15,23,42,0.92),rgba(8,13,23,0.98))] shadow-card",
        className
      )}
    >
      <div className="absolute right-0 top-0 h-40 w-40 rounded-full bg-primary/10 blur-3xl" />
      <div className="relative flex h-full flex-col">
        <div className="border-b border-border/60 px-5 py-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="space-y-1.5">
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-semibold uppercase tracking-[0.24em] text-muted-foreground">
                  Live Plan
                </span>
                <span
                  className={cn(
                    "h-2.5 w-2.5 rounded-full bg-primary",
                    isRunning && "animate-pulse"
                  )}
                />
              </div>
              <h3 className="text-base font-semibold text-foreground">{title}</h3>
              <p className="text-xs leading-5 text-muted-foreground">
                {summaryLabel({
                  answerOrigin,
                  completedCount,
                  totalCount,
                  isRunning,
                })}
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              {retrieval ? (
                <span className="inline-flex items-center gap-1.5 rounded-full border border-border/70 bg-background/70 px-3 py-1 text-[11px] font-medium text-foreground/90">
                  <Gauge className="h-3.5 w-3.5 text-primary" />
                  Grounding {retrieval}
                </span>
              ) : null}
              {confidence ? (
                <span className="inline-flex items-center gap-1.5 rounded-full border border-border/70 bg-background/70 px-3 py-1 text-[11px] font-medium text-foreground/90">
                  <Sparkles className="h-3.5 w-3.5 text-primary" />
                  Confidence {confidence}
                </span>
              ) : null}
            </div>
          </div>

          <div className="mt-4 h-1.5 overflow-hidden rounded-full bg-white/5">
            <div
              className="h-full rounded-full bg-gradient-to-r from-primary via-cyan-400 to-primary transition-[width] duration-500"
              style={{ width: `${Math.max(8, Math.min(progress * 100, 100))}%` }}
            />
          </div>
        </div>

        <div className="relative flex-1 px-5 py-5">
          {steps.length ? (
            <div className="space-y-1">
              {steps.map((step, index) => (
                <StepRow
                  key={step.id}
                  step={step}
                  isLast={index === steps.length - 1}
                />
              ))}
            </div>
          ) : (
            <EmptyTrace />
          )}
        </div>
      </div>
    </div>
  );
};

export default AILivePlanCard;
