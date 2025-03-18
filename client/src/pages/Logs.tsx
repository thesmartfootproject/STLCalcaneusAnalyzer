import { Card, CardContent } from "@/components/ui/card";
import { useQuery } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { useLocation } from "wouter";
import ProcessingLogs from "@/components/ProcessingLogs";
import { getProcessingResults } from "@/lib/stlProcessor";
import { Button } from "@/components/ui/button";

interface LogsProps {
  sessionId: string;
}

const Logs = ({ sessionId }: LogsProps) => {
  const { toast } = useToast();
  const [_, setLocation] = useLocation();

  // Fetch processing results to get logs
  const { data: processingData, isLoading, error } = useQuery({
    queryKey: [`/api/results/${sessionId}`],
    enabled: !!sessionId,
    queryFn: async () => {
      if (!sessionId) return null;
      return await getProcessingResults(sessionId);
    }
  });
  
  if (isLoading) {
    return (
      <section id="logs" className="mb-8">
        <Card>
          <CardContent className="pt-6 text-center py-12">
            <i className="fas fa-spinner fa-spin text-primary-500 text-4xl mb-4"></i>
            <p className="text-gray-600">Loading logs...</p>
          </CardContent>
        </Card>
      </section>
    );
  }
  
  if (error || !processingData) {
    return (
      <section id="logs" className="mb-8">
        <Card>
          <CardContent className="pt-6">
            <div className="text-center py-8">
              <i className="fas fa-exclamation-circle text-red-500 text-4xl mb-4"></i>
              <h3 className="text-xl font-medium text-gray-800 mb-2">No Logs Found</h3>
              <p className="text-gray-600 mb-6">
                {error instanceof Error 
                  ? error.message 
                  : "You need to process files before you can view logs."}
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
    <section id="logs" className="mb-8">
      <Card>
        <CardContent className="pt-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Processing Logs</h3>
          
          <ProcessingLogs logs={processingData.logs} />
        </CardContent>
      </Card>
    </section>
  );
};

export default Logs;
