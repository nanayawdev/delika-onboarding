"use client"

import * as React from "react";
import { useState, useEffect } from "react";
import { GoogleMap, LoadScript, DirectionsRenderer } from '@react-google-maps/api';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { DollarSign } from "lucide-react";

const GOOGLE_MAPS_API_KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;

export default function Overview() {
  const [selectedCourier, setSelectedCourier] = useState(null);
  const [directions, setDirections] = useState(null);
  const [couriers, setCouriers] = useState([]);
  const [selectedRestaurant, setSelectedRestaurant] = useState<string | null>(null);

  // Example restaurant data
  const restaurants = ["Restaurant A", "Restaurant B", "Restaurant C"];

  // Mock earnings data
  const earningsData = [
    { month: 'Jan', earnings: 5000 },
    { month: 'Feb', earnings: 7500 },
    { month: 'Mar', earnings: 6000 },
    { month: 'Apr', earnings: 8000 },
    { month: 'May', earnings: 9500 },
  ];

  useEffect(() => {
    const fetchCouriers = async () => {
      const response = await fetch('/api/couriers'); // Example endpoint
      const data = await response.json();
      setCouriers(data);
    };

    fetchCouriers();
  }, []);

  const handleCourierClick = async (courier) => {
    setSelectedCourier(courier);
    const origin = { lat: courier.orders[0].pickupLocation.lat, lng: courier.orders[0].pickupLocation.lng };
    const destination = { lat: courier.orders[0].dropoffLocation.lat, lng: courier.orders[0].dropoffLocation.lng };

    const directionsService = new window.google.maps.DirectionsService();
    directionsService.route(
      {
        origin,
        destination,
        travelMode: window.google.maps.TravelMode.DRIVING,
      },
      (result, status) => {
        if (status === window.google.maps.DirectionsStatus.OK) {
          setDirections(result);
        } else {
          console.error(`Error fetching directions: ${result}`);
        }
      }
    );
  };

  return (
    <div className="container mx-auto p-6 mt-10">
      <header className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Dashboard</h1>
        <div className="flex items-center">
          <span className="mr-4">Alicia Koch</span>
          <button className="bg-gray-200 p-2 rounded">Settings</button>
        </div>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <Card className="bg-white shadow-md">
          <CardHeader>
            <CardTitle>Total Revenue</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex justify-between items-center">
              <p className="text-2xl font-bold">$45,231.89</p>
              <DollarSign className="h-6 w-6 text-gray-500" />
            </div>
            <p className="text-sm text-gray-500">+20.1% from last month</p>
          </CardContent>
        </Card>

        <Card className="bg-white shadow-md">
          <CardHeader>
            <CardTitle>Subscriptions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex justify-between items-center">
              <p className="text-2xl font-bold">+2,350</p>
            </div>
            <p className="text-sm text-gray-500">+180.1% from last month</p>
          </CardContent>
        </Card>

        <Card className="bg-white shadow-md">
          <CardHeader>
            <CardTitle>Sales</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex justify-between items-center">
              <p className="text-2xl font-bold">+12,234</p>
            </div>
            <p className="text-sm text-gray-500">+19% from last month</p>
          </CardContent>
        </Card>

        <Card className="bg-white shadow-md">
          <CardHeader>
            <CardTitle>Active Now</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex justify-between items-center">
              <p className="text-2xl font-bold">+573</p>
            </div>
            <p className="text-sm text-gray-500">+201 since last hour</p>
          </CardContent>
        </Card>
      </div>

      <h2 className="text-2xl font-bold mb-4">Overview</h2>
      <ResponsiveContainer width="100%" height={300}>
        <BarChart data={earningsData}>
          <XAxis dataKey="month" />
          <YAxis />
          <Tooltip />
          <Bar dataKey="earnings" fill="#4caf50" />
        </BarChart>
      </ResponsiveContainer>

      <h2 className="text-2xl font-bold mb-4">Recent Sales</h2>
      <div className="bg-white shadow-md p-4 rounded">
        <ul>
          <li>Olivia Martin - $1,999.00</li>
          <li>Jackson Lee - $39.00</li>
          <li>Isabella Nguyen - $299.00</li>
          <li>William Kim - $99.00</li>
          <li>Sofia Davis - $39.00</li>
        </ul>
      </div>

      {/* Google Map */}
      {selectedCourier && (
        <LoadScript googleMapsApiKey={GOOGLE_MAPS_API_KEY}>
          <GoogleMap
            mapContainerStyle={{ height: "400px", width: "100%" }}
            center={{ lat: selectedCourier.orders[0].pickupLocation.lat, lng: selectedCourier.orders[0].pickupLocation.lng }}
            zoom={14}
          >
            {directions && <DirectionsRenderer directions={directions} />}
          </GoogleMap>
        </LoadScript>
      )}
    </div>
  );
} 