import { Fragment, type ReactNode } from "react";
import { cn } from "@/lib/utils";

const FORWARDED_EMAIL_SPLIT = /\nOn\s+.+?wrote:\s*\n/i;

function decodeNoticeEntities(content: string): string {
  return content
    .replace(/&nbsp;/gi, " ")
    .replace(/&gt;/gi, ">")
    .replace(/&lt;/gi, "<")
    .replace(/&amp;/gi, "&");
}

export function normalizeNoticeText(content: string): string {
  return decodeNoticeEntities(content || "")
    .replace(/\r\n/g, "\n")
    .replace(/\t/g, "  ")
    // Many imported notices include email/forum quote prefixes (>, >>, >>>).
    // Strip them so bullets/paragraphs render cleanly.
    .replace(/^\s*(?:>+\s*)+/gm, "")
    .replace(/[ \u00A0]+$/gm, "")
    .trim();
}

export function getNoticePreview(content: string, maxChars = 420): {
  text: string;
  truncated: boolean;
} {
  const normalized = normalizeNoticeText(content);
  if (!normalized) {
    return { text: "", truncated: false };
  }

  const primary = normalized.split(FORWARDED_EMAIL_SPLIT)[0]?.trim() || normalized;
  if (primary.length <= maxChars) {
    return { text: primary, truncated: false };
  }

  let candidate = primary.slice(0, maxChars);
  const lastBreak = Math.max(candidate.lastIndexOf("\n"), candidate.lastIndexOf(" "));
  if (lastBreak > maxChars * 0.6) {
    candidate = candidate.slice(0, lastBreak);
  }

  return {
    text: candidate.trimEnd(),
    truncated: true,
  };
}

const INLINE_TOKEN_REGEX = /(\*[^*\n]+\*|<https?:\/\/[^>\s]+>|https?:\/\/[^\s<]+|[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,})/g;

function cleanUrlToken(token: string): string {
  const withoutBrackets = token.startsWith("<") && token.endsWith(">")
    ? token.slice(1, -1)
    : token;

  return withoutBrackets.replace(/[),.;!?]+$/g, "");
}

function renderInline(text: string, keyPrefix: string): ReactNode[] {
  const nodes: ReactNode[] = [];
  let lastIndex = 0;

  const pushText = (value: string, index: number) => {
    if (!value) return;
    nodes.push(<Fragment key={`${keyPrefix}-text-${index}`}>{value}</Fragment>);
  };

  for (const match of text.matchAll(INLINE_TOKEN_REGEX)) {
    const token = match[0];
    const index = match.index ?? 0;

    pushText(text.slice(lastIndex, index), index);

    if (token.startsWith("*") && token.endsWith("*")) {
      nodes.push(
        <strong key={`${keyPrefix}-strong-${index}`} className="font-semibold text-foreground">
          {token.slice(1, -1)}
        </strong>
      );
    } else if (token.includes("@") && !token.startsWith("http") && !token.startsWith("<http")) {
      nodes.push(
        <a
          key={`${keyPrefix}-mail-${index}`}
          href={`mailto:${token}`}
          className="text-primary underline-offset-2 hover:underline"
          onClick={(event) => event.stopPropagation()}
        >
          {token}
        </a>
      );
    } else {
      const href = cleanUrlToken(token);
      nodes.push(
        <a
          key={`${keyPrefix}-url-${index}`}
          href={href}
          target="_blank"
          rel="noreferrer noopener"
          className="text-primary underline underline-offset-2 break-all"
          onClick={(event) => event.stopPropagation()}
        >
          {href}
        </a>
      );
    }

    lastIndex = index + token.length;
  }

  pushText(text.slice(lastIndex), lastIndex);
  return nodes;
}

function isBulletLine(line: string): RegExpMatchArray | null {
  return line.match(/^\s*(?:[-•]|\d+\.)\s+(.*)$/);
}

export default function NoticeContent({
  content,
  className,
}: {
  content: string;
  className?: string;
}) {
  const text = normalizeNoticeText(content);
  const lines = text.split("\n");
  const blocks: ReactNode[] = [];

  let index = 0;
  while (index < lines.length) {
    const current = lines[index] ?? "";
    const trimmed = current.trim();

    if (!trimmed) {
      index += 1;
      continue;
    }

    if (trimmed.startsWith(">")) {
      const quoteLines: string[] = [];
      while (index < lines.length && (lines[index] ?? "").trim().startsWith(">")) {
        quoteLines.push((lines[index] ?? "").trim().replace(/^>\s?/, ""));
        index += 1;
      }

      blocks.push(
        <blockquote
          key={`quote-${index}`}
          className="rounded-xl border-l-2 border-border bg-muted/30 px-3 py-2 text-muted-foreground"
        >
          <div className="space-y-1">
            {quoteLines.map((line, lineIndex) => (
              <p key={`quote-line-${lineIndex}`} className="leading-relaxed break-words">
                {renderInline(line, `quote-${index}-${lineIndex}`)}
              </p>
            ))}
          </div>
        </blockquote>
      );
      continue;
    }

    const bulletMatch = isBulletLine(trimmed);
    if (bulletMatch) {
      const items: string[] = [bulletMatch[1]];
      index += 1;

      while (index < lines.length) {
        const next = (lines[index] ?? "").trim();
        const nextBullet = isBulletLine(next);
        if (!nextBullet) break;
        items.push(nextBullet[1]);
        index += 1;
      }

      blocks.push(
        <ul key={`list-${index}`} className="list-disc space-y-1 pl-5 text-foreground/95 marker:text-muted-foreground">
          {items.map((item, itemIndex) => (
            <li key={`item-${itemIndex}`} className="leading-relaxed break-words">
              {renderInline(item, `list-${index}-${itemIndex}`)}
            </li>
          ))}
        </ul>
      );
      continue;
    }

    const paragraphLines: string[] = [trimmed];
    index += 1;

    while (index < lines.length) {
      const next = (lines[index] ?? "").trim();
      if (!next || next.startsWith(">") || isBulletLine(next)) break;
      paragraphLines.push(next);
      index += 1;
    }

    const paragraph = paragraphLines.join("\n");
    const fullBold = paragraph.match(/^\*([^*][\s\S]*?)\*$/);
    if (fullBold) {
      blocks.push(
        <p key={`bold-${index}`} className="leading-relaxed break-words font-semibold text-foreground">
          {renderInline(fullBold[1], `bold-${index}`)}
        </p>
      );
      continue;
    }

    blocks.push(
      <p key={`paragraph-${index}`} className="leading-relaxed break-words text-foreground/95 whitespace-pre-wrap">
        {renderInline(paragraph, `paragraph-${index}`)}
      </p>
    );
  }

  return <div className={cn("space-y-3", className)}>{blocks}</div>;
}
