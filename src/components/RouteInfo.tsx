
import React from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ArrowRight, ArrowUp, ArrowDown, Navigation } from 'lucide-react';

interface Location {
  lat: number;
  lng: number;
  address?: string;
}

interface RouteStep {
  instruction: string;
  distance: string;
  duration: string;
  coordinates: Location;
  maneuver: string;
}

interface RouteInfoProps {
  route: RouteStep[];
  currentStepIndex: number;
  isNavigating: boolean;
}

const RouteInfo: React.FC<RouteInfoProps> = ({ route, currentStepIndex, isNavigating }) => {
  const getManeuverIcon = (maneuver: string) => {
    switch (maneuver) {
      case 'turn-right':
        return <ArrowRight className="h-4 w-4" />;
      case 'turn-left':
        return <ArrowDown className="h-4 w-4 rotate-90" />;
      case 'straight':
        return <ArrowUp className="h-4 w-4" />;
      case 'arrive':
        return <Navigation className="h-4 w-4" />;
      default:
        return <ArrowUp className="h-4 w-4" />;
    }
  };

  const getTotalDistance = () => {
    return route.reduce((total, step) => {
      const distance = parseFloat(step.distance.replace(/[^\d.]/g, ''));
      return total + distance;
    }, 0).toFixed(1);
  };

  const getTotalDuration = () => {
    let totalMinutes = 0;
    route.forEach(step => {
      const duration = step.duration;
      if (duration.includes('min')) {
        totalMinutes += parseInt(duration.replace(/[^\d]/g, ''));
      } else if (duration.includes('sec')) {
        totalMinutes += parseInt(duration.replace(/[^\d]/g, '')) / 60;
      }
    });
    return Math.ceil(totalMinutes);
  };

  if (route.length === 0) {
    return (
      <div className="p-4 text-center text-gray-500">
        <Navigation className="h-12 w-12 mx-auto mb-3 text-gray-300" />
        <h3 className="font-medium text-gray-900 mb-1">No route selected</h3>
        <p className="text-sm">Enter a destination to get started</p>
      </div>
    );
  }

  return (
    <div className="p-4 space-y-4">
      {/* Route Summary */}
      <Card className="p-3 bg-blue-50 border-blue-200">
        <div className="flex items-center justify-between">
          <div>
            <div className="text-lg font-bold text-blue-900">{getTotalDistance()} mi</div>
            <div className="text-sm text-blue-700">{getTotalDuration()} mins</div>
          </div>
          <div className="text-right">
            <Badge variant="secondary" className="bg-blue-100 text-blue-800">
              {route.length} steps
            </Badge>
          </div>
        </div>
      </Card>

      {/* Current Step (if navigating) */}
      {isNavigating && (
        <Card className="p-4 bg-green-50 border-green-200">
          <div className="flex items-start space-x-3">
            <div className="p-2 bg-green-500 rounded-full text-white">
              {getManeuverIcon(route[currentStepIndex]?.maneuver)}
            </div>
            <div className="flex-1">
              <div className="font-medium text-green-900 mb-1">
                Next: {route[currentStepIndex]?.instruction}
              </div>
              <div className="text-sm text-green-700">
                In {route[currentStepIndex]?.distance} • {route[currentStepIndex]?.duration}
              </div>
            </div>
          </div>
        </Card>
      )}

      {/* All Steps */}
      <div className="space-y-2">
        <h3 className="font-medium text-gray-900 mb-3">Turn-by-turn directions</h3>
        {route.map((step, index) => (
          <Card 
            key={index} 
            className={`p-3 transition-all ${
              isNavigating && index === currentStepIndex 
                ? 'bg-blue-50 border-blue-200 scale-105' 
                : index < currentStepIndex && isNavigating
                ? 'bg-gray-50 opacity-60'
                : 'hover:bg-gray-50'
            }`}
          >
            <div className="flex items-start space-x-3">
              <div className={`p-1.5 rounded-full ${
                isNavigating && index === currentStepIndex 
                  ? 'bg-blue-500 text-white' 
                  : index < currentStepIndex && isNavigating
                  ? 'bg-green-500 text-white'
                  : 'bg-gray-200 text-gray-600'
              }`}>
                {getManeuverIcon(step.maneuver)}
              </div>
              
              <div className="flex-1 min-w-0">
                <div className={`font-medium ${
                  isNavigating && index === currentStepIndex 
                    ? 'text-blue-900' 
                    : 'text-gray-900'
                }`}>
                  {step.instruction}
                </div>
                <div className="flex items-center space-x-2 mt-1 text-sm text-gray-600">
                  <span>{step.distance}</span>
                  <span>•</span>
                  <span>{step.duration}</span>
                </div>
              </div>

              {isNavigating && index === currentStepIndex && (
                <Badge variant="default" className="bg-blue-500">
                  Current
                </Badge>
              )}
              
              {isNavigating && index < currentStepIndex && (
                <Badge variant="secondary" className="bg-green-100 text-green-800">
                  Done
                </Badge>
              )}
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default RouteInfo;
