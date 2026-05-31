import { Router, type IRouter } from "express";
import { eq, ilike, or, sql } from "drizzle-orm";
import { db, patientsTable } from "@workspace/db";
import { CreatePatientBody, UpdatePatientBody, GetPatientParams, UpdatePatientParams, DeletePatientParams } from "@workspace/api-zod";

const router: IRouter = Router();

function formatPatient(p: any) {
  return {
    id: p.id,
    firstName: p.firstName,
    lastName: p.lastName,
    phone: p.phone,
    email: p.email,
    dateOfBirth: p.dateOfBirth,
    gender: p.gender,
    bloodType: p.bloodType,
    status: p.status,
    avatar: p.avatar,
    createdAt: p.createdAt instanceof Date ? p.createdAt.toISOString() : String(p.createdAt),
    lastVisit: p.lastVisit instanceof Date ? p.lastVisit.toISOString() : (p.lastVisit ?? null),
  };
}

function formatPatientDetail(p: any) {
  return {
    ...formatPatient(p),
    address: p.address,
    allergies: p.allergies ?? [],
    medications: p.medications ?? [],
    medicalHistory: p.medicalHistory,
    doctorNotes: p.doctorNotes,
    isSmoker: p.isSmoker ?? false,
    hasDiabetes: p.hasDiabetes ?? false,
    hasHypertension: p.hasHypertension ?? false,
    insuranceProvider: p.insuranceProvider,
    insuranceNumber: p.insuranceNumber,
    emergencyContact: p.emergencyContact,
    emergencyPhone: p.emergencyPhone,
  };
}

router.get("/patients", async (req, res): Promise<void> => {
  const { search, status } = req.query as { search?: string; status?: string };

  let query = db.select().from(patientsTable);

  const conditions = [];
  if (search) {
    conditions.push(
      or(
        ilike(patientsTable.firstName, `%${search}%`),
        ilike(patientsTable.lastName, `%${search}%`),
        ilike(patientsTable.phone, `%${search}%`)
      )
    );
  }
  if (status) {
    conditions.push(eq(patientsTable.status, status));
  }

  const patients = conditions.length > 0
    ? await db.select().from(patientsTable).where(sql`${conditions.reduce((a, b) => sql`${a} AND ${b}`)}`)
    : await db.select().from(patientsTable).orderBy(patientsTable.createdAt);

  res.json(patients.map(formatPatient));
});

router.post("/patients", async (req, res): Promise<void> => {
  const parsed = CreatePatientBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const [patient] = await db.insert(patientsTable).values(parsed.data).returning();
  res.status(201).json(formatPatientDetail(patient));
});

router.get("/patients/:id", async (req, res): Promise<void> => {
  const raw = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const id = parseInt(raw, 10);
  if (isNaN(id)) {
    res.status(400).json({ error: "Invalid id" });
    return;
  }

  const [patient] = await db.select().from(patientsTable).where(eq(patientsTable.id, id));
  if (!patient) {
    res.status(404).json({ error: "Patient not found" });
    return;
  }

  res.json(formatPatientDetail(patient));
});

router.patch("/patients/:id", async (req, res): Promise<void> => {
  const raw = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const id = parseInt(raw, 10);
  if (isNaN(id)) {
    res.status(400).json({ error: "Invalid id" });
    return;
  }

  const parsed = UpdatePatientBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const [patient] = await db
    .update(patientsTable)
    .set(parsed.data)
    .where(eq(patientsTable.id, id))
    .returning();

  if (!patient) {
    res.status(404).json({ error: "Patient not found" });
    return;
  }

  res.json(formatPatient(patient));
});

router.delete("/patients/:id", async (req, res): Promise<void> => {
  const raw = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const id = parseInt(raw, 10);
  if (isNaN(id)) {
    res.status(400).json({ error: "Invalid id" });
    return;
  }

  const [patient] = await db.delete(patientsTable).where(eq(patientsTable.id, id)).returning();
  if (!patient) {
    res.status(404).json({ error: "Patient not found" });
    return;
  }

  res.sendStatus(204);
});

router.get("/patients/:id/ai-recommendations", async (req, res): Promise<void> => {
  const raw = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const id = parseInt(raw, 10);
  if (isNaN(id)) {
    res.status(400).json({ error: "Invalid id" });
    return;
  }

  const [patient] = await db.select().from(patientsTable).where(eq(patientsTable.id, id));
  if (!patient) {
    res.status(404).json({ error: "Patient not found" });
    return;
  }

  const recommendations = [];
  let recId = 1;

  const age = new Date().getFullYear() - new Date(patient.dateOfBirth).getFullYear();

  if (patient.isSmoker) {
    recommendations.push({
      id: recId++,
      type: "periodontal",
      title: "Periodontal Disease Risk",
      description: "Patient is a smoker. Recommend periodontal screening every 3 months and oral cancer screening at every visit.",
      priority: "high",
    });
  }

  if (patient.hasDiabetes) {
    recommendations.push({
      id: recId++,
      type: "medical_alert",
      title: "Diabetic Patient Protocol",
      description: "Monitor blood glucose before invasive procedures. Increased infection risk — use prophylactic antibiotics for extractions. Healing may be delayed.",
      priority: "critical",
    });
  }

  if (patient.hasHypertension) {
    recommendations.push({
      id: recId++,
      type: "medical_alert",
      title: "Hypertension Alert",
      description: "Check blood pressure before procedures. Limit epinephrine in local anesthesia. Avoid NSAIDs post-procedure.",
      priority: "high",
    });
  }

  if (age >= 40) {
    recommendations.push({
      id: recId++,
      type: "radiographic",
      title: "Annual Radiographic Assessment",
      description: "Patient is over 40. Annual full-mouth X-rays recommended to monitor bone density and detect early pathologies.",
      priority: "medium",
    });
  }

  if ((patient.allergies ?? []).length > 0) {
    recommendations.push({
      id: recId++,
      type: "medical_alert",
      title: "Known Allergies",
      description: `Patient has documented allergies: ${(patient.allergies ?? []).join(", ")}. Verify before prescribing medications or using materials.`,
      priority: "critical",
    });
  }

  recommendations.push({
    id: recId++,
    type: "preventive",
    title: "Routine Prophylaxis",
    description: "Schedule professional cleaning every 6 months. Reinforce oral hygiene instructions at each visit.",
    priority: "low",
  });

  res.json(recommendations);
});

export default router;
