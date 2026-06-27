import { useMemo } from "react";
import { Link2, ExternalLink } from "lucide-react";
import { cn } from "@/lib/utils";

interface LinkPreviewProps {
  content: string;
  className?: string;
}

const URL_REGEX = /https?:\/\/[^\s<]+/g;

function extractFirstUrl(text: string): string | null {
  const matches = text.match(URL_REGEX);
  if (!matches || matches.length === 0) return null;
  return matches[0].replace(/[),.;!?]+$/g, "");
}

function getDomain(url: string): string {
  try {
    const urlObj = new URL(url);
    return urlObj.hostname.replace(/^www\./, "");
  } catch {
    return url;
  }
}

function getFaviconUrl(domain: string): string {
  return `https://www.google.com/s2/favicons?domain=${encodeURIComponent(domain)}&sz=64`;
}

export function LinkPreview({ content, className }: LinkPreviewProps) {
  const url = useMemo(() => extractFirstUrl(content || ""), [content]);
  const domain = useMemo(() => (url ? getDomain(url) : null), [url]);
  const faviconUrl = useMemo(
    () => (domain ? getFaviconUrl(domain) : null),
    [domain],
  );

  if (!url || !domain) return null;

  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      className={cn(
        "group/link mt-3 block overflow-hidden rounded-xl border border-border/60 bg-secondary/20 transition-colors hover:bg-secondary/40",
        className,
      )}
      onClick={(e) => e.stopPropagation()}
    >
      <div className="flex items-center gap-3 p-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-background/80">
          {faviconUrl ? (
            <img
              src={faviconUrl}
              alt=""
              className="h-5 w-5 object-contain"
              loading="lazy"
              onError={(e) => {
                (e.target as HTMLImageElement).style.display = "none";
                const parent = (e.target as HTMLImageElement).parentElement;
                if (parent) {
                  parent.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="text-muted-foreground"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/></svg>`;
                }
              }}
            />
          ) : (
            <Link2 className="h-5 w-5 text-muted-foreground" />
          )}
        </div>
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-medium text-foreground group-hover/link:text-primary transition-colors">
            {domain}
          </p>
          <p className="truncate text-xs text-muted-foreground">{url}</p>
        </div>
        <ExternalLink className="h-4 w-4 shrink-0 text-muted-foreground opacity-0 group-hover/link:opacity-100 transition-opacity" />
      </div>
    </a>
  );
}

export default LinkPreview;
