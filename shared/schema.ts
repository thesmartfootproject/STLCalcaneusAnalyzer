import { pgTable, text, serial, integer, boolean, real, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// User schema (keeping the existing one)
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
});

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;

// New schemas for the STL processor application
export const processingJobs = pgTable("processing_jobs", {
  id: serial("id").primaryKey(),
  createdAt: text("created_at").notNull(),
  status: text("status").notNull(), // "pending", "processing", "completed", "failed"
  medialFilePath: text("medial_file_path").notNull(),
  lateralFilePath: text("lateral_file_path").notNull(),
  screwsDirectoryPath: text("screws_directory_path").notNull(),
  tolerance: real("tolerance").notNull(),
  side: text("side").notNull(),
  meanXMedial: real("mean_x_medial").notNull(),
  meanXLateral: real("mean_x_lateral").notNull(),
  logs: text("logs").notNull(),
});

export const insertProcessingJobSchema = createInsertSchema(processingJobs).omit({
  id: true,
});

export type InsertProcessingJob = z.infer<typeof insertProcessingJobSchema>;
export type ProcessingJob = typeof processingJobs.$inferSelect;

export const screwResults = pgTable("screw_results", {
  id: serial("id").primaryKey(),
  jobId: integer("job_id").notNull(),
  screwName: text("screw_name").notNull(),
  breachDetected: boolean("breach_detected").notNull(),
  breachInfo: text("breach_info"),
  minDistMedial: real("min_dist_medial").notNull(),
  minDistLateral: real("min_dist_lateral").notNull(),
  breachPoints: jsonb("breach_points")
});

export const insertScrewResultSchema = createInsertSchema(screwResults).omit({
  id: true,
});

export type InsertScrewResult = z.infer<typeof insertScrewResultSchema>;
export type ScrewResult = typeof screwResults.$inferSelect;

// Client-side schemas for form validation
export const settingsSchema = z.object({
  tolerance: z.number().min(0.1).max(5.0).default(0.5),
  colorMode: z.enum(["standard", "distance", "monochrome", "xray"]).default("standard"),
  units: z.enum(["mm", "cm", "in"]).default("mm"),
  autoRotate: z.boolean().default(false),
  highlightBreachPoints: z.boolean().default(true),
});

export type Settings = z.infer<typeof settingsSchema>;

// DTOs for API responses
export const processingResultSchema = z.object({
  side: z.string(),
  meanXMedial: z.number(),
  meanXLateral: z.number(),
  screwResults: z.array(
    z.object({
      screwName: z.string(),
      breachDetected: z.boolean(),
      breachInfo: z.string().optional(),
      minDistMedial: z.number(),
      minDistLateral: z.number(),
      breachPoints: z.any().optional(),
    })
  ),
  logs: z.string(),
});

export type ProcessingResult = z.infer<typeof processingResultSchema>;
