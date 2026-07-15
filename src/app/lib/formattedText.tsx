import { Fragment, type ReactNode } from "react";
import { PLAN_DARK } from "@/app/data/constants";
import { openExternalUrl } from "@/app/lib/telegram";

const TOKEN_PATTERN = /(\*\*[^*\n]+\*\*|_[^_\n]+_|\[[^\]\n]+\]\([^)\n]+\))/g;
const SAFE_URL_PATTERN = /^(?:https?:\/\/|tg:\/\/|t\.me\/)/i;

export const isSafeFormattedUrl = (url: string) => SAFE_URL_PATTERN.test(url.trim());

export function renderFormattedText(text: string): ReactNode {
  const nodes: ReactNode[] = [];
  let lastIndex = 0;

  for (const match of text.matchAll(TOKEN_PATTERN)) {
    const index = match.index ?? 0;
    const token = match[0];
    if (index > lastIndex) nodes.push(text.slice(lastIndex, index));

    if (token.startsWith("**")) {
      nodes.push(<strong key={`${index}-strong`}>{token.slice(2, -2)}</strong>);
    } else if (token.startsWith("_")) {
      nodes.push(<em key={`${index}-em`}>{token.slice(1, -1)}</em>);
    } else {
      const linkMatch = token.match(/^\[([^\]]+)\]\(([^)]+)\)$/);
      const url = linkMatch?.[2]?.trim() ?? "";
      nodes.push(linkMatch && isSafeFormattedUrl(url) ? (
        <button
          key={`${index}-link`}
          type="button"
          onClick={() => openExternalUrl(url)}
          className="inline text-left active:opacity-80"
          style={{ color: PLAN_DARK.accent }}
        >
          {linkMatch[1]}
        </button>
      ) : <Fragment key={`${index}-text`}>{token}</Fragment>);
    }
    lastIndex = index + token.length;
  }

  if (lastIndex < text.length) nodes.push(text.slice(lastIndex));
  return nodes;
}
