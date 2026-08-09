import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { Mic, Square, Send, RotateCcw } from "lucide-react";
import { useEcho } from "@/lib/echo-store";

export const Route = createFileRoute("/record")({
  head: () => ({
    meta: [
      { title: "Record a Moment — Echo Voice Journal" },
      {
        name: "description",
        content: "Tap once, speak freely. Echo captures your voice note and scores the mood.",
      },
      { property: "og:title", content: "Record a Moment — Echo Voice Journal" },
      {
        property: "og:description",
        content: "Tap once, speak freely. Echo captures your voice note and scores the mood.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: RecordPage,
});

const samples = [
  {
    transcript:
      "Just needed a minute to say this out loud. Today moved fast, but I stayed with it and got through the part I was dreading.",
    sentiment_score: 71,
    mood_tags: ["steady", "relieved"],
  },
  {
    transcript:
      "Feeling stretched thin. Too many open loops and not enough quiet between them. Naming it helps a little.",
    sentiment_score: 41,
    mood_tags: ["overwhelmed", "honest"],
  },
  {
    transcript:
      "Good one today. Something small clicked and I noticed it while it was happening, which almost never happens.",
    sentiment_score: 86,
    mood_tags: ["bright", "present"],
  },
];

function RecordPage() {
  const { addEntry } = useEcho();
  const navigate = useNavigate();
  const [recording, setRecording] = useState(false);
  const [status, setStatus] = useState<"idle" | "recording" | "ready" | "processing" | "done">(
    "idle",
  );
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [seconds, setSeconds] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const recorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);

  useEffect(() => {
    if (!recording) return;
    const t = setInterval(() => setSeconds((s) => s + 1), 1000);
    return () => clearInterval(t);
  }, [recording]);

  const stop = useCallback(() => {
    recorderRef.current?.stop();
    recorderRef.current?.stream.getTracks().forEach((t) => t.stop());
    setRecording(false);
  }, []);

  const start = useCallback(async () => {
    setError(null);
    setAudioUrl(null);
    setSeconds(0);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);
      chunksRef.current = [];
      recorder.ondataavailable = (e) => chunksRef.current.push(e.data);
      recorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: "audio/webm" });
        setAudioUrl(URL.createObjectURL(blob));
        setStatus("ready");
      };
      recorder.start();
      recorderRef.current = recorder;
      setRecording(true);
      setStatus("recording");
    } catch {
      setError("Microphone access was denied. Enable it in your browser settings to record.");
      setStatus("idle");
    }
  }, []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.code !== "Space" || (e.target as HTMLElement)?.tagName === "INPUT") return;
      e.preventDefault();
      recording ? stop() : start();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [recording, start, stop]);

  const submit = () => {
    setStatus("processing");
    const sample = samples[Math.floor(Math.random() * samples.length)]!;
    setTimeout(() => {
      const entry = addEntry(sample);
      setStatus("done");
      setTimeout(() => navigate({ to: "/entry/$id", params: { id: entry.id } }), 900);
    }, 1200);
  };

  const reset = () => {
    setAudioUrl(null);
    setSeconds(0);
    setStatus("idle");
  };

  const bars = useMemo(() => Array.from({ length: 28 }, (_, i) => i), []);
  const mmss = `${String(Math.floor(seconds / 60)).padStart(2, "0")}:${String(seconds % 60).padStart(2, "0")}`;

  return (
    <div className="mx-auto max-w-[640px] px-4 py-10 text-center">
      <h1 className="text-2xl font-bold tracking-tight">Record your moment</h1>
      <p className="mt-1 text-sm text-muted-foreground">
        Speak for as long as you like. Press <kbd className="rounded border border-border px-1">Space</kbd> to start or stop.
      </p>

      <div className="mt-8 rounded-2xl border border-border p-8">
        <button
          onClick={recording ? stop : start}
          aria-label={recording ? "Stop recording" : "Start recording"}
          className={`mx-auto grid size-28 place-items-center rounded-full text-primary-foreground transition-transform hover:scale-105 ${
            recording ? "animate-pulse-glow bg-destructive" : "bg-primary"
          }`}
        >
          {recording ? <Square className="size-9" /> : <Mic className="size-10" />}
        </button>

        <div className="mt-6 flex h-12 items-end justify-center gap-1">
          {bars.map((i) => (
            <span
              key={i}
              className={`w-1.5 rounded-full transition-all duration-300 ${
                recording ? "bg-primary" : "bg-border"
              }`}
              style={{
                height: recording ? `${18 + Math.abs(Math.sin(i + seconds)) * 30}px` : "6px",
              }}
            />
          ))}
        </div>

        <p className="mt-4 text-sm font-medium text-muted-foreground">
          {status === "idle" && "Tap the mic to start recording"}
          {status === "recording" && `Recording… ${mmss}`}
          {status === "ready" && `Recorded ${mmss} — preview it below`}
          {status === "processing" && "Processing your entry…"}
          {status === "done" && "Saved. Taking you to the entry…"}
        </p>

        {error && <p className="mt-3 text-sm text-destructive">{error}</p>}

        {audioUrl && (
          <div className="mt-6 animate-slide-up rounded-xl bg-muted p-4 text-left">
            <p className="mb-2 text-xs font-semibold text-muted-foreground">Preview</p>
            <audio controls src={audioUrl} className="w-full" />
          </div>
        )}

        {audioUrl && status === "ready" && (
          <div className="mt-5 flex flex-col gap-2 sm:flex-row sm:justify-center">
            <button
              onClick={submit}
              className="inline-flex items-center justify-center gap-2 rounded-lg bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground hover:opacity-90"
            >
              <Send className="size-4" /> Submit entry
            </button>
            <button
              onClick={reset}
              className="inline-flex items-center justify-center gap-2 rounded-lg border border-border px-5 py-2.5 text-sm font-semibold hover:bg-muted"
            >
              <RotateCcw className="size-4" /> Record again
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
