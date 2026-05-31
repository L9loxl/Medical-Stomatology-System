import { Router, type IRouter } from "express";
import { eq } from "drizzle-orm";
import { db, medicalImagesTable } from "@workspace/db";
import { CreateImageBody } from "@workspace/api-zod";

const router: IRouter = Router();

function formatImage(img: any) {
  return {
    id: img.id,
    patientId: img.patientId,
    type: img.type,
    url: img.url,
    thumbnailUrl: img.thumbnailUrl ?? null,
    date: img.date,
    description: img.description ?? null,
    toothNumber: img.toothNumber ?? null,
    createdAt: img.createdAt instanceof Date ? img.createdAt.toISOString() : String(img.createdAt),
  };
}

router.get("/imaging", async (req, res): Promise<void> => {
  const { patientId } = req.query as { patientId?: string };

  const images = patientId
    ? await db.select().from(medicalImagesTable).where(eq(medicalImagesTable.patientId, parseInt(patientId, 10)))
    : await db.select().from(medicalImagesTable);

  res.json(images.map(formatImage));
});

router.post("/imaging", async (req, res): Promise<void> => {
  const parsed = CreateImageBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const [image] = await db.insert(medicalImagesTable).values(parsed.data).returning();
  res.status(201).json(formatImage(image));
});

router.delete("/imaging/:id", async (req, res): Promise<void> => {
  const raw = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const id = parseInt(raw, 10);
  if (isNaN(id)) {
    res.status(400).json({ error: "Invalid id" });
    return;
  }

  const [image] = await db.delete(medicalImagesTable).where(eq(medicalImagesTable.id, id)).returning();
  if (!image) {
    res.status(404).json({ error: "Image not found" });
    return;
  }

  res.sendStatus(204);
});

export default router;
