"use client";

import { ChevronDown, ExternalLink, Globe, Loader2 } from "lucide-react";
import type React from "react";
import { useCallback, useEffect, useState } from "react";
import { fetchOgImage, scrapeArticle } from "@/app/actions/resident-news";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface SearchResultItem {
  title: string;
  snippet: string;
  url: string;
  source: string;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function faviconUrl(source: string): string {
  const host = source.startsWith("http") ? source : `https://${source}`;
  try {
    const { origin } = new URL(host);
    return `https://www.google.com/s2/favicons?domain=${origin}&sz=32`;
  } catch {
    return "";
  }
}

function displaySource(source: string): string {
  return source.replace(/^www\./, "");
}

// ---------------------------------------------------------------------------
// SearchResultCard — news card with OG image thumbnail + expandable content
// ---------------------------------------------------------------------------

export function SearchResultCard({
  result,
  icon,
}: {
  result: SearchResultItem;
  icon?: React.ReactNode;
}) {
  const [expanded, setExpanded] = useState(false);
  const [content, setContent] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [ogImage, setOgImage] = useState<string | null>(null);
  const [imgError, setImgError] = useState(false);

  const favicon = faviconUrl(result.source);
  const displayHost = displaySource(result.source);

  // Fetch OG image on mount
  useEffect(() => {
    let cancelled = false;
    fetchOgImage(result.url).then((img) => {
      if (!cancelled && img) setOgImage(img);
    });
    return () => {
      cancelled = true;
    };
  }, [result.url]);

  const toggle = useCallback(async () => {
    if (expanded) {
      setExpanded(false);
      return;
    }
    setExpanded(true);

    if (content === null) {
      setLoading(true);
      try {
        const md = await scrapeArticle(result.url);
        setContent(md || "");
      } catch {
        setContent("");
      } finally {
        setLoading(false);
      }
    }
  }, [expanded, content, result.url]);

  const showImage = ogImage && !imgError;

  return (
    <div className="overflow-hidden rounded-lg border bg-card transition-colors hover:bg-muted/30">
      {/* Clickable header area */}
      <button type="button" className="flex w-full items-start gap-0 text-left" onClick={toggle}>
        {/* Thumbnail image */}
        {showImage && (
          <div className="relative hidden shrink-0 sm:block sm:w-36 md:w-44">
            <div className="aspect-[16/10] w-full">
              <img
                src={ogImage}
                alt=""
                className="h-full w-full object-cover"
                onError={() => setImgError(true)}
              />
            </div>
          </div>
        )}

        {/* Content area */}
        <div className="flex min-w-0 flex-1 items-start gap-3 p-4">
          {/* Category icon */}
          <div className="flex shrink-0 items-center pt-0.5">
            {icon || (
              <div className="flex size-8 items-center justify-center rounded-md bg-muted">
                {favicon ? (
                  <img
                    src={favicon}
                    alt=""
                    className="size-4 rounded-sm"
                    onError={(e) => {
                      (e.target as HTMLImageElement).style.display = "none";
                    }}
                  />
                ) : (
                  <Globe className="size-4 text-muted-foreground" />
                )}
              </div>
            )}
          </div>

          {/* Title + snippet + source */}
          <div className="min-w-0 flex-1">
            <h3 className="text-sm font-semibold leading-snug text-foreground">
              {result.title || "Untitled"}
            </h3>
            {result.snippet && (
              <p className="mt-1 line-clamp-2 text-sm leading-relaxed text-muted-foreground">
                {result.snippet}
              </p>
            )}
            <div className="mt-1.5 flex items-center gap-1.5 text-[11px] text-muted-foreground/60">
              {favicon && <img src={favicon} alt="" className="size-3 rounded-sm opacity-50" />}
              <span>{displayHost}</span>
            </div>
          </div>

          {/* Expand indicator */}
          <div className="flex shrink-0 items-center pt-1">
            {loading ? (
              <Loader2 className="size-4 animate-spin text-muted-foreground" />
            ) : (
              <ChevronDown
                className={`size-4 text-muted-foreground transition-transform ${expanded ? "rotate-180" : ""}`}
              />
            )}
          </div>
        </div>
      </button>

      {/* Mobile: show image below header when present */}
      {showImage && (
        <div className="px-4 pb-2 sm:hidden">
          <img
            src={ogImage}
            alt=""
            className="w-full rounded-md object-cover"
            style={{ maxHeight: "180px" }}
            onError={() => setImgError(true)}
          />
        </div>
      )}

      {/* Expanded article content */}
      {expanded && !loading && (
        <div className="border-t px-4 pb-4 pt-3">
          {content ? (
            <div className="space-y-3">
              {content.split("\n\n").map((paragraph, i) => (
                <p key={i} className="text-sm leading-relaxed text-muted-foreground">
                  {paragraph}
                </p>
              ))}
            </div>
          ) : result.snippet ? (
            <p className="text-sm leading-relaxed text-muted-foreground">{result.snippet}</p>
          ) : (
            <p className="text-sm italic text-muted-foreground/60">
              Could not load article content.
            </p>
          )}

          <a
            href={result.url}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-4 inline-flex items-center gap-1.5 rounded-md border px-3 py-1.5 text-xs font-medium text-primary transition-colors hover:bg-primary hover:text-primary-foreground"
          >
            <ExternalLink className="size-3" />
            Read full article on {displayHost}
          </a>
        </div>
      )}
    </div>
  );
}
