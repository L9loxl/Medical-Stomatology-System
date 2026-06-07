import { useState } from "react";
import { useRoute, useLocation } from "wouter";
import { motion } from "framer-motion";
import {
  ArrowLeft, Phone, Mail, Calendar, AlertTriangle, Shield,
  Cigarette, Heart, Activity, Edit2, Stethoscope, DollarSign,
  ImageIcon, FileText, ChevronRight, CheckCircle, Clock, XCircle
} from "lucide-react";
import {
  useGetPatient, getGetPatientQueryKey,
  useGetPatientAiRecommendations, getGetPatientAiRecommendationsQueryKey,
  useListTreatments, getListTreatmentsQueryKey,
  useListAppointments, getListAppointmentsQueryKey,
  useListPayments, getListPaymentsQueryKey,
  useListImages, getListImagesQueryKey,
} from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";
import { useI18n } from "@/lib/i18n";
import { format } from "date-fns";

const priorityConfig = {
  critical: { color: "bg-red-500/10 border-red-500/30 text-red-400", dot: "bg-red-500", label: "Critical" },
  high: { color: "bg-orange-500/10 border-orange-500/30 text-orange-400", dot: "bg-orange-500", label: "High" },
  medium: { color: "bg-amber-500/10 border-amber-500/30 text-amber-400", dot: "bg-amber-500", label: "Medium" },
  low: { color: "bg-blue-500/10 border-blue-500/30 text-blue-400", dot: "bg-blue-400", label: "Low" },
};

const treatmentStatusConfig = {
  planned: { color: "bg-blue-500/10 text-blue-500", icon: Clock },
  in_progress: { color: "bg-amber-500/10 text-amber-500", icon: Activity },
  completed: { color: "bg-green-500/10 text-green-500", icon: CheckCircle },
  cancelled: { color: "bg-muted text-muted-foreground", icon: XCircle },
};

const paymentStatusConfig = {
  paid: "bg-green-500/10 text-green-500",
  partial: "bg-amber-500/10 text-amber-500",
  pending: "bg-blue-500/10 text-blue-500",
  overdue: "bg-red-500/10 text-red-500",
  cancelled: "bg-muted text-muted-foreground",
};

export default function PatientDetailPage() {
  const [, params] = useRoute("/patients/:id");
  const [, setLocation] = useLocation();
  const patientId = parseInt(params?.id ?? "0", 10);
  const [activeTab, setActiveTab] = useState("overview");
  const { t, tr } = useI18n();

  const { data: patient, isLoading } = useGetPatient(patientId, {
    query: { queryKey: getGetPatientQueryKey(patientId), enabled: !!patientId },
  });
  const { data: aiRecs } = useGetPatientAiRecommendations(patientId, {
    query: { queryKey: getGetPatientAiRecommendationsQueryKey(patientId), enabled: !!patientId },
  });
  const { data: treatments } = useListTreatments({ patientId }, {
    query: { queryKey: getListTreatmentsQueryKey({ patientId }), enabled: !!patientId },
  });
  const { data: appointments } = useListAppointments({ patientId }, {
    query: { queryKey: getListAppointmentsQueryKey({ patientId }), enabled: !!patientId },
  });
  const { data: payments } = useListPayments({ patientId }, {
    query: { queryKey: getListPaymentsQueryKey({ patientId }), enabled: !!patientId },
  });
  const { data: images } = useListImages({ patientId }, {
    query: { queryKey: getListImagesQueryKey({ patientId }), enabled: !!patientId },
  });

  if (isLoading) {
    return (
      <div className="p-6 space-y-4">
        <Skeleton className="h-10 w-32" />
        <Skeleton className="h-32 w-full rounded-xl" />
        <Skeleton className="h-64 w-full rounded-xl" />
      </div>
    );
  }

  if (!patient) {
    return (
      <div className="p-6 flex flex-col items-center justify-center h-64 text-muted-foreground">
        <AlertTriangle className="w-10 h-10 mb-3 opacity-30" />
        <p>{t.patientNotFound}</p>
        <Button variant="ghost" size="sm" onClick={() => setLocation("/patients")} className="mt-3">
          <ArrowLeft className="w-3.5 h-3.5 mr-1.5" /> {t.back}
        </Button>
      </div>
    );
  }

  const age = new Date().getFullYear() - new Date(patient.dateOfBirth).getFullYear();
  const initials = `${patient.firstName[0]}${patient.lastName[0]}`.toUpperCase();

  return (
    <div className="p-6 space-y-5 max-w-[1400px]">
      {/* Back */}
      <button
        onClick={() => setLocation("/patients")}
        className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors text-sm"
        data-testid="button-back"
      >
        <ArrowLeft className="w-4 h-4" /> {t.patients}
      </button>

      {/* Patient header */}
      <div className="bg-card border border-card-border rounded-xl p-5 flex flex-col sm:flex-row gap-5">
        <Avatar className="w-16 h-16 flex-shrink-0 ring-4 ring-primary/20">
          <AvatarFallback className="bg-primary/10 text-primary text-xl font-bold">{initials}</AvatarFallback>
        </Avatar>

        <div className="flex-1 min-w-0">
          <div className="flex items-start gap-3 flex-wrap">
            <h1 className="text-xl font-bold">{patient.firstName} {patient.lastName}</h1>
            <Badge
              variant="outline"
              className={cn(
                "text-xs",
                patient.status === "active" ? "bg-green-500/10 text-green-500 border-green-500/20" :
                patient.status === "emergency" ? "bg-red-500/10 text-red-500 border-red-500/20" :
                "text-muted-foreground"
              )}
            >
              {tr(patient.status)}
            </Badge>
          </div>

          <div className="flex flex-wrap gap-4 mt-2">
            <span className="flex items-center gap-1.5 text-sm text-muted-foreground">
              <Calendar className="w-3.5 h-3.5" /> {age} {t.yearsOld}
            </span>
            <span className="flex items-center gap-1.5 text-sm text-muted-foreground">
              <Phone className="w-3.5 h-3.5" /> {patient.phone}
            </span>
            {patient.email && (
              <span className="flex items-center gap-1.5 text-sm text-muted-foreground">
                <Mail className="w-3.5 h-3.5" /> {patient.email}
              </span>
            )}
          </div>

          {/* Medical flags */}
          <div className="flex flex-wrap gap-2 mt-3">
            {patient.isSmoker && (
              <Badge variant="outline" className="bg-amber-500/10 text-amber-500 border-amber-500/20 text-xs flex items-center gap-1">
                <Cigarette className="w-3 h-3" /> {t.smoker}
              </Badge>
            )}
            {patient.hasDiabetes && (
              <Badge variant="outline" className="bg-red-500/10 text-red-500 border-red-500/20 text-xs flex items-center gap-1">
                <Activity className="w-3 h-3" /> {t.diabetes}
              </Badge>
            )}
            {patient.hasHypertension && (
              <Badge variant="outline" className="bg-orange-500/10 text-orange-500 border-orange-500/20 text-xs flex items-center gap-1">
                <Heart className="w-3 h-3" /> {t.hypertension}
              </Badge>
            )}
            {(patient.allergies ?? []).length > 0 && (
              <Badge variant="outline" className="bg-purple-500/10 text-purple-500 border-purple-500/20 text-xs flex items-center gap-1">
                <AlertTriangle className="w-3 h-3" /> {(patient.allergies ?? []).length} {t.allergies}
              </Badge>
            )}
            {patient.bloodType && (
              <Badge variant="secondary" className="text-xs">{patient.bloodType}</Badge>
            )}
          </div>
        </div>

        <Button size="sm" variant="outline" className="flex-shrink-0 self-start" data-testid="button-edit-patient">
          <Edit2 className="w-3.5 h-3.5 mr-1.5" /> {t.edit}
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Main tabs */}
        <div className="lg:col-span-2">
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="w-full grid grid-cols-5">
              <TabsTrigger value="overview">{t.overview}</TabsTrigger>
              <TabsTrigger value="treatments">
                {t.treatments} {treatments?.length ? <span className="ml-1 text-xs opacity-60">({treatments.length})</span> : ""}
              </TabsTrigger>
              <TabsTrigger value="appointments">{t.apptsTab}</TabsTrigger>
              <TabsTrigger value="payments">{t.finance}</TabsTrigger>
              <TabsTrigger value="images">{t.images}</TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="mt-4 space-y-4">
              {patient.medicalHistory && (
                <div className="bg-card border border-card-border rounded-xl p-4">
                  <h3 className="text-sm font-semibold mb-2 flex items-center gap-2">
                    <FileText className="w-4 h-4 text-muted-foreground" /> {t.medicalHistory}
                  </h3>
                  <p className="text-sm text-muted-foreground">{patient.medicalHistory}</p>
                </div>
              )}
              {(patient.allergies ?? []).length > 0 && (
                <div className="bg-card border border-card-border rounded-xl p-4">
                  <h3 className="text-sm font-semibold mb-2 flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4 text-amber-500" /> {t.allergies}
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {(patient.allergies ?? []).map((a) => (
                      <Badge key={a} variant="outline" className="bg-amber-500/10 text-amber-500 border-amber-500/20">{a}</Badge>
                    ))}
                  </div>
                </div>
              )}
              {(patient.medications ?? []).length > 0 && (
                <div className="bg-card border border-card-border rounded-xl p-4">
                  <h3 className="text-sm font-semibold mb-2 flex items-center gap-2">
                    <Shield className="w-4 h-4 text-blue-500" /> {t.currentMedications}
                  </h3>
                  <div className="space-y-1">
                    {(patient.medications ?? []).map((m) => (
                      <p key={m} className="text-sm text-muted-foreground">{m}</p>
                    ))}
                  </div>
                </div>
              )}
              {patient.doctorNotes && (
                <div className="bg-card border border-card-border rounded-xl p-4">
                  <h3 className="text-sm font-semibold mb-2 flex items-center gap-2">
                    <Stethoscope className="w-4 h-4 text-primary" /> {t.doctorNotes}
                  </h3>
                  <p className="text-sm text-muted-foreground">{patient.doctorNotes}</p>
                </div>
              )}
              {patient.emergencyContact && (
                <div className="bg-card border border-card-border rounded-xl p-4">
                  <h3 className="text-sm font-semibold mb-2">{t.emergencyContact}</h3>
                  <p className="text-sm">{patient.emergencyContact}</p>
                  {patient.emergencyPhone && <p className="text-sm text-muted-foreground">{patient.emergencyPhone}</p>}
                </div>
              )}
            </TabsContent>

            <TabsContent value="treatments" className="mt-4 space-y-3">
              {!treatments?.length && <p className="text-sm text-muted-foreground text-center py-8">{t.noTreatments}</p>}
              {treatments?.map((tx) => {
                const sc = treatmentStatusConfig[tx.status as keyof typeof treatmentStatusConfig];
                const Icon = sc?.icon ?? Clock;
                return (
                  <div key={tx.id} className="bg-card border border-card-border rounded-xl p-4" data-testid={`card-treatment-${tx.id}`}>
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <p className="font-medium text-sm">{tx.name}</p>
                        {tx.description && <p className="text-xs text-muted-foreground mt-0.5">{tx.description}</p>}
                      </div>
                      <Badge variant="outline" className={cn("text-xs flex-shrink-0 flex items-center gap-1", sc?.color)}>
                        <Icon className="w-3 h-3" />{tr(tx.status)}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                      <span>{t.started}: {tx.startDate}</span>
                      {tx.completedDate && <span>{t.completed}: {tx.completedDate}</span>}
                      <span className="font-medium text-foreground">${Number(tx.cost).toFixed(2)}</span>
                    </div>
                    {tx.notes && <p className="text-xs text-muted-foreground mt-2 border-t border-border pt-2">{tx.notes}</p>}
                  </div>
                );
              })}
            </TabsContent>

            <TabsContent value="appointments" className="mt-4 space-y-2">
              {!appointments?.length && <p className="text-sm text-muted-foreground text-center py-8">{t.noAppointments}</p>}
              {appointments?.map((a) => (
                <div key={a.id} className="bg-card border border-card-border rounded-xl p-4 flex items-center gap-3" data-testid={`card-appointment-${a.id}`}>
                  <div className="flex-1">
                    <p className="text-sm font-medium">{tr(a.type)}</p>
                    <p className="text-xs text-muted-foreground">{a.date} - {a.time}</p>
                  </div>
                  <Badge variant="outline" className="text-xs">{tr(a.status)}</Badge>
                </div>
              ))}
            </TabsContent>

            <TabsContent value="payments" className="mt-4 space-y-2">
              {!payments?.length && <p className="text-sm text-muted-foreground text-center py-8">{t.noPayments}</p>}
              {payments?.map((p) => (
                <div key={p.id} className="bg-card border border-card-border rounded-xl p-4 flex items-center gap-3" data-testid={`card-payment-${p.id}`}>
                  <DollarSign className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                  <div className="flex-1">
                    <p className="text-sm font-medium">{p.treatmentName ?? t.other}</p>
                    <p className="text-xs text-muted-foreground">{t.due}: {p.dueDate}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-semibold">${Number(p.paidAmount).toFixed(2)} / ${Number(p.amount).toFixed(2)}</p>
                    <Badge variant="outline" className={cn("text-xs", paymentStatusConfig[p.status as keyof typeof paymentStatusConfig])}>{tr(p.status)}</Badge>
                  </div>
                </div>
              ))}
            </TabsContent>

            <TabsContent value="images" className="mt-4">
              {!images?.length && (
                <div className="flex flex-col items-center py-12 text-muted-foreground">
                  <ImageIcon className="w-10 h-10 mb-3 opacity-20" />
                  <p className="text-sm">{t.noImages}</p>
                </div>
              )}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {images?.map((img) => (
                  <div key={img.id} className="aspect-square rounded-xl overflow-hidden border border-card-border bg-muted relative group" data-testid={`card-image-${img.id}`}>
                    <img src={img.url} alt={img.type} className="w-full h-full object-cover transition-transform group-hover:scale-105" />
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-2">
                      <div>
                        <p className="text-white text-xs font-medium">{tr(img.type)}</p>
                        <p className="text-white/70 text-xs">{img.date}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </TabsContent>
          </Tabs>
        </div>

        {/* AI Recommendations panel */}
        <div className="space-y-3">
          <h2 className="font-semibold text-sm flex items-center gap-2">
            <Activity className="w-4 h-4 text-primary" /> {t.aiRecommendations}
          </h2>
          {!aiRecs?.length && (
            <div className="bg-card border border-card-border rounded-xl p-4 text-center text-muted-foreground">
              <p className="text-sm">{t.noRecommendations}</p>
            </div>
          )}
          {aiRecs?.map((rec, i) => {
            const pc = priorityConfig[rec.priority as keyof typeof priorityConfig];
            return (
              <motion.div
                key={rec.id}
                initial={{ opacity: 0, x: 12 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.08 }}
                className={cn("bg-card border rounded-xl p-4", pc?.color)}
                data-testid={`card-ai-rec-${rec.id}`}
              >
                <div className="flex items-start gap-2 mb-1">
                  <div className={cn("w-2 h-2 rounded-full mt-1.5 flex-shrink-0", pc?.dot)} />
                  <div>
                    <p className="text-sm font-semibold">{rec.title}</p>
                    <Badge variant="outline" className={cn("text-xs mt-0.5", pc?.color)}>{tr(rec.priority)}</Badge>
                  </div>
                </div>
                <p className="text-xs opacity-80 mt-2 leading-relaxed pl-4">{rec.description}</p>
              </motion.div>
            );
          })}

          {/* Quick actions */}
          <div className="bg-card border border-card-border rounded-xl p-4 space-y-2">
            <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">{t.quickActions}</h3>
            {[
              { label: t.scheduleAppointment, icon: Calendar, href: "/appointments" },
              { label: t.addTreatment, icon: Stethoscope, href: "/treatments" },
              { label: t.recordPayment, icon: DollarSign, href: "/financial" },
              { label: t.viewDentalChart, icon: Activity, href: "/dental-chart" },
            ].map(({ label, icon: Icon, href }) => (
              <button
                key={label}
                onClick={() => setLocation(href)}
                className="w-full flex items-center justify-between px-3 py-2 rounded-lg hover:bg-muted transition-colors text-sm"
              >
                <span className="flex items-center gap-2">
                  <Icon className="w-3.5 h-3.5 text-muted-foreground" /> {label}
                </span>
                <ChevronRight className="w-3.5 h-3.5 text-muted-foreground" />
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
