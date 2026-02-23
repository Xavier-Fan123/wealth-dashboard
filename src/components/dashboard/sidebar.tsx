"use client";

import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  Briefcase,
  Building2,
  ArrowRightLeft,
  ScrollText,
  TrendingUp,
  DollarSign,
  X,
} from "lucide-react";

const navItems = [
  { icon: LayoutDashboard, label: "Overview", id: "overview" },
  { icon: Briefcase, label: "Family Portfolio", id: "portfolio" },
  { icon: Building2, label: "Corporate Liquidity", id: "corporate" },
  { icon: ScrollText, label: "Statements", id: "statements" },
  { icon: ArrowRightLeft, label: "Capital Flows", id: "transactions" },
];

interface SidebarProps {
  activeSection: string;
  onNavigate: (section: string) => void;
  open: boolean;
  onClose: () => void;
}

export function Sidebar({ activeSection, onNavigate, open, onClose }: SidebarProps) {
  function handleNavigate(section: string) {
    onNavigate(section);
    onClose();
  }

  return (
    <>
      {/* Mobile overlay backdrop */}
      {open && (
        <div
          className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm md:hidden"
          onClick={onClose}
        />
      )}

      <aside
        className={cn(
          "fixed left-0 top-0 z-50 flex h-screen w-64 flex-col border-r border-border bg-card transition-transform duration-300",
          open ? "translate-x-0" : "-translate-x-full",
          "md:translate-x-0 md:z-40"
        )}
      >
        {/* Logo + close button */}
        <div className="flex h-16 items-center justify-between border-b border-border px-6">
          <div className="flex items-center gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary">
              <TrendingUp className="h-4 w-4 text-primary-foreground" />
            </div>
            <div>
              <h1 className="text-sm font-semibold text-foreground">WealthPulse</h1>
              <p className="text-xs text-muted-foreground">Family & Corporate</p>
            </div>
          </div>
          <button onClick={onClose} className="rounded-md p-1 text-muted-foreground hover:text-foreground md:hidden">
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 space-y-1 p-4">
          {navItems.map((item) => (
            <button
              key={item.id}
              onClick={() => handleNavigate(item.id)}
              className={cn(
                "flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                activeSection === item.id
                  ? "bg-primary/10 text-primary"
                  : "text-muted-foreground hover:bg-accent hover:text-foreground"
              )}
            >
              <item.icon className="h-4 w-4" />
              {item.label}
            </button>
          ))}
        </nav>

        {/* Footer */}
        <div className="border-t border-border p-4">
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <DollarSign className="h-3 w-3" />
            <span>Base Currency: SGD</span>
          </div>
        </div>
      </aside>
    </>
  );
}
