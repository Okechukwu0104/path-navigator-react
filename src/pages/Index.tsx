import React, { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Navigation, MapPin, Route } from 'lucide-react';
import SearchPanel from '@/components/SearchPanel';
import MapComponent from '@/components/MapComponent';
import RouteInfo from '@/components/RouteInfo';
import NavigationControls from '@/components/NavigationControls';
import { useToast } from '@/hooks/use-toast';

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

const GOOGLE_API_KEY = 'AIzaSyCsIxQ-fyrN_cOw46dFVWGMBKfI93LoVe8';

const Index = () => {
  const [currentLocation, setCurrentLocation] = useState<Location | null>(null);
  const [destination, setDestination] = useState<Location | null>(null);
  const [route, setRoute] = useState<RouteStep[]>([]);
  const [isNavigating, setIsNavigating] = useState(false);
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [mapView, setMapView] = useState<'roadmap' | 'satellite'>('roadmap');
  const { toast } = useToast();

  useEffect(() => {
    // Get user's current location
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
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
        (error) => {
          console.error('Error getting location:', error);
          // Default to San Francisco if location access is denied
          setCurrentLocation({ lat: 37.7749, lng: -122.4194 });
          toast({
            title: "Location access denied",
            description: "Using default location. Please enable location services for better experience.",
            variant: "destructive",
          });
        }
      );
    }
  }, [toast]);

  const calculateRoute = async (start: Location, end: Location) => {
    try {
      console.log('Calculating route from', start, 'to', end);
      
      // Use Google Directions API
      const response = await fetch(
        `https://maps.googleapis.com/maps/api/directions/json?origin=${start.lat},${start.lng}&destination=${end.lat},${end.lng}&key=${GOOGLE_API_KEY}&alternatives=false`
      );
      
      if (!response.ok) {
        throw new Error('Failed to get directions');
      }
      
      const data = await response.json();
      
      if (data.status !== 'OK' || !data.routes.length) {
        throw new Error('No routes found');
      }
      
      const route = data.routes[0];
      const legs = route.legs[0];
      
      // Convert Google Directions steps to our format
      const steps: RouteStep[] = legs.steps.map((step: any, index: number) => {
        // Extract maneuver type from HTML instructions
        let maneuver = 'straight';
        const instructions = step.html_instructions.toLowerCase();
        
        if (instructions.includes('turn right') || instructions.includes('right turn')) {
          maneuver = 'turn-right';
        } else if (instructions.includes('turn left') || instructions.includes('left turn')) {
          maneuver = 'turn-left';
        } else if (instructions.includes('arrive') || instructions.includes('destination')) {
          maneuver = 'arrive';
        }
        
        return {
          instruction: step.html_instructions.replace(/<[^>]*>/g, ''), // Remove HTML tags
          distance: step.distance.text,
          duration: step.duration.text,
          coordinates: {
            lat: step.end_location.lat,
            lng: step.end_location.lng
          },
          maneuver
        };
      });
      
      setRoute(steps);
      setCurrentStepIndex(0);
      
      toast({
        title: "Route calculated",
        description: `Found route with ${steps.length} steps (${legs.distance.text}, ${legs.duration.text})`,
      });
      
    } catch (error) {
      console.error('Error calculating route:', error);
      
      // Fallback to mock route if API fails
      const steps: RouteStep[] = [
        {
          instruction: "Head north on your current street",
          distance: "0.2 miles",
          duration: "1 min",
          coordinates: start,
          maneuver: "straight"
        },
        {
          instruction: "Turn right at the junction onto Main Street",
          distance: "0.5 miles",
          duration: "2 mins",
          coordinates: { lat: start.lat + 0.002, lng: start.lng + 0.001 },
          maneuver: "turn-right"
        },
        {
          instruction: "Continue straight through the traffic light",
          distance: "0.8 miles",
          duration: "3 mins",
          coordinates: { lat: start.lat + 0.005, lng: start.lng + 0.003 },
          maneuver: "straight"
        },
        {
          instruction: "Turn left at Oak Street junction",
          distance: "0.3 miles",
          duration: "1 min",
          coordinates: { lat: start.lat + 0.008, lng: start.lng + 0.002 },
          maneuver: "turn-left"
        },
        {
          instruction: "Arrive at your destination on the right",
          distance: "0.1 miles",
          duration: "30 secs",
          coordinates: end,
          maneuver: "arrive"
        }
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
    if (currentLocation) {
      calculateRoute(currentLocation, location);
    }
  };

  return (
    <div className="h-screen flex flex-col bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b px-4 py-3 flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <div className="p-2 bg-blue-500 rounded-lg">
            <Navigation className="h-6 w-6 text-white" />
          </div>
          <h1 className="text-xl font-bold text-gray-900">NaviMaps</h1>
        </div>
        
        <div className="flex items-center space-x-2">
          <Button
            variant={mapView === 'roadmap' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setMapView('roadmap')}
          >
            <MapPin className="h-4 w-4 mr-1" />
            Map
          </Button>
          <Button
            variant={mapView === 'satellite' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setMapView('satellite')}
          >
            Satellite
          </Button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex">
        {/* Left Panel */}
        <div className="w-80 bg-white shadow-lg border-r flex flex-col">
          {/* Search Panel */}
          <div className="p-4 border-b">
            <SearchPanel 
              onDestinationSelect={handleDestinationSelect}
              currentLocation={currentLocation}
            />
          </div>

          {/* Route Information */}
          {route.length > 0 && (
            <div className="flex-1 overflow-y-auto">
              <RouteInfo 
                route={route}
                currentStepIndex={currentStepIndex}
                isNavigating={isNavigating}
              />
            </div>
          )}

          {/* Navigation Controls */}
          {route.length > 0 && (
            <div className="p-4 border-t bg-gray-50">
              <NavigationControls
                isNavigating={isNavigating}
                onStartNavigation={startNavigation}
                onStopNavigation={stopNavigation}
                onNextStep={nextStep}
                canGoNext={currentStepIndex < route.length - 1}
              />
            </div>
          )}
        </div>

        {/* Map Area */}
        <div className="flex-1 relative">
          <MapComponent
            currentLocation={currentLocation}
            destination={destination}
            route={route}
            currentStepIndex={currentStepIndex}
            isNavigating={isNavigating}
            mapView={mapView}
          />
          
          {/* Current Location Info */}
          {currentLocation && (
            <Card className="absolute top-4 right-4 p-3 bg-white/95 backdrop-blur-sm">
              <div className="flex items-center space-x-2 text-sm">
                <div className="w-3 h-3 bg-blue-500 rounded-full navigation-pulse"></div>
                <span className="font-medium">Current Location</span>
              </div>
              <div className="text-xs text-gray-600 mt-1">
                {currentLocation.lat.toFixed(6)}, {currentLocation.lng.toFixed(6)}
              </div>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
};

export default Index;
