import React, { useEffect, useState } from 'react';
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { BroadcastModal } from '@/components/dashboard/BroadcastModal'; // Adjust the import based on your project structure

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL; // Access the API base URL directly

const BroadcastList: React.FC = () => {
  const [broadcasts, setBroadcasts] = useState<any[]>([]);
  const [restaurants, setRestaurants] = useState<{ [key: string]: string }>({}); // Mapping of restaurantId to restaurant name
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isBroadcastModalOpen, setIsBroadcastModalOpen] = useState(false);

  const fetchRestaurants = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/delikaquickshipper_restaurants_table`);
      if (!response.ok) {
        throw new Error('Failed to fetch restaurants');
      }
      const data = await response.json();
      // Create a mapping of restaurantId to restaurant name
      const restaurantMap = data.reduce((acc: { [key: string]: string }, restaurant: { id: string; restaurantName: string }) => {
        acc[restaurant.id] = restaurant.restaurantName;
        return acc;
      }, {});
      setRestaurants(restaurantMap);
    } catch (error) {
      console.error('Error fetching restaurants:', error);
      setError('Failed to load restaurants');
    }
  };

  const fetchBroadcasts = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/delikaquickshipper_broadcast_table`);
      if (!response.ok) {
        throw new Error('Failed to fetch broadcasts');
      }
      const data = await response.json();
      setBroadcasts(data);
    } catch (error) {
      console.error('Error fetching broadcasts:', error);
      setError('Failed to load broadcasts');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchRestaurants(); // Fetch restaurant names
    fetchBroadcasts(); // Fetch broadcasts
  }, []);

  const handleBroadcastSuccess = (message: string) => {
    fetchBroadcasts(); // Refresh the list after a new broadcast is created
  };

  if (isLoading) {
    return <LoadingSpinner className="h-6 w-6" />;
  }

  if (error) {
    return <div className="text-red-500">{error}</div>;
  }

  return (
    <div className="container mx-auto py-8">
      <div className="flex justify-between items-center mb-4 pt-36">
        <h1 className="text-2xl font-bold">Broadcast Messages</h1>
        <Button onClick={() => setIsBroadcastModalOpen(true)} className="bg-gray-900 text-white hover:bg-gray-700">
          Create Broadcast
        </Button>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
        {broadcasts.map(broadcast => (
          <Card key={broadcast.id} className="flex border border-gray-300 rounded-lg shadow-md h-full">
            {broadcast.Image && broadcast.Image.url && (
              <img 
                src={broadcast.Image.url} 
                alt={broadcast.Header} 
                className="w-32 h-full object-cover rounded-l-lg"
              />
            )}
            <div className="flex-1 p-4">
              <h2 className="font-semibold">{broadcast.Header}</h2>
              <p>{broadcast.Body}</p>
              {broadcast.Footer && <p className="text-gray-500">{broadcast.Footer}</p>}
              {broadcast.ExpiryDate && <p className="text-gray-400">Expires on: {new Date(broadcast.ExpiryDate).toLocaleDateString()}</p>}
              
              {/* Divider */}
              <hr className="my-2 border-gray-300" />

              {broadcast.restaurants && broadcast.restaurants.length > 0 && (
                <p className="text-gray-600">
                  Sent to: {broadcast.restaurants.map(restaurant => restaurants[restaurant.restaurantId] || restaurant.restaurantId).join(', ')}
                </p>
              )}
            </div>
          </Card>
        ))}
      </div>

      <BroadcastModal 
        isOpen={isBroadcastModalOpen}
        onClose={() => setIsBroadcastModalOpen(false)}
        onSuccess={handleBroadcastSuccess}
        restaurants={restaurants}
      />
    </div>
  );
};

export default BroadcastList;