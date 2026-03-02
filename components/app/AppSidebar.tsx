"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  PlayCircle,
  ListVideo,
  FileText,
  BarChart3,
  Settings,
  BookOpen,
  X,
  Download,
  History,
  Menu,
  Layers,
  Library,
  Folder,
  GraduationCap,
} from "lucide-react";
import { useSession } from "next-auth/react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/ThemeToggle";

const navItems = [
  { icon: LayoutDashboard, label: "Dashboard", href: "/app/dashboard" },
  { icon: Folder, label: "Library", href: "/app/videos" },
  { icon: ListVideo, label: "Playlists", href: "/app/playlists" },
  { icon: FileText, label: "Notes", href: "/app/notes" },
  { icon: BarChart3, label: "Analytics", href: "/app/analytics" },
  { icon: Download, label: "Install App", href: "/install", mobileOnly: true },
  { icon: History, label: "History", href: "/app/history" },
];

const specialItems = [
  { icon: GraduationCap, label: "IITM Curriculum", href: "/app/iitm", highlight: true },
];

interface AppSidebarProps {
  collapsed: boolean;
  onToggle: () => void;
  isMobile?: boolean;
  mobileMenuOpen?: boolean;
}

export function AppSidebar({ collapsed, onToggle, isMobile, mobileMenuOpen }: AppSidebarProps) {
  const pathname = usePathname();
  const { data: session } = useSession();

  // On mobile, show/hide based on mobileMenuOpen
  if (isMobile) {
    return (
      <aside
        className={cn(
          "fixed left-0 top-0 h-screen bg-sidebar border-r border-sidebar-border flex flex-col transition-transform duration-300 z-50 w-64",
          mobileMenuOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        {/* Header */}
        <div className="h-14 flex items-center justify-between px-4 border-b border-sidebar-border">
          <Link href="/app/dashboard" className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
              <BookOpen className="w-4 h-4 text-primary-foreground" />
            </div>
            <span className="font-semibold text-sidebar-foreground">StudyPlus</span>
          </Link>
          <Button
            variant="ghost"
            size="icon"
            onClick={onToggle}
            className="text-sidebar-foreground hover:bg-sidebar-accent"
          >
            <X className="w-5 h-5" />
          </Button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 min-h-0 overflow-y-auto py-4 px-3">
          <ul className="space-y-1">
            {navItems.map((item) => {
              const isActive = pathname === item.href;
              return (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    className={cn(
                      "flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors",
                      isActive
                        ? "bg-sidebar-accent text-sidebar-accent-foreground font-medium"
                        : "text-sidebar-foreground hover:bg-sidebar-accent/50"
                    )}
                  >
                    <item.icon className="w-5 h-5 flex-shrink-0" />
                    <span>{item.label}</span>
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>

        {/* Footer */}
        <div className="flex-shrink-0 p-3 border-t border-sidebar-border space-y-2">
          {session?.user?.isIITMUser && (
            <>
              <div className="px-2 mb-1">
                <div className="text-xs font-semibold text-muted-foreground mb-1">IITM BS Programme</div>
              </div>
              {specialItems.map((item) => {
                const isActive = pathname === item.href;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={cn(
                      "flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors border",
                      isActive
                        ? "bg-primary text-primary-foreground border-primary font-medium"
                        : "text-sidebar-foreground hover:bg-sidebar-accent/50 border-primary/30"
                    )}
                  >
                    <item.icon className="w-5 h-5 flex-shrink-0" />
                    <span>{item.label}</span>
                  </Link>
                );
              })}
            </>
          )}

          <Link
            href="/app/settings"
            className={cn(
              "flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors text-sidebar-foreground hover:bg-sidebar-accent/50",
              pathname === "/app/settings" && "bg-sidebar-accent text-sidebar-accent-foreground font-medium"
            )}
          >
            <Settings className="w-5 h-5 flex-shrink-0" />
            <span>Settings</span>
          </Link>
        </div>
      </aside>
    );
  }

  // Desktop sidebar
  return (
    <aside
      className={cn(
        "fixed left-0 top-0 h-screen bg-sidebar border-r border-sidebar-border flex-col transition-all duration-300 z-50 hidden md:flex",
        collapsed ? "w-16" : "w-60"
      )}
    >
      {/* Header */}
      <div className="h-16 flex items-center justify-between px-4 border-b border-sidebar-border">
        {!collapsed && (
          <Link href="/app/dashboard" className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
              <BookOpen className="w-4 h-4 text-primary-foreground" />
            </div>
            <span className="font-semibold text-sidebar-foreground">StudyPlus</span>
          </Link>
        )}
        <Button
          variant="ghost"
          size="icon"
          onClick={onToggle}
          className={cn("text-sidebar-foreground hover:bg-sidebar-accent", collapsed && "mx-auto")}
        >
          <Menu className="w-5 h-5" />
        </Button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 py-4 px-3">
        <ul className="space-y-1">
          {navItems.filter(item => !item.mobileOnly).map((item) => {
            const isActive = pathname === item.href;
            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  title={collapsed ? item.label : undefined}
                  className={cn(
                    "flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors",
                    isActive
                      ? "bg-sidebar-accent text-sidebar-accent-foreground font-medium"
                      : "text-sidebar-foreground hover:bg-sidebar-accent/50",
                    collapsed && "justify-center"
                  )}
                >
                  <item.icon className="w-5 h-5 flex-shrink-0" />
                  {!collapsed && <span>{item.label}</span>}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      {/* Footer */}
      <div className="p-3 border-t border-sidebar-border space-y-2">
        {/* IITM Curriculum - Special highlight - Only for IITM users */}
        {session?.user?.isIITMUser && (
          <>
            {!collapsed && (
              <div className="px-2 mb-1">
                <div className="text-xs font-semibold text-muted-foreground">IITM BS Programme</div>
              </div>
            )}
            {specialItems.map((item) => {
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  title={collapsed ? item.label : undefined}
                  className={cn(
                    "flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors border",
                    isActive
                      ? "bg-primary text-primary-foreground border-primary font-medium"
                      : "text-sidebar-foreground hover:bg-sidebar-accent/50 border-primary/30",
                    collapsed && "justify-center border-0"
                  )}
                >
                  <item.icon className="w-5 h-5 flex-shrink-0" />
                  {!collapsed && <span>{item.label}</span>}
                </Link>
              );
            })}
          </>
        )}

        <Link
          href="/app/settings"
          title={collapsed ? "Settings" : undefined}
          className={cn(
            "flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors text-sidebar-foreground hover:bg-sidebar-accent/50",
            pathname === "/app/settings" && "bg-sidebar-accent text-sidebar-accent-foreground font-medium",
            collapsed && "justify-center"
          )}
        >
          <Settings className="w-5 h-5 flex-shrink-0" />
          {!collapsed && <span>Settings</span>}
        </Link>
      </div>
    </aside>
  );
}
