import React, { useRef, useEffect, useState, useCallback } from 'react';
import { GoogleMap, useLoadScript, Marker, DirectionsRenderer, Polyline } from '@react-google-maps/api';
import type { Libraries } from '@react-google-maps/api';
import { Card } from '@/components/ui/card';

// Define libraries with correct type (only valid library names)
const libraries: Libraries = ['places', 'geometry'];

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

interface MapComponentProps {
  currentLocation: Location | null;
  destination: Location | null;
  route: RouteStep[];
  currentStepIndex: number;
  isNavigating: boolean;
  mapView: 'roadmap' | 'satellite';
}

const MapComponent: React.FC<MapComponentProps> = ({
  currentLocation,
  destination,
  route,
  currentStepIndex,
  isNavigating,
  mapView
}) => {
  const { isLoaded, loadError } = useLoadScript({
    googleMapsApiKey: 'AIzaSyCsIxQ-fyrN_cOw46dFVWGMBKfI93LoVe8',
    libraries
  });

  const [directions, setDirections] = useState<google.maps.DirectionsResult | null>(null);
  const [distance, setDistance] = useState<string>('');
  const [duration, setDuration] = useState<string>('');
  const mapRef = useRef<google.maps.Map | null>(null);

  // Calculate route with waypoints
  const calculateRoute = useCallback(() => {
    if (!isLoaded || !currentLocation || !destination || route.length === 0) return;

    const directionsService = new google.maps.DirectionsService();
    const waypoints = route
      .slice(1, -1) // Skip first and last points
      .map(step => ({
        location: new google.maps.LatLng(step.coordinates.lat, step.coordinates.lng),
        stopover: true
      }));

    directionsService.route(
      {
        origin: new google.maps.LatLng(currentLocation.lat, currentLocation.lng),
        destination: new google.maps.LatLng(destination.lat, destination.lng),
        waypoints,
        travelMode: google.maps.TravelMode.DRIVING,
        optimizeWaypoints: true,
      },
      (result, status) => {
        if (status === google.maps.DirectionsStatus.OK && result) {
          setDirections(result);
          
          // Extract distance and duration
          const leg = result.routes[0].legs[0];
          setDistance(leg.distance?.text || '');
          setDuration(leg.duration?.text || '');
          
          // Fit the bounds of the entire route
          const bounds = new google.maps.LatLngBounds();
          result.routes[0].legs.forEach(leg => {
            bounds.extend(leg.start_location);
            bounds.extend(leg.end_location);
          });
          mapRef.current?.fitBounds(bounds);
        } else {
          setDirections(null);
          console.error(`Directions request failed: ${status}`);
        }
      }
    );
  }, [isLoaded, currentLocation, destination, route]);

  useEffect(() => {
    calculateRoute();
  }, [calculateRoute]);

  const onLoad = (map: google.maps.Map) => {
    mapRef.current = map;
    // Set initial center if we have current location
    if (currentLocation) {
      map.panTo(new google.maps.LatLng(currentLocation.lat, currentLocation.lng));
    }
  };

  const onUnmount = () => {
    mapRef.current = null;
  };

  // Handle zoom controls
  const handleZoomIn = () => {
    if (mapRef.current) {
      mapRef.current.setZoom(mapRef.current.getZoom()! + 1);
    }
  };

  const handleZoomOut = () => {
    if (mapRef.current) {
      mapRef.current.setZoom(mapRef.current.getZoom()! - 1);
    }
  };

  // Handle map view change
  const handleMapViewChange = () => {
    if (mapRef.current) {
      const newMapType = mapView === 'roadmap' ? 'hybrid' : 'roadmap';
      mapRef.current.setMapTypeId(newMapType);
    }
  };

  if (loadError) return (
    <div className="w-full h-full flex items-center justify-center bg-gray-100">
      <Card className="p-4 text-center">
        <h3 className="text-lg font-medium text-red-600">Error loading Google Maps</h3>
        <p className="text-sm text-gray-600 mt-2">Please check your internet connection and try again.</p>
      </Card>
    </div>
  );

  if (!isLoaded) return (
    <div className="w-full h-full flex items-center justify-center bg-gray-100">
      <div className="flex flex-col items-center">
        <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mb-4"></div>
        <p className="text-gray-700">Loading Google Maps...</p>
      </div>
    </div>
  );

  const mapOptions: google.maps.MapOptions = {
    disableDefaultUI: true,
    zoomControl: false, // We're using custom controls
    mapTypeControl: false,
    streetViewControl: false,
    fullscreenControl: false,
    mapTypeId: mapView === 'satellite' ? 'hybrid' : 'roadmap',
    styles: [
      {
        featureType: "poi",
        elementType: "labels",
        stylers: [{ visibility: "off" }]
      },
      {
        featureType: "transit",
        elementType: "labels",
        stylers: [{ visibility: "off" }]
      },
      {
        featureType: "road",
        elementType: "labels.icon",
        stylers: [{ visibility: "off" }]
      }
    ]
  };

  return (
    <div className="w-full h-full relative">
      <GoogleMap
        mapContainerStyle={{ width: '100%', height: '100%' }}
        center={currentLocation || { lat: 0, lng: 0 }}
        zoom={14}
        onLoad={onLoad}
        onUnmount={onUnmount}
        options={mapOptions}
      >
        {/* Current Location Marker */}
        {currentLocation && (
          <Marker
            position={currentLocation}
            icon={{
              url: 'https://maps.google.com/mapfiles/ms/icons/blue-dot.png',
              scaledSize: new google.maps.Size(32, 32)
            }}
            zIndex={1000}
          />
        )}

        {/* Destination Marker */}
        {destination && (
          <Marker
            position={destination}
            icon={{
              url: 'https://maps.google.com/mapfiles/ms/icons/red-dot.png',
              scaledSize: new google.maps.Size(32, 32)
            }}
            zIndex={1000}
          />
        )}

        {/* Route Directions */}
        {directions && (
          <DirectionsRenderer
            directions={directions}
            options={{
              suppressMarkers: true,
              polylineOptions: {
                strokeColor: '#4285F4',
                strokeWeight: 5,
                strokeOpacity: 0.8,
                zIndex: 1
              }
            }}
          />
        )}

        {/* Current Step Marker (when navigating) */}
        {isNavigating && currentStepIndex < route.length && (
          <Marker
            position={route[currentStepIndex].coordinates}
            icon={{
              url: 'https://maps.google.com/mapfiles/ms/icons/green-dot.png',
              scaledSize: new google.maps.Size(40, 40)
            }}
            zIndex={1001}
          />
        )}

        {/* Progress Polyline (shows completed route) */}
        {isNavigating && currentStepIndex > 0 && (
          <Polyline
            path={route.slice(0, currentStepIndex + 1).map(step => (
              new google.maps.LatLng(step.coordinates.lat, step.coordinates.lng)
            ))}
            options={{
              strokeColor: '#34A853',
              strokeWeight: 5,
              strokeOpacity: 0.8,
              zIndex: 2
            }}
          />
        )}
      </GoogleMap>

      {/* Map Controls */}
      <div className="absolute bottom-6 right-6 space-y-3">
        {/* Zoom Controls */}
        <Card className="p-2 bg-white shadow-lg border-0 rounded-xl">
          <div className="flex flex-col space-y-2">
            <button 
              onClick={handleZoomIn}
              className="w-10 h-10 bg-white hover:bg-gray-50 rounded-lg flex items-center justify-center text-lg font-bold transition-colors shadow-sm border border-gray-200"
            >
              +
            </button>
            <button 
              onClick={handleZoomOut}
              className="w-10 h-10 bg-white hover:bg-gray-50 rounded-lg flex items-center justify-center text-lg font-bold transition-colors shadow-sm border border-gray-200"
            >
              −
            </button>
          </div>
        </Card>

        {/* Map View Toggle */}
        <Card className="p-2 bg-white shadow-lg border-0 rounded-xl">
          <button 
            onClick={handleMapViewChange}
            className="w-10 h-10 bg-white hover:bg-gray-50 rounded-lg flex items-center justify-center text-sm font-medium transition-colors shadow-sm border border-gray-200"
          >
            {mapView === 'roadmap' ? 'Sat' : 'Map'}
          </button>
        </Card>
      </div>

      {/* Route Info Overlay */}
      {distance && duration && (
        <div className="absolute top-4 left-4">
          <Card className="p-3 bg-white/90 backdrop-blur-sm shadow-lg border-0 rounded-xl">
            <div className="flex items-center space-x-4">
              <div className="text-center">
                <p className="text-xs text-gray-500">Distance</p>
                <p className="font-bold text-blue-600">{distance}</p>
              </div>
              <div className="h-8 w-px bg-gray-200"></div>
              <div className="text-center">
                <p className="text-xs text-gray-500">Duration</p>
                <p className="font-bold text-blue-600">{duration}</p>
              </div>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
};

export default MapComponent;