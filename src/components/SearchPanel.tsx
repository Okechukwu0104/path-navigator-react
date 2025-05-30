import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { Search, MapPin, Navigation } from 'lucide-react';

interface Location {
  lat: number;
  lng: number;
  name: string;
  address: string;
}

interface SearchPanelProps {
  onDestinationSelect: (location: Location) => void;
  currentLocation: Location | null;
}

const SearchPanel: React.FC<SearchPanelProps> = ({ onDestinationSelect, currentLocation }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [suggestions, setSuggestions] = useState<Location[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [autocompleteService, setAutocompleteService] = useState<google.maps.places.AutocompleteService | null>(null);
  const [placesService, setPlacesService] = useState<google.maps.places.PlacesService | null>(null);

  // Initialize Google Places services
  useEffect(() => {
    if (window.google && window.google.maps) {
      setAutocompleteService(new window.google.maps.places.AutocompleteService());
      const map = new window.google.maps.Map(document.createElement('div'));
      setPlacesService(new window.google.maps.places.PlacesService(map));
    }
  }, []);

  const searchLocations = React.useCallback((query: string) => {
    if (!query.trim() || !autocompleteService) {
      setSuggestions([]);
      return;
    }

    setIsSearching(true);

    autocompleteService.getPlacePredictions(
      {
        input: query,
        componentRestrictions: { country: 'ng' },
        location: new google.maps.LatLng(6.5244, 3.3792), // Lagos coordinates
        radius: 50000, // 50km around Lagos
        types: ['establishment', 'geocode']
      },
      (predictions, status) => {
        if (status !== google.maps.places.PlacesServiceStatus.OK || !predictions || !placesService) {
          setIsSearching(false);
          return;
        }

        // Get details for each prediction
        const detailsPromises = predictions.slice(0, 5).map(prediction => {
          return new Promise<Location | null>((resolve) => {
            placesService.getDetails(
              { placeId: prediction.place_id },
              (place, status) => {
                if (status === google.maps.places.PlacesServiceStatus.OK && place?.geometry?.location) {
                  resolve({
                    lat: place.geometry.location.lat(),
                    lng: place.geometry.location.lng(),
                    name: place.name || '',
                    address: place.formatted_address || ''
                  });
                } else {
                  resolve(null);
                }
              }
            );
          });
        });

        Promise.all(detailsPromises).then(results => {
          setSuggestions(results.filter(Boolean) as Location[]);
          setIsSearching(false);
        });
      }
    );
  }, [autocompleteService, placesService]);

  useEffect(() => {
    const timer = setTimeout(() => {
      searchLocations(searchQuery);
    }, 500);

    return () => clearTimeout(timer);
  }, [searchQuery, searchLocations]);

  const handleSuggestionClick = (location: Location) => {
    onDestinationSelect(location);
    setSearchQuery(location.name);
    setSuggestions([]);
  };

  const useCurrentLocation = () => {
    if (currentLocation) {
      onDestinationSelect({
        ...currentLocation,
        name: 'Current Location',
        address: 'Your current location'
      });
      setSearchQuery('Current Location');
    }
  };

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-xl font-semibold text-gray-900 mb-1">Where to in Lagos?</h2>
        <p className="text-sm text-gray-600">Search for a destination</p>
      </div>
      
      <div className="relative">
        <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
        <Input
          type="text"
          placeholder="Search for places in Lagos..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-12 pr-4 py-3 text-base border-gray-200 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent"
        />
      </div>

      {isSearching && (
        <div className="flex items-center justify-center p-4">
          <div className="w-5 h-5 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mr-2"></div>
          <span className="text-sm text-gray-600">Searching...</span>
        </div>
      )}

      {!isSearching && suggestions.length > 0 && (
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
                    {suggestion.name}
                  </div>
                  <div className="text-sm text-gray-500 truncate">
                    {suggestion.address}
                  </div>
                </div>
              </button>
            ))}
          </div>
        </Card>
      )}

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
      </div>
    </div>
  );
};

export default SearchPanel;