import { Link, useRouterState } from "@tanstack/react-router";
import { Mic, Home, Settings, AudioLines } from "lucide-react";

const links = [
  { to: "/", label: "Home", icon: Home },
  { to: "/record", label: "Record", icon: Mic },
  { to: "/settings", label: "Settings", icon: Settings },
] as const;

export function Header() {
  const path = useRouterState({ select: (s) => s.location.pathname });

  return (
    <header className="sticky top-0 z-40 h-15 border-b border-border bg-background/85 backdrop-blur">
      <div className="mx-auto flex h-15 max-w-[1200px] items-center justify-between px-4">
        <Link to="/" className="flex items-center gap-2 text-foreground">
          <span className="grid size-8 place-items-center rounded-lg bg-primary text-primary-foreground">
            <AudioLines className="size-4" />
          </span>
          <span className="text-2xl font-bold tracking-tight">Echo</span>
        </Link>
        <nav className="hidden items-center gap-1 sm:flex">
          {links.map(({ to, label }) => (
            <Link
              key={to}
              to={to}
              className={`rounded-md px-3 py-1.5 text-sm font-medium transition-colors hover:bg-muted ${
                path === to ? "text-primary" : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {label}
            </Link>
          ))}
        </nav>
      </div>
    </header>
  );
}

export function BottomNav() {
  const path = useRouterState({ select: (s) => s.location.pathname });

  return (
    <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-border bg-background sm:hidden">
      <div className="grid grid-cols-3">
        {links.map(({ to, label, icon: Icon }) => (
          <Link
            key={to}
            to={to}
            className={`flex flex-col items-center gap-0.5 py-2.5 text-xs font-medium transition-colors ${
              path === to ? "text-primary" : "text-muted-foreground"
            }`}
          >
            <Icon className="size-5" />
            {label}
          </Link>
        ))}
      </div>
    </nav>
  );
}

export function Footer() {
  return (
    <footer className="mt-10 border-t border-border py-5 pb-20 sm:pb-5">
      <div className="mx-auto flex max-w-[1200px] items-center justify-between px-4 text-xs text-muted-foreground">
        <span>Echo — voice journal &amp; mood recall</span>
        <span>Your entries stay on this device</span>
      </div>
    </footer>
  );
}
