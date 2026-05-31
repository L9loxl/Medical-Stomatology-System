import { Router, type IRouter } from "express";
import { eq, and } from "drizzle-orm";
import { db, dentalChartTable } from "@workspace/db";
import { UpdateToothStatusBody } from "@workspace/api-zod";

const router: IRouter = Router();

function formatEntry(e: any) {
  return {
    id: e.id,
    patientId: e.patientId,
    toothNumber: e.toothNumber,
    status: e.status,
    surface: e.surface ?? "",
    notes: e.notes ?? null,
    color: e.color ?? null,
    updatedAt: e.updatedAt instanceof Date ? e.updatedAt.toISOString() : String(e.updatedAt),
  };
}

router.get("/dental-chart/:patientId", async (req, res): Promise<void> => {
  const raw = Array.isArray(req.params.patientId) ? req.params.patientId[0] : req.params.patientId;
  const patientId = parseInt(raw, 10);
  if (isNaN(patientId)) {
    res.status(400).json({ error: "Invalid patientId" });
    return;
  }

  const entries = await db
    .select()
    .from(dentalChartTable)
    .where(eq(dentalChartTable.patientId, patientId))
    .orderBy(dentalChartTable.toothNumber);

  res.json(entries.map(formatEntry));
});

router.put("/dental-chart/:patientId/tooth/:toothNumber", async (req, res): Promise<void> => {
  const rawPatient = Array.isArray(req.params.patientId) ? req.params.patientId[0] : req.params.patientId;
  const rawTooth = Array.isArray(req.params.toothNumber) ? req.params.toothNumber[0] : req.params.toothNumber;
  const patientId = parseInt(rawPatient, 10);
  const toothNumber = parseInt(rawTooth, 10);

  if (isNaN(patientId) || isNaN(toothNumber)) {
    res.status(400).json({ error: "Invalid patientId or toothNumber" });
    return;
  }

  const parsed = UpdateToothStatusBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const existing = await db
    .select()
    .from(dentalChartTable)
    .where(and(eq(dentalChartTable.patientId, patientId), eq(dentalChartTable.toothNumber, toothNumber)));

  let entry;
  if (existing.length > 0) {
    [entry] = await db
      .update(dentalChartTable)
      .set(parsed.data)
      .where(and(eq(dentalChartTable.patientId, patientId), eq(dentalChartTable.toothNumber, toothNumber)))
      .returning();
  } else {
    [entry] = await db
      .insert(dentalChartTable)
      .values({ patientId, toothNumber, ...parsed.data })
      .returning();
  }

  res.json(formatEntry(entry));
});

export default router;
