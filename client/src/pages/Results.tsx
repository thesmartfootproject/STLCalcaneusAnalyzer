import { useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useQuery } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { useLocation } from "wouter";
import SideDetection from "@/components/SideDetection";
import ResultsTable from "@/components/ResultsTable";
import { getProcessingResults } from "@/lib/stlProcessor";
import { ScrewResult } from "@shared/schema";

interface ResultsProps {
  sessionId: string;
}

const Results = ({ sessionId }: ResultsProps) => {
  const { toast } = useToast();
  const [_, setLocation] = useLocation();
  const [results, setResults] = useState<ScrewResult[]>([]);
  
  // Fetch processing results
  const { data: processingData, isLoading, error } = useQuery({
    queryKey: [`/api/results/${sessionId}`],
    enabled: !!sessionId,
    queryFn: async () => {
      if (!sessionId) return null;
      return await getProcessingResults(sessionId);
    }
  });
  
  useEffect(() => {
    if (processingData) {
      // Parse results if they're a string
      const parsedResults = typeof processingData.results === 'string' 
        ? JSON.parse(processingData.results) 
        : processingData.results;
      
      setResults(parsedResults);
    }
  }, [processingData]);
  
  const handleViewScrew = (screwFile: string) => {
    // Navigate to visualization page with the selected screw
    setLocation(`/visualization?screw=${encodeURIComponent(screwFile)}`);
  };
  
  if (isLoading) {
    return (
      <section id="results" className="mb-8">
        <Card>
          <CardContent className="pt-6 text-center py-12">
            <i className="fas fa-spinner fa-spin text-primary-500 text-4xl mb-4"></i>
            <p className="text-gray-600">Loading results...</p>
          </CardContent>
        </Card>
      </section>
    );
  }
  
  if (error || !processingData || !results.length) {
    return (
      <section id="results" className="mb-8">
        <Card>
          <CardContent className="pt-6">
            <div className="text-center py-8">
              <i className="fas fa-exclamation-circle text-red-500 text-4xl mb-4"></i>
              <h3 className="text-xl font-medium text-gray-800 mb-2">No Results Found</h3>
              <p className="text-gray-600 mb-6">
                {error instanceof Error 
                  ? error.message 
                  : "You need to process files before you can view results."}
              </p>
              <Button onClick={() => setLocation("/upload")}>
                Go to File Upload
              </Button>
            </div>
          </CardContent>
        </Card>
      </section>
    );
  }
  
  return (
    <section id="results" className="mb-8">
      <Card>
        <CardContent className="pt-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Results</h3>
          
          <SideDetection 
            meanXMedial={processingData.meanXMedial}
            meanXLateral={processingData.meanXLateral}
            side={processingData.side}
          />
          
          <ResultsTable 
            results={results}
            sessionId={sessionId}
            onViewScrew={handleViewScrew}
          />
        </CardContent>
      </Card>
    </section>
  );
};

export default Results;
