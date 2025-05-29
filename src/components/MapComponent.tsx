
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
      // Satellite view with terrain-like colors
      const gradient = ctx.createRadialGradient(canvas.width/2, canvas.height/2, 0, canvas.width/2, canvas.height/2, canvas.width);
      gradient.addColorStop(0, '#4a5d23');
      gradient.addColorStop(0.3, '#5c7a2e');
      gradient.addColorStop(0.6, '#3d5c1f');
      gradient.addColorStop(1, '#2d4416');
      ctx.fillStyle = gradient;
    } else {
      // Google Maps style background
      ctx.fillStyle = '#f2f1ec';
    }
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Add map-like features for roadmap view
    if (mapView === 'roadmap') {
      // Draw parks/green areas
      ctx.fillStyle = '#c8e6c9';
      ctx.fillRect(50, 80, 120, 80);
      ctx.fillRect(280, 150, 100, 70);
      ctx.fillRect(420, 60, 90, 90);
      
      // Draw water bodies
      ctx.fillStyle = '#81d4fa';
      ctx.beginPath();
      ctx.ellipse(350, 300, 80, 40, 0, 0, 2 * Math.PI);
      ctx.fill();
      
      // Draw buildings/urban areas
      ctx.fillStyle = '#eeeeee';
      for (let i = 0; i < 15; i++) {
        const x = Math.random() * canvas.width;
        const y = Math.random() * canvas.height;
        const width = 15 + Math.random() * 25;
        const height = 15 + Math.random() * 25;
        ctx.fillRect(x, y, width, height);
      }
    }

    // Draw road network
    ctx.strokeStyle = mapView === 'satellite' ? '#8a9b5c' : '#ffffff';
    ctx.lineWidth = mapView === 'satellite' ? 3 : 8;
    ctx.lineCap = 'round';
    
    // Main roads - horizontal
    ctx.beginPath();
    ctx.moveTo(0, canvas.height * 0.3);
    ctx.lineTo(canvas.width, canvas.height * 0.3);
    ctx.stroke();
    
    ctx.beginPath();
    ctx.moveTo(0, canvas.height * 0.7);
    ctx.lineTo(canvas.width, canvas.height * 0.7);
    ctx.stroke();
    
    // Main roads - vertical
    ctx.beginPath();
    ctx.moveTo(canvas.width * 0.25, 0);
    ctx.lineTo(canvas.width * 0.25, canvas.height);
    ctx.stroke();
    
    ctx.beginPath();
    ctx.moveTo(canvas.width * 0.75, 0);
    ctx.lineTo(canvas.width * 0.75, canvas.height);
    ctx.stroke();
    
    // Secondary roads
    ctx.lineWidth = mapView === 'satellite' ? 2 : 4;
    ctx.strokeStyle = mapView === 'satellite' ? '#6b7c47' : '#f8f8f8';
    
    // Diagonal roads
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(canvas.width * 0.6, canvas.height * 0.8);
    ctx.stroke();
    
    ctx.beginPath();
    ctx.moveTo(canvas.width * 0.4, 0);
    ctx.lineTo(canvas.width, canvas.height * 0.6);
    ctx.stroke();
    
    // Small connector roads
    for (let i = 0; i < 8; i++) {
      ctx.beginPath();
      const startX = Math.random() * canvas.width;
      const startY = Math.random() * canvas.height;
      const endX = startX + (Math.random() - 0.5) * 100;
      const endY = startY + (Math.random() - 0.5) * 100;
      ctx.moveTo(startX, startY);
      ctx.lineTo(endX, endY);
      ctx.stroke();
    }

    // Add road markings for roadmap view
    if (mapView === 'roadmap') {
      ctx.strokeStyle = '#ffd54f';
      ctx.lineWidth = 1;
      ctx.setLineDash([10, 10]);
      
      // Center lines on main roads
      ctx.beginPath();
      ctx.moveTo(0, canvas.height * 0.3);
      ctx.lineTo(canvas.width, canvas.height * 0.3);
      ctx.stroke();
      
      ctx.beginPath();
      ctx.moveTo(canvas.width * 0.25, 0);
      ctx.lineTo(canvas.width * 0.25, canvas.height);
      ctx.stroke();
      
      ctx.setLineDash([]);
    }

    // Convert lat/lng to canvas coordinates
    const latToY = (lat: number) => {
      const centerLat = currentLocation.lat;
      const range = 0.02;
      return canvas.height / 2 - ((lat - centerLat) / range) * (canvas.height / 2);
    };

    const lngToX = (lng: number) => {
      const centerLng = currentLocation.lng;
      const range = 0.02;
      return canvas.width / 2 + ((lng - centerLng) / range) * (canvas.width / 2);
    };

    // Draw route path
    if (route.length > 0) {
      ctx.strokeStyle = '#1976d2';
      ctx.lineWidth = 6;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      ctx.setLineDash([]);
      
      // Route shadow for depth
      ctx.strokeStyle = 'rgba(25, 118, 210, 0.3)';
      ctx.lineWidth = 10;
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
      
      // Main route line
      ctx.strokeStyle = '#1976d2';
      ctx.lineWidth = 6;
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

      // Route waypoints
      route.forEach((step, index) => {
        const x = lngToX(step.coordinates.lng);
        const y = latToY(step.coordinates.lat);
        
        // Waypoint circle
        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.arc(x, y, 6, 0, 2 * Math.PI);
        ctx.fill();
        
        ctx.fillStyle = '#1976d2';
        ctx.beginPath();
        ctx.arc(x, y, 3, 0, 2 * Math.PI);
        ctx.fill();
      });

      // Highlight current step
      if (isNavigating && currentStepIndex < route.length) {
        const currentStep = route[currentStepIndex];
        const x = lngToX(currentStep.coordinates.lng);
        const y = latToY(currentStep.coordinates.lat);
        
        // Animated current position
        ctx.fillStyle = '#ff5722';
        ctx.beginPath();
        ctx.arc(x, y, 12, 0, 2 * Math.PI);
        ctx.fill();
        
        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.arc(x, y, 6, 0, 2 * Math.PI);
        ctx.fill();
      }
    }

    // Draw current location
    const currentX = lngToX(currentLocation.lng);
    const currentY = latToY(currentLocation.lat);
    
    // Location shadow
    ctx.fillStyle = 'rgba(33, 150, 243, 0.3)';
    ctx.beginPath();
    ctx.arc(currentX + 1, currentY + 1, 14, 0, 2 * Math.PI);
    ctx.fill();
    
    // Location marker
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(currentX, currentY, 12, 0, 2 * Math.PI);
    ctx.fill();
    
    ctx.fillStyle = '#2196f3';
    ctx.beginPath();
    ctx.arc(currentX, currentY, 8, 0, 2 * Math.PI);
    ctx.fill();
    
    // Location pulse effect
    ctx.strokeStyle = 'rgba(33, 150, 243, 0.5)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(currentX, currentY, 16, 0, 2 * Math.PI);
    ctx.stroke();

    // Draw destination
    if (destination) {
      const destX = lngToX(destination.lng);
      const destY = latToY(destination.lat);
      
      // Destination shadow
      ctx.fillStyle = 'rgba(244, 67, 54, 0.3)';
      ctx.beginPath();
      ctx.arc(destX + 1, destY + 1, 16, 0, 2 * Math.PI);
      ctx.fill();
      
      // Destination marker (pin style)
      ctx.fillStyle = '#f44336';
      ctx.beginPath();
      ctx.arc(destX, destY, 12, 0, 2 * Math.PI);
      ctx.fill();
      
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.arc(destX, destY, 6, 0, 2 * Math.PI);
      ctx.fill();
      
      // Pin pointer
      ctx.fillStyle = '#f44336';
      ctx.beginPath();
      ctx.moveTo(destX, destY + 12);
      ctx.lineTo(destX - 6, destY + 24);
      ctx.lineTo(destX + 6, destY + 24);
      ctx.closePath();
      ctx.fill();
    }

  }, [currentLocation, destination, route, currentStepIndex, isNavigating, mapView]);

  return (
    <div ref={mapRef} className="w-full h-full relative bg-gray-100">
      <canvas
        ref={canvasRef}
        className="w-full h-full"
        style={{ width: '100%', height: '100%' }}
      />
      
      {/* Map Controls */}
      <div className="absolute bottom-6 right-6">
        <Card className="p-2 bg-white shadow-lg border-0 rounded-xl">
          <div className="flex flex-col space-y-2">
            <button className="w-10 h-10 bg-white hover:bg-gray-50 rounded-lg flex items-center justify-center text-lg font-bold transition-colors shadow-sm border border-gray-200">
              +
            </button>
            <button className="w-10 h-10 bg-white hover:bg-gray-50 rounded-lg flex items-center justify-center text-lg font-bold transition-colors shadow-sm border border-gray-200">
              −
            </button>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default MapComponent;
