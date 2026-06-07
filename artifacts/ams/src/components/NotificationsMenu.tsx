import { useEffect, useMemo, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Bell, Calendar, DollarSign, AlertTriangle, Clock, CheckCheck, X } from "lucide-react";
import { useGetTodayAppointments, getGetTodayAppointmentsQueryKey } from "@workspace/api-client-react";
import { useI18n } from "@/lib/i18n";
import { cn } from "@/lib/utils";

interface NotifItem {
  id: string;
  icon: typeof Bell;
  title: string;
  desc: string;
  time: string;
  color: string;
}

// Appointment statuses that still warrant a reminder.
const ACTIVE_STATUSES = new Set(["scheduled", "confirmed", "in_progress", "emergency"]);
// Remind this many minutes before the appointment starts.
const REMINDER_WINDOW_MIN = 60;

export default function NotificationsMenu() {
  const { t, isRTL } = useI18n();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const [now, setNow] = useState(() => Date.now());

  const { data: todays } = useGetTodayAppointments({
    query: { queryKey: getGetTodayAppointmentsQueryKey(), refetchInterval: 60_000 },
  });

  // Re-evaluate "in X min" every minute.
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 60_000);
    return () => clearInterval(id);
  }, []);

  // Smart reminders: any active appointment starting within the next hour.
  const reminders: NotifItem[] = useMemo(() => {
    if (!todays) return [];
    const out: { item: NotifItem; diff: number }[] = [];
    for (const a of todays) {
      if (!ACTIVE_STATUSES.has(a.status)) continue;
      const start = new Date(`${a.date}T${a.time}:00`).getTime();
      if (Number.isNaN(start)) continue;
      const diffMin = Math.round((start - now) / 60_000);
      if (diffMin < 0 || diffMin > REMINDER_WINDOW_MIN) continue;
      const startingSoon = diffMin <= 15;
      out.push({
        diff: diffMin,
        item: {
          id: `appt-${a.id}`,
          icon: Clock,
          title: startingSoon ? `${t.notifUpcoming} · ${t.notifStartingSoon}` : t.notifUpcoming,
          desc: `${a.patientName} · ${t.apptInLabel} ${diffMin} ${t.minutesShort}`,
          time: `${t.atTimeLabel} ${a.time}`,
          color: startingSoon ? "text-red-500 bg-red-500/10" : "text-amber-500 bg-amber-500/10",
        },
      });
    }
    return out.sort((x, y) => x.diff - y.diff).map((o) => o.item);
  }, [todays, now, t]);

  const baseItems: NotifItem[] = useMemo(() => ([
    { id: "emergency", icon: AlertTriangle, title: t.notifEmergency, desc: t.notifEmergencyDesc, time: "5 " + t.minutesAgo, color: "text-red-500 bg-red-500/10" },
    { id: "newappt", icon: Calendar, title: t.notifNewAppt, desc: t.notifNewApptDesc, time: "20 " + t.minutesAgo, color: "text-sky-500 bg-sky-500/10" },
    { id: "payment", icon: DollarSign, title: t.notifPayment, desc: t.notifPaymentDesc, time: "1 " + t.hoursAgo, color: "text-green-500 bg-green-500/10" },
  ]), [t]);

  const items = useMemo(() => [...reminders, ...baseItems], [reminders, baseItems]);

  const [readIds, setReadIds] = useState<Set<string>>(new Set());
  const unreadCount = items.filter((i) => !readIds.has(i.id)).length;

  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  const markAll = () => setReadIds(new Set(items.map((i) => i.id)));

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen((o) => !o)}
        className="relative p-2 rounded-lg hover:bg-muted transition-colors text-muted-foreground hover:text-foreground"
        data-testid="button-notifications"
        aria-label={t.notificationsTitle}
      >
        <Bell className="w-4 h-4" />
        {unreadCount > 0 && (
          <span className={cn(
            "absolute top-0.5 min-w-[16px] h-4 px-1 rounded-full bg-destructive text-destructive-foreground text-[10px] font-bold flex items-center justify-center",
            isRTL ? "left-0.5" : "right-0.5"
          )}>
            {unreadCount}
          </span>
        )}
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -8, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -8, scale: 0.97 }}
            transition={{ duration: 0.15 }}
            className={cn(
              "absolute mt-2 w-80 max-w-[calc(100vw-2rem)] bg-popover border border-popover-border rounded-xl shadow-xl z-50 overflow-hidden",
              isRTL ? "left-0" : "right-0"
            )}
          >
            <div className="flex items-center justify-between px-4 py-3 border-b border-border">
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-semibold">{t.notificationsTitle}</h3>
                {unreadCount > 0 && (
                  <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-primary/15 text-primary">
                    {unreadCount}
                  </span>
                )}
              </div>
              <button
                onClick={() => setOpen(false)}
                className="p-1 rounded-md hover:bg-muted text-muted-foreground"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="max-h-[320px] overflow-y-auto scrollbar-hide">
              {items.length === 0 ? (
                <div className="py-10 text-center text-sm text-muted-foreground">{t.noNotifications}</div>
              ) : (
                items.map((item) => {
                  const Icon = item.icon;
                  const read = readIds.has(item.id);
                  return (
                    <button
                      key={item.id}
                      onClick={() => setReadIds((s) => new Set(s).add(item.id))}
                      className={cn(
                        "w-full flex items-start gap-3 px-4 py-3 text-start hover:bg-muted/60 transition-colors border-b border-border/50 last:border-0",
                        !read && "bg-primary/[0.03]"
                      )}
                    >
                      <div className={cn("w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0", item.color)}>
                        <Icon className="w-4 h-4" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-semibold text-foreground">{item.title}</p>
                        <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{item.desc}</p>
                        <p className="text-[10px] text-muted-foreground/70 mt-1">{item.time}</p>
                      </div>
                      {!read && <span className="w-2 h-2 rounded-full bg-primary flex-shrink-0 mt-1.5" />}
                    </button>
                  );
                })
              )}
            </div>

            <div className="flex items-center justify-between px-4 py-2.5 border-t border-border bg-muted/30">
              <button
                onClick={markAll}
                className="flex items-center gap-1.5 text-xs font-medium text-primary hover:underline"
              >
                <CheckCheck className="w-3.5 h-3.5" />
                {t.markAllRead}
              </button>
              <button className="text-xs text-muted-foreground hover:text-foreground">{t.viewAll}</button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
