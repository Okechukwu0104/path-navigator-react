
import React from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Play, Square, SkipForward, Volume2, VolumeX } from 'lucide-react';

interface NavigationControlsProps {
  isNavigating: boolean;
  onStartNavigation: () => void;
  onStopNavigation: () => void;
  onNextStep: () => void;
  canGoNext: boolean;
}

const NavigationControls: React.FC<NavigationControlsProps> = ({
  isNavigating,
  onStartNavigation,
  onStopNavigation,
  onNextStep,
  canGoNext
}) => {
  const [isMuted, setIsMuted] = React.useState(false);

  const toggleMute = () => {
    setIsMuted(!isMuted);
  };

  return (
    <div className="space-y-3  ">
      {/* Main Navigation Control */}
      {!isNavigating ? (
        <Button 
          onClick={onStartNavigation}
          className="w-full bg-blue-500 hover:bg-blue-600 text-white py-3"
          size="lg"
        >
          <Play className="h-5 w-5 mr-2" />
          Start Navigation
        </Button>
      ) : (
        <Button 
          onClick={onStopNavigation}
          variant="destructive"
          className="flex items-center justify-self-center w-30 bg-blue-500 text-red-500 py-3 hover:bg-red-600 text-white py-3"
          size="lg"
        >
          <Square className="h-5 w-2 mr-2 " />
          Stop Navigation
        </Button>
      )}

      {/* Additional Controls */}
      {isNavigating && (
        <Card className="p-3">
          <div className="flex items-center justify-between space-x-2">
            <Button
              onClick={onNextStep}
              disabled={!canGoNext}
              variant="outline"
              size="sm"
              className="flex-1"
            >
              <SkipForward className="h-4 w-4 mr-1" />
              Next Step
            </Button>
            
            <Button
              onClick={toggleMute}
              variant="outline"
              size="sm"
              className="px-3"
            >
              {isMuted ? (
                <VolumeX className="h-4 w-4" />
              ) : (
                <Volume2 className="h-4 w-4" />
              )}
            </Button>
          </div>
          
          <div className="mt-3 text-xs text-gray-600 text-center">
            Voice guidance: {isMuted ? 'Off' : 'On'}
          </div>
        </Card>
      )}

      {/* Navigation Tips */}
      <Card className="p-3 bg-gray-50">
        <div className="text-xs text-gray-600">
          <div className="font-medium mb-1">Navigation Tips:</div>
          <ul className="space-y-1">
            <li>• Follow junction-by-junction directions</li>
            <li>• Keep GPS enabled for accurate positioning</li>
            <li>• Voice guidance available during navigation</li>
          </ul>
        </div>
      </Card>
    </div>
  );
};

export default NavigationControls;
