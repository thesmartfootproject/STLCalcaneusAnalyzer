import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getSettings, saveSettings } from "@/lib/stlProcessor";

interface SettingsProps {
  sessionId: string;
}

const Settings = ({ sessionId }: SettingsProps) => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  // Settings state
  const [tolerance, setTolerance] = useState<number>(0.5);
  const [colorScheme, setColorScheme] = useState<string>("standard");
  const [showAxes, setShowAxes] = useState<boolean>(true);
  const [showMeasurements, setShowMeasurements] = useState<boolean>(true);
  const [highlightBreaches, setHighlightBreaches] = useState<boolean>(true);
  const [enableTransparency, setEnableTransparency] = useState<boolean>(false);
  
  // Fetch settings
  const { data: settingsData, isLoading } = useQuery({
    queryKey: [`/api/settings/default`],
    queryFn: async () => {
      return await getSettings();
    }
  });
  
  // Update settings mutation
  const mutation = useMutation({
    mutationFn: (settings: any) => {
      return saveSettings(0, settings);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/settings/default`] });
      toast({
        title: "Settings Saved",
        description: "Your settings have been saved successfully.",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to save settings",
        variant: "destructive"
      });
    }
  });
  
  // Update local state when settings are loaded
  useEffect(() => {
    if (settingsData) {
      setTolerance(parseFloat(settingsData.tolerance));
      setColorScheme(settingsData.colorScheme);
      setShowAxes(settingsData.showAxes);
      setShowMeasurements(settingsData.showMeasurements);
      setHighlightBreaches(settingsData.highlightBreaches);
      setEnableTransparency(settingsData.enableTransparency);
    }
  }, [settingsData]);
  
  const handleSaveSettings = () => {
    mutation.mutate({
      tolerance: tolerance.toString(),
      colorScheme,
      showAxes,
      showMeasurements,
      highlightBreaches,
      enableTransparency
    });
  };
  
  const handleResetDefaults = () => {
    setTolerance(0.5);
    setColorScheme("standard");
    setShowAxes(true);
    setShowMeasurements(true);
    setHighlightBreaches(true);
    setEnableTransparency(false);
  };
  
  if (isLoading) {
    return (
      <section id="settings" className="mb-8">
        <Card>
          <CardContent className="pt-6 text-center py-12">
            <i className="fas fa-spinner fa-spin text-primary-500 text-4xl mb-4"></i>
            <p className="text-gray-600">Loading settings...</p>
          </CardContent>
        </Card>
      </section>
    );
  }
  
  return (
    <section id="settings" className="mb-8">
      <Card>
        <CardContent className="pt-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Settings</h3>
          
          <div className="grid grid-cols-1 gap-6">
            <div>
              <Label htmlFor="tolerance" className="block text-sm font-medium text-gray-700 mb-1">
                Breach Detection Tolerance
              </Label>
              <div className="flex items-center">
                <Slider
                  id="tolerance"
                  min={0.1}
                  max={2.0}
                  step={0.1}
                  value={[tolerance]}
                  onValueChange={(value) => setTolerance(value[0])}
                  className="w-full"
                />
                <span className="ml-3 text-sm text-gray-700 min-w-[3rem]">
                  {tolerance.toFixed(1)} mm
                </span>
              </div>
              <p className="mt-1 text-xs text-gray-500">
                Minimum distance to wall for breach detection (0.1mm - 2.0mm)
              </p>
            </div>
            
            <div>
              <Label className="block text-sm font-medium text-gray-700 mb-2">
                Color Scheme
              </Label>
              <RadioGroup
                value={colorScheme}
                onValueChange={setColorScheme}
                className="grid grid-cols-2 gap-4"
              >
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="standard" id="standard" />
                  <Label htmlFor="standard" className="flex flex-col">
                    <span className="text-sm text-gray-700">Standard</span>
                    <div className="mt-1 flex space-x-1">
                      <div className="w-5 h-5 rounded-full bg-red-500"></div>
                      <div className="w-5 h-5 rounded-full bg-blue-500"></div>
                      <div className="w-5 h-5 rounded-full bg-purple-500"></div>
                    </div>
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="colorblind" id="colorblind" />
                  <Label htmlFor="colorblind" className="flex flex-col">
                    <span className="text-sm text-gray-700">Colorblind Friendly</span>
                    <div className="mt-1 flex space-x-1">
                      <div className="w-5 h-5 rounded-full bg-yellow-500"></div>
                      <div className="w-5 h-5 rounded-full bg-cyan-500"></div>
                      <div className="w-5 h-5 rounded-full bg-gray-600"></div>
                    </div>
                  </Label>
                </div>
              </RadioGroup>
            </div>
            
            <div>
              <Label className="block text-sm font-medium text-gray-700 mb-2">
                Visualization Options
              </Label>
              <div className="space-y-2">
                <div className="flex items-center space-x-2">
                  <Checkbox 
                    id="showAxes" 
                    checked={showAxes}
                    onCheckedChange={(checked) => setShowAxes(checked as boolean)}
                  />
                  <Label htmlFor="showAxes" className="text-sm text-gray-700">
                    Show axes in 3D view
                  </Label>
                </div>
                
                <div className="flex items-center space-x-2">
                  <Checkbox 
                    id="showMeasurements" 
                    checked={showMeasurements}
                    onCheckedChange={(checked) => setShowMeasurements(checked as boolean)}
                  />
                  <Label htmlFor="showMeasurements" className="text-sm text-gray-700">
                    Show measurement points
                  </Label>
                </div>
                
                <div className="flex items-center space-x-2">
                  <Checkbox 
                    id="highlightBreaches" 
                    checked={highlightBreaches}
                    onCheckedChange={(checked) => setHighlightBreaches(checked as boolean)}
                  />
                  <Label htmlFor="highlightBreaches" className="text-sm text-gray-700">
                    Highlight breach locations
                  </Label>
                </div>
                
                <div className="flex items-center space-x-2">
                  <Checkbox 
                    id="enableTransparency" 
                    checked={enableTransparency}
                    onCheckedChange={(checked) => setEnableTransparency(checked as boolean)}
                  />
                  <Label htmlFor="enableTransparency" className="text-sm text-gray-700">
                    Enable transparency for surfaces
                  </Label>
                </div>
              </div>
            </div>
          </div>
          
          <div className="flex justify-end mt-6 space-x-3">
            <Button
              variant="outline"
              onClick={handleResetDefaults}
            >
              Reset to Defaults
            </Button>
            <Button
              onClick={handleSaveSettings}
              disabled={mutation.isPending}
            >
              {mutation.isPending ? (
                <>
                  <i className="fas fa-spinner fa-spin mr-2"></i> Saving...
                </>
              ) : (
                "Save Settings"
              )}
            </Button>
          </div>
        </CardContent>
      </Card>
    </section>
  );
};

export default Settings;
