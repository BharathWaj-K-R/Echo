import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useEcho } from "@/lib/echo-store";

export const Route = createFileRoute("/settings")({
  head: () => ({
    meta: [
      { title: "Settings — Echo Voice Journal" },
      {
        name: "description",
        content: "Adjust reminders, transcript defaults and manage the entries stored on this device.",
      },
      { property: "og:title", content: "Settings — Echo Voice Journal" },
      {
        property: "og:description",
        content: "Reminders, transcript defaults and local data controls for Echo.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: SettingsPage,
});

function SettingsPage() {
  const { entries } = useEcho();
  const [reminder, setReminder] = useState(true);
  const [autoTranscribe, setAutoTranscribe] = useState(true);

  return (
    <div className="mx-auto max-w-[640px] px-4 py-8">
      <h1 className="text-2xl font-bold tracking-tight">Settings</h1>
      <p className="mt-1 text-sm text-muted-foreground">Small preferences, nothing complicated.</p>

      <div className="mt-6 divide-y divide-border rounded-2xl border border-border">
        <Row
          title="Daily reminder"
          desc="A nudge at 9pm to record how the day went."
          on={reminder}
          onChange={setReminder}
        />
        <Row
          title="Auto-transcribe"
          desc="Turn each recording into text as soon as it's saved."
          on={autoTranscribe}
          onChange={setAutoTranscribe}
        />
        <div className="flex items-center justify-between p-4">
          <div>
            <p className="text-sm font-semibold">Stored entries</p>
            <p className="text-xs text-muted-foreground">
              {entries.length} entries saved locally on this device.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

function Row({
  title,
  desc,
  on,
  onChange,
}: {
  title: string;
  desc: string;
  on: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <div className="flex items-center justify-between gap-4 p-4">
      <div>
        <p className="text-sm font-semibold">{title}</p>
        <p className="text-xs text-muted-foreground">{desc}</p>
      </div>
      <button
        role="switch"
        aria-checked={on}
        aria-label={title}
        onClick={() => onChange(!on)}
        className={`h-6 w-11 shrink-0 rounded-full p-0.5 ${on ? "bg-primary" : "bg-border"}`}
      >
        <span
          className={`block size-5 rounded-full bg-background transition-transform ${on ? "translate-x-5" : ""}`}
        />
      </button>
    </div>
  );
}
