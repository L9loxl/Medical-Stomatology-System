import { useState } from "react";
import { motion } from "framer-motion";
import { Activity, Save, Boxes, Grid2X2 } from "lucide-react";
import {
  useGetDentalChart, getGetDentalChartQueryKey,
  useUpdateToothStatus,
  useListPatients, getListPatientsQueryKey,
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import DentalChart, { type ToothStatus } from "@/components/DentalChart";
import DentalChart3D from "@/components/DentalChart3D";
import { cn } from "@/lib/utils";
import { useI18n } from "@/lib/i18n";
import { toast } from "sonner";

const TOOTH_STATUSES: ToothStatus[] = [
  "healthy", "decayed", "filled", "crowned", "missing",
  "implant", "extracted", "root_canal", "bridge", "fractured",
];

const STATUS_BADGES: Record<string, string> = {
  healthy:    "bg-green-500/10 text-green-500 border-green-500/20",
  decayed:    "bg-red-500/10 text-red-500 border-red-500/20",
  filled:     "bg-amber-500/10 text-amber-500 border-amber-500/20",
  crowned:    "bg-purple-500/10 text-purple-500 border-purple-500/20",
  missing:    "bg-muted text-muted-foreground",
  implant:    "bg-sky-500/10 text-sky-500 border-sky-500/20",
  extracted:  "bg-muted text-muted-foreground",
  root_canal: "bg-orange-500/10 text-orange-500 border-orange-500/20",
  bridge:     "bg-cyan-500/10 text-cyan-500 border-cyan-500/20",
  fractured:  "bg-red-600/10 text-red-600 border-red-600/20",
};

export default function DentalChartPage() {
  const [selectedPatient, setSelectedPatient] = useState<string>("1");
  const [selectedTooth, setSelectedTooth] = useState<number | null>(null);
  const [editDialog, setEditDialog] = useState(false);
  const [editData, setEditData] = useState({ status: "healthy" as ToothStatus, notes: "", surface: "" });
  const [viewMode, setViewMode] = useState<"3d" | "2d">("3d");
  const queryClient = useQueryClient();
  const { t, tr } = useI18n();

  const patientId = parseInt(selectedPatient, 10);
  const { data: chartData, isLoading } = useGetDentalChart(patientId, {
    query: { queryKey: getGetDentalChartQueryKey(patientId), enabled: !!patientId },
  });
  const { data: patients } = useListPatients(undefined, { query: { queryKey: getListPatientsQueryKey() } });

  const updateMutation = useUpdateToothStatus({
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getGetDentalChartQueryKey(patientId) });
        toast.success(`${t.tooth} #${selectedTooth} ${t.updated}`);
        setEditDialog(false);
      },
      onError: () => toast.error(t.dentalChartUpdateFailed),
    },
  });

  const handleToothClick2D = (toothNumber: number, currentStatus: ToothStatus) => {
    setSelectedTooth(toothNumber);
    setEditData({ status: currentStatus, notes: "", surface: "" });
    setEditDialog(true);
  };

  const handleToothClick3D = (toothNumber: number) => {
    const existing = chartData?.find(e => e.toothNumber === toothNumber);
    setSelectedTooth(toothNumber);
    setEditData({ status: (existing?.status as ToothStatus) ?? "healthy", notes: existing?.notes ?? "", surface: existing?.surface ?? "" });
    setEditDialog(true);
  };

  const handleSave = () => {
    if (!selectedTooth) return;
    updateMutation.mutate({
      patientId,
      toothNumber: selectedTooth,
      data: {
        status: editData.status as any,
        notes: editData.notes || undefined,
        surface: editData.surface || undefined,
      },
    });
  };

  const mapped = (chartData ?? []).map((e) => ({ toothNumber: e.toothNumber, status: e.status }));
  const stats = {
    issues:  (chartData ?? []).filter((t) => ["decayed", "fractured"].includes(t.status)).length,
    treated: (chartData ?? []).filter((t) => ["filled", "crowned", "root_canal"].includes(t.status)).length,
    missing: (chartData ?? []).filter((t) => ["missing", "extracted"].includes(t.status)).length,
  };
  const healthyCount = 32 - Object.values(stats).reduce((a, b) => a + b, 0);

  return (
    <div className="p-6 space-y-5 max-w-[1400px]">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="ams-page-title flex items-center gap-2">
            <Activity className="w-6 h-6 text-primary" /> {t.dentalChart}
          </h1>
          <p className="text-muted-foreground text-sm mt-0.5">
            {viewMode === "3d" ? t.dragToRotate : t.clickToothToEdit}
          </p>
        </div>

        <div className="flex items-center gap-3">
          {/* View toggle */}
          <div className="flex rounded-lg border border-border overflow-hidden">
            <button
              onClick={() => setViewMode("3d")}
              className={cn(
                "flex items-center gap-1.5 px-3 py-2 text-sm font-medium transition-colors",
                viewMode === "3d" ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground hover:bg-muted"
              )}
            >
              <Boxes className="w-3.5 h-3.5" /> 3D
            </button>
            <button
              onClick={() => setViewMode("2d")}
              className={cn(
                "flex items-center gap-1.5 px-3 py-2 text-sm font-medium transition-colors border-l border-border",
                viewMode === "2d" ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground hover:bg-muted"
              )}
            >
              <Grid2X2 className="w-3.5 h-3.5" /> 2D
            </button>
          </div>

          <Select value={selectedPatient} onValueChange={setSelectedPatient}>
            <SelectTrigger className="w-52" data-testid="select-chart-patient">
              <SelectValue placeholder={t.selectPatient} />
            </SelectTrigger>
            <SelectContent>
              {patients?.map((p) => (
                <SelectItem key={p.id} value={String(p.id)}>{p.firstName} {p.lastName}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Summary stats */}
      <div className="grid grid-cols-4 gap-3">
        {[
          { label: t.healthy,           value: healthyCount,   color: "text-green-500" },
          { label: t.issues,            value: stats.issues,   color: "text-red-500" },
          { label: t.treated,           value: stats.treated,  color: "text-amber-500" },
          { label: t.missingExtracted,  value: stats.missing,  color: "text-muted-foreground" },
        ].map(({ label, value, color }) => (
          <div key={label} className="ams-stat-card text-center">
            <p className={cn("text-2xl font-bold mb-1", color)}>{value}</p>
            <p className="text-xs text-muted-foreground">{label}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Main chart area */}
        <div className="lg:col-span-2 bg-card border border-card-border rounded-xl overflow-hidden shadow-sm">
          {isLoading ? (
            <Skeleton className="h-[480px] w-full" />
          ) : viewMode === "3d" ? (
            <DentalChart3D
              chartData={mapped}
              selectedTooth={selectedTooth}
              onToothClick={handleToothClick3D}
              height={480}
            />
          ) : (
            <div className="p-6">
              <h2 className="text-sm font-semibold mb-5 text-muted-foreground uppercase tracking-wide">
                {t.fdiNotation}
              </h2>
              <div className="overflow-x-auto">
                <div className="min-w-[500px]">
                  <DentalChart
                    chartData={mapped}
                    onToothClick={handleToothClick2D}
                    interactive={true}
                  />
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Conditions list */}
        <div className="bg-card border border-card-border rounded-xl p-5 shadow-sm">
          <h2 className="text-sm font-semibold mb-4 text-muted-foreground uppercase tracking-wide">{t.conditions}</h2>
          <div className="space-y-2 max-h-[420px] overflow-y-auto scrollbar-hide">
            {(chartData ?? []).length === 0 && (
              <p className="text-sm text-muted-foreground text-center py-6">{t.noConditionsRecorded}</p>
            )}
            {(chartData ?? []).map((entry) => (
              <motion.div
                key={entry.id}
                initial={{ opacity: 0, x: 8 }}
                animate={{ opacity: 1, x: 0 }}
                className={cn(
                  "flex items-start gap-3 p-3 rounded-lg bg-muted/30 hover:bg-muted/60 transition-colors cursor-pointer",
                  selectedTooth === entry.toothNumber && "ring-1 ring-primary bg-primary/5"
                )}
                onClick={() => {
                  setSelectedTooth(entry.toothNumber);
                  setEditData({ status: entry.status as ToothStatus, notes: entry.notes ?? "", surface: entry.surface ?? "" });
                  setEditDialog(true);
                }}
                data-testid={`entry-tooth-${entry.toothNumber}`}
              >
                <div className="w-8 h-8 rounded-lg bg-muted flex items-center justify-center flex-shrink-0">
                  <span className="text-xs font-bold text-foreground">#{entry.toothNumber}</span>
                </div>
                <div className="flex-1 min-w-0">
                  <Badge variant="outline" className={cn("text-xs capitalize", STATUS_BADGES[entry.status] ?? "")}>
                    {tr(entry.status)}
                  </Badge>
                  {entry.surface && (
                    <p className="text-xs text-muted-foreground mt-0.5">{t.surface}: {entry.surface}</p>
                  )}
                  {entry.notes && (
                    <p className="text-xs text-muted-foreground mt-1 truncate">{entry.notes}</p>
                  )}
                </div>
              </motion.div>
            ))}
          </div>

          {/* Status legend */}
          <div className="mt-5 pt-4 border-t border-border">
            <p className="text-xs font-medium text-muted-foreground mb-2 uppercase tracking-wide">{t.legend}</p>
            <div className="grid grid-cols-2 gap-1">
              {["healthy", "decayed", "filled", "crowned", "missing", "implant"].map(s => (
                <div key={s} className="flex items-center gap-1.5">
                  <Badge variant="outline" className={cn("text-xs capitalize py-0 h-4", STATUS_BADGES[s] ?? "")}>
                    {tr(s)}
                  </Badge>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Edit tooth dialog */}
      <Dialog open={editDialog} onOpenChange={setEditDialog}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>{t.tooth} #{selectedTooth}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 mt-2">
            <div className="space-y-1.5">
              <Label>{t.status}</Label>
              <Select value={editData.status} onValueChange={(v) => setEditData(d => ({ ...d, status: v as ToothStatus }))}>
                <SelectTrigger data-testid="select-tooth-status">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {TOOTH_STATUSES.map((s) => (
                    <SelectItem key={s} value={s} className="capitalize">{tr(s)}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>{t.surfaceOptional}</Label>
              <Input
                value={editData.surface}
                onChange={(e) => setEditData(d => ({ ...d, surface: e.target.value }))}
                placeholder={t.surfacePlaceholder}
                data-testid="input-surface"
              />
            </div>
            <div className="space-y-1.5">
              <Label>{t.notes}</Label>
              <Textarea
                value={editData.notes}
                onChange={(e) => setEditData(d => ({ ...d, notes: e.target.value }))}
                rows={2}
                data-testid="input-tooth-notes"
              />
            </div>
            <div className="flex gap-2">
              <Button variant="outline" className="flex-1" onClick={() => setEditDialog(false)}>{t.cancel}</Button>
              <Button
                className="flex-1"
                disabled={updateMutation.isPending}
                onClick={handleSave}
                data-testid="button-save-tooth"
              >
                <Save className="w-3.5 h-3.5 mr-1.5" />
                {updateMutation.isPending ? t.saving : t.save}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
