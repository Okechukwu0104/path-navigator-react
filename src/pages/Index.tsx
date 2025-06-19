import React, { useState, useEffect, useRef } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Navigation, MapPin, Route } from "lucide-react";
import SearchPanel from "@/components/SearchPanel";
import MapComponent from "@/components/MapComponent";
import RouteInfo from "@/components/RouteInfo";
import NavigationControls from "@/components/NavigationControls";
import { useToast } from "@/hooks/use-toast";
import { useLoadScript } from "@react-google-maps/api";

const libraries = ["places", "geometry"] as const;

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
  notes?: string;
}

const GOOGLE_API_KEY = "AIzaSyCsIxQ-fyrN_cOw46dFVWGMBKfI93LoVe8";

// Lagos, Nigeria coordinates for better default location
const LAGOS_DEFAULT_LOCATION = { lat: 6.5244, lng: 3.3792 };

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
  const [locationError, setLocationError] = useState<string | null>(null);
  const [isLocating, setIsLocating] = useState(false);
  const [locationAccuracy, setLocationAccuracy] = useState<number | null>(null);
  const { toast } = useToast();
  const [transportRoutes, setTransportRoutes] =
    useState<TransportRouteResponse | null>(null);
  const [selectedRoute, setSelectedRoute] = useState<"routeA" | "routeB">(
    "routeA"
  );

  // Use refs to prevent multiple simultaneous location requests
  const locationWatchId = useRef<number | null>(null);
  const isLocationRequestInProgress = useRef(false);

  // Get user's current location with improved stability
  useEffect(() => {
    const getCurrentLocation = () => {
      if (!navigator.geolocation) {
        console.error("Geolocation is not supported by this browser");
        setCurrentLocation(LAGOS_DEFAULT_LOCATION);
        setLocationError("Geolocation not supported");
        setIsLocating(false);
        toast({
          title: "Geolocation not supported",
          description: "Using Lagos, Nigeria as default location.",
          variant: "destructive",
        });
        return;
      }

      // Prevent multiple simultaneous requests
      if (isLocationRequestInProgress.current) {
        return;
      }

      setIsLocating(true);
      isLocationRequestInProgress.current = true;

      const options = {
        enableHighAccuracy: true,
        timeout: 15000, // Increased timeout
        maximumAge: 30000, // Reduced maximum age for more current location
      };

      const handleSuccess = (position: GeolocationPosition) => {
        const location = {
          lat: position.coords.latitude,
          lng: position.coords.longitude,
        };

        console.log("Location found:", location);
        console.log("Accuracy:", position.coords.accuracy, "meters");

        setCurrentLocation(location);
        setLocationAccuracy(position.coords.accuracy);
        setLocationError(null);
        setIsLocating(false);
        isLocationRequestInProgress.current = false;

        toast({
          title: "Location found",
          description: `Accuracy: ${Math.round(position.coords.accuracy)}m`,
        });
      };

      const handleError = (error: GeolocationPositionError) => {
        console.error("Geolocation error:", error);
        let errorMessage = "Unknown location error";

        switch (error.code) {
          case error.PERMISSION_DENIED:
            errorMessage = "Location access denied by user";
            break;
          case error.POSITION_UNAVAILABLE:
            errorMessage = "Location information unavailable";
            break;
          case error.TIMEOUT:
            errorMessage = "Location request timed out";
            break;
        }

        setLocationError(errorMessage);
        setCurrentLocation(LAGOS_DEFAULT_LOCATION);
        setIsLocating(false);
        isLocationRequestInProgress.current = false;

        toast({
          title: "Location access failed",
          description: `${errorMessage}. Using Lagos, Nigeria as default.`,
          variant: "destructive",
        });
      };

      // First, try to get current position
      navigator.geolocation.getCurrentPosition(
        handleSuccess,
        handleError,
        options
      );

      // Then set up continuous watching for better accuracy
      if (locationWatchId.current) {
        navigator.geolocation.clearWatch(locationWatchId.current);
      }

      locationWatchId.current = navigator.geolocation.watchPosition(
        position => {
          const newLocation = {
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          };

          // Only update if the location has changed significantly (> 10 meters)
          if (currentLocation) {
            const distance = calculateDistance(
              currentLocation.lat,
              currentLocation.lng,
              newLocation.lat,
              newLocation.lng
            );

            if (distance > 10) {
              // 10 meters threshold
              console.log(
                "Location updated:",
                newLocation,
                "Distance moved:",
                distance
              );
              setCurrentLocation(newLocation);
              setLocationAccuracy(position.coords.accuracy);
            }
          } else {
            setCurrentLocation(newLocation);
            setLocationAccuracy(position.coords.accuracy);
          }
        },
        error => {
          console.warn("Watch position error:", error);
          // Don't show error for watch position failures, just log them
        },
        {
          enableHighAccuracy: true,
          maximumAge: 10000,
          timeout: 10000,
        }
      );
    };

    getCurrentLocation();

    // Cleanup function
    return () => {
      if (locationWatchId.current) {
        navigator.geolocation.clearWatch(locationWatchId.current);
        locationWatchId.current = null;
      }
      isLocationRequestInProgress.current = false;
    };
  }, []); // Empty dependency array to run only once

  // Helper function to calculate distance between two points
  const calculateDistance = (
    lat1: number,
    lon1: number,
    lat2: number,
    lon2: number
  ): number => {
    const R = 6371e3; // Earth's radius in meters
    const φ1 = (lat1 * Math.PI) / 180;
    const φ2 = (lat2 * Math.PI) / 180;
    const Δφ = ((lat2 - lat1) * Math.PI) / 180;
    const Δλ = ((lon2 - lon1) * Math.PI) / 180;

    const a =
      Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
      Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    return R * c; // Distance in meters
  };

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
        price: "500",
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

  // Load transport routes when locations are set
  useEffect(() => {
    if (currentLocation && destination) {
      const payload = [
        {
          "start-name":
            currentLocation.name ||
            currentLocation.address ||
            "Current Location",
          "start-long": currentLocation.lng,
          "start-lat": currentLocation.lat,
          "stop-name": destination.name || destination.address || "Destination",
          "stop-long": destination.lng,
          "stop-lat": destination.lat,
        },
      ];

      console.log("Fetching transport routes with payload:", payload);

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
          console.log("Transport routes received:", data);
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
          <p className="text-xs text-gray-500 mt-2">
            Error: {loadError.message}
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
        distance: `₦${step.price}`,
        duration: "N/A",
        coordinates: {
          lat: parseFloat(isLastStep ? step.stop_lat : step.start_lat),
          lng: parseFloat(isLastStep ? step.stop_long : step.start_long),
          address: isLastStep ? step.stop : step.start,
        },
        maneuver: isLastStep ? "arrive" : "straight",
        notes: step.notes,
      };
    });
  };

  const getTransportRouteCoordinates = (
    steps: TransportStep[] | undefined
  ): Location[] => {
    if (!steps || steps.length === 0) {
      return [];
    }

    const coordinates: Location[] = [];

    steps.forEach((step, index) => {
      // Add start point (avoid duplicates)
      const startCoord = {
        lat: parseFloat(step.start_lat),
        lng: parseFloat(step.start_long),
        address: step.start,
        name: step.start,
      };

      // Only add if it's the first step or different from previous stop
      if (
        index === 0 ||
        coordinates[coordinates.length - 1]?.lat !== startCoord.lat
      ) {
        coordinates.push(startCoord);
      }

      // Add stop point
      coordinates.push({
        lat: parseFloat(step.stop_lat),
        lng: parseFloat(step.stop_long),
        address: step.stop,
        name: step.stop,
      });
    });

    return coordinates;
  };

  const calculateRoute = async (start: Location, end: Location) => {
    try {
      console.log("Calculating route from", start, "to", end);

      // Check if we have transport routes to display
      if (transportRoutes) {
        const routeSteps =
          selectedRoute === "routeA"
            ? transportRoutes.routesA
            : transportRoutes.routesB;

        const convertedSteps = convertTransportToSteps(routeSteps);
        setRoute(convertedSteps);
        setCurrentStepIndex(0);

        console.log("Using transport routes:", convertedSteps);
        return;
      }

      // Fallback to Google Directions API
      const directionsService = new google.maps.DirectionsService();

      const request = {
        origin: new google.maps.LatLng(start.lat, start.lng),
        destination: new google.maps.LatLng(end.lat, end.lng),
        travelMode: google.maps.TravelMode.TRANSIT,
        transitOptions: {
          departureTime: new Date(),
        },
      };

      directionsService.route(request, (result, status) => {
        if (status === google.maps.DirectionsStatus.OK && result) {
          const route = result.routes[0];
          const leg = route.legs[0];

          const steps: RouteStep[] = leg.steps.map((step, index) => {
            let maneuver = "straight";
            const instructions = step.instructions.toLowerCase();

            if (instructions.includes("turn right")) {
              maneuver = "turn-right";
            } else if (instructions.includes("turn left")) {
              maneuver = "turn-left";
            } else if (instructions.includes("arrive")) {
              maneuver = "arrive";
            }

            return {
              instruction: step.instructions.replace(/<[^>]*>/g, ""),
              distance: step.distance?.text || "N/A",
              duration: step.duration?.text || "N/A",
              coordinates: {
                lat: step.end_location.lat(),
                lng: step.end_location.lng(),
              },
              maneuver,
            };
          });

          setRoute(steps);
          setCurrentStepIndex(0);

          toast({
            title: "Route calculated",
            description: `Found route with ${steps.length} steps`,
          });
        } else {
          throw new Error(`Directions request failed: ${status}`);
        }
      });
    } catch (error) {
      console.error("Error calculating route:", error);

      // Use transport routes if available
      if (transportRoutes) {
        const routeSteps =
          selectedRoute === "routeA"
            ? transportRoutes.routesA
            : transportRoutes.routesB;
        setRoute(convertTransportToSteps(routeSteps));
        setCurrentStepIndex(0);
        return;
      }

      // Final fallback
      const fallbackSteps: RouteStep[] = [
        {
          instruction: "Navigate to your destination",
          distance: "Unknown",
          duration: "Unknown",
          coordinates: end,
          maneuver: "arrive",
        },
      ];

      setRoute(fallbackSteps);
      setCurrentStepIndex(0);

      toast({
        title: "Route calculated (fallback)",
        description: "Using basic route information",
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
    console.log("Destination selected:", location);
    setDestination(location);
    setShowRoutePanel(true);
    if (currentLocation) {
      calculateRoute(currentLocation, location);
    }
  };

  const retryLocation = () => {
    setLocationError(null);
    setCurrentLocation(null);
    setIsLocating(true);
    isLocationRequestInProgress.current = false;

    // Clear existing watch
    if (locationWatchId.current) {
      navigator.geolocation.clearWatch(locationWatchId.current);
      locationWatchId.current = null;
    }

    // Trigger location detection again
    const getCurrentLocation = () => {
      const options = {
        enableHighAccuracy: true,
        timeout: 15000,
        maximumAge: 0, // Force fresh location
      };

      navigator.geolocation.getCurrentPosition(
        position => {
          const location = {
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          };
          setCurrentLocation(location);
          setLocationAccuracy(position.coords.accuracy);
          setIsLocating(false);
          toast({
            title: "Location found",
            description: `Accuracy: ${Math.round(position.coords.accuracy)}m`,
          });
        },
        error => {
          setCurrentLocation(LAGOS_DEFAULT_LOCATION);
          setIsLocating(false);
          toast({
            title: "Using default location",
            description: "Lagos, Nigeria set as your location.",
          });
        },
        options
      );
    };
    getCurrentLocation();
  };

  return (
    <div className="h-screen w-full flex bg-white relative overflow-hidden">
      {/* Map Container */}
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
                      onClick={() => {
                        setSelectedRoute("routeA");
                        if (currentLocation && destination) {
                          calculateRoute(currentLocation, destination);
                        }
                      }}
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
                      onClick={() => {
                        setSelectedRoute("routeB");
                        if (currentLocation && destination) {
                          calculateRoute(currentLocation, destination);
                        }
                      }}
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

            {/* Navigation Controls */}
            {isNavigating && (
              <Card className="absolute top-6 right-6 w-80 bg-white shadow-xl border-0 rounded-2xl overflow-hidden z-10">
                <div className="p-6">
                  <RouteInfo
                    route={
                      selectedRoute === "routeA"
                        ? transportRoutes.routesA
                        : transportRoutes.routesB
                    }
                    currentStepIndex={currentStepIndex}
                    isNavigating={isNavigating}
                    onNextStep={() =>
                      setCurrentStepIndex(prev =>
                        Math.min(prev + 1, route.length - 1)
                      )
                    }
                    onPrevStep={() =>
                      setCurrentStepIndex(prev => Math.max(prev - 1, 0))
                    }
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
                  <div
                    className={`w-3 h-3 rounded-full ${
                      isLocating
                        ? "bg-yellow-500 animate-pulse"
                        : locationError
                        ? "bg-red-500"
                        : "bg-green-500"
                    }`}
                  />
                  <div>
                    <div className="font-medium text-gray-900">
                      {isLocating ? "Locating..." : "Current Location"}
                    </div>
                    <div className="text-xs text-gray-600">
                      {currentLocation.lat.toFixed(6)},{" "}
                      {currentLocation.lng.toFixed(6)}
                    </div>
                    {locationAccuracy && (
                      <div className="text-xs text-green-600">
                        Accuracy: {Math.round(locationAccuracy)}m
                      </div>
                    )}
                    {locationError && (
                      <div className="text-xs text-red-500">
                        {locationError}
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={retryLocation}
                          className="ml-2 h-4 px-2 text-xs"
                          disabled={isLocating}
                        >
                          {isLocating ? "Locating..." : "Retry"}
                        </Button>
                      </div>
                    )}
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
