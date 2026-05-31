import { Router, type IRouter } from "express";
import { eq, sql } from "drizzle-orm";
import { db, appointmentsTable, patientsTable, usersTable } from "@workspace/db";
import { CreateAppointmentBody, UpdateAppointmentBody } from "@workspace/api-zod";

const router: IRouter = Router();

function formatAppointment(a: any) {
  return {
    id: a.id,
    patientId: a.patientId,
    patientName: a.patientName ?? `${a.firstName ?? ""} ${a.lastName ?? ""}`.trim(),
    patientAvatar: a.patientAvatar ?? a.avatar ?? null,
    date: a.date,
    time: a.time,
    duration: a.duration,
    type: a.type,
    status: a.status,
    notes: a.notes ?? null,
    doctorId: a.doctorId ?? null,
    doctorName: a.doctorName ?? null,
  };
}

router.get("/appointments", async (req, res): Promise<void> => {
  const { date, patientId, status } = req.query as { date?: string; patientId?: string; status?: string };

  const appts = await db
    .select({
      id: appointmentsTable.id,
      patientId: appointmentsTable.patientId,
      doctorId: appointmentsTable.doctorId,
      date: appointmentsTable.date,
      time: appointmentsTable.time,
      duration: appointmentsTable.duration,
      type: appointmentsTable.type,
      status: appointmentsTable.status,
      notes: appointmentsTable.notes,
      firstName: patientsTable.firstName,
      lastName: patientsTable.lastName,
      avatar: patientsTable.avatar,
    })
    .from(appointmentsTable)
    .innerJoin(patientsTable, eq(appointmentsTable.patientId, patientsTable.id))
    .where(
      date ? eq(appointmentsTable.date, date) :
      patientId ? eq(appointmentsTable.patientId, parseInt(patientId, 10)) :
      status ? eq(appointmentsTable.status, status) :
      undefined
    )
    .orderBy(appointmentsTable.date, appointmentsTable.time);

  res.json(appts.map(formatAppointment));
});

router.post("/appointments", async (req, res): Promise<void> => {
  const parsed = CreateAppointmentBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const [appt] = await db.insert(appointmentsTable).values(parsed.data).returning();

  const [patient] = await db.select().from(patientsTable).where(eq(patientsTable.id, appt.patientId));

  res.status(201).json(formatAppointment({ ...appt, firstName: patient?.firstName, lastName: patient?.lastName, avatar: patient?.avatar }));
});

router.get("/appointments/:id", async (req, res): Promise<void> => {
  const raw = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const id = parseInt(raw, 10);
  if (isNaN(id)) {
    res.status(400).json({ error: "Invalid id" });
    return;
  }

  const [appt] = await db
    .select({
      id: appointmentsTable.id,
      patientId: appointmentsTable.patientId,
      doctorId: appointmentsTable.doctorId,
      date: appointmentsTable.date,
      time: appointmentsTable.time,
      duration: appointmentsTable.duration,
      type: appointmentsTable.type,
      status: appointmentsTable.status,
      notes: appointmentsTable.notes,
      firstName: patientsTable.firstName,
      lastName: patientsTable.lastName,
      avatar: patientsTable.avatar,
    })
    .from(appointmentsTable)
    .innerJoin(patientsTable, eq(appointmentsTable.patientId, patientsTable.id))
    .where(eq(appointmentsTable.id, id));

  if (!appt) {
    res.status(404).json({ error: "Appointment not found" });
    return;
  }

  res.json(formatAppointment(appt));
});

router.patch("/appointments/:id", async (req, res): Promise<void> => {
  const raw = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const id = parseInt(raw, 10);
  if (isNaN(id)) {
    res.status(400).json({ error: "Invalid id" });
    return;
  }

  const parsed = UpdateAppointmentBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const [appt] = await db
    .update(appointmentsTable)
    .set(parsed.data)
    .where(eq(appointmentsTable.id, id))
    .returning();

  if (!appt) {
    res.status(404).json({ error: "Appointment not found" });
    return;
  }

  const [patient] = await db.select().from(patientsTable).where(eq(patientsTable.id, appt.patientId));

  res.json(formatAppointment({ ...appt, firstName: patient?.firstName, lastName: patient?.lastName, avatar: patient?.avatar }));
});

router.delete("/appointments/:id", async (req, res): Promise<void> => {
  const raw = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const id = parseInt(raw, 10);
  if (isNaN(id)) {
    res.status(400).json({ error: "Invalid id" });
    return;
  }

  const [appt] = await db.delete(appointmentsTable).where(eq(appointmentsTable.id, id)).returning();
  if (!appt) {
    res.status(404).json({ error: "Appointment not found" });
    return;
  }

  res.sendStatus(204);
});

export default router;
