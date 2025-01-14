import { useEffect, useState } from 'react';

interface BroadcastBannerProps {
  restaurantId: string; // Accept restaurantId as a prop
}

export const BroadcastBanner: React.FC<BroadcastBannerProps> = ({ restaurantId }) => {
  const [broadcastMessage, setBroadcastMessage] = useState<string | null>(null);
  const [imageUrl, setImageUrl] = useState<string | null>(null); // State for the image URL
  const [expiryDate, setExpiryDate] = useState<string | null>(null); // State for the expiry date
  const [header, setHeader] = useState<string | null>(null); // State for the header

  const fetchBroadcastMessage = async () => {
    try {
      const response = await fetch(`https://api-server.krontiva.africa/api:uEBBwbSs/delikaquickshipper_broadcast_table`);
      if (response.ok) {
        const data = await response.json();
        console.log('Broadcast data:', data); // Debugging log
        // Find the broadcast message for the specific restaurant
        const restaurantBroadcast = data.find((broadcast: any) =>
          broadcast.restaurants.some((restaurant: { restaurantId: string }) => restaurant.restaurantId === restaurantId)
        );
        if (restaurantBroadcast) {
          setBroadcastMessage(restaurantBroadcast.Body); // Set the body of the broadcast message
          setHeader(restaurantBroadcast.Header); // Set the header of the broadcast message
          // Correctly set the image URL
          if (restaurantBroadcast.Image && restaurantBroadcast.Image.url) {
            setImageUrl(restaurantBroadcast.Image.url); // Set the image URL from the Image object
          }
          // Set the expiry date
          setExpiryDate(restaurantBroadcast.ExpiryDate); // Assuming the expiry date is in the broadcast data
          console.log('Broadcast message:', restaurantBroadcast.Body); // Debugging log
          console.log('Image URL:', restaurantBroadcast.Image?.url); // Debugging log
          console.log('Expiry Date:', restaurantBroadcast.ExpiryDate); // Debugging log
        }
      } else {
        console.error('Failed to fetch broadcast message:', response.status);
      }
    } catch (error) {
      console.error('Error fetching broadcast message:', error);
    }
  };

  useEffect(() => {
    if (restaurantId) { // Ensure restaurantId is defined before fetching
      fetchBroadcastMessage();
      const interval = setInterval(fetchBroadcastMessage, 60000); // Fetch every minute
      return () => clearInterval(interval);
    }
  }, [restaurantId]);

  // Check if the banner should be displayed based on the expiry date
  const isExpired = expiryDate ? new Date(expiryDate).setHours(23, 59, 59, 999) < new Date() : false;

  if (!broadcastMessage || isExpired) return null; // Hide the banner if expired

  return (
    <div className="bg-blue-100 mb-4 rounded-xl flex items-center p-4">
      {imageUrl && (
        <img 
          src={imageUrl} 
          alt="Broadcast" 
          className="h-20 w-20 mr-4 rounded-full" // Adjust size and margin
        />
      )}
      <div className="flex-1">
        {header && <h2 className="font-bold text-lg ml-4">{header}</h2>}
        <p className="text-sm ml-4">{broadcastMessage}</p>
      </div>
    </div>
  );
}; 