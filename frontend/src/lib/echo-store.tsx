import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";

export type Entry = {
  id: string;
  created_at: string;
  transcript: string;
  sentiment_score: number;
  mood_tags: string[];
};

const seed: Entry[] = [
  {
    id: "e1",
    created_at: daysAgo(0, 9),
    transcript:
      "Woke up before the alarm and actually felt rested. Made coffee slowly, watched the street wake up. Small win, but it set the tone for everything after.",
    sentiment_score: 82,
    mood_tags: ["calm", "hopeful"],
  },
  {
    id: "e2",
    created_at: daysAgo(1, 21),
    transcript:
      "Long day. The review meeting ran twice as long as it needed to and I left feeling like nobody heard the point I was making.",
    sentiment_score: 38,
    mood_tags: ["drained", "frustrated"],
  },
  {
    id: "e3",
    created_at: daysAgo(2, 18),
    transcript:
      "Walked home the long way along the river. Ten minutes of nothing but footsteps and water sounds. I should do that more often.",
    sentiment_score: 74,
    mood_tags: ["calm", "reflective"],
  },
  {
    id: "e4",
    created_at: daysAgo(3, 13),
    transcript:
      "Shipped the thing. It's not perfect but it's out and people are using it. Weird mix of relief and wanting to immediately fix five details.",
    sentiment_score: 88,
    mood_tags: ["proud", "restless"],
  },
  {
    id: "e5",
    created_at: daysAgo(4, 22),
    transcript:
      "Couldn't sleep again. Kept replaying the conversation from Tuesday and picking apart what I said.",
    sentiment_score: 29,
    mood_tags: ["anxious", "tired"],
  },
  {
    id: "e6",
    created_at: daysAgo(5, 12),
    transcript:
      "Lunch with Mara. We talked for two hours and it didn't feel like any time passed at all. I forget how much I need that.",
    sentiment_score: 91,
    mood_tags: ["connected", "grateful"],
  },
  {
    id: "e7",
    created_at: daysAgo(6, 8),
    transcript:
      "Rain all morning. Stayed in, cleaned the kitchen, and read a chapter of the book I keep abandoning. Quietly okay.",
    sentiment_score: 61,
    mood_tags: ["quiet", "steady"],
  },
];

function daysAgo(d: number, hour: number) {
  const date = new Date();
  date.setDate(date.getDate() - d);
  date.setHours(hour, 12, 0, 0);
  return date.toISOString();
}

type Ctx = {
  entries: Entry[];
  addEntry: (e: Omit<Entry, "id" | "created_at"> & { id?: string; created_at?: string }) => Entry;
  deleteEntry: (id: string) => void;
  getEntry: (id: string) => Entry | undefined;
  similar: (id: string) => Entry[];
};

const EchoContext = createContext<Ctx | null>(null);
const STORAGE_KEY = "echo.entries.v1";

export function EchoProvider({ children }: { children: ReactNode }) {
  const [entries, setEntries] = useState<Entry[]>(seed);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) setEntries(JSON.parse(raw) as Entry[]);
    } catch {
      /* ignore */
    }
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(entries));
    } catch {
      /* ignore */
    }
  }, [entries]);

  const value = useMemo<Ctx>(() => {
    const sorted = [...entries].sort((a, b) => +new Date(b.created_at) - +new Date(a.created_at));
    return {
      entries: sorted,
      addEntry: (e) => {
        const entry: Entry = {
          ...e,
          id: e.id ?? crypto.randomUUID(),
          created_at: e.created_at ?? new Date().toISOString(),
        };
        setEntries((prev) => [entry, ...prev]);
        return entry;
      },
      deleteEntry: (id) => setEntries((prev) => prev.filter((e) => e.id !== id)),
      getEntry: (id) => sorted.find((e) => e.id === id),
      similar: (id) => {
        const target = sorted.find((e) => e.id === id);
        if (!target) return [];
        return sorted
          .filter((e) => e.id !== id)
          .map((e) => {
            const overlap = e.mood_tags.filter((t) => target.mood_tags.includes(t)).length;
            const closeness = 1 - Math.abs(e.sentiment_score - target.sentiment_score) / 100;
            return { e, score: overlap * 0.5 + closeness };
          })
          .sort((a, b) => b.score - a.score)
          .slice(0, 3)
          .map((x) => x.e);
      },
    };
  }, [entries]);

  return <EchoContext.Provider value={value}>{children}</EchoContext.Provider>;
}

export function useEcho() {
  const ctx = useContext(EchoContext);
  if (!ctx) throw new Error("useEcho must be used inside EchoProvider");
  return ctx;
}

export function moodTone(score: number) {
  if (score >= 70) return "success" as const;
  if (score >= 45) return "warning" as const;
  return "danger" as const;
}
