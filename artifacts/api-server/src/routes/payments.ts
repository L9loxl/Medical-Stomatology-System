import { Router, type IRouter } from "express";
import { eq, sql } from "drizzle-orm";
import { db, paymentsTable, patientsTable, treatmentsTable } from "@workspace/db";
import { CreatePaymentBody, UpdatePaymentBody } from "@workspace/api-zod";

const router: IRouter = Router();

function formatPayment(p: any) {
  return {
    id: p.id,
    patientId: p.patientId,
    patientName: p.patientName ?? `${p.firstName ?? ""} ${p.lastName ?? ""}`.trim(),
    treatmentId: p.treatmentId ?? null,
    treatmentName: p.treatmentName ?? null,
    amount: parseFloat(p.amount ?? "0"),
    paidAmount: parseFloat(p.paidAmount ?? "0"),
    status: p.status,
    dueDate: p.dueDate,
    createdAt: p.createdAt instanceof Date ? p.createdAt.toISOString() : String(p.createdAt),
    notes: p.notes ?? null,
  };
}

router.get("/payments", async (req, res): Promise<void> => {
  const { patientId, status } = req.query as { patientId?: string; status?: string };

  const payments = await db
    .select({
      id: paymentsTable.id,
      patientId: paymentsTable.patientId,
      treatmentId: paymentsTable.treatmentId,
      amount: paymentsTable.amount,
      paidAmount: paymentsTable.paidAmount,
      status: paymentsTable.status,
      dueDate: paymentsTable.dueDate,
      createdAt: paymentsTable.createdAt,
      notes: paymentsTable.notes,
      firstName: patientsTable.firstName,
      lastName: patientsTable.lastName,
      treatmentName: treatmentsTable.name,
    })
    .from(paymentsTable)
    .innerJoin(patientsTable, eq(paymentsTable.patientId, patientsTable.id))
    .leftJoin(treatmentsTable, eq(paymentsTable.treatmentId, treatmentsTable.id))
    .where(
      patientId ? eq(paymentsTable.patientId, parseInt(patientId, 10)) :
      status ? eq(paymentsTable.status, status) :
      undefined
    )
    .orderBy(sql`${paymentsTable.createdAt} desc`);

  res.json(payments.map(formatPayment));
});

router.post("/payments", async (req, res): Promise<void> => {
  const parsed = CreatePaymentBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const data = {
    ...parsed.data,
    amount: String(parsed.data.amount),
  };

  const [payment] = await db.insert(paymentsTable).values(data).returning();
  const [patient] = await db.select().from(patientsTable).where(eq(patientsTable.id, payment.patientId));

  res.status(201).json(formatPayment({ ...payment, firstName: patient?.firstName, lastName: patient?.lastName }));
});

router.patch("/payments/:id", async (req, res): Promise<void> => {
  const raw = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const id = parseInt(raw, 10);
  if (isNaN(id)) {
    res.status(400).json({ error: "Invalid id" });
    return;
  }

  const parsed = UpdatePaymentBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const data: any = { ...parsed.data };
  if (data.paidAmount !== undefined) data.paidAmount = String(data.paidAmount);

  const [payment] = await db
    .update(paymentsTable)
    .set(data)
    .where(eq(paymentsTable.id, id))
    .returning();

  if (!payment) {
    res.status(404).json({ error: "Payment not found" });
    return;
  }

  const [patient] = await db.select().from(patientsTable).where(eq(patientsTable.id, payment.patientId));

  res.json(formatPayment({ ...payment, firstName: patient?.firstName, lastName: patient?.lastName }));
});

router.get("/payments/summary", async (_req, res): Promise<void> => {
  const [revenue] = await db
    .select({ total: sql<number>`coalesce(sum(paid_amount::numeric), 0)::float` })
    .from(paymentsTable)
    .where(eq(paymentsTable.status, "paid"));

  const [pending] = await db
    .select({ total: sql<number>`coalesce(sum((amount::numeric - paid_amount::numeric)), 0)::float` })
    .from(paymentsTable)
    .where(sql`status IN ('pending', 'partial')`);

  const [overdue] = await db
    .select({ total: sql<number>`coalesce(sum((amount::numeric - paid_amount::numeric)), 0)::float` })
    .from(paymentsTable)
    .where(eq(paymentsTable.status, "overdue"));

  const [paidCount] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(paymentsTable)
    .where(eq(paymentsTable.status, "paid"));

  const [pendingCount] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(paymentsTable)
    .where(sql`status IN ('pending', 'partial')`);

  const [overdueCount] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(paymentsTable)
    .where(eq(paymentsTable.status, "overdue"));

  res.json({
    totalRevenue: revenue?.total ?? 0,
    totalPending: pending?.total ?? 0,
    totalOverdue: overdue?.total ?? 0,
    paidCount: paidCount?.count ?? 0,
    pendingCount: pendingCount?.count ?? 0,
    overdueCount: overdueCount?.count ?? 0,
  });
});

export default router;
