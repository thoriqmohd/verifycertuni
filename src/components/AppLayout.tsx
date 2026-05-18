import { ReactNode, useState } from "react";
import { NavLink, useLocation, useNavigate, Link } from "react-router-dom";
import {
  LayoutDashboard, Building2, FileBadge, Receipt, Settings, Settings2, ScrollText, KeyRound,
  Search, History, Wallet, BadgeDollarSign, Menu, LogOut, ShieldCheck, X, Users,
} from "lucide-react";
import { useAuth, AppRole } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import brandLogo from "@/assets/univerify-logo.png";

type Item = { to: string; label: string; icon: any };

const menus: Record<AppRole, Item[]> = {
  super_admin: [
    { to: "/admin/dashboard", label: "Dashboard", icon: LayoutDashboard },
    { to: "/admin/universities", label: "Universities", icon: Building2 },
    { to: "/admin/transactions", label: "Transactions", icon: Receipt },
    { to: "/admin/payment-settings", label: "Payment Settings", icon: Settings2 },
    { to: "/admin/audit-logs", label: "Audit Logs", icon: ScrollText },
    { to: "/settings", label: "Settings", icon: Settings },
  ],
  university_admin: [
    { to: "/university/dashboard", label: "Dashboard", icon: LayoutDashboard },
    { to: "/university/certificates", label: "Certificates", icon: FileBadge },
    { to: "/university/api-integration", label: "API Integration", icon: KeyRound },
    { to: "/university/revenue", label: "Revenue", icon: Wallet },
    { to: "/university/finance-admins", label: "Finance Admins", icon: Users },
    { to: "/settings", label: "Settings", icon: Settings },
  ],
  employer: [
    { to: "/employer/dashboard", label: "Dashboard", icon: LayoutDashboard },
    { to: "/employer/search", label: "Search Certificate", icon: Search },
    { to: "/employer/history", label: "Verification History", icon: History },
    { to: "/settings", label: "Settings", icon: Settings },
  ],
  finance_admin: [
    { to: "/finance/dashboard", label: "Dashboard", icon: LayoutDashboard },
    { to: "/finance/transactions", label: "Transactions", icon: Receipt },
    { to: "/finance/settlements", label: "Settlements", icon: BadgeDollarSign },
    { to: "/settings", label: "Settings", icon: Settings },
  ],
  public_verifier: [],
};

const roleLabels: Record<AppRole, string> = {
  super_admin: "Super Admin",
  university_admin: "University Admin",
  employer: "Employer",
  finance_admin: "Finance Admin",
  public_verifier: "Public",
};

export function AppLayout({ children, title, breadcrumbs }: { children: ReactNode; title?: string; breadcrumbs?: { label: string; to?: string }[] }) {
  const { profile, primaryRole, signOut } = useAuth();
  const nav = useNavigate();
  const loc = useLocation();
  const [open, setOpen] = useState(false);
  const items = primaryRole ? menus[primaryRole] : [];

  const initials = (profile?.full_name ?? "U")
    .split(" ").slice(0, 2).map((s) => s[0]).join("").toUpperCase();

  const Sidebar = (
    <aside className="flex h-full w-64 flex-col bg-sidebar text-sidebar-foreground">
      <div className="flex h-16 items-center gap-2 px-6 border-b border-sidebar-border">
        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-sidebar-primary">
          <ShieldCheck className="h-5 w-5 text-sidebar-primary-foreground" />
        </div>
        <div>
          <div className="font-semibold text-white leading-tight">VerifyCert</div>
          <div className="text-[10px] uppercase tracking-wider text-sidebar-foreground/60">{primaryRole && roleLabels[primaryRole]}</div>
        </div>
      </div>
      <nav className="flex-1 overflow-y-auto p-3 space-y-1">
        {items.map((it) => {
          const active = loc.pathname === it.to || loc.pathname.startsWith(it.to + "/");
          return (
            <NavLink
              key={it.to}
              to={it.to}
              onClick={() => setOpen(false)}
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors",
                active ? "bg-sidebar-accent text-white" : "text-sidebar-foreground hover:bg-sidebar-accent/60 hover:text-white"
              )}
            >
              <it.icon className="h-4 w-4" />
              {it.label}
            </NavLink>
          );
        })}
      </nav>
      <div className="p-3 border-t border-sidebar-border">
        <Link to="/" className="flex items-center gap-2 rounded-lg px-3 py-2 text-xs text-sidebar-foreground/70 hover:text-white">
          ← Back to website
        </Link>
      </div>
    </aside>
  );

  return (
    <div className="flex min-h-screen w-full bg-background">
      <div className="hidden lg:block">{Sidebar}</div>

      {/* Mobile drawer */}
      {open && (
        <div className="lg:hidden fixed inset-0 z-50 flex">
          <div className="absolute inset-0 bg-black/50" onClick={() => setOpen(false)} />
          <div className="relative">{Sidebar}</div>
        </div>
      )}

      <div className="flex-1 flex flex-col min-w-0">
        <header className="h-16 border-b bg-card flex items-center justify-between px-4 lg:px-8 sticky top-0 z-30">
          <div className="flex items-center gap-3 min-w-0">
            <Button variant="ghost" size="icon" className="lg:hidden" onClick={() => setOpen(true)}>
              {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </Button>
            <div className="min-w-0">
              {breadcrumbs && (
                <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                  {breadcrumbs.map((b, i) => (
                    <span key={i} className="flex items-center gap-1.5">
                      {b.to ? <Link to={b.to} className="hover:text-foreground">{b.label}</Link> : <span>{b.label}</span>}
                      {i < breadcrumbs.length - 1 && <span>/</span>}
                    </span>
                  ))}
                </div>
              )}
              {title && <h1 className="text-lg font-semibold truncate">{title}</h1>}
            </div>
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="flex items-center gap-2 rounded-lg p-1 pr-3 hover:bg-muted transition-colors">
                <Avatar className="h-8 w-8"><AvatarFallback className="bg-primary text-primary-foreground text-xs">{initials}</AvatarFallback></Avatar>
                <div className="hidden md:block text-left">
                  <div className="text-sm font-medium leading-tight">{profile?.full_name ?? "User"}</div>
                  <div className="text-xs text-muted-foreground">{profile?.email}</div>
                </div>
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuLabel>{primaryRole && roleLabels[primaryRole]}</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => nav("/settings")}><Settings className="h-4 w-4 mr-2" />Settings</DropdownMenuItem>
              <DropdownMenuItem onClick={async () => { await signOut(); nav("/login"); }}>
                <LogOut className="h-4 w-4 mr-2" />Sign out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </header>
        <main className="flex-1 p-4 lg:p-8 max-w-[1500px] w-full mx-auto">{children}</main>
      </div>
    </div>
  );
}
