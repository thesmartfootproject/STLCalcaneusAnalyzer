import { exec } from "child_process";
import fs from "fs";
import path from "path";
import { promisify } from "util";
import { ScrewResult } from "@shared/schema";
import { extractFilesFromZip } from "./utils/zipExtractor";

const execAsync = promisify(exec);

interface ProcessingResult {
  side: string;
  meanXMedial: number;
  meanXLateral: number;
  results: ScrewResult[];
  logs: string;
}

export async function processStlFiles(
  medialFilePath: string,
  lateralFilePath: string,
  screwsFilePath: string,
  tolerance: number = 0.5
): Promise<ProcessingResult> {
  // Extract screws from zip file if it's a zip
  let screwsDir = screwsFilePath;
  if (screwsFilePath.toLowerCase().endsWith('.zip')) {
    const extractionDir = path.join(path.dirname(screwsFilePath), 'extracted_screws');
    
    // Ensure the extraction directory exists
    if (!fs.existsSync(extractionDir)) {
      fs.mkdirSync(extractionDir, { recursive: true });
    }
    
    // Extract zip file contents
    await extractFilesFromZip(screwsFilePath, extractionDir);
    screwsDir = extractionDir;
  }

  // Python script path - using forward slashes for Python compatibility
  const scriptPath = path.join(process.cwd(), 'server', 'pythonScripts', 'stlProcessor.py').replace(/\\/g, '/');
  
  // Convert file paths to forward slashes for Python compatibility
  const medialPath = medialFilePath.replace(/\\/g, '/');
  const lateralPath = lateralFilePath.replace(/\\/g, '/');
  const screwsPath = screwsDir.replace(/\\/g, '/');

  try {
    // Execute Python script with proper path handling
    const { stdout, stderr } = await execAsync(`python "${scriptPath}" "${medialPath}" "${lateralPath}" "${screwsPath}" ${tolerance}`);
    
    if (stderr) {
      console.error('Python script error:', stderr);
      throw new Error(`Python script error: ${stderr}`);
    }

    // Parse the results
    const results = JSON.parse(stdout);
    return results;
  } catch (error) {
    console.error('Error processing STL files:', error);
    throw error;
  }
}
