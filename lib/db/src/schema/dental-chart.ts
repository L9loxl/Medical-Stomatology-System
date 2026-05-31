import { pgTable, text, serial, timestamp, integer } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { patientsTable } from "./patients";

export const dentalChartTable = pgTable("dental_chart", {
  id: serial("id").primaryKey(),
  patientId: integer("patient_id").notNull().references(() => patientsTable.id, { onDelete: "cascade" }),
  toothNumber: integer("tooth_number").notNull(),
  status: text("status").notNull().default("healthy"),
  surface: text("surface").notNull().default(""),
  notes: text("notes"),
  color: text("color"),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
});

export const insertDentalChartSchema = createInsertSchema(dentalChartTable).omit({ id: true, updatedAt: true });
export type InsertDentalChart = z.infer<typeof insertDentalChartSchema>;
export type DentalChart = typeof dentalChartTable.$inferSelect;
