// pages/Index.tsx
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
// import { UserButton } from "@clerk/clerk-react"; // REMOVE THIS LINE

const libraries = ["places", "geometry"];

interface TransportStep {
  start: string;
  start_lat: string;
  start_long: string;
  stop: string;
  stop_lat: string;
  stop_long: string;
  price: string;
  type_of_vehicle: string;
  notes: string;
}

interface TransportRouteResponse {
  routesA: TransportStep[];
  routesB: TransportStep[];
}
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
  const [transportRoutes, setTransportRoutes] =
    useState<TransportRouteResponse | null>(null);
  const [selectedRoute, setSelectedRoute] = useState<"routeA" | "routeB">(
    "routeA"
  );

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

  const MOCK_TRANSPORT_ROUTES: TransportRouteResponse = {
    routesA: [
      {
        start: "Sabo Market",
        start_lat: "6.5194",
        start_long: "3.3792",
        stop: "Yaba Market",
        stop_lat: "6.5149",
        stop_long: "3.3793",
        price: "100",
        type_of_vehicle: "danfo",
        notes: "Board yellow 'Yaba-Ojuelegba' Danfo",
      },
      {
        start: "Yaba Market",
        start_lat: "6.5149",
        start_long: "3.3793",
        stop: "Obanikoro",
        stop_lat: "6.5492",
        stop_long: "3.3817",
        price: "150",
        type_of_vehicle: "danfo",
        notes: "Transfer to 'Ikeja' Danfo (yellow/black stripes)",
      },
      {
        start: "Obanikoro",
        start_lat: "6.5492",
        start_long: "3.3817",
        stop: "Palmgrove",
        stop_lat: "6.5531",
        stop_long: "3.3845",
        price: "0",
        type_of_vehicle: "danfo",
        notes: "Stay in same vehicle",
      },
      {
        start: "Palmgrove",
        start_lat: "6.5531",
        start_long: "3.3845",
        stop: "Ikeja Underbridge",
        stop_lat: "6.5874",
        stop_long: "3.3421",
        price: "50",
        type_of_vehicle: "danfo",
        notes: "Final stop (alight at LASMA office)",
      },
    ],
    routesB: [
      {
        start: "Sabo Market",
        start_lat: "6.5194",
        start_long: "3.3792",
        stop: "Costain BRT Terminal",
        stop_lat: "6.4923",
        stop_long: "3.3789",
        price: "300",
        type_of_vehicle: "BRT",
        notes: "Board blue 'CMS-Abule Egba' BRT (Cowry card required)",
      },
      {
        start: "Costain BRT Terminal",
        start_lat: "6.4923",
        start_long: "3.3789",
        stop: "Oshodi BRT Terminal",
        stop_lat: "6.5218",
        stop_long: "3.3356",
        price: "0",
        type_of_vehicle: "BRT",
        notes: "Free transfer to 'Oshodi-Ikeja' BRT",
      },
      {
        start: "Oshodi BRT Terminal",
        start_lat: "6.5218",
        start_long: "3.3356",
        stop: "Ikeja Underbridge",
        stop_lat: "6.5874",
        stop_long: "3.3421",
        price: "200",
        type_of_vehicle: "danfo",
        notes: "Board 'Ikeja Underbridge' Danfo (last stop)",
      },
    ],
  };

  // Then update your API useEffect:
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

      fetch("https://c4882168-00d8-4fc6-8900-6af6c0bec77c.mock.pstmn.io", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      })
        .then(res => {
          if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
          return res.json();
        })
        .then((data: TransportRouteResponse) => {
          setTransportRoutes(data);
          toast({
            title: "Transport routes loaded",
            description: "Found multiple route options",
          });
        })
        .catch(error => {
          console.log("Using mock transport data due to API error:", error);
          setTransportRoutes(MOCK_TRANSPORT_ROUTES);
          toast({
            title: "Using offline transport data",
            description: "Showing sample transport routes",
            variant: "default",
          });
        });
    }
  }, [currentLocation, destination, toast]);

  if (loadError) {
    return (
      <div className="w-full h-full flex items-center justify-center bg-gray-100">
        <Card className="p-4 text-center">
          <h3 className="text-lg font-medium text-red-600">
            Error loading Google Maps
          </h3>
          <p className="text-sm text-gray-600 mt-2">
            Please check your internet connection and try again.
          </p>
        </Card>
      </div>
    );
  }
  const convertTransportToSteps = (
    transportSteps: TransportStep[]
  ): RouteStep[] => {
    return transportSteps.map((step, index) => {
      const isLastStep = index === transportSteps.length - 1;
      return {
        instruction: `${step.type_of_vehicle.toUpperCase()}: ${step.start} → ${
          step.stop
        }`,
        distance: `${step.price} NGN`,
        duration: "N/A", // Could be calculated if you have time estimates
        coordinates: {
          lat: parseFloat(isLastStep ? step.stop_lat : step.start_lat),
          lng: parseFloat(isLastStep ? step.stop_long : step.start_long),
        },
        maneuver: isLastStep ? "arrive" : "straight",
        notes: step.notes, // Adding notes to the step
      };
    });
  };

  const getTransportRouteCoordinates = (steps: TransportStep[] | undefined): Location[] => {
  const coordinates: Location[] = [];

  if (!steps) {
    return coordinates; // Return empty array if steps is undefined
  }

  steps.forEach(step => {
    coordinates.push({
      lat: parseFloat(step.start_lat),
      lng: parseFloat(step.start_long),
      address: step.start,
    });
    coordinates.push({
      lat: parseFloat(step.stop_lat),
      lng: parseFloat(step.stop_long),
      address: step.stop,
    });
  });

  return coordinates;
};
  const calculateRoute = async (start: Location, end: Location) => {
    try {
      console.log("Calculating route from", start, "to", end);

      // First check if we have transport routes to display instead
      if (transportRoutes) {
        const routeSteps =
          selectedRoute === "routeA"
            ? transportRoutes.routesA
            : transportRoutes.routesB;
        setRoute(convertTransportToSteps(routeSteps));
        setCurrentStepIndex(0);
        return;
      }

      // Only use Google Directions API if we don't have transport routes
      const response = await fetch(
        `https://maps.googleapis.com/maps/api/directions/json?origin=${start.lat},${start.lng}&destination=${end.lat},${end.lng}&key=${GOOGLE_API_KEY}&alternatives=false`
      );

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();

      if (data.status !== "OK" || !data.routes.length) {
        throw new Error(data.error_message || "No routes found");
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
          instruction: step.html_instructions.replace(/<[^>]*>/g, ""),
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

      // If we have transport routes, use those instead of the fallback
      if (transportRoutes) {
        const routeSteps =
          selectedRoute === "routeA"
            ? transportRoutes.routesA
            : transportRoutes.routesB;
        setRoute(convertTransportToSteps(routeSteps));
        setCurrentStepIndex(0);
        return;
      }

      // Fallback to mock route if all else fails
      const steps: RouteStep[] = [
        {
          instruction: "Head north on your current street",
          distance: "0.2 miles",
          duration: "1 min",
          coordinates: start,
          maneuver: "straight",
        },
        // ... rest of fallback steps
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
    <div className="h-screen w-full flex bg-white relative overflow-hidden">
      {/* Map Container - must have explicit dimensions */}
      <div className="flex-1 w-full h-full">
        {!isLoaded ? (
          <div className="w-full h-full flex items-center justify-center bg-gray-100">
            <div className="flex flex-col items-center">
              <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mb-4" />
              <p className="text-gray-700">Loading Google Maps...</p>
            </div>
          </div>
        ) : (
          <>
            {/* REMOVE THIS User Button block from Index.tsx
            <div className="absolute top-4 right-4 z-50">
              <UserButton
                appearance={{
                  elements: {
                    userButtonBox: "h-10 w-10",
                    userButtonAvatarBox: "h-full w-full"
                  }
                }}
              />
            </div>
            */}
            {/* Main Map Component */}
            <MapComponent
              currentLocation={currentLocation}
              destination={destination}
              route={route}
              currentStepIndex={currentStepIndex}
              isNavigating={isNavigating}
              mapView={mapView}
              transportRoute={
                selectedRoute && transportRoutes
                  ? getTransportRouteCoordinates(transportRoutes[selectedRoute])
                  : undefined
              }
            />
            {/* Search Panel */}
            <Card className="absolute top-6 left-6 w-80 bg-white shadow-xl border-0 rounded-2xl overflow-hidden z-10">
              <div className="p-6">
                <SearchPanel
                  onDestinationSelect={handleDestinationSelect}
                  currentLocation={currentLocation}
                  isLoaded={isLoaded}
                />
              </div>
            </Card>
            {/* Transport Options Panel */}
            {showRoutePanel && transportRoutes && (
              <Card className="absolute bottom-6 left-6 w-80 bg-white shadow-xl border-0 rounded-2xl overflow-hidden z-10">
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

                  <div className="space-y-3">
                    {/* Route A - Danfo Option */}
                    <div
                      className={`flex items-center justify-between p-3 border rounded-xl cursor-pointer ${
                        selectedRoute === "routeA"
                          ? "bg-green-50 border-green-200"
                          : "border-gray-200 hover:bg-gray-50"
                      }`}
                      onClick={() => setSelectedRoute("routeA")}
                    >
                      <div className="flex items-center space-x-3">
                        <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center">
                          <Route className="h-4 w-4 text-white" />
                        </div>
                        <div>
                          <div className="font-medium text-gray-900">
                            Danfo Route
                          </div>
                          <div className="text-sm text-gray-600">
                            {transportRoutes.routesA.length} transfers
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="font-bold text-green-600">
                          ₦
                          {transportRoutes.routesA.reduce(
                            (sum, step) => sum + parseInt(step.price),
                            0
                          )}
                        </div>
                        <div className="text-xs text-gray-500">Total cost</div>
                      </div>
                    </div>

                    {/* Route B - BRT Option */}
                    <div
                      className={`flex items-center justify-between p-3 border rounded-xl cursor-pointer ${
                        selectedRoute === "routeB"
                          ? "bg-blue-50 border-blue-200"
                          : "border-gray-200 hover:bg-gray-50"
                      }`}
                      onClick={() => setSelectedRoute("routeB")}
                    >
                      <div className="flex items-center space-x-3">
                        <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center">
                          <Navigation className="h-4 w-4 text-white" />
                        </div>
                        <div>
                          <div className="font-medium text-gray-900">
                            BRT Route
                          </div>
                          <div className="text-sm text-gray-600">
                            {transportRoutes.routesB.length} transfers
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="font-bold text-blue-600">
                          ₦
                          {transportRoutes.routesB.reduce(
                            (sum, step) => sum + parseInt(step.price),
                            0
                          )}
                        </div>
                        <div className="text-xs text-gray-500">Total cost</div>
                      </div>
                    </div>

                    {/* Taxi Option */}
                    <div className="flex items-center justify-between p-3 border border-gray-200 rounded-xl hover:bg-gray-50">
                      <div className="flex items-center space-x-3">
                        <div className="w-8 h-8 bg-orange-500 rounded-full flex items-center justify-center">
                          <MapPin className="h-4 w-4 text-white" />
                        </div>
                        <div>
                          <div className="font-medium text-gray-900">
                            By taxi
                          </div>
                          <div className="text-sm text-gray-600">
                            Direct route
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="font-bold text-orange-600">
                          ₦800-1200
                        </div>
                        <div className="text-xs text-gray-500">Total cost</div>
                      </div>
                    </div>
                  </div>

                  <Button
                    onClick={() => {
                      const routeSteps =
                        selectedRoute === "routeA"
                          ? transportRoutes.routesA
                          : transportRoutes.routesB;
                      setRoute(convertTransportToSteps(routeSteps));
                      startNavigation();
                    }}
                    className="w-full mt-4 bg-green-500 hover:bg-green-600 text-white py-3 rounded-xl font-medium"
                  >
                    Start Navigation
                  </Button>

                  {/* Route details */}
                  <div className="mt-4 p-3 bg-gray-50 rounded-lg">
                    <h4 className="font-medium text-sm mb-2">Route Details:</h4>
                    <div className="space-y-2 text-sm">
                      {(selectedRoute === "routeA"
                        ? transportRoutes.routesA
                        : transportRoutes.routesB
                      ).map((step, index) => (
                        <div key={index} className="flex items-start">
                          <div className="w-5 h-5 bg-gray-200 rounded-full flex items-center justify-center mt-0.5 mr-2 flex-shrink-0">
                            <span className="text-xs">{index + 1}</span>
                          </div>
                          <div>
                            <p className="font-medium">
                              {step.type_of_vehicle}: {step.start} to{" "}
                              {step.stop}
                            </p>
                            <p className="text-gray-600">
                              ₦{step.price} - {step.notes}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </Card>
            )}
            ////////////////////////////////////////////////
            {/* Navigation Controls */}
            {isNavigating && (
              <Card className="absolute top-6 right-6 w-80 bg-white shadow-xl border-0 rounded-2xl overflow-hidden z-10">
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
              <Card className="absolute bottom-6 right-6 p-4 bg-white/95 backdrop-blur-sm shadow-lg border-0 rounded-2xl z-10">
                <div className="flex items-center space-x-3 text-sm">
                  <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse" />
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
            <div className="absolute top-6 right-6 z-10">
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
          </>
        )}
      </div>
    </div>
  );
};

export default Index;
