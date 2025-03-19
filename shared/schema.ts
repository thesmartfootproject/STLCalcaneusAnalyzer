import { pgTable, serial, text, timestamp, boolean, integer, json } from 'drizzle-orm/pg-core';
import { createInsertSchema } from 'drizzle-zod';
import { z } from 'zod';

// User model
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull()
});

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true
});

// STL files model
export const stlFiles = pgTable("stl_files", {
  id: serial("id").primaryKey(),
  sessionId: text("session_id").notNull(),
  fileName: text("file_name").notNull(),
  filePath: text("file_path").notNull(),
  fileType: text("file_type").notNull(), // 'medial', 'lateral', 'screws'
  uploadedAt: timestamp("uploaded_at").defaultNow()
});

export const insertStlFileSchema = createInsertSchema(stlFiles).omit({
  id: true,
  uploadedAt: true
});

// Processing results model
export const processingResults = pgTable("processing_results", {
  id: serial("id").primaryKey(),
  sessionId: text("session_id").notNull().unique(),
  side: text("side").notNull(),
  meanXMedial: text("mean_x_medial").notNull(),
  meanXLateral: text("mean_x_lateral").notNull(),
  results: json("results").notNull().$type<ScrewResult[]>(),
  tolerance: text("tolerance").notNull(),
  logs: text("logs").notNull(),
  processedAt: timestamp("processed_at").defaultNow()
});

export const insertProcessingResultSchema = createInsertSchema(processingResults).omit({
  id: true,
  processedAt: true
});

// Processing settings model
export const processingSettings = pgTable("processing_settings", {
  id: serial("id").primaryKey(),
  userId: integer("user_id"),
  tolerance: text("tolerance").notNull().default("0.5"),
  colorScheme: text("color_scheme").notNull().default("standard"),
  showAxes: boolean("show_axes").notNull().default(true),
  showMeasurements: boolean("show_measurements").notNull().default(true),
  highlightBreaches: boolean("highlight_breaches").notNull().default(true),
  enableTransparency: boolean("enable_transparency").notNull().default(false)
});

export const insertSettingsSchema = createInsertSchema(processingSettings).omit({
  id: true
});

// Screw result schema for processing
export const screwResultSchema = z.object({
  fileName: z.string(),
  distanceToMedial: z.number(),
  distanceToLateral: z.number(),
  breachStatus: z.enum(["No breach", "Medial breach", "Lateral breach", "Both breach"]),
  breachPoints: z.array(z.array(z.number())).nullable()
});

// Type definitions
export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;
export type StlFile = typeof stlFiles.$inferSelect;
export type InsertStlFile = z.infer<typeof insertStlFileSchema>;
export type ProcessingResult = typeof processingResults.$inferSelect;
export type InsertProcessingResult = z.infer<typeof insertProcessingResultSchema>;
export type ProcessingSetting = typeof processingSettings.$inferSelect;
export type InsertProcessingSetting = z.infer<typeof insertSettingsSchema>;
export type ScrewResult = z.infer<typeof screwResultSchema>;