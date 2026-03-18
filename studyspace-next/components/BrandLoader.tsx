'use client';

import { Loader2 } from "lucide-react";
import BrandMark from "@/components/BrandMark";
import { cn } from "@/lib/utils";

export default function BrandLoader({
  size = 72,
  label = "Loading",
  className,
}: {
  size?: number;
  label?: string;
  className?: string;
}) {
  return (
    <div className={cn("flex items-center gap-4", className)}>
      <div className="relative flex items-center justify-center">
        <div className="absolute inset-0 animate-pulse rounded-full bg-primary/10 blur-xl" />
        <BrandMark size={size} className="relative z-10 animate-pulse" alt={label} />
      </div>
      <div className="space-y-1">
        <div className="flex items-center gap-2 text-sm font-medium text-foreground">
          <Loader2 className="h-4 w-4 animate-spin text-primary" />
          {label}
        </div>
        <p className="text-xs text-muted-foreground">StudyShare is checking your materials.</p>
      </div>
    </div>
  );
}
