import { pgTable, text, serial, timestamp, doublePrecision, jsonb, boolean } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const calculatorSessionsTable = pgTable("calculator_sessions", {
  id: serial("id").primaryKey(),
  email: text("email"),
  annualCases: doublePrecision("annual_cases"),
  hospitals: doublePrecision("hospitals"),
  calculatedUpside: doublePrecision("calculated_upside").notNull(),
  inputs: jsonb("inputs").notNull(),
  isTest: boolean("is_test").notNull().default(false),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const insertCalculatorSessionSchema = createInsertSchema(calculatorSessionsTable).omit({ id: true, createdAt: true });
export type InsertCalculatorSession = z.infer<typeof insertCalculatorSessionSchema>;
export type CalculatorSession = typeof calculatorSessionsTable.$inferSelect;
