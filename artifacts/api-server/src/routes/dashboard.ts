import { Router, type IRouter } from "express";
import { db, patientsTable, appointmentsTable, treatmentsTable, paymentsTable } from "@workspace/db";
import { sql, eq, and, gte } from "drizzle-orm";

const router: IRouter = Router();

router.get("/dashboard/stats", async (_req, res): Promise<void> => {
  const today = new Date().toISOString().split("T")[0];
  const thisMonth = today.substring(0, 7);

  const [totalPatientsResult] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(patientsTable);

  const [todayApptResult] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(appointmentsTable)
    .where(eq(appointmentsTable.date, today));

  const [monthlyRevenueResult] = await db
    .select({ total: sql<number>`coalesce(sum(paid_amount::numeric), 0)::float` })
    .from(paymentsTable)
    .where(sql`to_char(created_at, 'YYYY-MM') = ${thisMonth}`);

  const [pendingPayResult] = await db
    .select({ total: sql<number>`coalesce(sum((amount::numeric - paid_amount::numeric)), 0)::float` })
    .from(paymentsTable)
    .where(sql`status IN ('pending', 'partial', 'overdue')`);

  const [emergencyResult] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(patientsTable)
    .where(eq(patientsTable.status, "emergency"));

  const [treatmentsResult] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(treatmentsTable)
    .where(sql`to_char(created_at, 'YYYY-MM') = ${thisMonth}`);

  const [newPatientsResult] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(patientsTable)
    .where(sql`to_char(created_at, 'YYYY-MM') = ${thisMonth}`);

  const [completedResult] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(treatmentsTable)
    .where(eq(treatmentsTable.status, "completed"));

  res.json({
    totalPatients: totalPatientsResult?.count ?? 0,
    todayAppointments: todayApptResult?.count ?? 0,
    monthlyRevenue: monthlyRevenueResult?.total ?? 0,
    pendingPayments: pendingPayResult?.total ?? 0,
    activeEmergencies: emergencyResult?.count ?? 0,
    treatmentsThisMonth: treatmentsResult?.count ?? 0,
    newPatientsThisMonth: newPatientsResult?.count ?? 0,
    completedTreatments: completedResult?.count ?? 0,
  });
});

router.get("/dashboard/revenue-chart", async (_req, res): Promise<void> => {
  const months = [];
  for (let i = 11; i >= 0; i--) {
    const d = new Date();
    d.setMonth(d.getMonth() - i);
    const monthKey = d.toISOString().substring(0, 7);
    const label = d.toLocaleString("default", { month: "short", year: "numeric" });
    months.push({ key: monthKey, label });
  }

  const results = await Promise.all(
    months.map(async ({ key, label }) => {
      const [rev] = await db
        .select({ total: sql<number>`coalesce(sum(paid_amount::numeric), 0)::float` })
        .from(paymentsTable)
        .where(sql`to_char(created_at, 'YYYY-MM') = ${key}`);

      const [exp] = await db
        .select({ total: sql<number>`coalesce(sum(amount::numeric) * 0.3, 0)::float` })
        .from(paymentsTable)
        .where(sql`to_char(created_at, 'YYYY-MM') = ${key}`);

      return {
        month: label,
        revenue: rev?.total ?? 0,
        expenses: exp?.total ?? 0,
      };
    })
  );

  res.json(results);
});

router.get("/dashboard/recent-activity", async (_req, res): Promise<void> => {
  const recentAppts = await db
    .select({
      id: appointmentsTable.id,
      patientId: appointmentsTable.patientId,
      type: appointmentsTable.type,
      date: appointmentsTable.date,
      firstName: patientsTable.firstName,
      lastName: patientsTable.lastName,
      createdAt: appointmentsTable.createdAt,
    })
    .from(appointmentsTable)
    .innerJoin(patientsTable, eq(appointmentsTable.patientId, patientsTable.id))
    .orderBy(sql`${appointmentsTable.createdAt} desc`)
    .limit(5);

  const recentPayments = await db
    .select({
      id: paymentsTable.id,
      patientId: paymentsTable.patientId,
      amount: paymentsTable.paidAmount,
      status: paymentsTable.status,
      firstName: patientsTable.firstName,
      lastName: patientsTable.lastName,
      createdAt: paymentsTable.createdAt,
    })
    .from(paymentsTable)
    .innerJoin(patientsTable, eq(paymentsTable.patientId, patientsTable.id))
    .orderBy(sql`${paymentsTable.createdAt} desc`)
    .limit(5);

  const activities = [
    ...recentAppts.map((a) => ({
      id: a.id,
      type: "appointment" as const,
      description: `${a.type} appointment scheduled`,
      time: new Date(a.createdAt).toISOString(),
      patientName: `${a.firstName} ${a.lastName}`,
      patientId: a.patientId,
    })),
    ...recentPayments.map((p) => ({
      id: p.id + 10000,
      type: "payment" as const,
      description: `Payment of $${p.amount} recorded`,
      time: new Date(p.createdAt).toISOString(),
      patientName: `${p.firstName} ${p.lastName}`,
      patientId: p.patientId,
    })),
  ]
    .sort((a, b) => new Date(b.time).getTime() - new Date(a.time).getTime())
    .slice(0, 10);

  res.json(activities);
});

router.get("/dashboard/today-appointments", async (_req, res): Promise<void> => {
  const today = new Date().toISOString().split("T")[0];

  const appts = await db
    .select({
      id: appointmentsTable.id,
      patientId: appointmentsTable.patientId,
      date: appointmentsTable.date,
      time: appointmentsTable.time,
      duration: appointmentsTable.duration,
      type: appointmentsTable.type,
      status: appointmentsTable.status,
      notes: appointmentsTable.notes,
      doctorId: appointmentsTable.doctorId,
      firstName: patientsTable.firstName,
      lastName: patientsTable.lastName,
      avatar: patientsTable.avatar,
    })
    .from(appointmentsTable)
    .innerJoin(patientsTable, eq(appointmentsTable.patientId, patientsTable.id))
    .where(eq(appointmentsTable.date, today))
    .orderBy(appointmentsTable.time);

  res.json(
    appts.map((a) => ({
      id: a.id,
      patientId: a.patientId,
      patientName: `${a.firstName} ${a.lastName}`,
      patientAvatar: a.avatar,
      date: a.date,
      time: a.time,
      duration: a.duration,
      type: a.type,
      status: a.status,
      notes: a.notes,
      doctorId: a.doctorId,
      doctorName: null,
    }))
  );
});

export default router;
