import { useMemo, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { Mic, TrendingUp, Search, NotebookPen } from "lucide-react";
import { useEcho } from "@/lib/echo-store";
import { MoodScore, MoodTag } from "@/components/mood";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Echo — Voice Journal & Mood Timeline" },
      {
        name: "description",
        content:
          "Track how you actually felt. Echo turns short voice notes into a mood timeline with recalls of similar moments.",
      },
      { property: "og:title", content: "Echo — Voice Journal & Mood Timeline" },
      {
        property: "og:description",
        content: "Short voice notes, a clear mood trend, and echoes of similar moments.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Dashboard,
});

const filters = [
  { key: "all", label: "All" },
  { key: "7", label: "Last 7 days" },
  { key: "30", label: "Last 30 days" },
] as const;

function Dashboard() {
  const { entries } = useEcho();
  const [filter, setFilter] = useState<(typeof filters)[number]["key"]>("all");
  const [query, setQuery] = useState("");

  const filtered = useMemo(() => {
    const cutoff = filter === "all" ? 0 : Date.now() - Number(filter) * 86400000;
    const q = query.trim().toLowerCase();
    return entries
      .filter((e) => +new Date(e.created_at) >= cutoff)
      .filter(
        (e) =>
          !q ||
          e.mood_tags.some((t) => t.toLowerCase().includes(q)) ||
          e.transcript.toLowerCase().includes(q) ||
          new Date(e.created_at).toLocaleDateString().includes(q),
      );
  }, [entries, filter, query]);

  const avgMood = filtered.length
    ? Math.round(filtered.reduce((a, b) => a + b.sentiment_score, 0) / filtered.length)
    : 0;

  const today = entries.find(
    (e) => new Date(e.created_at).toDateString() === new Date().toDateString(),
  );

  const chartData = useMemo(() => {
    const days: { date: string; mood: number | null }[] = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const scores = entries
        .filter((e) => new Date(e.created_at).toDateString() === d.toDateString())
        .map((e) => e.sentiment_score);
      days.push({
        date: d.toLocaleDateString(undefined, { month: "short", day: "numeric" }),
        mood: scores.length
          ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length)
          : null,
      });
    }

    // Fill null gaps by linear interpolation so the line is continuous
    const filled = [...days];
    for (let i = 0; i < filled.length; i++) {
      if (filled[i]!.mood !== null) continue;
      // find nearest non-null neighbours
      let left = i - 1;
      let right = i + 1;
      while (left >= 0 && filled[left]!.mood === null) left--;
      while (right < filled.length && filled[right]!.mood === null) right++;
      const lv = left >= 0 ? filled[left]!.mood! : null;
      const rv = right < filled.length ? filled[right]!.mood! : null;
      if (lv !== null && rv !== null) {
        const span = right - left;
        filled[i] = { ...filled[i]!, mood: Math.round(lv + ((rv - lv) * (i - left)) / span) };
      } else if (lv !== null) {
        filled[i] = { ...filled[i]!, mood: lv };
      } else if (rv !== null) {
        filled[i] = { ...filled[i]!, mood: rv };
      }
    }
    return filled;
  }, [entries]);


  const known = chartData.filter((d): d is { date: string; mood: number } => d.mood !== null);
  const trend = known.length > 1 ? known[known.length - 1]!.mood - known[0]!.mood : 0;


  return (
    <div className="mx-auto max-w-[1200px] px-4 py-6">
      <h1 className="text-2xl font-bold tracking-tight">Your timeline</h1>
      <p className="mt-1 text-sm text-muted-foreground">
        {entries.length} moments captured. Here&apos;s how the week has been going.
      </p>

      <div className="mt-5 grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Stat label="Total entries" value={String(entries.length)} />
        <Stat label="Avg mood" value={`${avgMood}/100`} />
        <Stat label="Today" value={today ? `${today.sentiment_score}/100` : "—"} />
        <Stat
          label="7-day trend"
          value={`${trend >= 0 ? "+" : ""}${trend}`}
          icon={<TrendingUp className="size-4 text-success" />}
        />
      </div>

      <section className="mt-4 rounded-xl border border-border p-4">
        <h2 className="text-sm font-semibold">7-day mood trend</h2>
        <div className="mt-3 h-56 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData} margin={{ left: -20, right: 8, top: 8 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
              <XAxis
                dataKey="date"
                tick={{ fontSize: 12, fill: "var(--muted-foreground)" }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                domain={[0, 100]}
                tick={{ fontSize: 12, fill: "var(--muted-foreground)" }}
                axisLine={false}
                tickLine={false}
              />
              <Tooltip
                formatter={(value: number) => [`${value}/100`, "Mood"]}
                contentStyle={{
                  borderRadius: 12,
                  border: "1px solid var(--border)",
                  fontSize: 12,
                }}
              />
              <Line
                type="monotone"
                dataKey="mood"
                connectNulls
                stroke="var(--primary)"
                strokeWidth={2.5}
                dot={{ r: 3, fill: "var(--primary)" }}
                activeDot={{ r: 5 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </section>

      <section className="mt-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-sm font-semibold">Recent entries</h2>
          <div className="flex flex-wrap items-center gap-2">
            <div className="relative">
              <Search className="pointer-events-none absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search mood or date"
                className="h-9 w-52 rounded-lg border border-border pl-8 pr-3 text-sm outline-none transition-colors placeholder:text-muted-foreground focus:border-primary"
              />
            </div>
            <div className="flex rounded-lg border border-border p-0.5">
              {filters.map((f) => (
                <button
                  key={f.key}
                  onClick={() => setFilter(f.key)}
                  className={`rounded-md px-2.5 py-1 text-xs font-medium ${
                    filter === f.key
                      ? "bg-primary text-primary-foreground"
                      : "text-muted-foreground hover:bg-muted"
                  }`}
                >
                  {f.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {filtered.length === 0 ? (
          <div className="mt-4 rounded-xl border border-dashed border-border p-10 text-center">
            <NotebookPen className="mx-auto size-6 text-muted-foreground" />
            <p className="mt-2 text-sm text-muted-foreground">No entries match that yet.</p>
          </div>
        ) : (
          <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {filtered.map((entry) => (
              <Link
                key={entry.id}
                to="/entry/$id"
                params={{ id: entry.id }}
                className="animate-slide-up rounded-xl border border-border p-4 transition-all hover:-translate-y-0.5 hover:border-primary/40 hover:bg-muted/40"
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-medium text-muted-foreground">
                    {new Date(entry.created_at).toLocaleDateString(undefined, {
                      month: "short",
                      day: "numeric",
                    })}
                  </span>
                  <MoodScore score={entry.sentiment_score} />
                </div>
                <p className="mt-2 line-clamp-3 text-sm leading-relaxed">{entry.transcript}</p>
                <div className="mt-3 flex flex-wrap gap-1.5">
                  {entry.mood_tags.slice(0, 2).map((t) => (
                    <MoodTag key={t} tag={t} />
                  ))}
                </div>
              </Link>
            ))}
          </div>
        )}
      </section>

      <Link
        to="/record"
        aria-label="Record new entry"
        className="fixed bottom-20 right-5 z-40 grid size-14 place-items-center rounded-full bg-primary text-primary-foreground shadow-lg transition-transform hover:scale-105 sm:bottom-8"
      >
        <Mic className="size-6" />
      </Link>
    </div>
  );
}

function Stat({ label, value, icon }: { label: string; value: string; icon?: React.ReactNode }) {
  return (
    <div className="rounded-xl border border-border p-4 transition-colors hover:bg-muted/50">
      <p className="text-xs font-medium text-muted-foreground">{label}</p>
      <div className="mt-1 flex items-center gap-1.5">
        <p className="text-2xl font-bold leading-none">{value}</p>
        {icon}
      </div>
    </div>
  );
}
