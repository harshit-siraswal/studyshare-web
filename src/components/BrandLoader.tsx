import { cn } from "@/lib/utils";
import { useMediaQuery } from "@/hooks/useMediaQuery";
import BrandMark from "./BrandMark";

interface BrandLoaderProps {
  size?: number;
  label?: string;
  compact?: boolean;
  className?: string;
}

const BrandLoader = ({ size = 72, label, compact = false, className }: BrandLoaderProps) => {
  const reduceMotion = useMediaQuery("(prefers-reduced-motion: reduce)");

  return (
    <div
      className={cn(
        "flex items-center justify-center",
        compact ? "flex-row gap-3" : "flex-col gap-3",
        className
      )}
    >
      <div
        className="relative flex items-center justify-center"
        style={{ width: size, height: size }}
      >
        {reduceMotion ? (
          <BrandMark size={size} className="animate-pulse" alt="Loading" />
        ) : (
          <video
            src="/brand/loader.mp4"
            autoPlay
            muted
            loop
            playsInline
            className={cn(
              "h-full w-full object-contain",
              "mix-blend-multiply dark:mix-blend-screen"
            )}
          />
        )}
      </div>
      {label && (
        <div className="text-xs font-medium text-muted-foreground">{label}</div>
      )}
    </div>
  );
};

export default BrandLoader;
