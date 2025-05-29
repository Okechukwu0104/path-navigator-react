
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { Search, MapPin, Navigation, Clock } from 'lucide-react';

interface Location {
  lat: number;
  lng: number;
  address?: string;
}

interface SearchPanelProps {
  onDestinationSelect: (location: Location) => void;
  currentLocation: Location | null;
}

const GOOGLE_API_KEY = 'AIzaSyCsIxQ-fyrN_cOw46dFVWGMBKfI93LoVe8';

const SearchPanel: React.FC<SearchPanelProps> = ({ onDestinationSelect, currentLocation }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [suggestions, setSuggestions] = useState<Location[]>([]);
  const [isSearching, setIsSearching] = useState(false);

  const searchLocations = async (query: string) => {
    if (!query.trim()) {
      setSuggestions([]);
      return;
    }

    setIsSearching(true);
    
    try {
      // Use Google Places API for autocomplete
      const response = await fetch(
        `https://maps.googleapis.com/maps/api/place/autocomplete/json?input=${encodeURIComponent(query)}&key=${GOOGLE_API_KEY}&libraries=places`,
        {
          method: 'GET',
        }
      );
      
      if (!response.ok) {
        throw new Error('Failed to fetch places');
      }
      
      const data = await response.json();
      
      // Get place details for each prediction
      const placePromises = data.predictions.slice(0, 5).map(async (prediction: any) => {
        const detailResponse = await fetch(
          `https://maps.googleapis.com/maps/api/place/details/json?place_id=${prediction.place_id}&fields=geometry,formatted_address&key=${GOOGLE_API_KEY}`
        );
        const detailData = await detailResponse.json();
        
        return {
          lat: detailData.result.geometry.location.lat,
          lng: detailData.result.geometry.location.lng,
          address: detailData.result.formatted_address
        };
      });
      
      const places = await Promise.all(placePromises);
      setSuggestions(places);
    } catch (error) {
      console.error('Error searching places:', error);
      // Fallback to mock data if API fails
      const mockSuggestions: Location[] = [
        { lat: 37.7849, lng: -122.4094, address: `${query} - Downtown San Francisco` },
        { lat: 37.7749, lng: -122.4194, address: `${query} - Union Square` },
        { lat: 37.7649, lng: -122.4094, address: `${query} - SOMA District` }
      ];
      setSuggestions(mockSuggestions);
    } finally {
      setIsSearching(false);
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    searchLocations(searchQuery);
  };

  const handleSuggestionClick = (location: Location) => {
    onDestinationSelect(location);
    setSuggestions([]);
    setSearchQuery(location.address || '');
  };

  const useCurrentLocation = () => {
    if (currentLocation) {
      onDestinationSelect(currentLocation);
      setSearchQuery('Current Location');
    }
  };

  return (
    <div className="space-y-4">
      {/* Title */}
      <div>
        <h2 className="text-xl font-semibold text-gray-900 mb-1">Where to?</h2>
        <p className="text-sm text-gray-600">Search for a destination</p>
      </div>
      
      {/* Search Input */}
      <div className="relative">
        <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
        <Input
          type="text"
          placeholder="Enter destination..."
          value={searchQuery}
          onChange={(e) => {
            setSearchQuery(e.target.value);
            searchLocations(e.target.value);
          }}
          className="pl-12 pr-4 py-3 text-base border-gray-200 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent"
        />
      </div>

      {/* Quick Actions */}
      <div className="space-y-2">
        <Button
          onClick={useCurrentLocation}
          variant="outline"
          size="sm"
          className="w-full justify-start text-left p-3 h-auto border-gray-200 rounded-xl hover:bg-gray-50"
          disabled={!currentLocation}
        >
          <Navigation className="h-5 w-5 mr-3 text-green-500" />
          <div>
            <div className="font-medium text-gray-900">Use Current Location</div>
            <div className="text-xs text-gray-500">Start from here</div>
          </div>
        </Button>

        <Button
          variant="outline"
          size="sm"
          className="w-full justify-start text-left p-3 h-auto border-gray-200 rounded-xl hover:bg-gray-50"
        >
          <Clock className="h-5 w-5 mr-3 text-blue-500" />
          <div>
            <div className="font-medium text-gray-900">Recent Searches</div>
            <div className="text-xs text-gray-500">View your recent destinations</div>
          </div>
        </Button>
      </div>

      {/* Search Suggestions */}
      {suggestions.length > 0 && (
        <Card className="border-0 shadow-lg rounded-xl overflow-hidden">
          <div className="max-h-60 overflow-y-auto">
            {suggestions.map((suggestion, index) => (
              <button
                key={index}
                onClick={() => handleSuggestionClick(suggestion)}
                className="w-full text-left p-4 hover:bg-gray-50 transition-colors flex items-start space-x-3 border-b border-gray-100 last:border-b-0"
              >
                <MapPin className="h-5 w-5 text-gray-400 mt-0.5 flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <div className="font-medium text-gray-900 truncate">
                    {suggestion.address}
                  </div>
                  <div className="text-sm text-gray-500 mt-1">
                    {suggestion.lat.toFixed(4)}, {suggestion.lng.toFixed(4)}
                  </div>
                </div>
              </button>
            ))}
          </div>
        </Card>
      )}

      {isSearching && (
        <div className="text-center py-4">
          <div className="inline-flex items-center space-x-2 text-sm text-gray-600">
            <div className="w-4 h-4 border-2 border-green-500 border-t-transparent rounded-full animate-spin"></div>
            <span>Searching...</span>
          </div>
        </div>
      )}
    </div>
  );
};

export default SearchPanel;
