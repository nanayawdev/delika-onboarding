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

  const handleAddressChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newAddress = e.target.value;
    setAddress(newAddress);
    
    if (newAddress) {
      if (prefillData?.city && prefillData.longitude && prefillData.latitude) {
        onLocationSelect({
          address: newAddress,
          city: prefillData.city,
          longitude: prefillData.longitude,
          latitude: prefillData.latitude
        });
      }
    }
  };

  return (
    <div ref={wrapperRef}>
      <label>{label}</label>
      <input
        type="text"
        value={address}
        onChange={handleAddressChange}
        disabled={disabled}
      />
      {showSuggestions && suggestions.length > 0 && (
        <ul>
          {suggestions.map((suggestion) => (
            <li key={suggestion.properties.formatted} onClick={() => {
              setAddress(suggestion.properties.formatted);
              const city = suggestion.properties.city || 'Unknown City';
              onLocationSelect({
                address: suggestion.properties.formatted,
                city: city,
                longitude: suggestion.properties.lon,
                latitude: suggestion.properties.lat,
              });
            }}>
              {suggestion.properties.formatted}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default LocationInput;
