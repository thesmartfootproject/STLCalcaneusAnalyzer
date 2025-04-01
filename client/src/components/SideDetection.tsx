
import React from 'react';
import { Card, CardContent } from "@/components/ui/card";

interface SideDetectionProps {
  meanXMedial: string;
  meanXLateral: string;
  side: string;
}

const SideDetection: React.FC<SideDetectionProps> = ({ meanXMedial, meanXLateral, side }) => {
  return (
    <div className="bg-gray-50 p-4 rounded-lg mb-6">
      <h4 className="text-md font-medium text-gray-700 mb-3">Side Detection</h4>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div>
          <p className="text-sm text-gray-500">Mean X (Medial)</p>
          <p className="text-lg font-medium">{parseFloat(meanXMedial).toFixed(2)} mm</p>
        </div>
        <div>
          <p className="text-sm text-gray-500">Mean X (Lateral)</p>
          <p className="text-lg font-medium">{parseFloat(meanXLateral).toFixed(2)} mm</p>
        </div>
        <div>
          <p className="text-sm text-gray-500">Detected Side</p>
          <p className="text-lg font-medium">{side}</p>
        </div>
      </div>
    </div>
  );
};

export default SideDetection;
