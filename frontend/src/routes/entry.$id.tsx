import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { ArrowLeft, ArrowRight, Share2, Trash2, Check } from "lucide-react";
import { useState } from "react";
import { useEcho } from "@/lib/echo-store";
import { MoodScore, MoodTag } from "@/components/mood";

export const Route = createFileRoute("/entry/$id")({
  head: () => ({
    meta: [
      { title: "Entry & Echoes — Echo Voice Journal" },
      {
        name: "description",
        content: "Read the full transcript, mood score and tags, plus similar moments from before.",
      },
      { property: "og:title", content: "Entry & Echoes — Echo Voice Journal" },
      {
        property: "og:description",
        content: "Full transcript, mood score and echoes of similar moments.",
      },
      { property: "og:type", content: "article" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: EntryDetail,
});

function EntryDetail() {
  const { id } = Route.useParams();
  const { getEntry, similar, deleteEntry } = useEcho();
  const navigate = useNavigate();
  const [copied, setCopied] = useState(false);
  const entry = getEntry(id);

  if (!entry) {
    return (
      <div className="mx-auto max-w-[640px] px-4 py-16 text-center">
        <p className="text-sm text-muted-foreground">That entry isn&apos;t here anymore.</p>
        <Link to="/" className="mt-4 inline-block text-sm font-semibold text-primary">
          Back to timeline
        </Link>
      </div>
    );
  }

  const echoes = similar(entry.id);
  const created = new Date(entry.created_at);

  const share = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {
      /* ignore */
    }
  };

  return (
    <div className="mx-auto max-w-[1200px] px-4 py-6">
      <Link
        to="/"
        className="inline-flex items-center gap-1.5 text-sm font-medium text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="size-4" /> Back to timeline
      </Link>

      <div className="mt-4 grid items-start gap-4 lg:grid-cols-[1.6fr_1fr]">
        <article className="animate-slide-up rounded-2xl border border-border p-6">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-sm font-semibold">
                {created.toLocaleDateString(undefined, {
                  weekday: "long",
                  month: "long",
                  day: "numeric",
                })}
              </p>
              <p className="text-xs text-muted-foreground">
                {created.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
              </p>
            </div>
            <MoodScore score={entry.sentiment_score} size="lg" />
          </div>

          <div className="mt-4 flex flex-wrap gap-1.5">
            {entry.mood_tags.map((t) => (
              <MoodTag key={t} tag={t} />
            ))}
          </div>

          <p className="mt-5 whitespace-pre-line text-[15px] leading-7">{entry.transcript}</p>

          <div className="mt-6 flex flex-wrap gap-2 border-t border-border pt-5">
            <button
              onClick={share}
              className="inline-flex items-center gap-2 rounded-lg border border-border px-4 py-2 text-sm font-semibold hover:bg-muted"
            >
              {copied ? <Check className="size-4 text-success" /> : <Share2 className="size-4" />}
              {copied ? "Link copied" : "Share"}
            </button>
            <button
              onClick={() => {
                deleteEntry(entry.id);
                navigate({ to: "/" });
              }}
              className="inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold text-destructive hover:bg-destructive/10"
            >
              <Trash2 className="size-4" /> Delete
            </button>
          </div>
        </article>

        <aside>
          <h2 className="text-sm font-semibold">Echoes</h2>
          <p className="mt-0.5 text-xs text-muted-foreground">Moments that felt like this one.</p>
          {echoes.length === 0 ? (
            <p className="mt-4 rounded-xl border border-dashed border-border p-6 text-center text-sm text-muted-foreground">
              No similar entries yet.
            </p>
          ) : (
            <div className="mt-3 space-y-3">
              {echoes.map((echo) => (
                <Link
                  key={echo.id}
                  to="/entry/$id"
                  params={{ id: echo.id }}
                  className="block rounded-xl border border-border p-4 transition-all hover:-translate-y-0.5 hover:border-primary/40 hover:bg-muted/40"
                >
                  <p className="text-xs font-medium text-muted-foreground">
                    {new Date(echo.created_at).toLocaleDateString(undefined, {
                      month: "short",
                      day: "numeric",
                    })}
                  </p>
                  <p className="mt-1.5 line-clamp-3 text-sm leading-relaxed">{echo.transcript}</p>
                  <div className="mt-3 flex items-center justify-between">
                    <MoodScore score={echo.sentiment_score} />
                    <ArrowRight className="size-4 text-muted-foreground" />
                  </div>
                </Link>
              ))}
            </div>
          )}
        </aside>
      </div>
    </div>
  );
}
