import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useState } from "react";

interface ProcessingLogsProps {
  logs: string;
}

const ProcessingLogs = ({ logs }: ProcessingLogsProps) => {
  const exportLog = () => {
    // Create a blob with the log content
    const blob = new Blob([logs], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    
    // Create a link and click it to download the file
    const a = document.createElement('a');
    a.href = url;
    a.download = `stl-processor-log-${new Date().toISOString().slice(0, 10)}.txt`;
    document.body.appendChild(a);
    a.click();
    
    // Clean up
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };
  
  // Colorize log messages
  const formatLogLine = (line: string) => {
    // Processing status
    if (line.includes('=== Processing Started') || line.includes('=== Processing Completed')) {
      return <span className="text-yellow-400">{line}</span>;
    }
    
    // Loading files 
    if (line.includes('Loading ')) {
      return <span className="text-gray-400">{line}</span>;
    }
    
    // Success messages
    if (line.includes('successfully') || line.includes('No breach detected')) {
      return <span className="text-green-400">{line}</span>;
    }
    
    // Screw processing
    if (line.includes('Processing Screw:')) {
      return <span className="text-yellow-400">{line}</span>;
    }
    
    // Breach detection
    if (line.includes('Breach Detected') || line.includes('breach at')) {
      return <span className="text-red-400">{line}</span>;
    }
    
    // Side detection
    if (line.includes('Side Detection:')) {
      return <span className="text-green-400">{line}</span>;
    }
    
    // Measurements
    if (line.includes('Mean X') || line.includes('Shortest distance')) {
      return <span className="text-white">{line}</span>;
    }
    
    // Default formatting
    if (line.includes('---')) {
      return <span className="text-gray-400">{line}</span>;
    }
    
    return line;
  };

  return (
    <div className="space-y-4">
      <div className="bg-gray-50 px-4 py-3 rounded-md flex justify-between items-center">
        <h4 className="text-md font-medium text-gray-700">Detailed Processing Log</h4>
        <Button 
          variant="ghost" 
          size="sm" 
          className="text-sm text-primary-600 hover:text-primary-800"
          onClick={exportLog}
        >
          <i className="fas fa-download mr-1"></i> Export Log
        </Button>
      </div>
      
      <div className="bg-gray-900 text-gray-200 p-4 rounded-md font-mono text-sm overflow-auto max-h-80">
        <div className="space-y-1">
          {logs.split('\n').map((line, index) => (
            <p key={index}>{formatLogLine(line)}</p>
          ))}
        </div>
      </div>
    </div>
  );
};

export default ProcessingLogs;
