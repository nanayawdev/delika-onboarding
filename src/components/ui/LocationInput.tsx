'use client'

import React, { useState, useEffect, useRef } from 'react';
import { LocationData } from '../types/location'; // Ensure this type is defined

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

  useEffect(() => {
    if (prefillData) {
      setAddress(prefillData.address);
      onLocationSelect(prefillData);
    }
  }, [prefillData]);

  const handleInputChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setAddress(value);

    if (value.length > 2) {
      try {
        const response = await fetch(
          `https://api.geoapify.com/v1/geocode/autocomplete?text=${encodeURIComponent(value)}&apiKey=${import.meta.env.VITE_GEOAPIFY_API_KEY}&filter=countrycode:gh`
        );
        const data = await response.json();
        setSuggestions(data.features || []);
        setShowSuggestions(true);
      } catch (error) {
        console.error('Error fetching suggestions:', error);
      }
    } else {
      setSuggestions([]);
      setShowSuggestions(false);
    }
  };

  const handleSelect = (feature: GeoapifyFeature) => {
    const locationData: LocationData = {
      longitude: feature.properties.lon,
      latitude: feature.properties.lat,
      name: feature.properties.address_line1,
      address: feature.properties.formatted,
      city: feature.properties.city || '',
    };

    setAddress(feature.properties.formatted);
    setSuggestions([]);
    setShowSuggestions(false);
    onLocationSelect(locationData);
  };

  return (
    <div className="w-full" ref={wrapperRef}>
      <label className="block text-[14px] leading-[22px] font-sans text-[#666] mb-2">{label}</label>
      <div className="relative w-full">
        <input
          placeholder={`Enter ${label.toLowerCase()} location`}
          value={address}
          onChange={handleInputChange}
          disabled={disabled}
          className={`font-sans w-full border-[#efefef] border-[1px] border-solid [outline:none]
                      text-[13px] bg-[#fff] rounded-[8px]
                      py-[14px] px-[20px]
                      text-[#201a18] placeholder:text-[#b1b4b3]
                      box-border ${disabled ? 'bg-gray-50 cursor-not-allowed' : ''}`}
        />

        {showSuggestions && suggestions.length > 0 && (
          <div className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-md shadow-lg">
            {suggestions.map((suggestion, index) => (
              <div
                key={index}
                className="px-4 py-2 hover:bg-gray-100 cursor-pointer text-sm"
                onClick={() => handleSelect(suggestion)}
              >
                {suggestion.properties.formatted}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default LocationInput; 