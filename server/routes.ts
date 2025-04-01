import type { Express, Request, Response } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import multer from "multer";
import path from "path";
import fs from "fs";
import { randomUUID } from "crypto";
import { z } from "zod";
import { processStlFiles } from "./stlProcessor";
import { insertStlFileSchema, insertProcessingResultSchema, insertSettingsSchema } from "@shared/schema";

// Setup storage for file uploads
const uploadDir = path.join(process.cwd(), "uploads");

// Ensure upload directory exists
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// Configure multer for file uploads
const stlStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    const sessionId = req.body.sessionId || randomUUID();
    const sessionDir = path.join(uploadDir, sessionId);
    
    if (!fs.existsSync(sessionDir)) {
      fs.mkdirSync(sessionDir, { recursive: true });
    }
    
    cb(null, sessionDir);
  },
  filename: (req, file, cb) => {
    // Use original filename
    cb(null, file.originalname);
  }
});

const upload = multer({ 
  storage: stlStorage,
  fileFilter: (req, file, cb) => {
    // Accept STL files and ZIP files
    if (
      file.mimetype === "application/octet-stream" ||
      file.originalname.toLowerCase().endsWith('.stl') ||
      file.mimetype === "application/zip" ||
      file.originalname.toLowerCase().endsWith('.zip')
    ) {
      cb(null, true);
    } else {
      cb(new Error('Only STL and ZIP files are allowed'));
    }
  },
  limits: {
    fileSize: 50 * 1024 * 1024, // 50MB max file size
  }
});

export async function registerRoutes(app: Express): Promise<Server> {
  // Create session ID
  app.post("/api/sessions", async (req: Request, res: Response) => {
    const sessionId = randomUUID();
    res.json({ sessionId });
  });
  
  // Upload STL files
  app.post("/api/upload", upload.fields([
    { name: 'medial', maxCount: 1 },
    { name: 'lateral', maxCount: 1 },
    { name: 'screws', maxCount: 1 }
  ]), async (req: Request, res: Response) => {
    try {
      const sessionId = req.body.sessionId;
      
      if (!sessionId) {
        return res.status(400).json({ message: "Session ID is required" });
      }
      
      const files = req.files as { [fieldname: string]: Express.Multer.File[] };
      const savedFiles = [];
      
      if (files.medial) {
        const medialFile = files.medial[0];
        const stlFile = insertStlFileSchema.parse({
          sessionId,
          fileType: 'medial',
          fileName: medialFile.originalname,
          filePath: medialFile.path
        });
        
        const savedFile = await storage.saveStlFile(stlFile);
        savedFiles.push(savedFile);
      }
      
      if (files.lateral) {
        const lateralFile = files.lateral[0];
        const stlFile = insertStlFileSchema.parse({
          sessionId,
          fileType: 'lateral',
          fileName: lateralFile.originalname,
          filePath: lateralFile.path
        });
        
        const savedFile = await storage.saveStlFile(stlFile);
        savedFiles.push(savedFile);
      }
      
      if (files.screws) {
        const screwsFile = files.screws[0];
        const stlFile = insertStlFileSchema.parse({
          sessionId,
          fileType: 'screws',
          fileName: screwsFile.originalname,
          filePath: screwsFile.path
        });
        
        const savedFile = await storage.saveStlFile(stlFile);
        savedFiles.push(savedFile);
      }
      
      res.status(201).json({ files: savedFiles });
    } catch (error) {
      console.error("Error uploading files:", error);
      res.status(500).json({ message: "Error uploading files" });
    }
  });
  
  // Get files by session ID
  app.get("/api/files/:sessionId", async (req: Request, res: Response) => {
    try {
      const { sessionId } = req.params;
      const files = await storage.getStlFilesBySession(sessionId);
      res.json({ files });
    } catch (error) {
      console.error("Error retrieving files:", error);
      res.status(500).json({ message: "Error retrieving files" });
    }
  });
  
  // Process STL files
  app.post("/api/process", async (req: Request, res: Response) => {
    try {
      const requestSchema = z.object({
        sessionId: z.string(),
        tolerance: z.string().default("0.5")
      });
      
      const { sessionId, tolerance } = requestSchema.parse(req.body);
      
      const medialFiles = await storage.getStlFilesBySessionAndType(sessionId, 'medial');
      const lateralFiles = await storage.getStlFilesBySessionAndType(sessionId, 'lateral');
      const screwFiles = await storage.getStlFilesBySessionAndType(sessionId, 'screws');
      
      if (medialFiles.length === 0 || lateralFiles.length === 0 || screwFiles.length === 0) {
        return res.status(400).json({ message: "Missing required files (medial, lateral, and screws)" });
      }
      
      const medialFile = medialFiles[0];
      const lateralFile = lateralFiles[0];
      const screwsFile = screwFiles[0];

      const processingResult = await processStlFiles(
        medialFile.filePath,
        lateralFile.filePath,
        screwsFile.filePath,
        parseFloat(tolerance)
      );
      
      const savedResult = await storage.saveProcessingResult(insertProcessingResultSchema.parse({
        sessionId,
        side: processingResult.side,
        meanXMedial: processingResult.meanXMedial.toString(),
        meanXLateral: processingResult.meanXLateral.toString(),
        results: processingResult.results,
        tolerance,
        logs: processingResult.logs
      }));
      
      res.json(savedResult);
    } catch (error) {
      console.error("Error processing files:", error);
      if (error instanceof Error) {
        res.status(500).json({ message: `Error processing files: ${error.message}` });
      } else {
        res.status(500).json({ message: "Error processing files" });
      }
    }
  });
  
  // Get processing results
  app.get("/api/results/:sessionId", async (req: Request, res: Response) => {
    try {
      const { sessionId } = req.params;
      const result = await storage.getResultsBySession(sessionId);
      
      if (!result) {
        return res.status(404).json({ message: "Results not found" });
      }
      
      res.json(result);
    } catch (error) {
      console.error("Error retrieving results:", error);
      res.status(500).json({ message: "Error retrieving results" });
    }
  });
  
  // Save settings
  app.post("/api/settings", async (req: Request, res: Response) => {
    try {
      const settings = insertSettingsSchema.parse(req.body);
      const savedSettings = await storage.saveSettings(settings);
      res.json(savedSettings);
    } catch (error) {
      console.error("Error saving settings:", error);
      res.status(500).json({ message: "Error saving settings" });
    }
  });
  
  // Get default settings
  app.get("/api/settings/default", async (req: Request, res: Response) => {
    try {
      const settings = await storage.getDefaultSettings();
      res.json(settings);
    } catch (error) {
      console.error("Error retrieving default settings:", error);
      res.status(500).json({ message: "Error retrieving default settings" });
    }
  });
  
  // Get settings by user ID
  app.get("/api/settings/:userId", async (req: Request, res: Response) => {
    try {
      const userId = parseInt(req.params.userId);
      const settings = await storage.getSettingsForUser(userId);
      
      if (!settings) {
        const defaultSettings = await storage.getDefaultSettings();
        return res.json(defaultSettings);
      }
      
      res.json(settings);
    } catch (error) {
      console.error("Error retrieving settings:", error);
      res.status(500).json({ message: "Error retrieving settings" });
    }
  });
  
  // Export results as CSV
  app.get("/api/export/:sessionId", async (req: Request, res: Response) => {
    try {
      const { sessionId } = req.params;
      const result = await storage.getResultsBySession(sessionId);
      
      if (!result) {
        return res.status(404).json({ message: "Results not found" });
      }
      
      // Handle different results formats - could be string or already an object
      let resultsArray;
      if (typeof result.results === 'string') {
        try {
          resultsArray = JSON.parse(result.results);
        } catch (e) {
          console.error("Failed to parse results string:", e);
          return res.status(500).json({ message: "Invalid results data format" });
        }
      } else if (Array.isArray(result.results)) {
        resultsArray = result.results;
      } else {
        console.error("Results is not in expected format:", typeof result.results);
        return res.status(500).json({ message: "Invalid results data format" });
      }
      
      // Generate CSV content
      let csvContent = "Screw File,Distance to Medial Wall,Distance to Lateral Wall,Breach Status\n";
      
      for (const row of resultsArray) {
        csvContent += `${row.fileName},${row.distanceToMedial},${row.distanceToLateral},${row.breachStatus}\n`;
      }
      
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename="stl-analysis-${sessionId}.csv"`);
      res.status(200).send(csvContent);
    } catch (error) {
      console.error("Error exporting results:", error);
      res.status(500).json({ message: "Error exporting results" });
    }
  });

  // Get results by ID
  app.get("/api/results/:id", async (req: Request, res: Response) => {
    try {
      const id = req.params.id;
      
      // Try to parse as number first
      const numericId = parseInt(id);
      if (!isNaN(numericId)) {
        const result = await storage.getResultById(numericId);
        if (!result) {
          return res.status(404).json({ message: "Result not found" });
        }
        return res.json(result);
      }
      
      // If not a number, try to get by session ID
      const result = await storage.getResultsBySession(id);
      if (!result) {
        return res.status(404).json({ message: "Result not found" });
      }
      
      res.json(result);
    } catch (error) {
      console.error("Error getting result:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
