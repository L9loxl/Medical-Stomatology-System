import { useState } from "react";
import { motion } from "framer-motion";
import { format, startOfWeek, endOfWeek, eachDayOfInterval, addWeeks, subWeeks, isSameDay, parseISO } from "date-fns";
import {
  ChevronLeft, ChevronRight, Plus, Calendar, Clock, User, Filter
} from "lucide-react";
import {
  useListAppointments, getListAppointmentsQueryKey,
  useCreateAppointment, useUpdateAppointment,
  useListPatients, getListPatientsQueryKey,
  AppointmentInputType,
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { useI18n } from "@/lib/i18n";

const APPOINTMENT_TYPES = [
  "checkup", "cleaning", "filling", "extraction", "rootCanal",
  "crown", "implant", "orthodontics", "emergency", "consultation", "other"
];

const STATUS_LABEL_KEYS: Record<string, string> = {
  scheduled: "scheduled", confirmed: "confirmed", in_progress: "inProgress",
  completed: "completed", cancelled: "cancelled", no_show: "noShow",
};

const STATUS_COLORS: Record<string, string> = {
  scheduled: "bg-blue-500/15 text-blue-400 border-blue-500/30",
  confirmed: "bg-green-500/15 text-green-400 border-green-500/30",
  in_progress: "bg-amber-500/15 text-amber-400 border-amber-500/30",
  completed: "bg-muted text-muted-foreground",
  cancelled: "bg-red-500/15 text-red-400 border-red-500/30",
  no_show: "bg-muted text-muted-foreground",
};

const TYPE_COLORS: Record<string, string> = {
  checkup: "border-l-blue-400", cleaning: "border-l-cyan-400",
  filling: "border-l-amber-400", extraction: "border-l-red-400",
  rootCanal: "border-l-orange-400", crown: "border-l-purple-400",
  implant: "border-l-teal-400", orthodontics: "border-l-pink-400",
  emergency: "border-l-red-600", consultation: "border-l-indigo-400",
  other: "border-l-muted-foreground",
};

const HOURS = Array.from({ length: 11 }, (_, i) => `${(8 + i).toString().padStart(2, "0")}:00`);

export default function AppointmentsPage() {
  const { t, tr } = useI18n();
  const [viewMode, setViewMode] = useState<"week" | "list">("week");
  const [weekStart, setWeekStart] = useState(() => startOfWeek(new Date(), { weekStartsOn: 0 }));
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({
    patientId: 0, date: format(new Date(), "yyyy-MM-dd"),
    time: "09:00", duration: 30, type: "checkup", notes: "",
  });
  const queryClient = useQueryClient();

  const weekEnd = endOfWeek(weekStart, { weekStartsOn: 0 });
  const days = eachDayOfInterval({ start: weekStart, end: weekEnd });

  const { data: appointments, isLoading } = useListAppointments(undefined, {
    query: { queryKey: getListAppointmentsQueryKey() },
  });
  const { data: patients } = useListPatients(undefined, {
    query: { queryKey: getListPatientsQueryKey() },
  });

  const createMutation = useCreateAppointment({
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getListAppointmentsQueryKey() });
        toast.success(t.apptScheduled);
        setShowForm(false);
      },
      onError: () => toast.error(t.apptScheduleFailed),
    },
  });

  const updateMutation = useUpdateAppointment({
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getListAppointmentsQueryKey() });
        toast.success(t.apptUpdated);
      },
    },
  });

  const apptsByDay = (day: Date) =>
    (appointments ?? []).filter((a) => {
      try { return isSameDay(parseISO(a.date), day); } catch { return false; }
    });

  return (
    <div className="p-6 space-y-5 max-w-[1600px]">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="ams-page-title">{t.appointments}</h1>
          <p className="text-muted-foreground text-sm mt-0.5">{appointments?.length ?? 0} {t.totalAppointments}</p>
        </div>
        <div className="flex gap-2">
          <div className="flex rounded-lg border border-border overflow-hidden">
            <button
              onClick={() => setViewMode("week")}
              className={cn("px-3 py-1.5 text-sm", viewMode === "week" ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground")}
            >
              {t.week}
            </button>
            <button
              onClick={() => setViewMode("list")}
              className={cn("px-3 py-1.5 text-sm", viewMode === "list" ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground")}
            >
              {t.list}
            </button>
          </div>
          <Button size="sm" onClick={() => setShowForm(true)} data-testid="button-new-appointment">
            <Plus className="w-3.5 h-3.5 mr-1.5" /> {t.newAppointment}
          </Button>
        </div>
      </div>

      {viewMode === "week" ? (
        <div className="bg-card border border-card-border rounded-xl overflow-hidden shadow-sm">
          {/* Week navigation */}
          <div className="flex items-center justify-between px-5 py-3 border-b border-border">
            <button onClick={() => setWeekStart(subWeeks(weekStart, 1))} className="p-1.5 rounded hover:bg-muted transition-colors">
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="text-sm font-semibold">
              {format(weekStart, "MMM d")} – {format(weekEnd, "MMM d, yyyy")}
            </span>
            <button onClick={() => setWeekStart(addWeeks(weekStart, 1))} className="p-1.5 rounded hover:bg-muted transition-colors">
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          <div className="overflow-x-auto">
            {/* Day headers */}
            <div className="grid grid-cols-8 border-b border-border min-w-[700px]">
              <div className="p-3 text-xs text-muted-foreground" />
              {days.map((day) => (
                <div
                  key={day.toISOString()}
                  className={cn(
                    "p-3 text-center border-l border-border",
                    isSameDay(day, new Date()) ? "bg-primary/5" : ""
                  )}
                >
                  <p className="text-xs text-muted-foreground">{format(day, "EEE")}</p>
                  <p className={cn("text-sm font-semibold mt-0.5", isSameDay(day, new Date()) ? "text-primary" : "")}>
                    {format(day, "d")}
                  </p>
                </div>
              ))}
            </div>

            {/* Time grid */}
            <div className="min-w-[700px]">
              {HOURS.map((hour) => (
                <div key={hour} className="grid grid-cols-8 border-b border-border/50 min-h-[64px]">
                  <div className="p-2 text-xs text-muted-foreground text-right pr-3 pt-1.5">{hour}</div>
                  {days.map((day) => {
                    const appts = apptsByDay(day).filter((a) => a.time.startsWith(hour.split(":")[0]));
                    return (
                      <div key={day.toISOString()} className={cn("border-l border-border/50 p-1 space-y-1", isSameDay(day, new Date()) ? "bg-primary/3" : "")}>
                        {appts.map((a) => (
                          <div
                            key={a.id}
                            className={cn("text-xs p-1.5 rounded border-l-2 cursor-pointer hover:opacity-80 transition-opacity", TYPE_COLORS[a.type] ?? "border-l-muted", STATUS_COLORS[a.status] ?? "bg-muted")}
                            data-testid={`card-appt-${a.id}`}
                          >
                            <p className="font-semibold truncate">{a.patientName}</p>
                            <p className="opacity-70 truncate capitalize">{tr(a.type)}</p>
                          </div>
                        ))}
                      </div>
                    );
                  })}
                </div>
              ))}
            </div>
          </div>
        </div>
      ) : (
        <div className="space-y-2">
          {isLoading && [...Array(5)].map((_, i) => <Skeleton key={i} className="h-16 rounded-xl" />)}
          {appointments?.map((a) => (
            <motion.div
              key={a.id}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className={cn(
                "bg-card border border-card-border rounded-xl px-4 py-3 flex items-center gap-4 border-l-4",
                TYPE_COLORS[a.type] ?? ""
              )}
              data-testid={`row-appt-${a.id}`}
            >
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <p className="font-medium text-sm">{a.patientName}</p>
                  <Badge variant="outline" className={cn("text-xs", STATUS_COLORS[a.status])}>{tr(STATUS_LABEL_KEYS[a.status] ?? a.status)}</Badge>
                </div>
                <div className="flex items-center gap-3 mt-0.5 text-xs text-muted-foreground">
                  <span className="flex items-center gap-1"><Calendar className="w-3 h-3" />{a.date}</span>
                  <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{a.time}</span>
                  <span className="capitalize">{tr(a.type)}</span>
                </div>
              </div>
              <Select
                value={a.status}
                onValueChange={(v) => updateMutation.mutate({ id: a.id, data: { status: v as any } })}
              >
                <SelectTrigger className="w-32 h-8 text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {["scheduled","confirmed","in_progress","completed","cancelled","no_show"].map((s) => (
                    <SelectItem key={s} value={s} className="text-xs">{tr(STATUS_LABEL_KEYS[s] ?? s)}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </motion.div>
          ))}
          {!appointments?.length && !isLoading && (
            <div className="flex flex-col items-center py-16 text-muted-foreground">
              <Calendar className="w-10 h-10 mb-3 opacity-20" />
              <p className="text-sm">{t.noAppointments}</p>
            </div>
          )}
        </div>
      )}

      {/* New appointment dialog */}
      <Dialog open={showForm} onOpenChange={setShowForm}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle>{t.scheduleTitle}</DialogTitle></DialogHeader>
          <div className="space-y-4 mt-2">
            <div className="space-y-1.5">
              <Label>{t.patient}</Label>
              <Select value={String(form.patientId)} onValueChange={(v) => setForm(f => ({ ...f, patientId: parseInt(v) }))}>
                <SelectTrigger data-testid="select-patient">
                  <SelectValue placeholder={t.selectPatient} />
                </SelectTrigger>
                <SelectContent>
                  {patients?.map((p) => (
                    <SelectItem key={p.id} value={String(p.id)}>{p.firstName} {p.lastName}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>{t.date}</Label>
                <Input type="date" value={form.date} onChange={(e) => setForm(f => ({ ...f, date: e.target.value }))} data-testid="input-date" />
              </div>
              <div className="space-y-1.5">
                <Label>{t.time}</Label>
                <Input type="time" value={form.time} onChange={(e) => setForm(f => ({ ...f, time: e.target.value }))} data-testid="input-time" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>{t.type}</Label>
                <Select value={form.type} onValueChange={(v) => setForm(f => ({ ...f, type: v }))}>
                  <SelectTrigger data-testid="select-type">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {APPOINTMENT_TYPES.map((at) => (
                      <SelectItem key={at} value={at} className="capitalize">{tr(at)}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>{t.durationMin}</Label>
                <Input type="number" value={form.duration} onChange={(e) => setForm(f => ({ ...f, duration: parseInt(e.target.value) }))} data-testid="input-duration" />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label>{t.notes}</Label>
              <Textarea value={form.notes} onChange={(e) => setForm(f => ({ ...f, notes: e.target.value }))} rows={2} data-testid="input-notes" />
            </div>
            <div className="flex gap-2 pt-1">
              <Button variant="outline" className="flex-1" onClick={() => setShowForm(false)}>{t.cancel}</Button>
              <Button
                className="flex-1"
                disabled={!form.patientId || !form.date || createMutation.isPending}
                onClick={() => createMutation.mutate({ data: { ...form, type: form.type as AppointmentInputType } })}
                data-testid="button-submit-appointment"
              >
                {createMutation.isPending ? t.scheduling : t.schedule}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
