import { motion } from "framer-motion";
import { BarChart3, Download, TrendingUp, Users, DollarSign, Calendar } from "lucide-react";
import {
  useGetRevenueChart, getGetRevenueChartQueryKey,
  useGetDashboardStats, getGetDashboardStatsQueryKey,
  useListPatients, getListPatientsQueryKey,
  useListPayments, getListPaymentsQueryKey,
} from "@workspace/api-client-react";
import {
  BarChart, Bar, AreaChart, Area, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend
} from "recharts";
import { Skeleton } from "@/components/ui/skeleton";

const COLORS = ["hsl(199,89%,50%)", "hsl(217,91%,60%)", "hsl(142,71%,45%)", "hsl(38,92%,50%)", "hsl(280,65%,60%)", "hsl(0,72%,55%)"];

const TREATMENT_TYPES = [
  { name: "Checkup", value: 28 },
  { name: "Cleaning", value: 22 },
  { name: "Filling", value: 18 },
  { name: "Root Canal", value: 12 },
  { name: "Crown", value: 8 },
  { name: "Implant", value: 5 },
  { name: "Other", value: 7 },
];

const GENDER_DATA = [
  { name: "Male", value: 45 },
  { name: "Female", value: 55 },
];

export default function ReportsPage() {
  const { data: revenueData, isLoading: chartLoading } = useGetRevenueChart({ query: { queryKey: getGetRevenueChartQueryKey() } });
  const { data: stats } = useGetDashboardStats({ query: { queryKey: getGetDashboardStatsQueryKey() } });
  const { data: patients } = useListPatients(undefined, { query: { queryKey: getListPatientsQueryKey() } });
  const { data: payments } = useListPayments(undefined, { query: { queryKey: getListPaymentsQueryKey() } });

  const totalRevenue = payments?.filter(p => p.status === "paid").reduce((s, p) => s + Number(p.paidAmount), 0) ?? 0;
  const outstandingBalance = payments?.filter(p => ["pending", "partial", "overdue"].includes(p.status))
    .reduce((s, p) => s + (Number(p.amount) - Number(p.paidAmount)), 0) ?? 0;

  const fmt = (n: number) => new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(n);

  return (
    <div className="p-6 space-y-6 max-w-[1400px]">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="ams-page-title">Reports & Analytics</h1>
          <p className="text-muted-foreground text-sm mt-0.5">Practice performance overview</p>
        </div>
      </div>

      {/* KPI row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { icon: Users, label: "Total Patients", value: stats?.totalPatients ?? patients?.length ?? 0, color: "bg-blue-500/10 text-blue-500" },
          { icon: Calendar, label: "Total Appointments", value: "—", color: "bg-cyan-500/10 text-cyan-500" },
          { icon: DollarSign, label: "Total Revenue", value: fmt(totalRevenue), color: "bg-green-500/10 text-green-500" },
          { icon: TrendingUp, label: "Outstanding", value: fmt(outstandingBalance), color: "bg-amber-500/10 text-amber-500" },
        ].map(({ icon: Icon, label, value, color }, i) => (
          <motion.div
            key={label}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.07 }}
            className="ams-stat-card"
          >
            <div className={`w-9 h-9 rounded-lg flex items-center justify-center mb-3 ${color}`}>
              <Icon className="w-4 h-4" />
            </div>
            <p className="text-2xl font-bold">{value}</p>
            <p className="text-xs text-muted-foreground mt-0.5">{label}</p>
          </motion.div>
        ))}
      </div>

      {/* Charts row 1 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Revenue bar chart */}
        <div className="bg-card border border-card-border rounded-xl p-5 shadow-sm">
          <h2 className="font-semibold mb-4">Monthly Revenue & Expenses</h2>
          {chartLoading ? <Skeleton className="h-52" /> : (
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={revenueData ?? []} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="month" tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }} tickLine={false} axisLine={false} />
                <YAxis tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }} tickLine={false} axisLine={false} tickFormatter={(v) => `$${v}`} />
                <Tooltip
                  contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: "8px", fontSize: 12 }}
                  formatter={(v: number) => [`$${v.toFixed(0)}`, ""]}
                />
                <Legend wrapperStyle={{ fontSize: 11 }} />
                <Bar dataKey="revenue" name="Revenue" fill="hsl(199,89%,50%)" radius={[4, 4, 0, 0]} />
                <Bar dataKey="expenses" name="Expenses" fill="hsl(var(--destructive))" radius={[4, 4, 0, 0]} opacity={0.7} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Treatment types pie */}
        <div className="bg-card border border-card-border rounded-xl p-5 shadow-sm">
          <h2 className="font-semibold mb-4">Treatment Types Distribution</h2>
          <div className="flex items-center gap-4">
            <ResponsiveContainer width={180} height={180}>
              <PieChart>
                <Pie data={TREATMENT_TYPES} cx="50%" cy="50%" innerRadius={50} outerRadius={80} paddingAngle={2} dataKey="value">
                  {TREATMENT_TYPES.map((_, index) => (
                    <Cell key={index} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: "8px", fontSize: 12 }}
                />
              </PieChart>
            </ResponsiveContainer>
            <div className="flex-1 space-y-1.5">
              {TREATMENT_TYPES.map((t, i) => (
                <div key={t.name} className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-1.5">
                    <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: COLORS[i % COLORS.length] }} />
                    <span className="text-muted-foreground">{t.name}</span>
                  </div>
                  <span className="font-medium">{t.value}%</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Charts row 2 */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Revenue trend */}
        <div className="lg:col-span-2 bg-card border border-card-border rounded-xl p-5 shadow-sm">
          <h2 className="font-semibold mb-4">Revenue Trend (12 months)</h2>
          {chartLoading ? <Skeleton className="h-44" /> : (
            <ResponsiveContainer width="100%" height={180}>
              <AreaChart data={revenueData ?? []} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="trendGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="hsl(142,71%,45%)" stopOpacity={0.25} />
                    <stop offset="95%" stopColor="hsl(142,71%,45%)" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="month" tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }} tickLine={false} axisLine={false} />
                <YAxis tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }} tickLine={false} axisLine={false} tickFormatter={(v) => `$${v}`} />
                <Tooltip
                  contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: "8px", fontSize: 12 }}
                  formatter={(v: number) => [`$${v.toFixed(0)}`, ""]}
                />
                <Area type="monotone" dataKey="revenue" stroke="hsl(142,71%,45%)" strokeWidth={2} fill="url(#trendGrad)" />
              </AreaChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Patient demographics */}
        <div className="bg-card border border-card-border rounded-xl p-5 shadow-sm">
          <h2 className="font-semibold mb-4">Patient Demographics</h2>
          <ResponsiveContainer width="100%" height={180}>
            <PieChart>
              <Pie data={GENDER_DATA} cx="50%" cy="50%" innerRadius={40} outerRadius={70} paddingAngle={4} dataKey="value">
                {GENDER_DATA.map((_, i) => (
                  <Cell key={i} fill={i === 0 ? "hsl(199,89%,50%)" : "hsl(280,65%,60%)"} />
                ))}
              </Pie>
              <Tooltip
                contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: "8px", fontSize: 12 }}
              />
              <Legend wrapperStyle={{ fontSize: 11 }} />
            </PieChart>
          </ResponsiveContainer>

          <div className="mt-4 space-y-2">
            {[
              { label: "Active Patients", value: patients?.filter(p => p.status === "active").length ?? 0 },
              { label: "Emergency Cases", value: patients?.filter(p => p.status === "emergency").length ?? 0 },
              { label: "Inactive", value: patients?.filter(p => p.status === "inactive").length ?? 0 },
            ].map(({ label, value }) => (
              <div key={label} className="flex justify-between text-xs">
                <span className="text-muted-foreground">{label}</span>
                <span className="font-semibold">{value}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
