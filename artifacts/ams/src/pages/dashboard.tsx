import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import {
  Users, Calendar, DollarSign, AlertTriangle, Activity, TrendingUp,
  ArrowUpRight, ArrowDownRight, Plus, Clock, CheckCircle2
} from "lucide-react";
import {
  useGetDashboardStats, getGetDashboardStatsQueryKey,
  useGetRevenueChart, getGetRevenueChartQueryKey,
  useGetRecentActivity, getGetRecentActivityQueryKey,
  useGetTodayAppointments, getGetTodayAppointmentsQueryKey,
} from "@workspace/api-client-react";
import { useLocation } from "wouter";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { useI18n } from "@/lib/i18n";
import { format, parseISO } from "date-fns";

const statusColors: Record<string, string> = {
  scheduled: "bg-blue-500/10 text-blue-500",
  confirmed: "bg-green-500/10 text-green-500",
  in_progress: "bg-amber-500/10 text-amber-500",
  completed: "bg-muted text-muted-foreground",
  cancelled: "bg-red-500/10 text-red-500",
  emergency: "bg-red-500/10 text-red-500",
};

const appointmentTypeColors: Record<string, string> = {
  checkup: "border-l-blue-400",
  cleaning: "border-l-cyan-400",
  filling: "border-l-amber-400",
  extraction: "border-l-red-400",
  rootCanal: "border-l-orange-400",
  crown: "border-l-purple-400",
  implant: "border-l-teal-400",
  emergency: "border-l-red-500",
  consultation: "border-l-indigo-400",
  orthodontics: "border-l-pink-400",
};

function CountUp({ value }: { value: number }) {
  const [display, setDisplay] = useState(0);
  useEffect(() => {
    let raf = 0;
    const start = performance.now();
    const dur = 900;
    const tick = (nowT: number) => {
      const p = Math.min((nowT - start) / dur, 1);
      const eased = 1 - Math.pow(1 - p, 3);
      setDisplay(Math.round(value * eased));
      if (p < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [value]);
  return <>{display.toLocaleString()}</>;
}

function StatCard({ icon: Icon, label, value, trend, trendLabel, color, loading }: {
  icon: any; label: string; value: string | number; trend?: "up" | "down" | "neutral";
  trendLabel?: string; color: string; loading?: boolean;
}) {
  if (loading) return <div className="ams-stat-card"><Skeleton className="h-20 w-full" /></div>;
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className="ams-stat-card"
    >
      <div className="flex items-start justify-between mb-3">
        <div className={cn("p-2 rounded-lg", color)}>
          <Icon className="w-4 h-4" />
        </div>
        {trend && trendLabel && (
          <span className={cn("flex items-center gap-1 text-xs font-medium",
            trend === "up" ? "text-green-500" : trend === "down" ? "text-red-500" : "text-muted-foreground"
          )}>
            {trend === "up" ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
            {trendLabel}
          </span>
        )}
      </div>
      <p className="text-2xl font-bold text-foreground">{typeof value === "number" ? <CountUp value={value} /> : value}</p>
      <p className="text-xs text-muted-foreground mt-0.5">{label}</p>
    </motion.div>
  );
}

export default function DashboardPage() {
  const [, setLocation] = useLocation();
  const { t, tr } = useI18n();
  const { data: stats, isLoading: statsLoading } = useGetDashboardStats({ query: { queryKey: getGetDashboardStatsQueryKey() } });
  const { data: revenueChart, isLoading: chartLoading } = useGetRevenueChart({ query: { queryKey: getGetRevenueChartQueryKey() } });
  const { data: activity } = useGetRecentActivity({ query: { queryKey: getGetRecentActivityQueryKey() } });
  const { data: todayAppts } = useGetTodayAppointments({ query: { queryKey: getGetTodayAppointmentsQueryKey() } });

  const formatCurrency = (n: number) =>
    new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(n);

  return (
    <div className="p-6 space-y-6 max-w-[1600px]">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="ams-page-title">{t.dashboard}</h1>
          <p className="text-muted-foreground text-sm mt-0.5">
            {format(new Date(), "EEEE, MMMM d, yyyy")}
          </p>
        </div>
        <div className="flex gap-2">
          <Button size="sm" variant="outline" onClick={() => setLocation("/patients")}>
            <Plus className="w-3.5 h-3.5 mr-1.5" /> {t.newPatient}
          </Button>
          <Button size="sm" onClick={() => setLocation("/appointments")}>
            <Calendar className="w-3.5 h-3.5 mr-1.5" /> {t.newAppointment}
          </Button>
        </div>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard
          icon={Users} label={t.totalPatients} value={stats?.totalPatients ?? 0}
          color="bg-blue-500/10 text-blue-500" trend="up" trendLabel="+12%" loading={statsLoading}
        />
        <StatCard
          icon={Calendar} label={t.todayAppointments} value={stats?.todayAppointments ?? 0}
          color="bg-cyan-500/10 text-cyan-500" loading={statsLoading}
        />
        <StatCard
          icon={DollarSign} label={t.monthlyRevenue} value={formatCurrency(stats?.monthlyRevenue ?? 0)}
          color="bg-green-500/10 text-green-500" trend="up" trendLabel="+8%" loading={statsLoading}
        />
        <StatCard
          icon={AlertTriangle} label={t.pendingPayments} value={formatCurrency(stats?.pendingPayments ?? 0)}
          color="bg-amber-500/10 text-amber-500" trend="down" trendLabel={String(stats?.pendingPayments ?? 0 > 0 ? t.actionNeeded : t.allClear)} loading={statsLoading}
        />
        <StatCard
          icon={Activity} label={t.activeEmergencies} value={stats?.activeEmergencies ?? 0}
          color="bg-red-500/10 text-red-500" loading={statsLoading}
        />
        <StatCard
          icon={TrendingUp} label={t.treatmentsThisMonth} value={stats?.treatmentsThisMonth ?? 0}
          color="bg-purple-500/10 text-purple-500" loading={statsLoading}
        />
        <StatCard
          icon={Users} label={t.newPatientsThisMonth} value={stats?.newPatientsThisMonth ?? 0}
          color="bg-indigo-500/10 text-indigo-500" loading={statsLoading}
        />
        <StatCard
          icon={CheckCircle2} label={t.completedTreatments} value={stats?.completedTreatments ?? 0}
          color="bg-teal-500/10 text-teal-500" loading={statsLoading}
        />
      </div>

      {/* Charts + Today */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Revenue chart */}
        <div className="lg:col-span-2 bg-card border border-card-border rounded-xl p-5 shadow-sm">
          <div className="flex items-center justify-between mb-5">
            <div>
              <h2 className="font-semibold text-foreground">{t.revenueOverview}</h2>
              <p className="text-xs text-muted-foreground mt-0.5">{t.last12Months}</p>
            </div>
          </div>
          {chartLoading ? (
            <Skeleton className="h-48 w-full" />
          ) : (
            <ResponsiveContainer width="100%" height={200}>
              <AreaChart data={revenueChart ?? []} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="revenueGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="hsl(199,89%,50%)" stopOpacity={0.25} />
                    <stop offset="95%" stopColor="hsl(199,89%,50%)" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="month" tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }} tickLine={false} axisLine={false} />
                <YAxis tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }} tickLine={false} axisLine={false} tickFormatter={(v) => `$${v}`} />
                <Tooltip
                  contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: "8px", fontSize: 12 }}
                  formatter={(v: number) => [`$${v.toFixed(0)}`, ""]}
                />
                <Area type="monotone" dataKey="revenue" stroke="hsl(199,89%,50%)" strokeWidth={2} fill="url(#revenueGrad)" name={t.revenue} />
                <Area type="monotone" dataKey="expenses" stroke="hsl(var(--destructive))" strokeWidth={1.5} fill="none" strokeDasharray="4 2" name={t.expenses} />
              </AreaChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Today's appointments */}
        <div className="bg-card border border-card-border rounded-xl p-5 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-foreground">{t.todaySchedule}</h2>
            <Badge variant="secondary">{todayAppts?.length ?? 0} {t.appts}</Badge>
          </div>
          <div className="space-y-2 overflow-y-auto max-h-52 scrollbar-hide">
            {!todayAppts?.length && (
              <div className="flex flex-col items-center justify-center h-32 text-muted-foreground">
                <Calendar className="w-8 h-8 mb-2 opacity-30" />
                <p className="text-xs">{t.noAppointmentsToday}</p>
              </div>
            )}
            {todayAppts?.map((appt) => (
              <motion.div
                key={appt.id}
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                onClick={() => setLocation(`/patients/${appt.patientId}`)}
                className={cn(
                  "flex items-start gap-3 p-3 rounded-lg border-l-2 bg-muted/30 cursor-pointer hover:bg-muted/60 transition-colors",
                  appointmentTypeColors[appt.type] ?? "border-l-muted-foreground"
                )}
                data-testid={`card-today-appt-${appt.id}`}
              >
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-semibold truncate">{appt.patientName}</p>
                  <p className="text-xs text-muted-foreground capitalize">{tr(appt.type)}</p>
                </div>
                <div className="text-right">
                  <p className="text-xs font-medium">{appt.time}</p>
                  <span className={cn("text-xs px-1.5 py-0.5 rounded-full font-medium", statusColors[appt.status] ?? "bg-muted text-muted-foreground")}>
                    {tr(appt.status)}
                  </span>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </div>

      {/* Recent activity */}
      <div className="bg-card border border-card-border rounded-xl p-5 shadow-sm">
        <h2 className="font-semibold text-foreground mb-4">{t.recentActivity}</h2>
        <div className="space-y-3">
          {!activity?.length && (
            <p className="text-sm text-muted-foreground text-center py-4">{t.noRecentActivity}</p>
          )}
          {activity?.slice(0, 6).map((item, i) => (
            <motion.div
              key={item.id}
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              className="flex items-center gap-3 py-2 border-b border-border last:border-0"
              data-testid={`item-activity-${item.id}`}
            >
              <div className={cn("w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0",
                item.type === "appointment" ? "bg-blue-500/10 text-blue-500" :
                item.type === "payment" ? "bg-green-500/10 text-green-500" :
                "bg-purple-500/10 text-purple-500"
              )}>
                {item.type === "appointment" ? <Calendar className="w-3.5 h-3.5" /> :
                 item.type === "payment" ? <DollarSign className="w-3.5 h-3.5" /> :
                 <Activity className="w-3.5 h-3.5" />}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{item.patientName}</p>
                <p className="text-xs text-muted-foreground">{item.description}</p>
              </div>
              <div className="flex items-center gap-1 text-xs text-muted-foreground flex-shrink-0">
                <Clock className="w-3 h-3" />
                {format(parseISO(item.time), "h:mm a")}
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
}
