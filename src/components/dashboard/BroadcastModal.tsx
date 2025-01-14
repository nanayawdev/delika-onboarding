import React, { useState, useEffect } from 'react';
import Modal from '@/components/ui/Modal'; // Adjust the import path as necessary
import { Button } from "@/components/ui/button";
import { toast } from 'sonner'; // Import the toast function

interface Restaurant {
  id: string;
  restaurantName: string;
}

interface BroadcastModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void; // Adjusted to not require a message
}

export const BroadcastModal: React.FC<BroadcastModalProps> = ({ isOpen, onClose, onSuccess }) => {
  const [header, setHeader] = useState('');
  const [body, setBody] = useState('');
  const [footer, setFooter] = useState('');
  const [photo, setPhoto] = useState<File | null>(null);
  const [expiryDate, setExpiryDate] = useState<string>('');
  const [restaurants, setRestaurants] = useState<Restaurant[]>([]);
  const [selectedRestaurants, setSelectedRestaurants] = useState<string[]>([]); // Store selected restaurant IDs
  const [isLoading, setIsLoading] = useState(false); // Loading state

  useEffect(() => {
    if (isOpen) {
      fetchRestaurants(); // Fetch restaurants when the modal opens
    }
  }, [isOpen]);

  const fetchRestaurants = async () => {
    try {
      const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/delikaquickshipper_restaurants_table`);
      if (!response.ok) {
        throw new Error('Failed to fetch restaurants');
      }
      const data = await response.json();
      setRestaurants(data);
    } catch (error) {
      console.error('Error fetching restaurants:', error);
    }
  };

  const handleSubmit = async () => {
    setIsLoading(true); // Set loading state to true
    const formData = new FormData();
    formData.append('Header', header);
    formData.append('Footer', footer);
    formData.append('Body', body);
    formData.append('ExpiryDate', expiryDate || '');

    if (photo) {
      formData.append('photo', photo);
    }

    // Append each restaurantId individually
    selectedRestaurants.forEach(restaurantId => {
      formData.append('restaurants[]', JSON.stringify({ restaurantId }));
    });

    try {
      const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/delikaquickshipper_broadcast_table`, {
        method: 'POST',
        body: formData,
      });

      if (response.ok) {
        toast.success('Broadcast sent successfully!'); // Show success toast
        onSuccess();
        onClose();
      } else {
        const errorText = await response.text();
        toast.error(`Failed to send broadcast: ${errorText}`); // Show error toast
      }
    } catch (error) {
      console.error('Error sending broadcast:', error);
      toast.error('An error occurred while sending the broadcast.'); // Show error toast
    } finally {
      setIsLoading(false); // Reset loading state
    }
  };

  const toggleRestaurantSelection = (id: string) => {
    setSelectedRestaurants(prevSelected => 
      prevSelected.includes(id) 
        ? prevSelected.filter(restaurantId => restaurantId !== id) 
        : [...prevSelected, id]
    );
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose}>
      <h2 className="text-lg font-bold mb-4">Send Broadcast Message</h2>
      <input 
        type="text"
        value={header}
        onChange={(e) => setHeader(e.target.value)}
        placeholder="Header"
        className="w-full p-2 border border-gray-300 rounded mb-2"
      />
      <textarea 
        value={body}
        onChange={(e) => setBody(e.target.value)}
        placeholder="Body"
        className="w-full h-24 p-2 border border-gray-300 rounded mb-2"
      />
      <input 
        type="text"
        value={footer}
        onChange={(e) => setFooter(e.target.value)}
        placeholder="Footer (optional)"
        className="w-full p-2 border border-gray-300 rounded mb-2"
      />
      <input 
        type="file"
        onChange={(e) => e.target.files && setPhoto(e.target.files[0])}
        className="mb-2"
      />
      <input 
        type="date"
        value={expiryDate}
        onChange={(e) => setExpiryDate(e.target.value)}
        className="w-full p-2 border border-gray-300 rounded mb-2"
      />

      <h3 className="text-lg font-bold mb-2">Select Restaurants</h3>
      <div className="max-h-40 overflow-y-auto border border-gray-300 rounded mb-4">
        {restaurants.map(restaurant => (
          <div key={restaurant.id} className="flex items-center p-2">
            <input 
              type="checkbox" 
              checked={selectedRestaurants.includes(restaurant.id)} 
              onChange={() => toggleRestaurantSelection(restaurant.id)} 
            />
            <label className="ml-2">{restaurant.restaurantName}</label>
          </div>
        ))}
      </div>

      <div className="flex justify-end mt-4">
        <Button onClick={handleSubmit} className={`bg-blue-600 text-white hover:bg-blue-700 ${isLoading ? 'opacity-50 cursor-not-allowed' : ''}`} disabled={isLoading}>
          {isLoading ? 'Sending...' : 'Send'} {/* Change button text based on loading state */}
        </Button>
        <Button onClick={onClose} className="bg-red-600 text-white hover:bg-red-700 ml-2">
          Cancel
        </Button>
      </div>
    </Modal>
  );
}; 