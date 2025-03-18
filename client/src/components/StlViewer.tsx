import { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import { STLLoader } from "three/examples/jsm/loaders/STLLoader.js";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import { toast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { ScrewResult } from "@shared/schema";

interface StlViewerProps {
  sessionId: string;
  selectedScrewFile?: string;
  results: ScrewResult[];
  showMedial: boolean;
  showLateral: boolean;
  showScrews: boolean;
  showBreaches: boolean;
  enableTransparency: boolean;
}

const StlViewer = ({
  sessionId,
  selectedScrewFile,
  results,
  showMedial = true,
  showLateral = true,
  showScrews = true,
  showBreaches = true,
  enableTransparency = false,
}: StlViewerProps) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const controlsRef = useRef<OrbitControls | null>(null);
  const objectsRef = useRef<{ [key: string]: THREE.Mesh }>({});
  const breachPointsRef = useRef<THREE.Points | null>(null);

  const [loading, setLoading] = useState(false);
  const [hasModels, setHasModels] = useState(false);

  // Initialize Three.js scene
  useEffect(() => {
    if (!containerRef.current) return;

    // Scene setup
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0xf5f5f5);
    sceneRef.current = scene;

    // Camera setup
    const camera = new THREE.PerspectiveCamera(
      75,
      containerRef.current.clientWidth / containerRef.current.clientHeight,
      0.1,
      1000
    );
    camera.position.set(0, 5, 10);
    cameraRef.current = camera;

    // Renderer setup
    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(
      containerRef.current.clientWidth,
      containerRef.current.clientHeight
    );
    containerRef.current.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    // Controls setup
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controlsRef.current = controls;

    // Lighting
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
    scene.add(ambientLight);

    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
    directionalLight.position.set(1, 1, 1);
    scene.add(directionalLight);

    // Add axes helper
    const axesHelper = new THREE.AxesHelper(5);
    scene.add(axesHelper);

    // Animation loop
    const animate = () => {
      requestAnimationFrame(animate);
      
      if (controlsRef.current) {
        controlsRef.current.update();
      }
      
      if (rendererRef.current && sceneRef.current && cameraRef.current) {
        rendererRef.current.render(sceneRef.current, cameraRef.current);
      }
    };
    
    animate();

    // Handle resize
    const handleResize = () => {
      if (
        !containerRef.current ||
        !rendererRef.current ||
        !cameraRef.current
      )
        return;

      const width = containerRef.current.clientWidth;
      const height = containerRef.current.clientHeight;

      cameraRef.current.aspect = width / height;
      cameraRef.current.updateProjectionMatrix();
      rendererRef.current.setSize(width, height);
    };

    window.addEventListener("resize", handleResize);

    return () => {
      window.removeEventListener("resize", handleResize);
      
      if (rendererRef.current && containerRef.current) {
        containerRef.current.removeChild(rendererRef.current.domElement);
        rendererRef.current.dispose();
      }
    };
  }, []);

  // Load models when sessionId changes
  useEffect(() => {
    if (!sessionId || !sceneRef.current) return;

    const loadModels = async () => {
      try {
        setLoading(true);
        
        // Get files for this session
        const response = await fetch(`/api/files/${sessionId}`);
        if (!response.ok) {
          throw new Error("Failed to fetch files");
        }
        
        const data = await response.json();
        const files = data.files;
        
        if (!files || files.length === 0) {
          return;
        }
        
        // Find medial, lateral, and screw files
        const medialFile = files.find((file: any) => file.fileType === "medial");
        const lateralFile = files.find((file: any) => file.fileType === "lateral");
        const screwsFile = files.find((file: any) => file.fileType === "screws");
        
        if (!medialFile || !lateralFile || !screwsFile) {
          return;
        }
        
        // Clear previous models
        if (sceneRef.current) {
          Object.values(objectsRef.current).forEach((obj) => {
            sceneRef.current?.remove(obj);
          });
          
          if (breachPointsRef.current) {
            sceneRef.current.remove(breachPointsRef.current);
            breachPointsRef.current = null;
          }
        }
        
        objectsRef.current = {};
        
        // Load medial surface
        await loadSTL(
          `/uploads/${sessionId}/${medialFile.fileName}`,
          0xff6b6b, // Red
          "medial"
        );
        
        // Load lateral surface
        await loadSTL(
          `/uploads/${sessionId}/${lateralFile.fileName}`,
          0x4d96ff, // Blue
          "lateral"
        );
        
        // Load selected screw or default to first screw
        if (results.length > 0) {
          const screwFileName = selectedScrewFile || results[0].fileName;
          await loadSTL(
            `/uploads/${sessionId}/extracted_screws/${screwFileName}`,
            0xd580ff, // Purple
            "screw"
          );
          
          // Add breach points if any
          addBreachPoints();
        }
        
        setHasModels(true);
      } catch (error) {
        console.error("Error loading models:", error);
        toast({
          title: "Error",
          description: "Failed to load 3D models",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };
    
    loadModels();
  }, [sessionId, selectedScrewFile, results]);

  // Update visibility based on props
  useEffect(() => {
    if (!objectsRef.current || !sceneRef.current) return;
    
    // Update visibility for each object type
    if (objectsRef.current.medial) {
      objectsRef.current.medial.visible = showMedial;
    }
    
    if (objectsRef.current.lateral) {
      objectsRef.current.lateral.visible = showLateral;
    }
    
    if (objectsRef.current.screw) {
      objectsRef.current.screw.visible = showScrews;
    }
    
    // Update transparency
    if (enableTransparency) {
      if (objectsRef.current.medial && objectsRef.current.medial.material) {
        (objectsRef.current.medial.material as THREE.MeshPhongMaterial).transparent = true;
        (objectsRef.current.medial.material as THREE.MeshPhongMaterial).opacity = 0.7;
      }
      
      if (objectsRef.current.lateral && objectsRef.current.lateral.material) {
        (objectsRef.current.lateral.material as THREE.MeshPhongMaterial).transparent = true;
        (objectsRef.current.lateral.material as THREE.MeshPhongMaterial).opacity = 0.7;
      }
    } else {
      if (objectsRef.current.medial && objectsRef.current.medial.material) {
        (objectsRef.current.medial.material as THREE.MeshPhongMaterial).transparent = false;
        (objectsRef.current.medial.material as THREE.MeshPhongMaterial).opacity = 1.0;
      }
      
      if (objectsRef.current.lateral && objectsRef.current.lateral.material) {
        (objectsRef.current.lateral.material as THREE.MeshPhongMaterial).transparent = false;
        (objectsRef.current.lateral.material as THREE.MeshPhongMaterial).opacity = 1.0;
      }
    }
    
    // Update breach points visibility
    if (breachPointsRef.current) {
      breachPointsRef.current.visible = showBreaches;
    }
  }, [showMedial, showLateral, showScrews, showBreaches, enableTransparency]);

  const loadSTL = (url: string, color: number, key: string): Promise<void> => {
    return new Promise((resolve, reject) => {
      const loader = new STLLoader();
      
      loader.load(
        url,
        (geometry) => {
          const material = new THREE.MeshPhongMaterial({
            color: color,
            specular: 0x111111,
            shininess: 200,
          });
          
          const mesh = new THREE.Mesh(geometry, material);
          
          // Center the geometry
          geometry.computeBoundingBox();
          if (geometry.boundingBox) {
            const center = new THREE.Vector3();
            geometry.boundingBox.getCenter(center);
            geometry.translate(-center.x, -center.y, -center.z);
          }
          
          if (sceneRef.current) {
            sceneRef.current.add(mesh);
            objectsRef.current[key] = mesh;
          }
          
          resolve();
        },
        undefined,
        (error) => {
          console.error("Error loading STL:", error);
          reject(error);
        }
      );
    });
  };

  const addBreachPoints = () => {
    if (!sceneRef.current || !selectedScrewFile) return;
    
    // Find breach points for the selected screw
    const selectedScrew = results.find(
      (screw) => screw.fileName === selectedScrewFile
    );
    
    if (!selectedScrew || !selectedScrew.breachPoints || selectedScrew.breachPoints.length === 0) {
      return;
    }
    
    // Remove existing breach points
    if (breachPointsRef.current) {
      sceneRef.current.remove(breachPointsRef.current);
    }
    
    // Create points
    const pointsGeometry = new THREE.BufferGeometry();
    const positions: number[] = [];
    
    selectedScrew.breachPoints.forEach((point) => {
      positions.push(point[0], point[1], point[2]);
    });
    
    pointsGeometry.setAttribute(
      "position",
      new THREE.Float32BufferAttribute(positions, 3)
    );
    
    const pointsMaterial = new THREE.PointsMaterial({
      color: 0xffff00, // Yellow
      size: 0.5,
    });
    
    const points = new THREE.Points(pointsGeometry, pointsMaterial);
    sceneRef.current.add(points);
    breachPointsRef.current = points;
  };

  const resetView = () => {
    if (!cameraRef.current || !controlsRef.current) return;
    
    cameraRef.current.position.set(0, 5, 10);
    cameraRef.current.lookAt(0, 0, 0);
    controlsRef.current.reset();
  };

  const takeScreenshot = () => {
    if (!rendererRef.current) return;
    
    const dataURL = rendererRef.current.domElement.toDataURL("image/png");
    
    const link = document.createElement("a");
    link.href = dataURL;
    link.download = "stl-viewer-screenshot.png";
    link.click();
  };

  return (
    <div className="flex flex-col">
      <div className="mb-4">
        <div className="flex flex-wrap gap-2 mb-3">
          <Button 
            variant={showMedial && showLateral && showScrews ? "default" : "outline"}
            size="sm"
            onClick={() => {}}
            className="text-sm"
          >
            <i className="fas fa-eye mr-1.5"></i> All Models
          </Button>
          <Button 
            variant={showMedial ? "default" : "outline"} 
            size="sm"
            onClick={() => {}}
            className="text-sm"
          >
            <i className="fas fa-square mr-1.5"></i> Medial Surface
          </Button>
          <Button 
            variant={showLateral ? "default" : "outline"} 
            size="sm"
            onClick={() => {}}
            className="text-sm"
          >
            <i className="fas fa-square mr-1.5"></i> Lateral Surface
          </Button>
          <Button 
            variant={showScrews ? "default" : "outline"} 
            size="sm"
            onClick={() => {}}
            className="text-sm"
          >
            <i className="fas fa-wrench mr-1.5"></i> Screws
          </Button>
          <Button 
            variant={showBreaches ? "default" : "outline"} 
            size="sm"
            onClick={() => {}}
            className="text-sm bg-red-100 text-red-700 hover:bg-red-200 hover:text-red-800"
          >
            <i className="fas fa-exclamation-triangle mr-1.5"></i> Breach Points
          </Button>
        </div>
      </div>
      
      <div 
        ref={containerRef} 
        className="h-96 bg-gray-100 rounded-lg flex items-center justify-center" 
      >
        {loading ? (
          <div className="text-center p-8">
            <i className="fas fa-spinner fa-spin text-gray-400 text-5xl mb-4"></i>
            <p className="text-gray-500">Loading 3D models...</p>
          </div>
        ) : !hasModels ? (
          <div className="text-center p-8" id="viewerPlaceholder">
            <i className="fas fa-cube text-gray-400 text-5xl mb-4"></i>
            <p className="text-gray-500">3D model will appear here after processing</p>
            <p className="text-xs text-gray-400 mt-2">You can rotate, zoom, and pan using mouse controls</p>
          </div>
        ) : null}
      </div>
      
      <div className="flex justify-center mt-4">
        <div className="bg-gray-100 rounded-lg p-2 inline-flex space-x-2">
          <Button 
            variant="ghost" 
            size="icon" 
            className="p-2 hover:bg-gray-200 rounded-md text-gray-600" 
            title="Reset view"
            onClick={resetView}
          >
            <i className="fas fa-home"></i>
          </Button>
          <Button 
            variant="ghost" 
            size="icon" 
            className="p-2 hover:bg-gray-200 rounded-md text-gray-600" 
            title="Wireframe toggle"
            onClick={() => {}}
          >
            <i className="fas fa-border-all"></i>
          </Button>
          <Button 
            variant="ghost" 
            size="icon" 
            className="p-2 hover:bg-gray-200 rounded-md text-gray-600" 
            title="Screenshot"
            onClick={takeScreenshot}
          >
            <i className="fas fa-camera"></i>
          </Button>
        </div>
      </div>
    </div>
  );
};

export default StlViewer;
