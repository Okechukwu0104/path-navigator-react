import React from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  ChevronLeft,
  ChevronRight,
  Bus,
  Car,
  PersonStanding,
  Bike,
  Truck,
} from "lucide-react";

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
  onPrevStep,
}) => {
  const getTransportIcon = (type: string) => {
    switch (type.toLowerCase()) {
      case "danfo":
      case "brt":
      case "korokpe":
      case "bus":
        return <Bus className="h-6 w-6" />;
      case "taxi":
      case "cab":
        return <Car className="h-6 w-6" />;
      case "bike":
        return <Bike className="h-6 w-6" />;
      case "keke":
        return <Truck className="h-6 w-6" />;
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
    <div className="fixed bottom-0 left-0 right-0 flex justify-center p-4">
      <div className="w-full max-w-md space-y-4">
        {" "}
        {/* Added max-width and centered */}
        {/* Route Summary Header */}
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-bold text-xl">Transport Route</h3>{" "}
            {/* Increased text size */}
            <div className="text-base text-gray-500">
              {" "}
              {/* Increased text size */}
              Step {currentStepIndex + 1} of {route.length}
            </div>
          </div>
          <Badge
            variant="secondary"
            className="bg-green-100 text-green-800 text-base"
          >
            {" "}
            {/* Increased text size */}₦{getTotalCost()} total
          </Badge>
        </div>
        {/* Transport Diagram - Made larger */}
        <Card className="p-6 bg-gray-50 border-gray-200">
          {" "}
          {/* Increased padding */}
          <div className="flex flex-col items-center">
            {/* Larger Transport Icon */}
            <div className="p-4 bg-blue-100 rounded-full mb-4 text-3xl">
              {" "}
              {/* Increased size */}
              {getTransportIcon(currentStep.type_of_vehicle)}
            </div>

            {/* Route Line - Made thicker */}
            <div className="relative w-full flex justify-center mb-4">
              <div className="absolute h-16 w-1 bg-gray-300"></div>{" "}
              {/* Increased height and width */}
              <div
                className="absolute h-8 w-1 bg-blue-500" /* Increased height and width */
                style={{ top: 0 }}
              ></div>
            </div>

            {/* Start and Stop Points - Larger text */}
            <div className="w-full flex justify-between px-6">
              <div className="text-center">
                <div className="text-lg font-medium">{currentStep.start}</div>{" "}
                {/* Increased text size */}
              </div>
              <div className="text-center">
                <div className="text-lg font-medium">{currentStep.stop}</div>{" "}
                {/* Increased text size */}
              </div>
            </div>
          </div>
        </Card>
        {/* Step Details - Larger */}
        <Card className="p-6">
          {" "}
          {/* Increased padding */}
          <div className="flex items-center justify-between mb-4">
            {" "}
            {/* Increased margin */}
            <div className="flex items-center space-x-3 text-lg">
              {" "}
              {/* Increased text size and spacing */}
              <span className="text-2xl">
                {" "}
                {/* Larger icon */}
                {getTransportIcon(currentStep.type_of_vehicle)}
              </span>
              <span className="font-medium capitalize">
                {currentStep.type_of_vehicle}
              </span>
            </div>
            <Badge variant="default" className="bg-blue-500 text-lg">
              {" "}
              {/* Increased text size */}₦{currentStep.price}
            </Badge>
          </div>
          <div className="text-base text-gray-700 mb-5">
            {currentStep.notes}
          </div>{" "}
          {/* Increased text size and margin */}
          <div className="text-sm text-gray-500">
            {" "}
            {/* Slightly larger than original */}
            Board at <span className="font-medium">
              {currentStep.start}
            </span>{" "}
            and alight at{" "}
            <span className="font-medium">{currentStep.stop}</span>
          </div>
        </Card>
        {/* Navigation Controls - Larger */}
        <div className="flex items-center justify-between px-4">
          {" "}
          {/* Added horizontal padding */}
          <button
            onClick={onPrevStep}
            disabled={currentStepIndex === 0}
            className={`p-3 rounded-full ${
              /* Increased padding */
              currentStepIndex === 0
                ? "text-gray-300"
                : "text-gray-700 hover:bg-gray-100"
            }`}
          >
            <ChevronLeft className="h-8 w-8" /> {/* Increased size */}
          </button>
          <div className="flex space-x-2">
            {" "}
            {/* Increased spacing */}
            {route.map((_, index) => (
              <div
                key={index}
                className={`h-3 w-3 rounded-full ${
                  /* Increased size */
                  index === currentStepIndex ? "bg-blue-500" : "bg-gray-300"
                }`}
              />
            ))}
          </div>
          <button
            onClick={onNextStep}
            disabled={currentStepIndex === route.length - 1}
            className={`p-3 rounded-full ${
              /* Increased padding */
              currentStepIndex === route.length - 1
                ? "text-gray-300"
                : "text-gray-700 hover:bg-gray-100"
            }`}
          >
            <ChevronRight className="h-8 w-8" /> {/* Increased size */}
          </button>
        </div>
        {/* Start Navigation Button - Larger */}
        {!isNavigating && (
          <button className="w-full py-4 bg-blue-500 hover:bg-blue-600 text-white rounded-lg font-medium text-lg">
            Start Navigation
          </button>
        )}
      </div>
    </div>
  );
};

export default RouteInfo;
