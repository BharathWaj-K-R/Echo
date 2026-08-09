import { moodTone } from "@/lib/echo-store";

export function MoodScore({ score, size = "sm" }: { score: number; size?: "sm" | "lg" }) {
  const tone = moodTone(score);
  const color =
    tone === "success"
      ? "bg-success/10 text-success"
      : tone === "warning"
        ? "bg-warning/15 text-warning"
        : "bg-destructive/10 text-destructive";

  if (size === "lg") {
    return (
      <div className={`rounded-xl px-4 py-2 text-right ${color}`}>
        <span className="text-3xl font-bold leading-none">{score}</span>
        <span className="ml-1 text-sm opacity-70">/100</span>
      </div>
    );
  }

  return (
    <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${color}`}>{score}/100</span>
  );
}

export function MoodTag({ tag }: { tag: string }) {
  return (
    <span className="rounded-full border border-border bg-muted px-2.5 py-0.5 text-xs font-medium text-muted-foreground">
      {tag}
    </span>
  );
}
