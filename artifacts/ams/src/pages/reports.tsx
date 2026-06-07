import { useRef, useState } from "react";
import { motion } from "framer-motion";
import { Download, TrendingUp, Users, DollarSign, Calendar, Loader2 } from "lucide-react";
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
import { Button } from "@/components/ui/button";
import { useI18n } from "@/lib/i18n";
import { toast } from "sonner";

const COLORS = ["hsl(199,89%,50%)", "hsl(217,91%,60%)", "hsl(142,71%,45%)", "hsl(38,92%,50%)", "hsl(280,65%,60%)", "hsl(0,72%,55%)"];

const TREATMENT_TYPES = [
  { key: "checkup", value: 28 },
  { key: "cleaning", value: 22 },
  { key: "filling", value: 18 },
  { key: "rootCanal", value: 12 },
  { key: "crown", value: 8 },
  { key: "implant", value: 5 },
  { key: "other", value: 7 },
] as const;

/* Convert a live recharts <svg> into a PNG data URL (avoids html2canvas oklch issues) */
function svgToPng(svg: SVGSVGElement, scale = 2): Promise<string> {
  const rect = svg.getBoundingClientRect();
  const clone = svg.cloneNode(true) as SVGSVGElement;
  clone.setAttribute("width", String(rect.width));
  clone.setAttribute("height", String(rect.height));
  clone.setAttribute("xmlns", "http://www.w3.org/2000/svg");
  const xml = new XMLSerializer().serializeToString(clone);
  const src = "data:image/svg+xml;base64," + btoa(unescape(encodeURIComponent(xml)));
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement("canvas");
      canvas.width = Math.max(1, rect.width) * scale;
      canvas.height = Math.max(1, rect.height) * scale;
      const ctx = canvas.getContext("2d");
      if (!ctx) return reject(new Error("no ctx"));
      ctx.fillStyle = "#ffffff";
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.scale(scale, scale);
      ctx.drawImage(img, 0, 0, rect.width, rect.height);
      resolve(canvas.toDataURL("image/png"));
    };
    img.onerror = reject;
    img.src = src;
  });
}

export default function ReportsPage() {
  const { t, tr } = useI18n();
  const reportRef = useRef<HTMLDivElement>(null);
  const [exporting, setExporting] = useState(false);

  const { data: revenueData, isLoading: chartLoading } = useGetRevenueChart({ query: { queryKey: getGetRevenueChartQueryKey() } });
  const { data: stats } = useGetDashboardStats({ query: { queryKey: getGetDashboardStatsQueryKey() } });
  const { data: patients } = useListPatients(undefined, { query: { queryKey: getListPatientsQueryKey() } });
  const { data: payments } = useListPayments(undefined, { query: { queryKey: getListPaymentsQueryKey() } });

  const totalRevenue = payments?.filter(p => p.status === "paid").reduce((s, p) => s + Number(p.paidAmount), 0) ?? 0;
  const outstandingBalance = payments?.filter(p => ["pending", "partial", "overdue"].includes(p.status))
    .reduce((s, p) => s + (Number(p.amount) - Number(p.paidAmount)), 0) ?? 0;

  const fmt = (n: number) => new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(n);

  const treatmentData = TREATMENT_TYPES.map(d => ({ name: tr(d.key), value: d.value }));
  const genderData = [
    { name: t.male, value: 45 },
    { name: t.female, value: 55 },
  ];

  const kpis = [
    { icon: Users, label: t.totalPatients, value: String(stats?.totalPatients ?? patients?.length ?? 0), color: "bg-blue-500/10 text-blue-500" },
    { icon: Calendar, label: t.totalAppointmentsLabel, value: "—", color: "bg-cyan-500/10 text-cyan-500" },
    { icon: DollarSign, label: t.totalRevenue, value: fmt(totalRevenue), color: "bg-green-500/10 text-green-500" },
    { icon: TrendingUp, label: t.outstanding, value: fmt(outstandingBalance), color: "bg-amber-500/10 text-amber-500" },
  ];

  const handleExport = async () => {
    if (!reportRef.current) return;
    setExporting(true);
    try {
      const { jsPDF } = await import("jspdf");
      const pdf = new jsPDF("p", "mm", "a4");
      const pageW = pdf.internal.pageSize.getWidth();
      const pageH = pdf.internal.pageSize.getHeight();
      const margin = 12;
      let y = margin;

      pdf.setFontSize(18);
      pdf.setTextColor(15, 23, 42);
      pdf.text("AMS — " + t.reportsAnalytics, margin, y + 4);
      y += 10;
      pdf.setFontSize(10);
      pdf.setTextColor(120, 130, 145);
      pdf.text(new Date().toLocaleString(), margin, y);
      y += 8;

      pdf.setDrawColor(225, 230, 238);
      pdf.line(margin, y, pageW - margin, y);
      y += 8;

      pdf.setFontSize(11);
      kpis.forEach((k) => {
        pdf.setTextColor(110, 120, 135);
        pdf.text(k.label, margin, y);
        pdf.setTextColor(15, 23, 42);
        pdf.text(k.value, pageW - margin, y, { align: "right" });
        y += 7;
      });
      y += 4;

      const svgs = Array.from(reportRef.current.querySelectorAll<SVGSVGElement>("svg.recharts-surface"));
      for (const svg of svgs) {
        const png = await svgToPng(svg);
        const rect = svg.getBoundingClientRect();
        const imgW = pageW - margin * 2;
        const imgH = imgW * (rect.height / Math.max(1, rect.width));
        if (y + imgH > pageH - margin) {
          pdf.addPage();
          y = margin;
        }
        pdf.addImage(png, "PNG", margin, y, imgW, imgH);
        y += imgH + 8;
      }

      pdf.save("AMS-Report.pdf");
      toast.success(t.pdfExported);
    } catch {
      toast.error(t.pdfExportFailed);
    } finally {
      setExporting(false);
    }
  };

  return (
    <div ref={reportRef} className="p-6 space-y-6 max-w-[1400px]">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div>
          <h1 className="ams-page-title">{t.reportsAnalytics}</h1>
          <p className="text-muted-foreground text-sm mt-0.5">{t.practiceOverview}</p>
        </div>
        <Button onClick={handleExport} disabled={exporting} data-testid="button-export-pdf">
          {exporting ? (
            <span className="flex items-center gap-2"><Loader2 className="w-4 h-4 animate-spin" />{t.exporting}</span>
          ) : (
            <span className="flex items-center gap-2"><Download className="w-4 h-4" />{t.exportPdf}</span>
          )}
        </Button>
      </div>

      {/* KPI row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {kpis.map(({ icon: Icon, label, value, color }, i) => (
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
        <div className="bg-card border border-card-border rounded-xl p-5 shadow-sm">
          <h2 className="font-semibold mb-4">{t.monthlyRevenueExpenses}</h2>
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
                <Bar dataKey="revenue" name={t.revenue} fill="hsl(199,89%,50%)" radius={[4, 4, 0, 0]} />
                <Bar dataKey="expenses" name={t.expenses} fill="hsl(var(--destructive))" radius={[4, 4, 0, 0]} opacity={0.7} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>

        <div className="bg-card border border-card-border rounded-xl p-5 shadow-sm">
          <h2 className="font-semibold mb-4">{t.treatmentDistribution}</h2>
          <div className="flex items-center gap-4">
            <ResponsiveContainer width={180} height={180}>
              <PieChart>
                <Pie data={treatmentData} cx="50%" cy="50%" innerRadius={50} outerRadius={80} paddingAngle={2} dataKey="value">
                  {treatmentData.map((_, index) => (
                    <Cell key={index} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: "8px", fontSize: 12 }}
                />
              </PieChart>
            </ResponsiveContainer>
            <div className="flex-1 space-y-1.5">
              {treatmentData.map((d, i) => (
                <div key={d.name} className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-1.5">
                    <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: COLORS[i % COLORS.length] }} />
                    <span className="text-muted-foreground">{d.name}</span>
                  </div>
                  <span className="font-medium">{d.value}%</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Charts row 2 */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        <div className="lg:col-span-2 bg-card border border-card-border rounded-xl p-5 shadow-sm">
          <h2 className="font-semibold mb-4">{t.revenueTrend}</h2>
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

        <div className="bg-card border border-card-border rounded-xl p-5 shadow-sm">
          <h2 className="font-semibold mb-4">{t.patientDemographics}</h2>
          <ResponsiveContainer width="100%" height={180}>
            <PieChart>
              <Pie data={genderData} cx="50%" cy="50%" innerRadius={40} outerRadius={70} paddingAngle={4} dataKey="value">
                {genderData.map((_, i) => (
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
              { label: t.activePatients, value: patients?.filter(p => p.status === "active").length ?? 0 },
              { label: t.emergencyCases, value: patients?.filter(p => p.status === "emergency").length ?? 0 },
              { label: t.inactive, value: patients?.filter(p => p.status === "inactive").length ?? 0 },
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
