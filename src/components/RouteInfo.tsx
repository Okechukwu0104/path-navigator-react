import React from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ChevronLeft, ChevronRight, Bus, Car, PersonStanding } from 'lucide-react';

interface TransportStep {
  start: string;
  stop: string;
  price: string;
  type_of_vehicle: string;
  notes: string;
}

interface RouteInfoProps {
  route: TransportStep[];
  currentStepIndex: number;
  isNavigating: boolean;
  onNextStep: () => void;
  onPrevStep: () => void;
}

const RouteInfo: React.FC<RouteInfoProps> = ({ 
  route, 
  currentStepIndex, 
  isNavigating,
  onNextStep,
  onPrevStep
}) => {
  const getTransportIcon = (type: string) => {
    switch(type.toLowerCase()) {
      case 'danfo':
      case 'brt':
      case 'bus':
        return <Bus className="h-6 w-6" />;
      case 'taxi':
      case 'cab':
        return <Car className="h-6 w-6" />;
      default:
        return <PersonStanding className="h-6 w-6" />;
    }
  };

  const getTotalCost = () => {
    return route.reduce((total, step) => total + parseInt(step.price), 0);
  };

  if (route.length === 0) {
    return (
      <div className="p-4 text-center text-gray-500">
        <Bus className="h-12 w-12 mx-auto mb-3 text-gray-300" />
        <h3 className="font-medium text-gray-900 mb-1">No transport route</h3>
        <p className="text-sm">Enter a destination to see transport options</p>
      </div>
    );
  }

  const currentStep = route[currentStepIndex];

  return (
    <div className="p-4 space-y-4">
      {/* Route Summary Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="font-bold text-lg">Transport Route</h3>
          <div className="text-sm text-gray-500">
            Step {currentStepIndex + 1} of {route.length}
          </div>
        </div>
        <Badge variant="secondary" className="bg-green-100 text-green-800">
          ₦{getTotalCost()} total
        </Badge>
      </div>

      {/* Transport Diagram */}
      <Card className="p-4 bg-gray-50 border-gray-200">
        <div className="flex flex-col items-center">
          {/* Transport Icon */}
          <div className="p-3 bg-blue-100 rounded-full mb-3">
            {getTransportIcon(currentStep.type_of_vehicle)}
          </div>
          
          {/* Route Line */}
          <div className="relative w-full flex justify-center mb-3">
            <div className="absolute h-12 w-px bg-gray-300"></div>
            <div className="absolute h-6 w-px bg-blue-500" style={{ top: 0 }}></div>
          </div>
          
          {/* Start and Stop Points */}
          <div className="w-full flex justify-between px-4">
            <div className="text-center">
              <div className="text-sm font-medium">{currentStep.start}</div>
            </div>
            <div className="text-center">
              <div className="text-sm font-medium">{currentStep.stop}</div>
            </div>
          </div>
        </div>
      </Card>

      {/* Step Details */}
      <Card className="p-4">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center space-x-2">
            {getTransportIcon(currentStep.type_of_vehicle)}
            <span className="font-medium capitalize">{currentStep.type_of_vehicle}</span>
          </div>
          <Badge variant="default" className="bg-blue-500">
            ₦{currentStep.price}
          </Badge>
        </div>
        
        <div className="text-sm text-gray-700 mb-4">
          {currentStep.notes}
        </div>
        
        <div className="text-xs text-gray-500">
          Board at <span className="font-medium">{currentStep.start}</span> and alight at <span className="font-medium">{currentStep.stop}</span>
        </div>
      </Card>

      {/* Navigation Controls */}
      <div className="flex items-center justify-between">
        <button
          onClick={onPrevStep}
          disabled={currentStepIndex === 0}
          className={`p-2 rounded-full ${currentStepIndex === 0 ? 'text-gray-300' : 'text-gray-700 hover:bg-gray-100'}`}
        >
          <ChevronLeft className="h-6 w-6" />
        </button>
        
        <div className="flex space-x-1">
          {route.map((_, index) => (
            <div 
              key={index}
              className={`h-2 w-2 rounded-full ${index === currentStepIndex ? 'bg-blue-500' : 'bg-gray-300'}`}
            />
          ))}
        </div>
        
        <button
          onClick={onNextStep}
          disabled={currentStepIndex === route.length - 1}
          className={`p-2 rounded-full ${currentStepIndex === route.length - 1 ? 'text-gray-300' : 'text-gray-700 hover:bg-gray-100'}`}
        >
          <ChevronRight className="h-6 w-6" />
        </button>
      </div>

      {/* Start Navigation Button */}
      {!isNavigating && (
        <button className="w-full py-3 bg-blue-500 hover:bg-blue-600 text-white rounded-lg font-medium">
          Start Navigation
        </button>
      )}
    </div>
  );
};

export default RouteInfo;