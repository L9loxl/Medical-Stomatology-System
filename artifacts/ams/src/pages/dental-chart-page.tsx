import { useState } from "react";
import { motion } from "framer-motion";
import { Activity, Save, Plus, Trash2 } from "lucide-react";
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
import { cn } from "@/lib/utils";
import { toast } from "sonner";

const TOOTH_STATUSES: ToothStatus[] = [
  "healthy", "decayed", "filled", "crowned", "missing",
  "implant", "extracted", "root_canal", "bridge", "fractured",
];

const STATUS_BADGES: Record<string, string> = {
  healthy: "bg-green-500/10 text-green-500 border-green-500/20",
  decayed: "bg-red-500/10 text-red-500 border-red-500/20",
  filled: "bg-amber-500/10 text-amber-500 border-amber-500/20",
  crowned: "bg-purple-500/10 text-purple-500 border-purple-500/20",
  missing: "bg-muted text-muted-foreground",
  implant: "bg-sky-500/10 text-sky-500 border-sky-500/20",
  extracted: "bg-muted text-muted-foreground",
  root_canal: "bg-orange-500/10 text-orange-500 border-orange-500/20",
  bridge: "bg-cyan-500/10 text-cyan-500 border-cyan-500/20",
  fractured: "bg-red-600/10 text-red-600 border-red-600/20",
};

export default function DentalChartPage() {
  const [selectedPatient, setSelectedPatient] = useState<string>("1");
  const [selectedTooth, setSelectedTooth] = useState<number | null>(null);
  const [editDialog, setEditDialog] = useState(false);
  const [editData, setEditData] = useState({ status: "healthy" as ToothStatus, notes: "", surface: "" });
  const queryClient = useQueryClient();

  const patientId = parseInt(selectedPatient, 10);
  const { data: chartData, isLoading } = useGetDentalChart(patientId, {
    query: { queryKey: getGetDentalChartQueryKey(patientId), enabled: !!patientId },
  });
  const { data: patients } = useListPatients(undefined, { query: { queryKey: getListPatientsQueryKey() } });

  const updateMutation = useUpdateToothStatus({
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getGetDentalChartQueryKey(patientId) });
        toast.success(`Tooth #${selectedTooth} updated`);
        setEditDialog(false);
      },
      onError: () => toast.error("Failed to update dental chart"),
    },
  });

  const handleToothClick = (toothNumber: number, currentStatus: ToothStatus) => {
    setSelectedTooth(toothNumber);
    setEditData({ status: currentStatus, notes: "", surface: "" });
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

  const stats = {
    healthy: (chartData ?? []).filter((t) => !t.status || t.status === "healthy").length,
    issues: (chartData ?? []).filter((t) => ["decayed", "fractured"].includes(t.status)).length,
    treated: (chartData ?? []).filter((t) => ["filled", "crowned", "root_canal"].includes(t.status)).length,
    missing: (chartData ?? []).filter((t) => ["missing", "extracted"].includes(t.status)).length,
  };

  return (
    <div className="p-6 space-y-5 max-w-[1400px]">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="ams-page-title flex items-center gap-2">
            <Activity className="w-6 h-6 text-primary" /> Dental Chart
          </h1>
          <p className="text-muted-foreground text-sm mt-0.5">Interactive FDI tooth chart</p>
        </div>

        <Select value={selectedPatient} onValueChange={setSelectedPatient}>
          <SelectTrigger className="w-52" data-testid="select-chart-patient">
            <SelectValue placeholder="Select patient..." />
          </SelectTrigger>
          <SelectContent>
            {patients?.map((p) => (
              <SelectItem key={p.id} value={String(p.id)}>{p.firstName} {p.lastName}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Summary stats */}
      <div className="grid grid-cols-4 gap-3">
        {[
          { label: "Healthy", value: 32 - Object.values(stats).slice(1).reduce((a, b) => a + b, 0), color: "text-green-500 bg-green-500/10" },
          { label: "Issues", value: stats.issues, color: "text-red-500 bg-red-500/10" },
          { label: "Treated", value: stats.treated, color: "text-amber-500 bg-amber-500/10" },
          { label: "Missing/Extracted", value: stats.missing, color: "text-muted-foreground bg-muted" },
        ].map(({ label, value, color }) => (
          <div key={label} className="ams-stat-card text-center">
            <p className={cn("text-2xl font-bold mb-1", color.split(" ")[0])}>{value}</p>
            <p className="text-xs text-muted-foreground">{label}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Chart */}
        <div className="lg:col-span-2 bg-card border border-card-border rounded-xl p-6 shadow-sm">
          <h2 className="text-sm font-semibold mb-5 text-muted-foreground uppercase tracking-wide">
            FDI Notation — Click any tooth to edit
          </h2>
          {isLoading ? (
            <Skeleton className="h-64 w-full" />
          ) : (
            <div className="overflow-x-auto">
              <div className="min-w-[500px]">
                <DentalChart
                  chartData={(chartData ?? []).map((e) => ({
                    toothNumber: e.toothNumber,
                    status: e.status,
                  }))}
                  onToothClick={handleToothClick}
                  interactive={true}
                />
              </div>
            </div>
          )}
        </div>

        {/* Charted conditions list */}
        <div className="bg-card border border-card-border rounded-xl p-5 shadow-sm">
          <h2 className="text-sm font-semibold mb-4 text-muted-foreground uppercase tracking-wide">Conditions</h2>
          <div className="space-y-2 max-h-96 overflow-y-auto scrollbar-hide">
            {(chartData ?? []).length === 0 && (
              <p className="text-sm text-muted-foreground text-center py-6">No conditions recorded</p>
            )}
            {(chartData ?? []).map((entry) => (
              <motion.div
                key={entry.id}
                initial={{ opacity: 0, x: 8 }}
                animate={{ opacity: 1, x: 0 }}
                className="flex items-start gap-3 p-3 rounded-lg bg-muted/30 hover:bg-muted/60 transition-colors cursor-pointer"
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
                    {entry.status.replace("_", " ")}
                  </Badge>
                  {entry.surface && (
                    <p className="text-xs text-muted-foreground mt-0.5">Surface: {entry.surface}</p>
                  )}
                  {entry.notes && (
                    <p className="text-xs text-muted-foreground mt-1 truncate">{entry.notes}</p>
                  )}
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </div>

      {/* Edit tooth dialog */}
      <Dialog open={editDialog} onOpenChange={setEditDialog}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Tooth #{selectedTooth}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 mt-2">
            <div className="space-y-1.5">
              <Label>Status</Label>
              <Select value={editData.status} onValueChange={(v) => setEditData(d => ({ ...d, status: v as ToothStatus }))}>
                <SelectTrigger data-testid="select-tooth-status">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {TOOTH_STATUSES.map((s) => (
                    <SelectItem key={s} value={s} className="capitalize">{s.replace("_", " ")}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Surface (optional)</Label>
              <Input
                value={editData.surface}
                onChange={(e) => setEditData(d => ({ ...d, surface: e.target.value }))}
                placeholder="e.g. MOD, B, D"
                data-testid="input-surface"
              />
            </div>
            <div className="space-y-1.5">
              <Label>Notes</Label>
              <Textarea
                value={editData.notes}
                onChange={(e) => setEditData(d => ({ ...d, notes: e.target.value }))}
                rows={2}
                data-testid="input-tooth-notes"
              />
            </div>
            <div className="flex gap-2">
              <Button variant="outline" className="flex-1" onClick={() => setEditDialog(false)}>Cancel</Button>
              <Button
                className="flex-1"
                disabled={updateMutation.isPending}
                onClick={handleSave}
                data-testid="button-save-tooth"
              >
                <Save className="w-3.5 h-3.5 mr-1.5" />
                {updateMutation.isPending ? "Saving..." : "Save"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
