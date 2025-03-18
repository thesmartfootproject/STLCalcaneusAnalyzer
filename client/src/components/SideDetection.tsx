import { Card, CardContent } from "@/components/ui/card";

interface SideDetectionProps {
  meanXMedial: string;
  meanXLateral: string;
  side: string;
}

const SideDetection = ({ meanXMedial, meanXLateral, side }: SideDetectionProps) => {
  return (
    <div className="bg-gray-50 p-4 rounded-lg mb-6">
      <h4 className="text-md font-medium text-gray-700 mb-3">Side Detection</h4>
      <div className="grid grid-cols-2 gap-4 mb-4">
        <div>
          <p className="text-sm text-gray-600">Mean X (Medial)</p>
          <p className="text-lg font-semibold">{meanXMedial} mm</p>
        </div>
        <div>
          <p className="text-sm text-gray-600">Mean X (Lateral)</p>
          <p className="text-lg font-semibold">{meanXLateral} mm</p>
        </div>
      </div>
      <div className="bg-primary-100 p-3 rounded-md">
        <p className="text-primary-800 font-medium">
          Result: This is a <span className="font-bold">{side}</span>
        </p>
      </div>
    </div>
  );
};

export default SideDetection;
