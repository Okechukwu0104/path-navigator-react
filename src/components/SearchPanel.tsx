
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { Search, MapPin, Navigation } from 'lucide-react';

interface Location {
  lat: number;
  lng: number;
  address?: string;
}

interface SearchPanelProps {
  onDestinationSelect: (location: Location) => void;
  currentLocation: Location | null;
}

const SearchPanel: React.FC<SearchPanelProps> = ({ onDestinationSelect, currentLocation }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [suggestions, setSuggestions] = useState<Location[]>([]);
  const [isSearching, setIsSearching] = useState(false);

  // Simulated search suggestions
  const searchLocations = async (query: string) => {
    if (!query.trim()) {
      setSuggestions([]);
      return;
    }

    setIsSearching(true);
    
    // Simulate API delay
    setTimeout(() => {
      const mockSuggestions: Location[] = [
        { lat: 37.7849, lng: -122.4094, address: `${query} - Downtown San Francisco` },
        { lat: 37.7749, lng: -122.4194, address: `${query} - Union Square` },
        { lat: 37.7649, lng: -122.4094, address: `${query} - SOMA District` },
        { lat: 37.8049, lng: -122.4194, address: `${query} - Financial District` },
        { lat: 37.7549, lng: -122.4294, address: `${query} - Mission District` }
      ];
      
      setSuggestions(mockSuggestions);
      setIsSearching(false);
    }, 500);
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
      <div>
        <label className="text-sm font-medium text-gray-700 mb-2 block">
          Where do you want to go?
        </label>
        
        <form onSubmit={handleSearch} className="space-y-2">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              type="text"
              placeholder="Search for a destination..."
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                searchLocations(e.target.value);
              }}
              className="pl-10 pr-4"
            />
          </div>
        </form>

        <Button
          onClick={useCurrentLocation}
          variant="outline"
          size="sm"
          className="w-full mt-2"
          disabled={!currentLocation}
        >
          <Navigation className="h-4 w-4 mr-2" />
          Use Current Location
        </Button>
      </div>

      {/* Search Suggestions */}
      {suggestions.length > 0 && (
        <Card className="p-2 max-h-60 overflow-y-auto">
          <div className="space-y-1">
            {suggestions.map((suggestion, index) => (
              <button
                key={index}
                onClick={() => handleSuggestionClick(suggestion)}
                className="w-full text-left p-2 hover:bg-gray-100 rounded-md transition-colors flex items-start space-x-2"
              >
                <MapPin className="h-4 w-4 text-gray-400 mt-0.5 flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium text-gray-900 truncate">
                    {suggestion.address}
                  </div>
                  <div className="text-xs text-gray-500">
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
            <div className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
            <span>Searching...</span>
          </div>
        </div>
      )}
    </div>
  );
};

export default SearchPanel;
