'use client'

import React, { useState, useEffect, useRef } from 'react';
import { LocationData } from '../../types/location';

interface LocationInputProps {
  label: string;
  onLocationSelect: (location: LocationData) => void;
  prefillData?: LocationData;
  disabled?: boolean;
}

interface GeoapifyFeature {
  properties: {
    lon: number;
    lat: number;
    formatted: string;
    address_line1: string;
    address_line2: string;
    city?: string;
    country?: string;
  };
}

const LocationInput: React.FC<LocationInputProps> = ({ label, onLocationSelect, prefillData, disabled }) => {
  const [address, setAddress] = useState(prefillData?.address || '');
  const [suggestions, setSuggestions] = useState<GeoapifyFeature[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
        setShowSuggestions(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleAddressChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const newAddress = e.target.value;
    setAddress(newAddress);
    
    if (newAddress.length > 2) {
      try {
        const response = await fetch(
          `https://api.geoapify.com/v1/geocode/autocomplete?text=${encodeURIComponent(newAddress)}&apiKey=${import.meta.env.VITE_GEOAPIFY_API_KEY}`
        );
        const data = await response.json();
        setSuggestions(data.features || []);
        setShowSuggestions(true);
      } catch (error) {
        console.error('Error fetching location suggestions:', error);
        setSuggestions([]);
      }
    } else {
      setSuggestions([]);
      setShowSuggestions(false);
    }
    
    if (newAddress && prefillData?.city && prefillData.longitude && prefillData.latitude) {
      onLocationSelect({
        address: newAddress,
        city: prefillData.city,
        longitude: prefillData.longitude,
        latitude: prefillData.latitude
      });
    }
  };

  return (
    <div ref={wrapperRef} className="relative w-full">
      <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
      <input
        type="text"
        value={address}
        onChange={handleAddressChange}
        disabled={disabled}
        className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary"
        placeholder="Enter location"
      />
      {showSuggestions && suggestions.length > 0 && (
        <ul className="absolute z-10 w-full mt-1 bg-white shadow-lg max-h-60 rounded-md py-1 text-base ring-1 ring-black ring-opacity-5 overflow-auto focus:outline-none sm:text-sm">
          {suggestions.map((suggestion) => (
            <li
              key={suggestion.properties.formatted}
              onClick={() => {
                setAddress(suggestion.properties.formatted);
                const city = suggestion.properties.city || 'Unknown City';
                onLocationSelect({
                  address: suggestion.properties.formatted,
                  city: city,
                  longitude: suggestion.properties.lon,
                  latitude: suggestion.properties.lat,
                });
                setShowSuggestions(false);
              }}
              className="cursor-pointer select-none relative py-2 pl-3 pr-9 hover:bg-gray-50"
            >
              {suggestion.properties.formatted}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default LocationInput;
