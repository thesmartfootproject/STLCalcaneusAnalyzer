import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";

interface HomeProps {
  sessionId: string;
}

const Home = ({ sessionId }: HomeProps) => {
  return (
    <div className="container mx-auto">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-10">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            STL Batch Processor for Calcaneus Analysis
          </h1>
          <p className="text-xl text-gray-600">
            Upload, process and visualize STL files to analyze screws placement in calcaneus surfaces
          </p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <i className="fas fa-upload mr-2 text-primary-600"></i> File Upload
              </CardTitle>
              <CardDescription>
                Upload your STL files for analysis
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="mb-4 text-sm text-gray-600">
                Upload a medial surface STL file, a lateral surface STL file, and a ZIP file containing screw STL files.
              </p>
              <Link href="/upload">
                <Button className="w-full">
                  <i className="fas fa-file-upload mr-2"></i> Go to Upload
                </Button>
              </Link>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <i className="fas fa-cubes mr-2 text-primary-600"></i> 3D Visualization
              </CardTitle>
              <CardDescription>
                View your models in 3D
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="mb-4 text-sm text-gray-600">
                Interactive 3D visualization of medial and lateral surfaces with screws and breach points.
              </p>
              <Link href="/visualization">
                <Button className="w-full">
                  <i className="fas fa-cube mr-2"></i> View Models
                </Button>
              </Link>
            </CardContent>
          </Card>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <i className="fas fa-table mr-2 text-primary-600"></i> Results
              </CardTitle>
              <CardDescription>
                View analysis results
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="mb-4 text-sm text-gray-600">
                Review breach detection and measurements in tabular format.
              </p>
              <Link href="/results">
                <Button variant="outline" className="w-full">Go to Results</Button>
              </Link>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <i className="fas fa-cog mr-2 text-primary-600"></i> Settings
              </CardTitle>
              <CardDescription>
                Customize your experience
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="mb-4 text-sm text-gray-600">
                Adjust tolerance levels, color schemes, and visualization options.
              </p>
              <Link href="/settings">
                <Button variant="outline" className="w-full">Go to Settings</Button>
              </Link>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <i className="fas fa-list mr-2 text-primary-600"></i> Logs
              </CardTitle>
              <CardDescription>
                View processing logs
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="mb-4 text-sm text-gray-600">
                Detailed logs of the STL processing for debugging and verification.
              </p>
              <Link href="/logs">
                <Button variant="outline" className="w-full">View Logs</Button>
              </Link>
            </CardContent>
          </Card>
        </div>
        
        <div className="mt-8 p-4 bg-gray-50 rounded-lg text-center">
          <p className="text-sm text-gray-600">
            Current Session ID: <span className="font-mono font-semibold">{sessionId.slice(0, 8)}...</span>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Home;
