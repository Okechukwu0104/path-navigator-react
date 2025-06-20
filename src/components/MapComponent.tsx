import React, { useEffect, useRef ,forwardRef, useImperativeHandle} from "react";
import {
  GoogleMap,
  useLoadScript,
  Marker,
  Polyline,
} from "@react-google-maps/api";
import type { Libraries } from "@react-google-maps/api";
import { Card } from "@/components/ui/card";
const libraries: Libraries = ["places", "geometry"];

interface Location {
  lat: number;
  lng: number;
  name?: string;
}

interface MapComponentProps {
  currentLocation: Location | null;
  destination: Location | null;
  routeCoordinates: Location[];
  currentStepIndex: number;
  isNavigating: boolean;
  mapView: "roadmap" | "satellite";
}

const MapComponent: React.FC<MapComponentProps> = ({
  currentLocation,
  destination,
  routeCoordinates,
  currentStepIndex,
  isNavigating,
  mapView,
}) => {
  const { isLoaded, loadError } = useLoadScript({
    googleMapsApiKey: "AIzaSyCsIxQ-fyrN_cOw46dFVWGMBKfI93LoVe8",
    libraries,
  });

  const mapRef = useRef<google.maps.Map | null>(null);

  const onLoad = (map: google.maps.Map) => {
    mapRef.current = map;
    if (currentLocation) {
      map.panTo(
        new google.maps.LatLng(currentLocation.lat, currentLocation.lng)
      );
    }
  };

  const onUnmount = () => {
    mapRef.current = null;
  };
  useEffect(() => {
    if (isNavigating && mapRef.current && routeCoordinates.length > 0) {
      // Get the current step's coordinates
      const currentStep =
        routeCoordinates[currentStepIndex + 1] ||
        routeCoordinates[routeCoordinates.length - 1];

      if (currentStep) {
        // Create bounds to include both current location and next step
        const bounds = new window.google.maps.LatLngBounds();
        bounds.extend(new google.maps.LatLng(currentStep.lat, currentStep.lng));

        if (currentLocation) {
          bounds.extend(
            new google.maps.LatLng(currentLocation.lat, currentLocation.lng)
          );
        }

        // Apply padding and fit bounds
        mapRef.current.fitBounds(bounds, {
          top: 100,
          right: 100,
          bottom: 250, // Extra space at bottom for controls
          left: 100,
        });

        // Set a minimum zoom level
        const zoom = mapRef.current.getZoom();
        if (zoom && zoom > 15) {
          mapRef.current.setZoom(15);
        }
      }
    }
  }, [currentStepIndex, isNavigating, routeCoordinates, currentLocation]);
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

  if (!isLoaded) {
    return (
      <div className="w-full h-full flex items-center justify-center bg-gray-100">
        <div className="flex flex-col items-center">
          <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mb-4"></div>
          <p className="text-gray-700">Loading Google Maps...</p>
        </div>
      </div>
    );
  }

  const mapOptions: google.maps.MapOptions = {
    disableDefaultUI: true,
    zoomControl: false,
    mapTypeControl: false,
    streetViewControl: false,
    fullscreenControl: false,
    mapTypeId: mapView === "satellite" ? "hybrid" : "roadmap",
    styles: [
      {
        featureType: "poi",
        elementType: "labels",
        stylers: [{ visibility: "off" }],
      },
      {
        featureType: "transit",
        elementType: "labels",
        stylers: [{ visibility: "off" }],
      },
    ],
  };

  // Calculate path for the Polyline
  const path = routeCoordinates.map(coord => ({
    lat: coord.lat,
    lng: coord.lng,
  }));

  // Calculate completed path for navigation progress
  const completedPath = routeCoordinates
    .slice(0, currentStepIndex + 2) // +2 to include the next step
    .map(coord => ({
      lat: coord.lat,
      lng: coord.lng,
    }));

  return (
    <div className="w-full h-full relative">
      <GoogleMap
        mapContainerStyle={{ width: "100%", height: "100%" }}
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
              url: "https://maps.google.com/mapfiles/ms/icons/blue-dot.png",
              scaledSize: new google.maps.Size(32, 32),
            }}
            zIndex={1000}
          />
        )}

        {/* Destination Marker */}
        {destination && (
          <Marker
            position={destination}
            icon={{
              url: "https://maps.google.com/mapfiles/ms/icons/red-dot.png",
              scaledSize: new google.maps.Size(32, 32),
            }}
            zIndex={1000}
          />
        )}

        {/* Route Markers */}
        {routeCoordinates.map((coord, index) => (
          <Marker
            key={`${coord.lat}-${coord.lng}-${index}`}
            position={coord}
            icon={{
              url: "https://maps.google.com/mapfiles/ms/icons/green-dot.png",
              scaledSize: new google.maps.Size(24, 24),
            }}
            zIndex={900}
            label={
              index === 0 || index === routeCoordinates.length - 1
                ? undefined
                : {
                    text: `${index}`,
                    color: "white",
                    fontSize: "12px",
                  }
            }
          />
        ))}

        {/* Route Polyline */}
        {routeCoordinates.length > 1 && (
          <Polyline
            path={path}
            options={{
              strokeColor: "#4285F4",
              strokeWeight: 3,
              strokeOpacity: 0.7,
              zIndex: 1,
            }}
          />
        )}

        {/* Completed Route Polyline (when navigating) */}
        {isNavigating && completedPath.length > 1 && (
          <Polyline
            path={completedPath}
            options={{
              strokeColor: "#34A853",
              strokeWeight: 4,
              strokeOpacity: 0.9,
              zIndex: 2,
            }}
          />
        )}

        {/* Current Step Marker (when navigating) */}
        {isNavigating && routeCoordinates[currentStepIndex + 1] && (
          <Marker
            position={routeCoordinates[currentStepIndex + 1]}
            icon={{
              url: "https://maps.google.com/mapfiles/ms/icons/yellow-dot.png",
              scaledSize: new google.maps.Size(40, 40),
            }}
            zIndex={1001}
          />
        )}
      </GoogleMap>
    </div>
  );
};

export default MapComponent;
