import { useState } from "react";
import { useLocation } from "wouter";
import { motion, AnimatePresence } from "framer-motion";
import {
  Plus, Search, Users, Phone, Mail, Calendar, ChevronRight,
  Filter, AlertCircle, UserCheck, UserX
} from "lucide-react";
import {
  useListPatients, getListPatientsQueryKey,
  useCreatePatient,
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { useI18n } from "@/lib/i18n";
import { toast } from "sonner";
import { format } from "date-fns";

const statusConfig = {
  active: { label: "Active", icon: UserCheck, color: "bg-green-500/10 text-green-500 border-green-500/20" },
  inactive: { label: "Inactive", icon: UserX, color: "bg-muted text-muted-foreground border-border" },
  emergency: { label: "Emergency", icon: AlertCircle, color: "bg-red-500/10 text-red-500 border-red-500/20" },
};

export default function PatientsPage() {
  const [, setLocation] = useLocation();
  const { t, tr } = useI18n();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [showNewForm, setShowNewForm] = useState(false);
  const [newPatient, setNewPatient] = useState({
    firstName: "", lastName: "", phone: "", email: "",
    dateOfBirth: "", gender: "male" as "male" | "female",
  });
  const queryClient = useQueryClient();

  const params = { ...(search ? { search } : {}), ...(statusFilter !== "all" ? { status: statusFilter } : {}) };
  const { data: patients, isLoading } = useListPatients(params, { query: { queryKey: getListPatientsQueryKey(params) } });

  const createMutation = useCreatePatient({
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getListPatientsQueryKey() });
        toast.success(t.patientAdded);
        setShowNewForm(false);
        setNewPatient({ firstName: "", lastName: "", phone: "", email: "", dateOfBirth: "", gender: "male" });
      },
      onError: () => toast.error(t.patientAddFailed),
    },
  });

  const getAge = (dob: string) => {
    const age = new Date().getFullYear() - new Date(dob).getFullYear();
    return age;
  };

  const getInitials = (first: string, last: string) =>
    `${first[0] ?? ""}${last[0] ?? ""}`.toUpperCase();

  return (
    <div className="p-6 space-y-5 max-w-[1400px]">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="ams-page-title">{t.patients}</h1>
          <p className="text-muted-foreground text-sm mt-0.5">
            {patients?.length ?? 0} {t.patientsRegistered}
          </p>
        </div>
        <Button size="sm" onClick={() => setShowNewForm(true)} data-testid="button-new-patient">
          <Plus className="w-3.5 h-3.5 mr-1.5" /> {t.addPatient}
        </Button>
      </div>

      {/* Filters */}
      <div className="flex gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder={t.searchPatients}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
            data-testid="input-search-patients"
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-36" data-testid="select-status-filter">
            <Filter className="w-3.5 h-3.5 mr-2" />
            <SelectValue placeholder={t.status} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{t.allStatus}</SelectItem>
            <SelectItem value="active">{t.active}</SelectItem>
            <SelectItem value="inactive">{t.inactive}</SelectItem>
            <SelectItem value="emergency">{t.emergency}</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Stats strip */}
      <div className="flex gap-3">
        {Object.entries(statusConfig).map(([status, { icon: Icon, color }]) => (
          <button
            key={status}
            onClick={() => setStatusFilter(status === statusFilter ? "all" : status)}
            className={cn(
              "flex items-center gap-2 px-3 py-2 rounded-lg border text-sm font-medium transition-all",
              status === statusFilter ? color : "border-border text-muted-foreground hover:border-border/80"
            )}
          >
            <Icon className="w-3.5 h-3.5" />
            {tr(status)}
            <span className="ml-1 text-xs bg-foreground/10 rounded-full px-1.5">
              {patients?.filter((p) => p.status === status).length ?? 0}
            </span>
          </button>
        ))}
      </div>

      {/* Patient list */}
      {isLoading ? (
        <div className="space-y-2">
          {[...Array(6)].map((_, i) => <Skeleton key={i} className="h-16 w-full rounded-xl" />)}
        </div>
      ) : (
        <div className="space-y-2">
          <AnimatePresence>
            {patients?.map((patient, i) => {
              const sc = statusConfig[patient.status as keyof typeof statusConfig];
              return (
                <motion.div
                  key={patient.id}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ delay: i * 0.03 }}
                  onClick={() => setLocation(`/patients/${patient.id}`)}
                  className="bg-card border border-card-border rounded-xl px-5 py-4 flex items-center gap-4 cursor-pointer hover:border-primary/30 hover:shadow-sm transition-all"
                  data-testid={`card-patient-${patient.id}`}
                >
                  <Avatar className="w-10 h-10 flex-shrink-0">
                    <AvatarFallback className="bg-primary/10 text-primary font-semibold text-sm">
                      {getInitials(patient.firstName, patient.lastName)}
                    </AvatarFallback>
                  </Avatar>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="font-semibold text-foreground">
                        {patient.firstName} {patient.lastName}
                      </p>
                      {patient.status === "emergency" && (
                        <AlertCircle className="w-3.5 h-3.5 text-red-500 flex-shrink-0" />
                      )}
                    </div>
                    <div className="flex items-center gap-3 mt-0.5">
                      <span className="flex items-center gap-1 text-xs text-muted-foreground">
                        <Phone className="w-3 h-3" /> {patient.phone}
                      </span>
                      {patient.email && (
                        <span className="flex items-center gap-1 text-xs text-muted-foreground">
                          <Mail className="w-3 h-3" /> {patient.email}
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="hidden sm:flex items-center gap-4 text-xs text-muted-foreground">
                    <span>{getAge(patient.dateOfBirth)} {t.yrs}</span>
                    <span className="capitalize">{tr(patient.gender)}</span>
                    {patient.lastVisit && (
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        {format(new Date(patient.lastVisit), "MMM d")}
                      </span>
                    )}
                  </div>

                  <Badge
                    variant="outline"
                    className={cn("flex-shrink-0 text-xs", sc?.color)}
                  >
                    {tr(patient.status)}
                  </Badge>

                  <ChevronRight className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                </motion.div>
              );
            })}
          </AnimatePresence>

          {patients?.length === 0 && (
            <div className="flex flex-col items-center justify-center py-20 text-muted-foreground">
              <Users className="w-12 h-12 mb-3 opacity-20" />
              <p className="font-medium">{t.noPatientsFound}</p>
              <p className="text-sm">{t.adjustSearch}</p>
            </div>
          )}
        </div>
      )}

      {/* New patient dialog */}
      <Dialog open={showNewForm} onOpenChange={setShowNewForm}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{t.addNewPatient}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 mt-2">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>{t.firstName}</Label>
                <Input value={newPatient.firstName} onChange={(e) => setNewPatient(p => ({ ...p, firstName: e.target.value }))} data-testid="input-first-name" />
              </div>
              <div className="space-y-1.5">
                <Label>{t.lastName}</Label>
                <Input value={newPatient.lastName} onChange={(e) => setNewPatient(p => ({ ...p, lastName: e.target.value }))} data-testid="input-last-name" />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label>{t.phone}</Label>
              <Input value={newPatient.phone} onChange={(e) => setNewPatient(p => ({ ...p, phone: e.target.value }))} data-testid="input-phone" />
            </div>
            <div className="space-y-1.5">
              <Label>{t.emailOptional}</Label>
              <Input type="email" value={newPatient.email} onChange={(e) => setNewPatient(p => ({ ...p, email: e.target.value }))} data-testid="input-email" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>{t.dateOfBirth}</Label>
                <Input type="date" value={newPatient.dateOfBirth} onChange={(e) => setNewPatient(p => ({ ...p, dateOfBirth: e.target.value }))} data-testid="input-dob" />
              </div>
              <div className="space-y-1.5">
                <Label>{t.male}/{t.female}</Label>
                <Select value={newPatient.gender} onValueChange={(v) => setNewPatient(p => ({ ...p, gender: v as "male" | "female" }))}>
                  <SelectTrigger data-testid="select-gender">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="male">{t.male}</SelectItem>
                    <SelectItem value="female">{t.female}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="flex gap-2 pt-2">
              <Button variant="outline" className="flex-1" onClick={() => setShowNewForm(false)}>{t.cancel}</Button>
              <Button
                className="flex-1"
                disabled={!newPatient.firstName || !newPatient.lastName || !newPatient.phone || !newPatient.dateOfBirth || createMutation.isPending}
                onClick={() => createMutation.mutate({ data: newPatient })}
                data-testid="button-submit-patient"
              >
                {createMutation.isPending ? t.adding : t.addPatient}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
