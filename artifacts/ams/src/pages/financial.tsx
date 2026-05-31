import { useState } from "react";
import { motion } from "framer-motion";
import {
  DollarSign, TrendingUp, AlertTriangle, CheckCircle2,
  Plus, Filter, Clock, ChevronDown, CreditCard
} from "lucide-react";
import {
  useListPayments, getListPaymentsQueryKey,
  useGetFinancialSummary, getGetFinancialSummaryQueryKey,
  useCreatePayment, useUpdatePayment,
  useListPatients, getListPatientsQueryKey,
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

const STATUS_STYLES: Record<string, string> = {
  paid: "bg-green-500/10 text-green-500 border-green-500/20",
  partial: "bg-amber-500/10 text-amber-500 border-amber-500/20",
  pending: "bg-blue-500/10 text-blue-500 border-blue-500/20",
  overdue: "bg-red-500/10 text-red-500 border-red-500/20",
  cancelled: "bg-muted text-muted-foreground",
};

export default function FinancialPage() {
  const [statusFilter, setStatusFilter] = useState("all");
  const [showForm, setShowForm] = useState(false);
  const [paymentForm, setPaymentForm] = useState({ patientId: 0, amount: 0, dueDate: "", notes: "" });
  const [payingId, setPayingId] = useState<number | null>(null);
  const [payAmount, setPayAmount] = useState(0);
  const queryClient = useQueryClient();

  const params = statusFilter !== "all" ? { status: statusFilter } : undefined;
  const { data: payments, isLoading } = useListPayments(params, {
    query: { queryKey: getListPaymentsQueryKey(params) },
  });
  const { data: summary } = useGetFinancialSummary({ query: { queryKey: getGetFinancialSummaryQueryKey() } });
  const { data: patients } = useListPatients(undefined, { query: { queryKey: getListPatientsQueryKey() } });

  const createMutation = useCreatePayment({
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getListPaymentsQueryKey() });
        queryClient.invalidateQueries({ queryKey: getGetFinancialSummaryQueryKey() });
        toast.success("Payment record created");
        setShowForm(false);
      },
      onError: () => toast.error("Failed to create payment"),
    },
  });

  const updateMutation = useUpdatePayment({
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getListPaymentsQueryKey() });
        queryClient.invalidateQueries({ queryKey: getGetFinancialSummaryQueryKey() });
        toast.success("Payment updated");
        setPayingId(null);
      },
    },
  });

  const fmt = (n: number) => new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(n);

  return (
    <div className="p-6 space-y-5 max-w-[1400px]">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="ams-page-title">Financial Management</h1>
          <p className="text-muted-foreground text-sm mt-0.5">Payments and revenue overview</p>
        </div>
        <Button size="sm" onClick={() => setShowForm(true)} data-testid="button-new-payment">
          <Plus className="w-3.5 h-3.5 mr-1.5" /> Record Payment
        </Button>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        {[
          { icon: CheckCircle2, label: "Total Revenue", value: fmt(summary?.totalRevenue ?? 0), color: "text-green-500 bg-green-500/10", key: "rev" },
          { icon: Clock, label: "Pending", value: fmt(summary?.totalPending ?? 0), color: "text-amber-500 bg-amber-500/10", key: "pend" },
          { icon: AlertTriangle, label: "Overdue", value: fmt(summary?.totalOverdue ?? 0), color: "text-red-500 bg-red-500/10", key: "over" },
        ].map(({ icon: Icon, label, value, color, key }) => (
          <motion.div
            key={key}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="ams-stat-card"
          >
            <div className={cn("w-9 h-9 rounded-lg flex items-center justify-center mb-3", color)}>
              <Icon className="w-4 h-4" />
            </div>
            <p className="text-xl font-bold">{value}</p>
            <p className="text-xs text-muted-foreground mt-0.5">{label}</p>
          </motion.div>
        ))}
      </div>

      {/* Filters */}
      <div className="flex gap-2 flex-wrap">
        {["all", "pending", "partial", "paid", "overdue"].map((s) => (
          <button
            key={s}
            onClick={() => setStatusFilter(s)}
            className={cn(
              "px-3 py-1.5 rounded-lg border text-sm font-medium transition-all capitalize",
              statusFilter === s
                ? s === "all" ? "bg-primary text-primary-foreground border-primary" : cn("border-transparent", STATUS_STYLES[s])
                : "border-border text-muted-foreground hover:border-border/60"
            )}
            data-testid={`filter-${s}`}
          >
            {s === "all" ? "All Payments" : s}
            {s !== "all" && payments && (
              <span className="ml-1.5 opacity-60">{payments.filter(p => p.status === s).length}</span>
            )}
          </button>
        ))}
      </div>

      {/* Payments table */}
      <div className="bg-card border border-card-border rounded-xl shadow-sm overflow-hidden">
        <div className="grid grid-cols-[1fr_1fr_1fr_1fr_auto] gap-0 text-xs font-semibold text-muted-foreground uppercase tracking-wide px-5 py-3 border-b border-border">
          <span>Patient</span>
          <span>Treatment</span>
          <span>Amount</span>
          <span>Due Date</span>
          <span>Status</span>
        </div>

        {isLoading && [...Array(4)].map((_, i) => (
          <div key={i} className="px-5 py-4 border-b border-border/50">
            <Skeleton className="h-10 w-full" />
          </div>
        ))}

        {payments?.map((p, i) => (
          <motion.div
            key={p.id}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: i * 0.03 }}
            className="grid grid-cols-[1fr_1fr_1fr_1fr_auto] gap-0 items-center px-5 py-4 border-b border-border/50 hover:bg-muted/30 transition-colors"
            data-testid={`row-payment-${p.id}`}
          >
            <span className="text-sm font-medium truncate">{p.patientName}</span>
            <span className="text-sm text-muted-foreground truncate">{p.treatmentName ?? "General"}</span>
            <div>
              <p className="text-sm font-semibold">{fmt(p.amount)}</p>
              {p.paidAmount > 0 && p.paidAmount < p.amount && (
                <p className="text-xs text-muted-foreground">Paid: {fmt(p.paidAmount)}</p>
              )}
            </div>
            <span className="text-sm text-muted-foreground">{p.dueDate}</span>
            <div className="flex items-center gap-2">
              <Badge variant="outline" className={cn("text-xs capitalize", STATUS_STYLES[p.status] ?? "")}>
                {p.status}
              </Badge>
              {(p.status === "pending" || p.status === "partial" || p.status === "overdue") && (
                <Button
                  size="sm"
                  variant="outline"
                  className="h-7 text-xs"
                  onClick={() => { setPayingId(p.id); setPayAmount(Number(p.amount) - Number(p.paidAmount)); }}
                  data-testid={`button-pay-${p.id}`}
                >
                  <CreditCard className="w-3 h-3 mr-1" /> Pay
                </Button>
              )}
            </div>
          </motion.div>
        ))}

        {!payments?.length && !isLoading && (
          <div className="flex flex-col items-center py-16 text-muted-foreground">
            <DollarSign className="w-10 h-10 mb-3 opacity-20" />
            <p className="text-sm">No payments found</p>
          </div>
        )}
      </div>

      {/* Record payment dialog */}
      <Dialog open={showForm} onOpenChange={setShowForm}>
        <DialogContent className="max-w-sm">
          <DialogHeader><DialogTitle>New Payment Record</DialogTitle></DialogHeader>
          <div className="space-y-4 mt-2">
            <div className="space-y-1.5">
              <Label>Patient</Label>
              <Select value={String(paymentForm.patientId)} onValueChange={(v) => setPaymentForm(f => ({ ...f, patientId: parseInt(v) }))}>
                <SelectTrigger data-testid="select-patient">
                  <SelectValue placeholder="Select patient..." />
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
                <Label>Amount ($)</Label>
                <Input type="number" value={paymentForm.amount || ""} onChange={(e) => setPaymentForm(f => ({ ...f, amount: parseFloat(e.target.value) }))} data-testid="input-amount" />
              </div>
              <div className="space-y-1.5">
                <Label>Due Date</Label>
                <Input type="date" value={paymentForm.dueDate} onChange={(e) => setPaymentForm(f => ({ ...f, dueDate: e.target.value }))} data-testid="input-due-date" />
              </div>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" className="flex-1" onClick={() => setShowForm(false)}>Cancel</Button>
              <Button
                className="flex-1"
                disabled={!paymentForm.patientId || !paymentForm.amount || !paymentForm.dueDate || createMutation.isPending}
                onClick={() => createMutation.mutate({ data: paymentForm })}
                data-testid="button-submit-payment"
              >
                {createMutation.isPending ? "Saving..." : "Save"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Record pay amount dialog */}
      <Dialog open={payingId !== null} onOpenChange={() => setPayingId(null)}>
        <DialogContent className="max-w-sm">
          <DialogHeader><DialogTitle>Record Payment</DialogTitle></DialogHeader>
          <div className="space-y-4 mt-2">
            <div className="space-y-1.5">
              <Label>Amount to Pay ($)</Label>
              <Input type="number" value={payAmount} onChange={(e) => setPayAmount(parseFloat(e.target.value))} data-testid="input-pay-amount" />
            </div>
            <div className="flex gap-2">
              <Button variant="outline" className="flex-1" onClick={() => setPayingId(null)}>Cancel</Button>
              <Button
                className="flex-1"
                disabled={updateMutation.isPending}
                onClick={() => {
                  if (payingId) {
                    const payment = payments?.find(p => p.id === payingId);
                    const newPaid = (Number(payment?.paidAmount ?? 0)) + payAmount;
                    const newStatus = newPaid >= Number(payment?.amount ?? 0) ? "paid" : "partial";
                    updateMutation.mutate({ id: payingId, data: { paidAmount: newPaid, status: newStatus } });
                  }
                }}
                data-testid="button-confirm-payment"
              >
                {updateMutation.isPending ? "Processing..." : "Confirm Payment"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
