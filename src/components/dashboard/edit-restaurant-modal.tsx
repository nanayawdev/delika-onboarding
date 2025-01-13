import { useState, useEffect } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { LoadingSpinner } from "@/components/ui/loading-spinner"
import { toast } from "sonner"

interface Restaurant {
  id: string
  restaurantName: string
  restaurantEmail: string
  restaurantPhoneNumber: string
  restaurantAddress: string
  restaurantLogo?: {
    url: string
    name: string
  }
  created_at: number
}

interface EditRestaurantModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
  restaurant: Restaurant | null
}

export function EditRestaurantModal({ isOpen, onClose, onSuccess, restaurant }: EditRestaurantModalProps) {
  const [formData, setFormData] = useState({
    restaurantName: '',
    restaurantEmail: '',
    restaurantPhoneNumber: '',
    restaurantAddress: '',
  })
  const [selectedLogo, setSelectedLogo] = useState<File | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  useEffect(() => {
    if (restaurant) {
      setFormData({
        restaurantName: restaurant.restaurantName,
        restaurantEmail: restaurant.restaurantEmail,
        restaurantPhoneNumber: restaurant.restaurantPhoneNumber,
        restaurantAddress: restaurant.restaurantAddress,
      })
    }
  }, [restaurant])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)

    try {
      const formDataToSend = new FormData()

      // Add all form fields
      Object.entries(formData).forEach(([key, value]) => {
        formDataToSend.append(key, value)
      })

      // Add logo if selected, but name it as 'image' to match the API field
      if (selectedLogo) {
        formDataToSend.append('image', selectedLogo)
      }

      const response = await fetch(
        `${import.meta.env.VITE_API_BASE_URL}${import.meta.env.VITE_EDIT_RESTAURANT_ENDPOINT}/${restaurant?.id}`,
        {
          method: 'PATCH',
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('authToken')}`
          },
          body: formDataToSend
        }
      )

      if (!response.ok) {
        throw new Error('Failed to update restaurant')
      }

      toast.success('Restaurant updated successfully')
      onSuccess()
    } catch (error) {
      console.error('Error updating restaurant:', error)
      toast.error('Failed to update restaurant')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Edit Restaurant</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Logo preview and upload */}
          <div className="space-y-2">
            {restaurant?.restaurantLogo && (
              <div className="mb-4">
                <img 
                  src={restaurant.restaurantLogo.url} 
                  alt={restaurant.restaurantName}
                  className="w-24 h-24 object-cover rounded-lg"
                />
              </div>
            )}
            <Label htmlFor="logo">Restaurant Logo</Label>
            <Input
              id="logo"
              type="file"
              accept="image/*"
              onChange={(e) => {
                if (e.target.files?.[0]) {
                  setSelectedLogo(e.target.files[0])
                }
              }}
              className="cursor-pointer"
            />
          </div>

          {/* Restaurant Name */}
          <div className="space-y-2">
            <Label htmlFor="restaurantName">Restaurant Name</Label>
            <Input
              id="restaurantName"
              value={formData.restaurantName}
              onChange={(e) => setFormData(prev => ({ ...prev, restaurantName: e.target.value }))}
              required
            />
          </div>

          {/* Email */}
          <div className="space-y-2">
            <Label htmlFor="restaurantEmail">Email</Label>
            <Input
              id="restaurantEmail"
              type="email"
              value={formData.restaurantEmail}
              onChange={(e) => setFormData(prev => ({ ...prev, restaurantEmail: e.target.value }))}
              required
            />
          </div>

          {/* Phone Number */}
          <div className="space-y-2">
            <Label htmlFor="restaurantPhoneNumber">Phone Number</Label>
            <Input
              id="restaurantPhoneNumber"
              value={formData.restaurantPhoneNumber}
              onChange={(e) => setFormData(prev => ({ ...prev, restaurantPhoneNumber: e.target.value }))}
              required
            />
          </div>

          {/* Address */}
          <div className="space-y-2">
            <Label htmlFor="restaurantAddress">Address</Label>
            <Input
              id="restaurantAddress"
              value={formData.restaurantAddress}
              onChange={(e) => setFormData(prev => ({ ...prev, restaurantAddress: e.target.value }))}
              required
            />
          </div>

          {/* Submit buttons */}
          <div className="flex justify-end gap-4">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? (
                <>
                  <LoadingSpinner className="mr-2 h-4 w-4" />
                  Saving...
                </>
              ) : (
                'Save Changes'
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
} 