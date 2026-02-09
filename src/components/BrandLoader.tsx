import { cn } from "@/lib/utils";
import { useMediaQuery } from "@/hooks/useMediaQuery";

interface BrandLoaderProps {
  size?: number;
  label?: string;
  compact?: boolean;
  className?: string;
}

const BrandLoader = ({ size = 72, label, compact = false, className }: BrandLoaderProps) => {
  const reduceMotion = useMediaQuery("(prefers-reduced-motion: reduce)");
  const dotCount = 8;
  const dotSize = Math.max(4, Math.round(size / 10));
  const radius = Math.max(8, size / 2 - dotSize - 2);

  return (
    <div
      className={cn(
        "flex items-center justify-center",
        compact ? "flex-row gap-3" : "flex-col gap-3",
        className
      )}
    >
      <div className="relative flex items-center justify-center" style={{ width: size, height: size }}>
        <div className="absolute inset-1 rounded-full bg-primary/10 blur-xl" aria-hidden="true" />
        <div
          className={cn("absolute inset-0", reduceMotion ? "" : "animate-spin")}
          style={{ animationDuration: "1.4s" }}
          aria-hidden="true"
        >
          {Array.from({ length: dotCount }).map((_, i) => {
            const angle = (360 / dotCount) * i;
            const opacity = 0.25 + (i / dotCount) * 0.65;
            return (
              <span
                key={`dot-${i}`}
                className="absolute left-1/2 top-1/2 rounded-full bg-primary"
                style={{
                  width: dotSize,
                  height: dotSize,
                  transform: `translate(-50%, -50%) rotate(${angle}deg) translate(${radius}px)`,
                  opacity,
                }}
              />
            );
          })}
        </div>
        {reduceMotion && (
          <div className="absolute inset-0 rounded-full border border-primary/30" aria-hidden="true" />
        )}
      </div>
      {label && <div className="text-xs font-medium text-muted-foreground">{label}</div>}
    </div>
  );
};

export default BrandLoader;
