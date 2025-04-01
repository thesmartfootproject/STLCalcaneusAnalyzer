import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useQuery } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { useLocation } from "wouter";
import StlViewer from "@/components/StlViewer";
import { getProcessingResults, getSettings } from "@/lib/stlProcessor";
import { ScrewResult } from "@shared/schema";

interface VisualizationProps {
  sessionId: string;
}

const Visualization = ({ sessionId }: VisualizationProps) => {
  const { toast } = useToast();
  const [location] = useLocation();
  const [results, setResults] = useState<ScrewResult[]>([]);
  const [selectedScrew, setSelectedScrew] = useState<string | undefined>(undefined);
  
  // UI state
  const [showMedial, setShowMedial] = useState(true);
  const [showLateral, setShowLateral] = useState(true);
  const [showScrews, setShowScrews] = useState(true);
  const [showBreaches, setShowBreaches] = useState(true);
  
  // Get screw from URL query parameter
  useEffect(() => {
    const url = new URL(window.location.href);
    const screwParam = url.searchParams.get('screw');
    if (screwParam) {
      setSelectedScrew(screwParam);
    }
  }, [location]);
  
  // Fetch processing results
  const { data: processingData, isLoading: resultsLoading } = useQuery({
    queryKey: [`/api/results/${sessionId}`],
    enabled: !!sessionId,
    queryFn: async () => {
      if (!sessionId) return null;
      return await getProcessingResults(sessionId);
    }
  });
  
  // Fetch settings
  const { data: settingsData, isLoading: settingsLoading } = useQuery({
    queryKey: [`/api/settings/default`],
    queryFn: async () => {
      return await getSettings();
    }
  });
  
  useEffect(() => {
    if (processingData) {
      console.log("Visualization: Processing data received:", processingData);
      
      // Parse results if they're a string
      const parsedResults = typeof processingData.results === 'string' 
        ? JSON.parse(processingData.results) 
        : processingData.results;
      
      console.log("Visualization: Parsed results:", parsedResults);
      
      setResults(parsedResults);
      
      // Set the first screw as selected if none is selected
      if (!selectedScrew && parsedResults && parsedResults.length > 0) {
        console.log("Visualization: Setting first screw as selected:", parsedResults[0].fileName);
        setSelectedScrew(parsedResults[0].fileName);
      }
    }
  }, [processingData, selectedScrew]);
  
  const handleScrewSelect = (screwFile: string) => {
    setSelectedScrew(screwFile);
  };
  
  if (resultsLoading || settingsLoading) {
    return (
      <section id="visualization" className="mb-8">
        <Card>
          <CardContent className="pt-6 text-center py-12">
            <i className="fas fa-spinner fa-spin text-primary-500 text-4xl mb-4"></i>
            <p className="text-gray-600">Loading visualization data...</p>
          </CardContent>
        </Card>
      </section>
    );
  }
  
  if (!processingData || results.length === 0) {
    return (
      <section id="visualization" className="mb-8">
        <Card>
          <CardContent className="pt-6">
            <div className="text-center py-8">
              <i className="fas fa-cube text-gray-400 text-4xl mb-4"></i>
              <h3 className="text-xl font-medium text-gray-800 mb-2">No Models Available</h3>
              <p className="text-gray-600 mb-6">
                You need to process files before you can view 3D models.
              </p>
              <Button onClick={() => window.location.href = "/upload"}>
                Go to File Upload
              </Button>
            </div>
          </CardContent>
        </Card>
      </section>
    );
  }
  
  return (
    <section id="visualization" className="mb-8">
      <Card>
        <CardContent className="pt-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">3D Visualization</h3>
          
          <StlViewer 
            sessionId={sessionId}
            selectedScrewFile={selectedScrew}
            results={results}
            showMedial={showMedial}
            showLateral={showLateral}
            showScrews={showScrews}
            showBreaches={showBreaches}
            enableTransparency={settingsData?.enableTransparency || false}
          />
          
          {/* Screw Selection for Visualization */}
          <div className="mt-6">
            <h4 className="text-md font-medium text-gray-700 mb-3">Screw Selection</h4>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-2">
              {results.map((screw, index) => (
                <button
                  key={index}
                  className={`flex flex-col items-center justify-center p-2 border rounded hover:bg-gray-50 ${
                    selectedScrew === screw.fileName
                      ? 'border-primary-200 bg-primary-50'
                      : 'border-gray-200'
                  }`}
                  onClick={() => handleScrewSelect(screw.fileName)}
                >
                  <div className={`w-full aspect-square flex items-center justify-center rounded-md mb-1 ${
                    selectedScrew === screw.fileName ? 'bg-primary-100' : 'bg-gray-100'
                  }`}>
                    <i className={`fas fa-bolt ${
                      selectedScrew === screw.fileName ? 'text-primary-600' : 'text-gray-400'
                    }`}></i>
                  </div>
                  <span className="text-xs truncate w-full text-center">{screw.fileName}</span>
                </button>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>
    </section>
  );
};

export default Visualization;
