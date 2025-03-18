import { pgTable, text, serial, integer, boolean, jsonb, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
});

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
});

export const stlFiles = pgTable("stl_files", {
  id: serial("id").primaryKey(),
  sessionId: text("session_id").notNull(),
  fileType: text("file_type").notNull(), // 'medial', 'lateral', 'screw'
  fileName: text("file_name").notNull(),
  filePath: text("file_path").notNull(),
  uploadedAt: timestamp("uploaded_at").defaultNow(),
});

export const insertStlFileSchema = createInsertSchema(stlFiles).omit({
  id: true,
  uploadedAt: true,
});

export const processingResults = pgTable("processing_results", {
  id: serial("id").primaryKey(),
  sessionId: text("session_id").notNull(),
  side: text("side").notNull(), // 'Left Calcaneus' or 'Right Calcaneus'
  meanXMedial: text("mean_x_medial").notNull(),
  meanXLateral: text("mean_x_lateral").notNull(),
  results: jsonb("results").notNull(),
  processedAt: timestamp("processed_at").defaultNow(),
  tolerance: text("tolerance").default("0.5"),
  logs: text("logs").notNull(),
});

export const insertProcessingResultSchema = createInsertSchema(processingResults).omit({
  id: true,
  processedAt: true,
});

export const processingSettings = pgTable("processing_settings", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id),
  tolerance: text("tolerance").default("0.5"),
  colorScheme: text("color_scheme").default("standard"),
  showAxes: boolean("show_axes").default(true),
  showMeasurements: boolean("show_measurements").default(true),
  highlightBreaches: boolean("highlight_breaches").default(true),
  enableTransparency: boolean("enable_transparency").default(false),
});

export const insertSettingsSchema = createInsertSchema(processingSettings).omit({
  id: true,
});

// Result object structure
export const screwResultSchema = z.object({
  fileName: z.string(),
  distanceToMedial: z.number(),
  distanceToLateral: z.number(),
  breachStatus: z.enum(['No breach', 'Medial breach', 'Lateral breach', 'Both breach']),
  breachPoints: z.array(z.array(z.number())).optional(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;
export type StlFile = typeof stlFiles.$inferSelect;
export type InsertStlFile = z.infer<typeof insertStlFileSchema>;
export type ProcessingResult = typeof processingResults.$inferSelect;
export type InsertProcessingResult = z.infer<typeof insertProcessingResultSchema>;
export type ProcessingSetting = typeof processingSettings.$inferSelect;
export type InsertProcessingSetting = z.infer<typeof insertSettingsSchema>;
export type ScrewResult = z.infer<typeof screwResultSchema>;
