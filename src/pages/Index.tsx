import React, { useState, useEffect, useRef } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Navigation,
  MapPin,
  Route,
  ChevronLeft,
  ChevronRight,
  Users,
  Sun,
  Square,
  Clock,
  Currency,
  Badge,
} from "lucide-react";
import SearchPanel from "@/components/SearchPanel";
import MapComponent from "@/components/MapComponent";
import { useToast } from "@/hooks/use-toast";
import { useLoadScript } from "@react-google-maps/api";

const libraries = ["places", "geometry"] as const;

interface TransportStep {
  start: string;
  end: string;
  vehicle: string;
  weather: string;
  time: string;
  crowd: number;
  start_long: number;
  start_lat: number;
  end_long: number;
  end_lat: number;
  price: string;
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
const LAGOS_DEFAULT_LOCATION = { lat: 6.5244, lng: 3.3792 };

const Index = () => {
  const mapRef = useRef<google.maps.Map | null>(null);

  const { isLoaded, loadError } = useLoadScript({
    googleMapsApiKey: GOOGLE_API_KEY,
    libraries,
  });

  const [currentLocation, setCurrentLocation] = useState<Location | null>(null);
  const [destination, setDestination] = useState<Location | null>(null);
  const [transportSteps, setTransportSteps] = useState<TransportStep[]>([]);
  const [isNavigating, setIsNavigating] = useState(false);
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [mapView, setMapView] = useState<"roadmap" | "satellite">("roadmap");
  const [showNavigationPanel, setShowNavigationPanel] = useState(false);
  const [locationError, setLocationError] = useState<string | null>(null);
  const [isLocating, setIsLocating] = useState(false);
  const [locationAccuracy, setLocationAccuracy] = useState<number | null>(null);
  const { toast } = useToast();
  const locationWatchId = useRef<number | null>(null);
  const isLocationRequestInProgress = useRef(false);

  useEffect(() => {
    const getCurrentLocation = () => {
      if (!navigator.geolocation) {
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

      if (isLocationRequestInProgress.current) return;

      setIsLocating(true);
      isLocationRequestInProgress.current = true;

      // Improved options for better accuracy
      const options = {
        enableHighAccuracy: true, // This is critical for mobile devices
        timeout: 20000, // Increased timeout
        maximumAge: 0, // Don't use cached position
      };

      const handleSuccess = (position: GeolocationPosition) => {
        const location = {
          lat: position.coords.latitude,
          lng: position.coords.longitude,
        };
        setCurrentLocation(location);
        setLocationAccuracy(position.coords.accuracy);
        setLocationError(null);
        setIsLocating(false);
        isLocationRequestInProgress.current = false;

        // If we have a map reference, pan to the new location
        if (mapRef.current) {
          mapRef.current.panTo(location);
        }
      };

      const handleError = (error: GeolocationPositionError) => {
        // Retry with less accurate settings if high accuracy fails
        if (error.code === error.TIMEOUT) {
          navigator.geolocation.getCurrentPosition(
            handleSuccess,
            handleFinalError,
            { enableHighAccuracy: false, timeout: 10000 }
          );
          return;
        }
        handleFinalError(error);
      };

      const handleFinalError = (error: GeolocationPositionError) => {
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
      };

      navigator.geolocation.getCurrentPosition(
        handleSuccess,
        handleError,
        options
      );

      if (locationWatchId.current) {
        navigator.geolocation.clearWatch(locationWatchId.current);
      }

      // More aggressive watch position for navigation
      locationWatchId.current = navigator.geolocation.watchPosition(
        position => {
          const newLocation = {
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          };
          setCurrentLocation(newLocation);
          setLocationAccuracy(position.coords.accuracy);

          // Auto-center map during navigation
          if (isNavigating && mapRef.current) {
            mapRef.current.panTo(newLocation);
          }
        },
        error => console.warn("Watch position error:", error),
        {
          enableHighAccuracy: true,
          maximumAge: 0,
          timeout: 15000,
        }
      );
    };

    getCurrentLocation();

    return () => {
      if (locationWatchId.current) {
        navigator.geolocation.clearWatch(locationWatchId.current);
      }
    };
  }, [isNavigating, toast]);

  useEffect(() => {
    if (currentLocation && destination) {
      const payload = {
          "startName": currentLocation.name || "",
          "startLong": currentLocation.lng,
          "startLat": currentLocation.lat,
          "stopName": destination.name || "",
          "stopLong": destination.lng,
          "stopLat": destination.lat,
        };

      fetch(
        "https://9166d298-3e05-4c76-a645-4478df40a8e7.mock.pstmn.io/route",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        }
      )
        .then(res => {
          if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
          return res.json();
        })
        .then(data => {
          setTransportSteps(data);
          toast({
            title: "Transport routes loaded",
            description: "Found multiple route options",
          });
        })
        .catch(error => {
          console.log("Using mock transport data due to API error:", error);

          const mockResponse = [
            {
              start: "baba market",
              end: "jibowu bus stop",
              vehicle: "keke",
              weather: "sunny",
              time: "4.5",
              crowd: 1,
              start_long: 3.37800783,
              start_lat: 6.50600558,
              end_long: 3.3729165,
              end_lat: 6.5098321,
              price: "150",
            },
            {
              start: "jibowu bus stop",
              end: "obafemi awolowo way",
              vehicle: "keke",
              weather: "sunny",
              time: "6.2",
              crowd: 0,
              start_long: 3.3729165,
              start_lat: 6.5098321,
              end_long: 3.3612458,
              end_lat: 6.5183942,
              price: "100",
            },
            {
              start: "obafemi awolowo way",
              end: "ikeja underbridge",
              vehicle: "keke",
              weather: "sunny",
              time: "7.8",
              crowd: 1,
              start_long: 3.3612458,
              start_lat: 6.5183942,
              end_long: 3.3425871,
              end_lat: 6.5965062,
              price: "20000",
            },
          ];
          setTransportSteps(mockResponse);
          toast({
            title: "Using offline transport data",
            description: "Showing sample transport routes",
            variant: "default",
          });
        });
    }
  }, [currentLocation, destination, toast]);

  const handleDestinationSelect = (location: Location) => {
    setDestination(location);

    setShowNavigationPanel(true);
  };

  const startNavigation = () => {
    if (transportSteps.length > 0) {
      setIsNavigating(true);
      toast({
        title: "Navigation started",
        description: "Follow the transport directions",
      });
    }
  };

  const stopNavigation = () => {
    setIsNavigating(false);
    setCurrentStepIndex(0);
  };

  const nextStep = () => {
    if (currentStepIndex < transportSteps.length - 1) {
      setCurrentStepIndex(currentStepIndex + 1);
    }
  };

  const prevStep = () => {
    if (currentStepIndex > 0) {
      setCurrentStepIndex(currentStepIndex - 1);
    }
  };

  const getTransportIcon = (vehicle: string) => {
    switch (vehicle.toLowerCase()) {
      case "keke":
        return "🛺";
      case "bike":
        return "🏍️";
      case "bus":
        return "🚌";
      case "danfo":
        return "🚐";
      default:
        return "🚗";
    }
  };

  const getTotalCost = () => {
    return transportSteps.reduce(
      (total, step) => total + parseInt(step.price),
      0
    );
  };

  const getRouteCoordinates = (): Location[] => {
    if (transportSteps.length === 0) return [];

    const coordinates: Location[] = [];

    // Add starting point
    coordinates.push({
      lat: transportSteps[0].start_lat,
      lng: transportSteps[0].start_long,
      name: transportSteps[0].start,
    });

    // Add all end points
    transportSteps.forEach(step => {
      coordinates.push({
        lat: step.end_lat,
        lng: step.end_long,
        name: step.end,
      });
    });

    return coordinates;
  };

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
            <MapComponent
              ref={mapRef}
              currentLocation={currentLocation}
              destination={destination}
              routeCoordinates={getRouteCoordinates()}
              currentStepIndex={currentStepIndex}
              isNavigating={isNavigating}
              mapView={mapView}
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

            {showNavigationPanel && transportSteps.length > 0 && (
              <Card className="absolute bottom-[10rem] left-[90rem] transform -translate-x-1/2 w-[36rem] bg-white shadow-xl border-0 rounded-3xl overflow-hidden z-10">
                <div className="p-8">
                  {/* Header - Larger */}
                  <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center space-x-3">
                      <Route className="h-6 w-6 text-blue-600" />
                      <h3 className="text-xl font-semibold text-gray-900">
                        Transport Route
                      </h3>
                    </div>
                    <div className="flex items-center space-x-3">
                      <Badge className="bg-green-100 text-green-800 text-base py-1.5 px-3">
                        <Navigation className="h-4 w-4 mr-1.5" />₦
                        {getTotalCost()} total
                      </Badge>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setShowNavigationPanel(false)}
                        className="h-10 w-10 p-0 text-gray-500 hover:text-gray-700 text-xl"
                      >
                        ×
                      </Button>
                    </div>
                  </div>

                  <div className="mb-8">
                    <div className="flex flex-col items-center mb-6">
                      <div className="p-4 bg-blue-100 rounded-full mb-4">
                        <span className="text-4xl">
                          {getTransportIcon(
                            transportSteps[currentStepIndex].vehicle
                          )}
                        </span>
                      </div>

                      <div className="relative w-full max-w-md">
                        <div className="absolute left-0 right-0 top-1/2 h-1 bg-gray-200 transform -translate-y-1/2"></div>
                        <div
                          className="absolute left-0 top-1/2 h-1 bg-blue-500 transform -translate-y-1/2"
                          style={{
                            width: `${
                              ((currentStepIndex + 1) / transportSteps.length) *
                              100
                            }%`,
                          }}
                        ></div>
                        <div className="flex justify-between">
                          <MapPin className="h-6 w-6 mb-9 1 text-blue-600" />
                          <MapPin className="h-6 w-6 mb-9 text-red-600" />
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center space-x-4">
                        <span className="text-2xl font-medium capitalize">
                          {transportSteps[currentStepIndex].vehicle}
                        </span>
                        <Badge
                          variant="secondary"
                          className="text-lg py-1.5 px-3"
                        >
                          <Clock className="h-4 w-4 mr-1.5" />
                          {transportSteps[currentStepIndex].time.replace(
                            ".",
                            ":"
                          )}{" "}
                          min
                        </Badge>
                      </div>
                      <span className="text-2xl font-bold text-blue-600">
                        ₦{transportSteps[currentStepIndex].price}
                      </span>
                    </div>

                    <div className="flex justify-between mb-6 px-4">
                      <div className="text-base font-medium">
                        {transportSteps[currentStepIndex].start}
                      </div>
                      <div className="text-base font-medium">
                        {transportSteps[currentStepIndex].end}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between mb-6">
                    <Button
                      variant="outline"
                      onClick={prevStep}
                      disabled={currentStepIndex === 0}
                      className="flex items-center h-12 px-5 text-base"
                    >
                      <ChevronLeft className="h-5 w-5 mr-2" />
                      Previous
                    </Button>

                    <div className="flex space-x-3">
                      {transportSteps.map((_, index) => (
                        <div
                          key={index}
                          className={`h-3 w-3 rounded-full ${
                            index === currentStepIndex
                              ? "bg-blue-500"
                              : "bg-gray-300"
                          }`}
                        />
                      ))}
                    </div>

                    <Button
                      variant="outline"
                      onClick={nextStep}
                      disabled={currentStepIndex === transportSteps.length - 1}
                      className="flex items-center h-12 px-5 text-base"
                    >
                      Next
                      <ChevronRight className="h-5 w-5 ml-2" />
                    </Button>
                  </div>

                  {!isNavigating ? (
                    <Button
                      onClick={startNavigation}
                      className="w-full bg-blue-600 hover:bg-blue-700 text-white py-4 rounded-xl font-medium text-lg h-14"
                    >
                      <Navigation className="h-6 w-6 mr-3" />
                      Start Navigation
                    </Button>
                  ) : (
                    <Button
                      onClick={stopNavigation}
                      variant="destructive"
                      className="w-full bg-red-600 hover:bg-red-700 text-white py-4 rounded-xl font-medium text-lg h-14"
                    >
                      <Square className="h-6 w-6 mr-3" />
                      Stop Navigation
                    </Button>
                  )}

                  <div className="mt-6 text-base text-gray-600">
                    <div className="flex items-center justify-between mb-2">
                      <span className="flex items-center">
                        <Sun className="h-4 w-4 mr-2" />
                        Weather:
                      </span>
                      <span className="capitalize">
                        {transportSteps[currentStepIndex].weather}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="flex items-center">
                        <Users className="h-4 w-4 mr-2" />
                        Crowd:
                      </span>
                      <span>
                        {transportSteps[currentStepIndex].crowd === 1
                          ? "Crowded"
                          : "Moderate"}
                      </span>
                    </div>
                  </div>
                </div>
              </Card>
            )}

            {currentLocation && (
              <Card className="absolute top-16 right-6 p-3 bg-white/95 backdrop-blur-sm shadow-lg border-0 rounded-2xl z-10">
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
