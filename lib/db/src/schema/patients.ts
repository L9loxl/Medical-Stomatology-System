import { pgTable, text, serial, timestamp, boolean } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const patientsTable = pgTable("patients", {
  id: serial("id").primaryKey(),
  firstName: text("first_name").notNull(),
  lastName: text("last_name").notNull(),
  phone: text("phone").notNull(),
  email: text("email"),
  dateOfBirth: text("date_of_birth").notNull(),
  gender: text("gender").notNull(),
  bloodType: text("blood_type"),
  status: text("status").notNull().default("active"),
  avatar: text("avatar"),
  address: text("address"),
  allergies: text("allergies").array().default([]),
  medications: text("medications").array().default([]),
  medicalHistory: text("medical_history"),
  doctorNotes: text("doctor_notes"),
  isSmoker: boolean("is_smoker").default(false),
  hasDiabetes: boolean("has_diabetes").default(false),
  hasHypertension: boolean("has_hypertension").default(false),
  insuranceProvider: text("insurance_provider"),
  insuranceNumber: text("insurance_number"),
  emergencyContact: text("emergency_contact"),
  emergencyPhone: text("emergency_phone"),
  lastVisit: timestamp("last_visit", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
});

export const insertPatientSchema = createInsertSchema(patientsTable).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertPatient = z.infer<typeof insertPatientSchema>;
export type Patient = typeof patientsTable.$inferSelect;
