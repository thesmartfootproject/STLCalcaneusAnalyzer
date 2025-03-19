import React, { useState } from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableHeader,
  TableHead,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { ScrewResult } from "@shared/schema";

interface ResultsTableProps {
  results: ScrewResult[];
  sessionId: string;
  onViewScrew: (fileName: string) => void;
}

const ResultsTable: React.FC<ResultsTableProps> = ({ results, sessionId, onViewScrew }) => {
  const { toast } = useToast();
  const [downloading, setDownloading] = useState(false);

  const getBreachStatusBadge = (status: string) => {
    switch (status) {
      case "No breach":
        return <Badge className="bg-green-100 text-green-800">No breach</Badge>;
      case "Medial breach":
        return <Badge className="bg-red-100 text-red-800">Medial breach</Badge>;
      case "Lateral breach":
        return <Badge className="bg-red-100 text-red-800">Lateral breach</Badge>;
      case "Both breach":
        return <Badge className="bg-red-100 text-red-800">Both breach</Badge>;
      default:
        return <Badge className="bg-gray-100 text-gray-800">{status}</Badge>;
    }
  };

  const handleExport = async () => {
    try {
      setDownloading(true);
      const response = await fetch(`/api/export/${sessionId}`);

      if (!response.ok) {
        throw new Error(`Failed to export results: ${response.statusText}`);
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
      console.error("Error exporting results:", error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to export results",
        variant: "destructive",
      });
    } finally {
      setDownloading(false);
    }
  };

  return (
    <div>
      <div className="flex justify-end mb-4">
        <Button onClick={handleExport} disabled={downloading}>
          <i className="fas fa-download mr-1.5"></i> Download CSV
        </Button>
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Screw File</TableHead>
              <TableHead>Distance to Medial Wall (mm)</TableHead>
              <TableHead>Distance to Lateral Wall (mm)</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Action</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {results.map((screw, index) => (
              <TableRow key={index}>
                <TableCell>{screw.fileName}</TableCell>
                <TableCell>{screw.distanceToMedial.toFixed(2)}</TableCell>
                <TableCell>{screw.distanceToLateral.toFixed(2)}</TableCell>
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
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
};

export default ResultsTable;