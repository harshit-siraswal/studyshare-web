import type { SyntheticEvent } from "react";
import { cn } from "@/lib/utils";

interface BrandMarkProps {
  size?: number;
  className?: string;
  alt?: string;
}

const BrandMark = ({ size = 40, className, alt = "StudyShare logo" }: BrandMarkProps) => {
  const handleError = (e: SyntheticEvent<HTMLImageElement>) => {
    const target = e.currentTarget;
    if (target.src.includes("logo-mark-light.png")) {
      target.src = "/favicon.png";
      return;
    }
    if (target.src.includes("logo-mark.png")) {
      target.src = "/favicon.png";
    }
  };

  return (
    <>
      <img
        src="/brand/logo-mark-light.png"
        alt={alt}
        width={size}
        height={size}
        className={cn("object-contain dark:hidden", className)}
        loading="lazy"
        decoding="async"
        onError={handleError}
      />
      <img
        src="/brand/logo-mark.png"
        alt={alt}
        width={size}
        height={size}
        className={cn("hidden object-contain dark:block", className)}
        loading="lazy"
        decoding="async"
        onError={handleError}
      />
    </>
  );
};

export default BrandMark;
