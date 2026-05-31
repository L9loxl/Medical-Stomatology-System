import { Router, type IRouter } from "express";
import { eq } from "drizzle-orm";
import { db, treatmentsTable, patientsTable, usersTable } from "@workspace/db";
import { CreateTreatmentBody, UpdateTreatmentBody } from "@workspace/api-zod";

const router: IRouter = Router();

function formatTreatment(t: any) {
  return {
    id: t.id,
    patientId: t.patientId,
    name: t.name,
    description: t.description ?? null,
    status: t.status,
    startDate: t.startDate,
    completedDate: t.completedDate ?? null,
    cost: parseFloat(t.cost ?? "0"),
    toothNumbers: t.toothNumbers ?? [],
    doctorId: t.doctorId ?? null,
    doctorName: t.doctorName ?? null,
    notes: t.notes ?? null,
  };
}

router.get("/treatments", async (req, res): Promise<void> => {
  const { patientId } = req.query as { patientId?: string };

  const query = db
    .select({
      id: treatmentsTable.id,
      patientId: treatmentsTable.patientId,
      doctorId: treatmentsTable.doctorId,
      name: treatmentsTable.name,
      description: treatmentsTable.description,
      status: treatmentsTable.status,
      startDate: treatmentsTable.startDate,
      completedDate: treatmentsTable.completedDate,
      cost: treatmentsTable.cost,
      toothNumbers: treatmentsTable.toothNumbers,
      notes: treatmentsTable.notes,
    })
    .from(treatmentsTable);

  const treatments = patientId
    ? await query.where(eq(treatmentsTable.patientId, parseInt(patientId, 10))).orderBy(treatmentsTable.startDate)
    : await query.orderBy(treatmentsTable.startDate);

  res.json(treatments.map(formatTreatment));
});

router.post("/treatments", async (req, res): Promise<void> => {
  const parsed = CreateTreatmentBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const data = {
    ...parsed.data,
    startDate: parsed.data.startDate ?? new Date().toISOString().split("T")[0],
    cost: String(parsed.data.cost ?? 0),
  };

  const [treatment] = await db.insert(treatmentsTable).values(data).returning();
  res.status(201).json(formatTreatment(treatment));
});

router.patch("/treatments/:id", async (req, res): Promise<void> => {
  const raw = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const id = parseInt(raw, 10);
  if (isNaN(id)) {
    res.status(400).json({ error: "Invalid id" });
    return;
  }

  const parsed = UpdateTreatmentBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const data: any = { ...parsed.data };
  if (data.cost !== undefined) data.cost = String(data.cost);

  const [treatment] = await db
    .update(treatmentsTable)
    .set(data)
    .where(eq(treatmentsTable.id, id))
    .returning();

  if (!treatment) {
    res.status(404).json({ error: "Treatment not found" });
    return;
  }

  res.json(formatTreatment(treatment));
});

router.delete("/treatments/:id", async (req, res): Promise<void> => {
  const raw = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const id = parseInt(raw, 10);
  if (isNaN(id)) {
    res.status(400).json({ error: "Invalid id" });
    return;
  }

  const [treatment] = await db.delete(treatmentsTable).where(eq(treatmentsTable.id, id)).returning();
  if (!treatment) {
    res.status(404).json({ error: "Treatment not found" });
    return;
  }

  res.sendStatus(204);
});

export default router;
