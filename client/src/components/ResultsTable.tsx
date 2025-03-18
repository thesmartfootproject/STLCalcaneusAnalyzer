import { useState } from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { toast } from '@/hooks/use-toast';
import { ScrewResult } from '@shared/schema';

interface ResultsTableProps {
  results: ScrewResult[];
  sessionId: string;
  onViewScrew: (screwFile: string) => void;
}

const ResultsTable = ({ results, sessionId, onViewScrew }: ResultsTableProps) => {
  const [downloading, setDownloading] = useState(false);

  const downloadCSV = async () => {
    if (!sessionId) {
      toast({
        title: "Error",
        description: "No session found to export results",
        variant: "destructive"
      });
      return;
    }

    try {
      setDownloading(true);
      const response = await fetch(`/api/export/${sessionId}`);
      
      if (!response.ok) {
        throw new Error('Failed to export results');
      }
      
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.style.display = 'none';
      a.href = url;
      a.download = `stl-analysis-${sessionId.slice(0, 8)}.csv`;
      
      document.body.appendChild(a);
      a.click();
      
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      
      toast({
        title: "Success",
        description: "Results exported successfully",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to export results",
        variant: "destructive"
      });
    } finally {
      setDownloading(false);
    }
  };

  const getBreachStatusBadge = (status: string) => {
    switch (status) {
      case 'No breach':
        return (
          <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
            No breach
          </span>
        );
      case 'Medial breach':
        return (
          <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-red-100 text-red-800">
            Medial breach
          </span>
        );
      case 'Lateral breach':
        return (
          <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-red-100 text-red-800">
            Lateral breach
          </span>
        );
      case 'Both breach':
        return (
          <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-red-100 text-red-800">
            Both breach
          </span>
        );
      default:
        return (
          <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-gray-100 text-gray-800">
            Unknown
          </span>
        );
    }
  };

  return (
    <div className="overflow-x-auto">
      <div className="flex items-center justify-between mb-4">
        <h4 className="text-md font-medium text-gray-700">Screw Analysis Results</h4>
        <Button
          variant="outline"
          size="sm"
          className="text-secondary-700 bg-secondary-100 hover:bg-secondary-200 border-secondary-200"
          onClick={downloadCSV}
          disabled={downloading || results.length === 0}
        >
          <i className="fas fa-download mr-1.5"></i> Download CSV
        </Button>
      </div>
      
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Screw File</TableHead>
              <TableHead>Distance to Medial Wall</TableHead>
              <TableHead>Distance to Lateral Wall</TableHead>
              <TableHead>Breach Status</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {results.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-6 text-gray-500">
                  No results available. Process files to see results here.
                </TableCell>
              </TableRow>
            ) : (
              results.map((screw, index) => (
                <TableRow key={index}>
                  <TableCell className="font-medium">
                    {screw.fileName}
                  </TableCell>
                  <TableCell>
                    {screw.distanceToMedial.toFixed(2)} mm
                  </TableCell>
                  <TableCell>
                    {screw.distanceToLateral.toFixed(2)} mm
                  </TableCell>
                  <TableCell>
                    {getBreachStatusBadge(screw.breachStatus)}
                  </TableCell>
                  <TableCell>
                    <Button 
                      variant="link" 
                      className="text-primary-600 hover:text-primary-900 p-0"
                      onClick={() => onViewScrew(screw.fileName)}
                    >
                      View
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
};

export default ResultsTable;
