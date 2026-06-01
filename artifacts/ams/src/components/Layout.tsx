import { useState } from "react";
import { Link, useLocation } from "wouter";
import { motion, AnimatePresence } from "framer-motion";
import {
  LayoutDashboard, Users, Calendar, DollarSign, ImageIcon,
  Activity, BarChart3, Settings, LogOut, Menu, X, Stethoscope,
  ChevronRight, Bell, Moon, Sun, Globe
} from "lucide-react";
import { useAuth } from "@/components/auth-provider";
import { useTheme } from "@/components/theme-provider";
import { useI18n } from "@/lib/i18n";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

export default function Layout({ children }: { children: React.ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [location] = useLocation();
  const { user, logout, profilePhoto } = useAuth();
  const { theme, setTheme } = useTheme();
  const { t, lang, setLang, isRTL } = useI18n();

  const initials = user
    ? `${user.name.split(" ")[0][0]}${user.name.split(" ").slice(-1)[0]?.[0] ?? ""}`
    : "?";

  const navItems = [
    { href: "/dashboard",   label: t.dashboard,      icon: LayoutDashboard },
    { href: "/patients",    label: t.patients,        icon: Users },
    { href: "/appointments",label: t.appointments,    icon: Calendar },
    { href: "/financial",   label: t.financial,       icon: DollarSign },
    { href: "/imaging",     label: t.medicalImaging,  icon: ImageIcon },
    { href: "/dental-chart",label: t.dentalChart,     icon: Activity },
    { href: "/reports",     label: t.reports,         icon: BarChart3 },
    { href: "/settings",    label: t.settings,        icon: Settings },
  ];

  return (
    <div className={cn("flex h-screen overflow-hidden bg-background", isRTL && "flex-row-reverse")}>
      {/* Sidebar */}
      <motion.aside
        animate={{ width: sidebarOpen ? 240 : 64 }}
        transition={{ duration: 0.2, ease: "easeInOut" }}
        className="flex-shrink-0 bg-sidebar border-r border-sidebar-border flex flex-col overflow-hidden z-20"
      >
        {/* Logo */}
        <div className="h-16 flex items-center px-4 border-b border-sidebar-border flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-sidebar-primary flex items-center justify-center flex-shrink-0">
              <Stethoscope className="w-4 h-4 text-white" />
            </div>
            <AnimatePresence>
              {sidebarOpen && (
                <motion.div
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -10 }}
                  transition={{ duration: 0.15 }}
                  className="overflow-hidden"
                >
                  <p className="text-sm font-bold text-sidebar-foreground tracking-tight">AMS</p>
                  <p className="text-xs text-sidebar-foreground/50 -mt-0.5">Stomatology System</p>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* Nav items */}
        <nav className="flex-1 py-3 px-2 space-y-0.5 overflow-y-auto scrollbar-hide">
          {navItems.map(({ href, label, icon: Icon }) => {
            const active = location === href || (href !== "/" && location.startsWith(href));
            return (
              <Link key={href} href={href}>
                <motion.div
                  whileHover={{ x: isRTL ? -2 : 2 }}
                  whileTap={{ scale: 0.98 }}
                  className={cn(
                    "flex items-center gap-3 px-3 py-2.5 rounded-lg cursor-pointer transition-colors group",
                    active
                      ? "bg-sidebar-primary text-sidebar-primary-foreground"
                      : "text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                  )}
                  data-testid={`nav-${label.toLowerCase().replace(/\s+/g, "-")}`}
                >
                  <Icon className="w-4 h-4 flex-shrink-0" />
                  <AnimatePresence>
                    {sidebarOpen && (
                      <motion.span
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="text-sm font-medium truncate flex-1"
                      >
                        {label}
                      </motion.span>
                    )}
                  </AnimatePresence>
                  {active && sidebarOpen && (
                    <motion.div layoutId="active-indicator" className={cn(isRTL ? "mr-auto" : "ml-auto")}>
                      <ChevronRight className={cn("w-3 h-3 opacity-60", isRTL && "rotate-180")} />
                    </motion.div>
                  )}
                </motion.div>
              </Link>
            );
          })}
        </nav>

        {/* User footer */}
        <div className="p-3 border-t border-sidebar-border flex-shrink-0">
          <div className={cn("flex items-center gap-3", !sidebarOpen && "justify-center")}>
            <Avatar className="w-8 h-8 flex-shrink-0 ring-2 ring-sidebar-primary/30">
              {profilePhoto && <AvatarImage src={profilePhoto} alt={user?.name ?? ""} className="object-cover" />}
              <AvatarFallback className="bg-sidebar-primary text-sidebar-primary-foreground text-xs font-semibold">
                {initials}
              </AvatarFallback>
            </Avatar>
            <AnimatePresence>
              {sidebarOpen && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex-1 min-w-0">
                  <p className="text-xs font-semibold text-sidebar-foreground truncate">{user?.name}</p>
                  <p className="text-xs text-sidebar-foreground/50 truncate">{user?.role}</p>
                </motion.div>
              )}
            </AnimatePresence>
            {sidebarOpen && (
              <button
                onClick={logout}
                className="p-1.5 rounded-md text-sidebar-foreground/40 hover:text-sidebar-foreground hover:bg-sidebar-accent transition-colors"
                data-testid="button-logout"
                title={t.logout}
              >
                <LogOut className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>
      </motion.aside>

      {/* Main content */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Top bar */}
        <header className={cn(
          "h-16 border-b border-border bg-background/80 backdrop-blur-sm flex items-center px-4 gap-3 flex-shrink-0 z-10",
          isRTL && "flex-row-reverse"
        )}>
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="p-2 rounded-lg hover:bg-muted transition-colors text-muted-foreground hover:text-foreground"
            data-testid="button-toggle-sidebar"
          >
            {sidebarOpen ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
          </button>

          <div className="flex-1" />

          {/* Language toggle */}
          <button
            onClick={() => setLang(lang === "en" ? "ar" : "en")}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg hover:bg-muted transition-colors text-muted-foreground hover:text-foreground text-sm font-medium"
            title="Switch language / تغيير اللغة"
          >
            <Globe className="w-3.5 h-3.5" />
            <span className="text-xs font-semibold">{lang === "en" ? "عربي" : "EN"}</span>
          </button>

          <Button
            variant="ghost"
            size="icon"
            onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
            data-testid="button-theme-toggle"
            className="text-muted-foreground hover:text-foreground"
          >
            {theme === "dark" ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
          </Button>

          <button className="relative p-2 rounded-lg hover:bg-muted transition-colors text-muted-foreground">
            <Bell className="w-4 h-4" />
            <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 bg-destructive rounded-full" />
          </button>

          {/* Avatar with photo */}
          <div className={cn("flex items-center gap-2 pl-2 border-l border-border", isRTL && "pr-2 pl-0 border-l-0 border-r")}>
            <Avatar className="w-8 h-8 ring-2 ring-primary/25">
              {profilePhoto && <AvatarImage src={profilePhoto} alt={user?.name ?? ""} className="object-cover" />}
              <AvatarFallback className="bg-primary text-primary-foreground text-xs font-semibold">
                {initials}
              </AvatarFallback>
            </Avatar>
            <div className="hidden sm:block">
              <p className="text-xs font-semibold leading-tight">{user?.name}</p>
              <Badge variant="secondary" className="text-xs px-1 py-0 h-4 font-normal">{user?.role}</Badge>
            </div>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-y-auto">
          <motion.div
            key={location}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.2 }}
            className="h-full"
          >
            {children}
          </motion.div>
        </main>
      </div>
    </div>
  );
}
