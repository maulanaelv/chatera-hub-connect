import { Link } from "@tanstack/react-router";
import { BarChart3, BookOpen, Bot, Inbox as InboxIcon, LogOut, Settings, ShieldCheck } from "lucide-react";
import type { ReactNode } from "react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import assistantMark from "@/assets/purworejo-assistant-mark.png";

export const APP_NAV = [
  { label: "Inbox", icon: InboxIcon, to: "/" as const },
  { label: "Knowledge Base", icon: BookOpen, to: "/knowledge-base" as const },
  { label: "Menu Bot", icon: Bot, to: "/menu-bot" as const },
  { label: "Statistik", icon: BarChart3, to: "/statistik" as const },
  { label: "Pengaturan", icon: Settings, to: "/pengaturan" as const },
];

export function AppShell({
  title,
  subtitle,
  actions,
  children,
}: {
  title: string;
  subtitle?: string;
  actions?: ReactNode;
  children: ReactNode;
}) {
  return (
    <main className="flex min-h-dvh bg-app-canvas text-foreground">
      <aside className="hidden w-60 shrink-0 flex-col border-r border-sidebar-border bg-sidebar lg:flex">
        <div className="flex h-[76px] items-center gap-3 border-b border-sidebar-border px-5">
          <img src={assistantMark} alt="Logo Purworejo Chatera Assistant" width={42} height={42} className="size-10 shrink-0 object-contain" />
          <div className="min-w-0">
            <p className="truncate text-sm font-bold text-sidebar-foreground">Purworejo</p>
            <p className="truncate text-xs text-muted-foreground">Chatera Assistant</p>
          </div>
        </div>
        <nav aria-label="Navigasi utama" className="flex-1 space-y-1 px-3 py-5">
          <p className="px-3 pb-2 text-[10px] font-semibold uppercase text-muted-foreground">Ruang kerja</p>
          {APP_NAV.map(({ label, icon: Icon, to }) => (
            <Link
              key={label}
              to={to}
              className="flex h-10 items-center gap-3 rounded-md px-3 text-sm font-medium text-muted-foreground transition-colors hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
              activeOptions={{ exact: true }}
              activeProps={{ className: "bg-sidebar-primary text-sidebar-primary-foreground hover:bg-sidebar-primary hover:text-sidebar-primary-foreground" }}
            >
              <Icon className="size-4 shrink-0" />
              <span className="truncate">{label}</span>
            </Link>
          ))}
        </nav>
        <div className="border-t border-sidebar-border p-4">
          <div className="flex items-center gap-2.5 rounded-md bg-sidebar-accent px-3 py-3">
            <ShieldCheck className="size-4 text-sidebar-primary" />
            <div className="min-w-0">
              <p className="truncate text-xs font-semibold text-sidebar-foreground">Chatera terhubung</p>
              <p className="truncate text-[10px] text-muted-foreground">Webhook aktif</p>
            </div>
          </div>
        </div>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="grid h-[76px] shrink-0 grid-cols-[minmax(0,1fr)_auto] items-center gap-3 border-b border-border bg-background px-4 sm:px-6">
          <div className="min-w-0">
            <h1 className="truncate text-lg font-bold sm:text-xl">{title}</h1>
            {subtitle ? <p className="hidden truncate text-xs text-muted-foreground sm:block">{subtitle}</p> : null}
          </div>
          <div className="flex shrink-0 items-center gap-2 sm:gap-3">
            {actions}
            <Avatar className="size-9 border border-border">
              <AvatarFallback className="bg-accent text-xs font-bold text-accent-foreground">RW</AvatarFallback>
            </Avatar>
            <Button variant="ghost" size="icon" aria-label="Logout">
              <LogOut />
            </Button>
          </div>
        </header>
        <div className="min-w-0 flex-1 p-4 sm:p-6">{children}</div>
        <nav className="flex items-center justify-around border-t border-border bg-background px-2 py-2 lg:hidden" aria-label="Navigasi bawah">
          {APP_NAV.slice(0, 3).map(({ label, icon: Icon, to }) => (
            <Link key={label} to={to} className="flex flex-col items-center gap-1 px-3 py-1 text-[10px] text-muted-foreground" activeOptions={{ exact: true }} activeProps={{ className: "text-foreground font-semibold" }}>
              <Icon className="size-4" />
              {label}
            </Link>
          ))}
        </nav>
      </div>
    </main>
  );
}

export { cn };
