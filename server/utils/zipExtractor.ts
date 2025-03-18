import fs from 'fs';
import path from 'path';
import AdmZip from 'adm-zip';

/**
 * Extracts files from a ZIP archive to a specified directory
 * @param zipFilePath - Path to the ZIP file
 * @param extractionDir - Directory where files should be extracted
 */
export async function extractFilesFromZip(zipFilePath: string, extractionDir: string): Promise<string[]> {
  try {
    // Ensure extraction directory exists
    if (!fs.existsSync(extractionDir)) {
      fs.mkdirSync(extractionDir, { recursive: true });
    }

    // Create instance of AdmZip
    const zip = new AdmZip(zipFilePath);
    
    // Get all entries
    const zipEntries = zip.getEntries();
    
    // Filter for STL files only
    const stlEntries = zipEntries.filter(entry => 
      !entry.isDirectory && entry.name.toLowerCase().endsWith('.stl')
    );
    
    // Extract STL files
    const extractedFiles: string[] = [];
    
    for (const entry of stlEntries) {
      const entryPath = path.join(extractionDir, entry.name);
      
      // Extract file
      zip.extractEntryTo(entry, extractionDir, false, true);
      
      extractedFiles.push(entryPath);
    }
    
    console.log(`Extracted ${extractedFiles.length} STL files from ZIP archive.`);
    return extractedFiles;
  } catch (error) {
    console.error('Error extracting ZIP file:', error);
    throw new Error(`Failed to extract ZIP file: ${error instanceof Error ? error.message : String(error)}`);
  }
}