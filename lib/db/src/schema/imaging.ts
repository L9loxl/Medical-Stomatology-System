import { pgTable, text, serial, timestamp, integer } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { patientsTable } from "./patients";

export const medicalImagesTable = pgTable("medical_images", {
  id: serial("id").primaryKey(),
  patientId: integer("patient_id").notNull().references(() => patientsTable.id, { onDelete: "cascade" }),
  type: text("type").notNull().default("other"),
  url: text("url").notNull(),
  thumbnailUrl: text("thumbnail_url"),
  date: text("date").notNull(),
  description: text("description"),
  toothNumber: integer("tooth_number"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const insertMedicalImageSchema = createInsertSchema(medicalImagesTable).omit({ id: true, createdAt: true });
export type InsertMedicalImage = z.infer<typeof insertMedicalImageSchema>;
export type MedicalImage = typeof medicalImagesTable.$inferSelect;
