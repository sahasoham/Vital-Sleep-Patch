import { pgTable, text, serial, timestamp, doublePrecision, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const demoRequestsTable = pgTable("demo_requests", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull(),
  institution: text("institution").notNull(),
  jobTitle: text("job_title"),
  calculatedUpside: doublePrecision("calculated_upside").notNull(),
  inputs: jsonb("inputs").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const insertDemoRequestSchema = createInsertSchema(demoRequestsTable).omit({ id: true, createdAt: true });
export type InsertDemoRequest = z.infer<typeof insertDemoRequestSchema>;
export type DemoRequest = typeof demoRequestsTable.$inferSelect;
