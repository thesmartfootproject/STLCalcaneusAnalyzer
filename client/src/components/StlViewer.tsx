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
  showMedial: initialShowMedial = true,
  showLateral: initialShowLateral = true,
  showScrews: initialShowScrews = true,
  showBreaches: initialShowBreaches = true,
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
  const [showMedial, setShowMedial] = useState(initialShowMedial);
  const [showLateral, setShowLateral] = useState(initialShowLateral);
  const [showScrews, setShowScrews] = useState(initialShowScrews);
  const [showBreaches, setShowBreaches] = useState(initialShowBreaches);
  const [wireframeMode, setWireframeMode] = useState(false);

  // Initialize Three.js scene
  useEffect(() => {
    if (!containerRef.current) return;

    // Scene setup
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0xf8f9fa); // Lighter, more modern background
    sceneRef.current = scene;

    // Camera setup
    const camera = new THREE.PerspectiveCamera(
      65, // Better field of view for medical models
      containerRef.current.clientWidth / containerRef.current.clientHeight,
      0.1,
      1000
    );
    camera.position.set(0, 10, 20); // Better initial position
    cameraRef.current = camera;

    // Renderer setup with better settings
    const renderer = new THREE.WebGLRenderer({ 
      antialias: true,
      alpha: true,
      preserveDrawingBuffer: true // For screenshots
    });
    renderer.setPixelRatio(window.devicePixelRatio); // For sharper rendering
    renderer.shadowMap.enabled = true; // Enable shadows
    renderer.shadowMap.type = THREE.PCFSoftShadowMap; // Better shadow quality
    renderer.setSize(
      containerRef.current.clientWidth,
      containerRef.current.clientHeight
    );
    containerRef.current.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    // Advanced controls setup
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    controls.rotateSpeed = 0.7;
    controls.panSpeed = 0.7;
    controls.zoomSpeed = 1.2;
    controls.screenSpacePanning = true; // Pan in screen space
    controls.minDistance = 5;
    controls.maxDistance = 100;
    controlsRef.current = controls;

    // Better lighting setup
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.4);
    scene.add(ambientLight);

    // Key light
    const keyLight = new THREE.DirectionalLight(0xffffff, 0.8);
    keyLight.position.set(-10, 10, 10);
    keyLight.castShadow = true;
    keyLight.shadow.mapSize.width = 1024;
    keyLight.shadow.mapSize.height = 1024;
    scene.add(keyLight);
    
    // Fill light
    const fillLight = new THREE.DirectionalLight(0xffffff, 0.5);
    fillLight.position.set(10, 5, -10);
    scene.add(fillLight);
    
    // Back light
    const backLight = new THREE.DirectionalLight(0xffffff, 0.3);
    backLight.position.set(0, -10, -10);
    scene.add(backLight);

    // Add subtle ground grid
    const gridHelper = new THREE.GridHelper(50, 50, 0xcccccc, 0xe6e6e6);
    (gridHelper.material as THREE.Material).opacity = 0.2;
    (gridHelper.material as THREE.Material).transparent = true;
    scene.add(gridHelper);

    // Add subtle axes helper (small and less obtrusive)
    const axesHelper = new THREE.AxesHelper(5);
    axesHelper.position.y = 0.01; // Slightly above grid
    scene.add(axesHelper);

    // Animation loop with performance optimization
    let frameId: number;
    const animate = () => {
      frameId = requestAnimationFrame(animate);
      
      if (controlsRef.current) {
        controlsRef.current.update();
      }
      
      if (rendererRef.current && sceneRef.current && cameraRef.current) {
        rendererRef.current.render(sceneRef.current, cameraRef.current);
      }
    };
    
    animate();

    // Better resize handler with debounce
    let resizeTimeout: any;
    const handleResize = () => {
      clearTimeout(resizeTimeout);
      resizeTimeout = setTimeout(() => {
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
        rendererRef.current.setPixelRatio(window.devicePixelRatio);
      }, 100);
    };

    window.addEventListener("resize", handleResize);

    return () => {
      window.removeEventListener("resize", handleResize);
      cancelAnimationFrame(frameId);
      clearTimeout(resizeTimeout);
      
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
        console.log("StlViewer: Loading models for session", sessionId);
        console.log("StlViewer: Selected screw file:", selectedScrewFile);
        console.log("StlViewer: Results:", results);
        
        // Get files for this session
        const response = await fetch(`/api/files/${sessionId}`);
        if (!response.ok) {
          throw new Error("Failed to fetch files");
        }
        
        const data = await response.json();
        const files = data.files;
        console.log("StlViewer: Files from API:", files);
        
        if (!files || files.length === 0) {
          console.log("StlViewer: No files found for session");
          return;
        }
        
        // Find medial, lateral, and screw files
        const medialFile = files.find((file: any) => file.fileType === "medial");
        const lateralFile = files.find((file: any) => file.fileType === "lateral");
        const screwsFile = files.find((file: any) => file.fileType === "screws");
        
        console.log("StlViewer: Medial file:", medialFile);
        console.log("StlViewer: Lateral file:", lateralFile);
        console.log("StlViewer: Screws file:", screwsFile);
        
        if (!medialFile || !lateralFile || !screwsFile) {
          console.log("StlViewer: Missing required files");
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
        console.log("StlViewer: Loading medial surface:", `/uploads/${sessionId}/${medialFile.fileName}`);
        await loadSTL(
          `/uploads/${sessionId}/${medialFile.fileName}`,
          0xff6b6b, // Red
          "medial"
        );
        
        // Load lateral surface
        console.log("StlViewer: Loading lateral surface:", `/uploads/${sessionId}/${lateralFile.fileName}`);
        await loadSTL(
          `/uploads/${sessionId}/${lateralFile.fileName}`,
          0x4d96ff, // Blue
          "lateral"
        );
        
        // Load selected screw or default to first screw
        if (results.length > 0) {
          const screwFileName = selectedScrewFile || results[0].fileName;
          console.log("StlViewer: Loading screw:", `/uploads/${sessionId}/extracted_screws/${screwFileName}`);
          await loadSTL(
            `/uploads/${sessionId}/extracted_screws/${screwFileName}`,
            0xd580ff, // Purple
            "screw"
          );
          
          // Add breach points if any
          addBreachPoints();
        } else {
          console.log("StlViewer: No screw results to display");
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
      
      // Add loading progress indicator
      const onProgress = (xhr: ProgressEvent) => {
        if (xhr.lengthComputable) {
          const percentComplete = Math.round((xhr.loaded / xhr.total) * 100);
          console.log(`${key} loading: ${percentComplete}%`);
        }
      };
      
      loader.load(
        url,
        (geometry) => {
          // Compute normals for better lighting
          geometry.computeVertexNormals();
          
          // Create high-quality material with enhanced shading
          const material = new THREE.MeshStandardMaterial({
            color: color,
            metalness: 0.1,
            roughness: 0.5,
            flatShading: false,
            emissive: new THREE.Color(color).multiplyScalar(0.05), // Subtle glow
            side: THREE.DoubleSide // Show both sides of each face
          });
          
          // For medial and lateral surfaces, we can use more advanced materials
          if (key === "medial" || key === "lateral") {
            material.envMapIntensity = 0.8;
            // Note: clearcoat would be great here, but we'd need to use MeshPhysicalMaterial instead
          }
          
          // For screws, we want a more metallic appearance
          if (key === "screw") {
            material.metalness = 0.8;
            material.roughness = 0.2;
            material.envMapIntensity = 1.2;
          }
          
          const mesh = new THREE.Mesh(geometry, material);
          
          // Enable shadows
          mesh.castShadow = true;
          mesh.receiveShadow = true;
          
          // Optimize the geometry
          geometry.computeBoundingBox();
          if (geometry.boundingBox) {
            const center = new THREE.Vector3();
            geometry.boundingBox.getCenter(center);
            geometry.translate(-center.x, -center.y, -center.z);
            
            // Scale models appropriately
            const size = new THREE.Vector3();
            geometry.boundingBox.getSize(size);
            const maxDim = Math.max(size.x, size.y, size.z);
            
            // If the model is too big or too small, scale it
            if (maxDim > 50 || maxDim < 5) {
              const scale = 10 / maxDim; // Aim for around 10 units
              mesh.scale.set(scale, scale, scale);
            }
          }
          
          if (sceneRef.current) {
            sceneRef.current.add(mesh);
            objectsRef.current[key] = mesh;
            
            // Auto-position camera to frame all objects
            if (Object.keys(objectsRef.current).length > 1 && cameraRef.current && controlsRef.current) {
              // After adding at least two objects, reframe the view
              const allMeshes = Object.values(objectsRef.current);
              
              // Calculate bounding box containing all objects
              const boundingBox = new THREE.Box3();
              allMeshes.forEach(mesh => {
                mesh.geometry.computeBoundingBox();
                const meshBoundingBox = new THREE.Box3().setFromObject(mesh);
                boundingBox.union(meshBoundingBox);
              });
              
              // Get center and size of the combined bounding box
              const center = new THREE.Vector3();
              boundingBox.getCenter(center);
              const size = new THREE.Vector3();
              boundingBox.getSize(size);
              
              // Position camera to show all objects
              const maxDim = Math.max(size.x, size.y, size.z);
              const fov = cameraRef.current.fov * (Math.PI / 180);
              let cameraDistance = maxDim / (2 * Math.tan(fov / 2));
              
              // Add extra padding
              cameraDistance *= 1.5;
              
              // Set camera position
              cameraRef.current.position.copy(center);
              cameraRef.current.position.z += cameraDistance;
              cameraRef.current.lookAt(center);
              
              // Update controls target to center of objects
              controlsRef.current.target.copy(center);
              controlsRef.current.update();
            }
          }
          
          resolve();
        },
        onProgress,
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
      // Display a message if no breach points detected
      console.log("No breach points detected for this screw");
      return;
    }
    
    // Remove existing breach points
    if (breachPointsRef.current) {
      sceneRef.current.remove(breachPointsRef.current);
    }
    
    // Create points with improved visuals
    const pointsGeometry = new THREE.BufferGeometry();
    const positions: number[] = [];
    const colors: number[] = [];
    
    // Use a custom sprite for better visibility
    const sprite = new THREE.TextureLoader().load('/assets/disc.png');

    selectedScrew.breachPoints.forEach((point) => {
      positions.push(point[0], point[1], point[2]);
      
      // Use red color for danger
      colors.push(1, 0, 0); // RGB for red
    });
    
    pointsGeometry.setAttribute(
      "position",
      new THREE.Float32BufferAttribute(positions, 3)
    );
    
    pointsGeometry.setAttribute(
      "color", 
      new THREE.Float32BufferAttribute(colors, 3)
    );
    
    // Create better point material
    const pointsMaterial = new THREE.PointsMaterial({
      color: 0xff0000, // Red base color
      size: 0.8, // Larger points
      alphaTest: 0.5,
      transparent: true,
      vertexColors: true, // Use vertex colors
      sizeAttenuation: true, // Size changes with distance to camera
    });
    
    // If sprite loaded successfully, use it
    if (sprite) {
      pointsMaterial.map = sprite;
    }
    
    const points = new THREE.Points(pointsGeometry, pointsMaterial);
    
    // Add a pulsing animation effect to highlight breach points
    const pulse = () => {
      if (!breachPointsRef.current) return;
      
      const time = Date.now() * 0.001; // Time in seconds
      const scale = 1.0 + 0.3 * Math.sin(time * 2.0); // Scale between 0.7 and 1.3
      
      (breachPointsRef.current.material as THREE.PointsMaterial).size = 0.8 * scale;
      
      requestAnimationFrame(pulse);
    };
    
    sceneRef.current.add(points);
    breachPointsRef.current = points;
    
    // Start the pulsing animation
    pulse();
  };

  // Effect to handle wireframe mode updates
  useEffect(() => {
    if (!objectsRef.current) return;
    
    Object.values(objectsRef.current).forEach((mesh) => {
      if (mesh && mesh.material) {
        if (mesh.material instanceof THREE.MeshStandardMaterial ||
            mesh.material instanceof THREE.MeshPhongMaterial ||
            mesh.material instanceof THREE.MeshBasicMaterial) {
          mesh.material.wireframe = wireframeMode;
        }
      }
    });
  }, [wireframeMode]);

  const resetView = () => {
    if (!cameraRef.current || !controlsRef.current) return;
    
    cameraRef.current.position.set(0, 10, 20);
    cameraRef.current.lookAt(0, 0, 0);
    controlsRef.current.reset();
    
    toast({
      title: "View Reset",
      description: "Camera view has been reset to default position",
    });
  };

  const toggleWireframe = () => {
    setWireframeMode(!wireframeMode);
    
    toast({
      title: wireframeMode ? "Solid Mode" : "Wireframe Mode",
      description: wireframeMode ? "Showing models in solid mode" : "Showing models in wireframe mode",
    });
  };

  const takeScreenshot = () => {
    if (!rendererRef.current) return;
    
    try {
      const dataURL = rendererRef.current.domElement.toDataURL("image/png");
      
      const link = document.createElement("a");
      link.href = dataURL;
      link.download = `stl-analysis-${Date.now()}.png`;
      link.click();
      
      toast({
        title: "Screenshot Captured",
        description: "Image has been saved to your downloads folder",
      });
    } catch (error) {
      console.error("Error taking screenshot:", error);
      toast({
        title: "Screenshot Failed",
        description: "Failed to capture screenshot",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="flex flex-col">
      <div className="mb-4">
        <div className="flex flex-wrap gap-2 mb-3">
          <Button 
            variant={showMedial && showLateral && showScrews ? "default" : "outline"}
            size="sm"
            onClick={() => {
              setShowMedial(true);
              setShowLateral(true);
              setShowScrews(true);
            }}
            className="text-sm"
          >
            <i className="fas fa-eye mr-1.5"></i> All Models
          </Button>
          <Button 
            variant={showMedial ? "default" : "outline"} 
            size="sm"
            onClick={() => setShowMedial(!showMedial)}
            className="text-sm"
          >
            <i className="fas fa-square mr-1.5"></i> Medial Surface
          </Button>
          <Button 
            variant={showLateral ? "default" : "outline"} 
            size="sm"
            onClick={() => setShowLateral(!showLateral)}
            className="text-sm"
          >
            <i className="fas fa-square mr-1.5"></i> Lateral Surface
          </Button>
          <Button 
            variant={showScrews ? "default" : "outline"} 
            size="sm"
            onClick={() => setShowScrews(!showScrews)}
            className="text-sm"
          >
            <i className="fas fa-wrench mr-1.5"></i> Screws
          </Button>
          <Button 
            variant={showBreaches ? "default" : "outline"} 
            size="sm"
            onClick={() => setShowBreaches(!showBreaches)}
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
            variant={wireframeMode ? "default" : "ghost"}
            size="icon" 
            className={`p-2 hover:bg-gray-200 rounded-md ${wireframeMode ? "text-primary-600 bg-primary-100" : "text-gray-600"}`}
            title="Toggle wireframe mode"
            onClick={toggleWireframe}
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
