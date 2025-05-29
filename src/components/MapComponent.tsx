import React, { useRef, useEffect } from 'react';
import { Card } from '@/components/ui/card';

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
  const mapRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (!canvasRef.current || !currentLocation) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Set canvas size
    canvas.width = canvas.offsetWidth;
    canvas.height = canvas.offsetHeight;

    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Draw background based on map view
    if (mapView === 'satellite') {
      // Satellite view background
      const gradient = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
      gradient.addColorStop(0, '#2a4a3a');
      gradient.addColorStop(0.5, '#3d6b5a');
      gradient.addColorStop(1, '#2a3d2e');
      ctx.fillStyle = gradient;
    } else {
      // Clean map background like in Figma
      ctx.fillStyle = '#f8fafb';
    }
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Draw subtle grid lines for map effect
    ctx.strokeStyle = mapView === 'satellite' ? '#4a6b5a' : '#e8f0f2';
    ctx.lineWidth = 1;
    
    // Vertical lines
    for (let x = 0; x < canvas.width; x += 40) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, canvas.height);
      ctx.stroke();
    }
    
    // Horizontal lines
    for (let y = 0; y < canvas.height; y += 40) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(canvas.width, y);
      ctx.stroke();
    }

    // Convert lat/lng to canvas coordinates (simplified projection)
    const latToY = (lat: number) => {
      const centerLat = currentLocation.lat;
      const range = 0.01; // Zoom level
      return canvas.height / 2 - ((lat - centerLat) / range) * (canvas.height / 2);
    };

    const lngToX = (lng: number) => {
      const centerLng = currentLocation.lng;
      const range = 0.01; // Zoom level
      return canvas.width / 2 + ((lng - centerLng) / range) * (canvas.width / 2);
    };

    // Draw roads/streets
    if (mapView === 'roadmap') {
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 4;
      
      // Main streets
      for (let i = 0; i < 5; i++) {
        ctx.beginPath();
        ctx.moveTo(0, (canvas.height / 5) * i + canvas.height / 10);
        ctx.lineTo(canvas.width, (canvas.height / 5) * i + canvas.height / 10);
        ctx.stroke();
        
        ctx.beginPath();
        ctx.moveTo((canvas.width / 5) * i + canvas.width / 10, 0);
        ctx.lineTo((canvas.width / 5) * i + canvas.width / 10, canvas.height);
        ctx.stroke();
      }
    }

    // Draw route path with modern styling
    if (route.length > 0) {
      ctx.strokeStyle = '#10b981'; // Green color like in Figma
      ctx.lineWidth = 8;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      ctx.setLineDash([]);
      
      ctx.beginPath();
      route.forEach((step, index) => {
        const x = lngToX(step.coordinates.lng);
        const y = latToY(step.coordinates.lat);
        
        if (index === 0) {
          ctx.moveTo(x, y);
        } else {
          ctx.lineTo(x, y);
        }
      });
      ctx.stroke();

      // Draw route points
      route.forEach((step, index) => {
        const x = lngToX(step.coordinates.lng);
        const y = latToY(step.coordinates.lat);
        
        // Point circle
        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.arc(x, y, 8, 0, 2 * Math.PI);
        ctx.fill();
        
        ctx.fillStyle = '#10b981';
        ctx.beginPath();
        ctx.arc(x, y, 5, 0, 2 * Math.PI);
        ctx.fill();
      });

      // Highlight current step if navigating
      if (isNavigating && currentStepIndex < route.length) {
        const currentStep = route[currentStepIndex];
        const x = lngToX(currentStep.coordinates.lng);
        const y = latToY(currentStep.coordinates.lat);
        
        // Animated pulse for current step
        ctx.fillStyle = '#ef4444';
        ctx.beginPath();
        ctx.arc(x, y, 15, 0, 2 * Math.PI);
        ctx.fill();
        
        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.arc(x, y, 8, 0, 2 * Math.PI);
        ctx.fill();
      }
    }

    // Draw current location with modern styling
    const currentX = lngToX(currentLocation.lng);
    const currentY = latToY(currentLocation.lat);
    
    // Location circle with shadow effect
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(currentX, currentY, 12, 0, 2 * Math.PI);
    ctx.fill();
    
    ctx.fillStyle = '#3b82f6';
    ctx.beginPath();
    ctx.arc(currentX, currentY, 8, 0, 2 * Math.PI);
    ctx.fill();

    // Draw destination with modern styling
    if (destination) {
      const destX = lngToX(destination.lng);
      const destY = latToY(destination.lat);
      
      // Destination pin
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.arc(destX, destY, 15, 0, 2 * Math.PI);
      ctx.fill();
      
      ctx.fillStyle = '#ef4444';
      ctx.beginPath();
      ctx.arc(destX, destY, 10, 0, 2 * Math.PI);
      ctx.fill();
    }

  }, [currentLocation, destination, route, currentStepIndex, isNavigating, mapView]);

  return (
    <div ref={mapRef} className="w-full h-full relative bg-gray-50">
      <canvas
        ref={canvasRef}
        className="w-full h-full"
        style={{ width: '100%', height: '100%' }}
      />
      
      {/* Modern Map Controls */}
      <div className="absolute bottom-6 right-6">
        <Card className="p-2 bg-white shadow-lg border-0 rounded-xl">
          <div className="flex flex-col space-y-2">
            <button className="w-10 h-10 bg-white hover:bg-gray-50 rounded-lg flex items-center justify-center text-lg font-bold transition-colors shadow-sm">
              +
            </button>
            <button className="w-10 h-10 bg-white hover:bg-gray-50 rounded-lg flex items-center justify-center text-lg font-bold transition-colors shadow-sm">
              −
            </button>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default MapComponent;
