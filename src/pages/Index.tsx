import React, { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Navigation, MapPin, Route } from "lucide-react";
import SearchPanel from "@/components/SearchPanel";
import MapComponent from "@/components/MapComponent";
import RouteInfo from "@/components/RouteInfo";
import NavigationControls from "@/components/NavigationControls";
import { useToast } from "@/hooks/use-toast";
import { useLoadScript } from "@react-google-maps/api";

const libraries = ["places", "geometry"];

interface Location {
  lat: number;
  lng: number;
  address?: string;
  name?: string;
}

interface RouteStep {
  instruction: string;
  distance: string;
  duration: string;
  coordinates: Location;
  maneuver: string;
}

const GOOGLE_API_KEY = "AIzaSyCsIxQ-fyrN_cOw46dFVWGMBKfI93LoVe8";

const Index = () => {
  const { isLoaded, loadError } = useLoadScript({
    googleMapsApiKey: GOOGLE_API_KEY,
    libraries,
  });

  const [currentLocation, setCurrentLocation] = useState<Location | null>(null);
  const [destination, setDestination] = useState<Location | null>(null);
  const [route, setRoute] = useState<RouteStep[]>([]);
  const [isNavigating, setIsNavigating] = useState(false);
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [mapView, setMapView] = useState<"roadmap" | "satellite">("roadmap");
  const [showRoutePanel, setShowRoutePanel] = useState(false);
  const { toast } = useToast();

  /////////////////////////////////////////////////////////////////
  useEffect(() => {
    // Get user's current location
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        position => {
          const location = {
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          };
          setCurrentLocation(location);
          toast({
            title: "Location found",
            description: "Your current location has been detected.",
          });
        },
        error => {
          console.error("Error getting location:", error);

          setCurrentLocation({ lat: 37.7749, lng: -122.4194 });
          toast({
            title: "Location access denied",
            description:
              "Using default location. Please enable location services for better experience.",
            variant: "destructive",
          });
        }
      );
    }
  }, [toast]);

  useEffect(() => {
    if (currentLocation && destination) {
      const payload = [
        {
          "start-name": currentLocation.name || "",
          "start-long": currentLocation.lng,
          "start-lat": currentLocation.lat,
          "stop-name": destination.name || "",
          "stop-long": destination.lng,
          "stop-lat": destination.lat,
        },
      ];
      alert("recieved the json...ready for takeoff");
      // Send to backend
      fetch("/your-backend-endpoint", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      })
        .then(res => res.json())
        .then(data => {
          // handle response if needed
        });
    }
  }, [currentLocation, destination]);

  //////////////////////////////////////////////////////////////

  const calculateRoute = async (start: Location, end: Location) => {
    try {
      console.log("Calculating route from", start, "to", end);

      // Use Google Directions API
      const response = await fetch(
        `https://maps.googleapis.com/maps/api/directions/json?origin=${start.lat},${start.lng}&destination=${end.lat},${end.lng}&key=${GOOGLE_API_KEY}&alternatives=false`
      );

      if (!response.ok) {
        throw new Error("Failed to get directions");
      }

      const data = await response.json();

      if (data.status !== "OK" || !data.routes.length) {
        throw new Error("No routes found");
      }

      const route = data.routes[0];
      const legs = route.legs[0];

      // Convert Google Directions steps to our format
      const steps: RouteStep[] = legs.steps.map((step: any, index: number) => {
        let maneuver = "straight";
        const instructions = step.html_instructions.toLowerCase();

        if (
          instructions.includes("turn right") ||
          instructions.includes("right turn")
        ) {
          maneuver = "turn-right";
        } else if (
          instructions.includes("turn left") ||
          instructions.includes("left turn")
        ) {
          maneuver = "turn-left";
        } else if (
          instructions.includes("arrive") ||
          instructions.includes("destination")
        ) {
          maneuver = "arrive";
        }

        return {
          instruction: step.html_instructions.replace(/<[^>]*>/g, ""), // Remove HTML tags
          distance: step.distance.text,
          duration: step.duration.text,
          coordinates: {
            lat: step.end_location.lat,
            lng: step.end_location.lng,
          },
          maneuver,
        };
      });

      setRoute(steps);
      setCurrentStepIndex(0);

      toast({
        title: "Route calculated",
        description: `Found route with ${steps.length} steps (${legs.distance.text}, ${legs.duration.text})`,
      });
    } catch (error) {
      console.error("Error calculating route:", error);

      // Fallback to mock route if API fails
      const steps: RouteStep[] = [
        {
          instruction: "Head north on your current street",
          distance: "0.2 miles",
          duration: "1 min",
          coordinates: start,
          maneuver: "straight",
        },
        {
          instruction: "Turn right at the junction onto Main Street",
          distance: "0.5 miles",
          duration: "2 mins",
          coordinates: { lat: start.lat + 0.002, lng: start.lng + 0.001 },
          maneuver: "turn-right",
        },
        {
          instruction: "Continue straight through the traffic light",
          distance: "0.8 miles",
          duration: "3 mins",
          coordinates: { lat: start.lat + 0.005, lng: start.lng + 0.003 },
          maneuver: "straight",
        },
        {
          instruction: "Turn left at Oak Street junction",
          distance: "0.3 miles",
          duration: "1 min",
          coordinates: { lat: start.lat + 0.008, lng: start.lng + 0.002 },
          maneuver: "turn-left",
        },
        {
          instruction: "Arrive at your destination on the right",
          distance: "0.1 miles",
          duration: "30 secs",
          coordinates: end,
          maneuver: "arrive",
        },
      ];

      setRoute(steps);
      setCurrentStepIndex(0);

      toast({
        title: "Route calculated (offline mode)",
        description: `Using fallback route with ${steps.length} steps`,
        variant: "destructive",
      });
    }
  };

  const startNavigation = () => {
    if (route.length > 0) {
      setIsNavigating(true);
      toast({
        title: "Navigation started",
        description: "Follow the turn-by-turn directions",
      });
    }
  };

  const stopNavigation = () => {
    setIsNavigating(false);
    setCurrentStepIndex(0);
    toast({
      title: "Navigation stopped",
      description: "You can start navigation again anytime",
    });
  };

  const nextStep = () => {
    if (currentStepIndex < route.length - 1) {
      setCurrentStepIndex(currentStepIndex + 1);
    }
  };

  const handleDestinationSelect = (location: Location) => {
    setDestination(location);
    setShowRoutePanel(true);
    if (currentLocation) {
      calculateRoute(currentLocation, location);
    }
  };

  return (
    <div className="h-screen flex bg-white relative overflow-hidden">
      {/* Map Area - Full Screen */}
      <div className="flex-1 relative">
        <MapComponent
          currentLocation={currentLocation}
          destination={destination}
          route={route}
          currentStepIndex={currentStepIndex}
          isNavigating={isNavigating}
          mapView={mapView}
        />

        {/* Top Left Search Panel */}
        <Card className="absolute top-6 left-6 w-80 bg-white shadow-xl border-0 rounded-2xl overflow-hidden">
          <div className="p-6">
            <SearchPanel
              onDestinationSelect={handleDestinationSelect}
              currentLocation={currentLocation}
              isLoaded={isLoaded}
            />
          </div>
        </Card>

        {/* Transport Options Panel - Shows when route is calculated */}
        {showRoutePanel && route.length > 0 && (
          <Card className="absolute bottom-6 left-6 w-80 bg-white shadow-xl border-0 rounded-2xl overflow-hidden">
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">
                  Transport options
                </h3>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowRoutePanel(false)}
                  className="h-8 w-8 p-0"
                >
                  ×
                </Button>
              </div>

              {/* Transport Options */}
              <div className="space-y-3">
                <div className="flex items-center justify-between p-3 bg-green-50 border border-green-200 rounded-xl">
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center">
                      <Route className="h-4 w-4 text-white" />
                    </div>
                    <div>
                      <div className="font-medium text-gray-900">By car</div>
                      <div className="text-sm text-gray-600">
                        {route.length} stops
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-bold text-green-600">1200-2500</div>
                    <div className="text-xs text-gray-500">Total cost</div>
                  </div>
                </div>

                <div className="flex items-center justify-between p-3 border border-gray-200 rounded-xl hover:bg-gray-50">
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center">
                      <Navigation className="h-4 w-4 text-white" />
                    </div>
                    <div>
                      <div className="font-medium text-gray-900">
                        By public transport
                      </div>
                      <div className="text-sm text-gray-600">Metro + Bus</div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-bold text-blue-600">300-500</div>
                    <div className="text-xs text-gray-500">Total cost</div>
                  </div>
                </div>

                <div className="flex items-center justify-between p-3 border border-gray-200 rounded-xl hover:bg-gray-50">
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 bg-orange-500 rounded-full flex items-center justify-center">
                      <MapPin className="h-4 w-4 text-white" />
                    </div>
                    <div>
                      <div className="font-medium text-gray-900">By taxi</div>
                      <div className="text-sm text-gray-600">Direct route</div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-bold text-orange-600">800-1200</div>
                    <div className="text-xs text-gray-500">Total cost</div>
                  </div>
                </div>
              </div>

              {/* Start Navigation Button */}
              <Button
                onClick={startNavigation}
                className="w-full mt-4 bg-green-500 hover:bg-green-600 text-white py-3 rounded-xl font-medium"
              >
                Start Navigation
              </Button>
            </div>
          </Card>
        )}

        {/* Navigation Controls - Only show during navigation */}
        {isNavigating && (
          <Card className="absolute top-6 right-6 w-80 bg-white shadow-xl border-0 rounded-2xl overflow-hidden">
            <div className="p-6">
              <RouteInfo
                route={route}
                currentStepIndex={currentStepIndex}
                isNavigating={isNavigating}
              />
              <div className="mt-4">
                <NavigationControls
                  isNavigating={isNavigating}
                  onStartNavigation={startNavigation}
                  onStopNavigation={stopNavigation}
                  onNextStep={nextStep}
                  canGoNext={currentStepIndex < route.length - 1}
                />
              </div>
            </div>
          </Card>
        )}

        {/* Current Location Info */}
        {currentLocation && (
          <Card className="absolute bottom-6 right-6 p-4 bg-white/95 backdrop-blur-sm shadow-lg border-0 rounded-2xl">
            <div className="flex items-center space-x-3 text-sm">
              <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
              <div>
                <div className="font-medium text-gray-900">
                  Current Location
                </div>
                <div className="text-xs text-gray-600">
                  {currentLocation.lat.toFixed(6)},{" "}
                  {currentLocation.lng.toFixed(6)}
                </div>
              </div>
            </div>
          </Card>
        )}

        {/* Map View Toggle */}
        <div className="absolute top-6 right-6">
          <div className="flex bg-white rounded-xl shadow-lg overflow-hidden">
            <Button
              variant={mapView === "roadmap" ? "default" : "ghost"}
              size="sm"
              onClick={() => setMapView("roadmap")}
              className="rounded-none border-0"
            >
              Map
            </Button>
            <Button
              variant={mapView === "satellite" ? "default" : "ghost"}
              size="sm"
              onClick={() => setMapView("satellite")}
              className="rounded-none border-0"
            >
              Satellite
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Index;
