import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { toast } from "@/hooks/use-toast";
import { useToast } from "@/hooks/use-toast";
import { useQuery } from "@tanstack/react-query";
import FileDropzone from "@/components/FileDropzone";
import { uploadFiles, processFiles } from "@/lib/stlProcessor";
import { useLocation } from "wouter";

interface FileUploadProps {
  sessionId: string;
}

const FileUpload = ({ sessionId }: FileUploadProps) => {
  const [medialFile, setMedialFile] = useState<File | null>(null);
  const [lateralFile, setLateralFile] = useState<File | null>(null);
  const [screwsFile, setScrewsFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const { toast } = useToast();
  const [_, setLocation] = useLocation();
  
  // Fetch any existing files for this session
  const { data: filesData } = useQuery({
    queryKey: [`/api/files/${sessionId}`],
    enabled: !!sessionId,
  });
  
  const handleProcess = async () => {
    if (!sessionId) {
      toast({
        title: "Error",
        description: "No active session found",
        variant: "destructive"
      });
      return;
    }
    
    if (!medialFile || !lateralFile || !screwsFile) {
      toast({
        title: "Missing Files",
        description: "Please upload all required files (medial, lateral, and screws)",
        variant: "destructive"
      });
      return;
    }
    
    try {
      setIsUploading(true);
      // Upload files
      const uploadResult = await uploadFiles(
        sessionId, 
        medialFile, 
        lateralFile, 
        screwsFile
      );
      
      if (!uploadResult.success) {
        throw new Error(uploadResult.message || "Failed to upload files");
      }
      
      setIsUploading(false);
      setIsProcessing(true);
      
      // Process files
      await processFiles(sessionId);
      
      toast({
        title: "Success",
        description: "Files processed successfully",
      });
      
      // Navigate to results page
      setLocation("/results");
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "An error occurred during processing",
        variant: "destructive"
      });
    } finally {
      setIsUploading(false);
      setIsProcessing(false);
    }
  };
  
  return (
    <section id="upload" className="mb-8">
      <Card>
        <CardContent className="pt-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">File Upload</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <FileDropzone 
              label="Medial Surface (STL)"
              accept={{ 'model/stl': ['.stl'] }}
              fileType="medial"
              onChange={setMedialFile}
              value={medialFile}
              helpText="STL file only"
            />
            
            <FileDropzone 
              label="Lateral Surface (STL)"
              accept={{ 'model/stl': ['.stl'] }}
              fileType="lateral"
              onChange={setLateralFile}
              value={lateralFile}
              helpText="STL file only"
            />
            
            <div className="col-span-1 md:col-span-2">
              <FileDropzone 
                label="Screws (ZIP file containing STL files)"
                accept={{ 
                  'application/zip': ['.zip'], 
                  'application/x-zip-compressed': ['.zip'] 
                }}
                fileType="screws"
                onChange={setScrewsFile}
                value={screwsFile}
                helpText="ZIP file containing STL files (max 48 files)"
              />
            </div>
          </div>
          
          <div className="flex items-center justify-end mt-6 space-x-3">
            <Button
              disabled={!medialFile || !lateralFile || !screwsFile || isUploading || isProcessing}
              onClick={handleProcess}
            >
              {isUploading ? (
                <>
                  <i className="fas fa-spinner fa-spin mr-2"></i> Uploading...
                </>
              ) : isProcessing ? (
                <>
                  <i className="fas fa-cogs fa-spin mr-2"></i> Processing...
                </>
              ) : (
                <>
                  <i className="fas fa-cogs mr-2"></i> Process Files
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>
    </section>
  );
};

export default FileUpload;
