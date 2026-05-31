import { pgTable, text, serial, timestamp, integer, numeric } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { patientsTable } from "./patients";
import { usersTable } from "./users";

export const treatmentsTable = pgTable("treatments", {
  id: serial("id").primaryKey(),
  patientId: integer("patient_id").notNull().references(() => patientsTable.id, { onDelete: "cascade" }),
  doctorId: integer("doctor_id").references(() => usersTable.id),
  name: text("name").notNull(),
  description: text("description"),
  status: text("status").notNull().default("planned"),
  startDate: text("start_date").notNull(),
  completedDate: text("completed_date"),
  cost: numeric("cost", { precision: 10, scale: 2 }).notNull().default("0"),
  toothNumbers: integer("tooth_numbers").array().default([]),
  notes: text("notes"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
});

export const insertTreatmentSchema = createInsertSchema(treatmentsTable).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertTreatment = z.infer<typeof insertTreatmentSchema>;
export type Treatment = typeof treatmentsTable.$inferSelect;
