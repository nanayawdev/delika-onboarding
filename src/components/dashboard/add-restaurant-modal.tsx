'use client'

import type React from "react";
import { useState } from "react";
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog"
import { Sonner } from "@/components/ui/sonner"
import { LoadingSpinner } from "@/components/ui/loading-spinner"
import { toast } from "sonner"
import LocationInput from "@/components/ui/LocationInput";

interface RestaurantDetails {
  image: File | null;
  restaurantName: string;
  restaurantEmail: string;
  restaurantPhoneNumber: string;
  restaurantAddress: string;
}

interface RestaurantErrors {
  image?: string;
  restaurantName?: string;
  restaurantEmail?: string;
  restaurantPhoneNumber?: string;
  restaurantAddress?: string;
}

interface LocationData {
  address: string;
  city: string;
  longitude: number;
  latitude: number;
}

interface AddRestaurantModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
}

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;
const ADD_RESTAURANT_ENDPOINT = import.meta.env.VITE_ADD_RESTAURANT_ENDPOINT;

export function AddRestaurantModal({ isOpen, onClose, onSuccess }: AddRestaurantModalProps) {
  const [restaurantDetails, setRestaurantDetails] = useState<RestaurantDetails>({
    image: null,
    restaurantName: "",
    restaurantEmail: "",
    restaurantPhoneNumber: "",
    restaurantAddress: "",
  })
  const [imagePreview, setImagePreview] = useState<string | null>(null)
  const [errors, setErrors] = useState<RestaurantErrors>({})
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, files } = e.target
    
    if (type === 'file' && files && files[0]) {
      const file = files[0]
      setRestaurantDetails((prev) => ({ ...prev, image: file }))
      const previewUrl = URL.createObjectURL(file)
      setImagePreview(previewUrl)
      if (errors.image) {
        setErrors(prev => ({ ...prev, image: undefined }))
      }
    } else {
      setRestaurantDetails(prev => ({ ...prev, [name]: value }))
      if (errors[name as keyof RestaurantErrors]) {
        setErrors(prev => ({ ...prev, [name]: undefined }))
      }
    }
  }

  const validateForm = (): boolean => {
    const newErrors: RestaurantErrors = {}
    let isValid = true

    if (!restaurantDetails.restaurantName.trim()) {
      newErrors.restaurantName = 'This field is required'
      isValid = false
    }

    if (!restaurantDetails.restaurantEmail.trim()) {
      newErrors.restaurantEmail = 'This field is required'
      isValid = false
    } else if (!/\S+@\S+\.\S+/.test(restaurantDetails.restaurantEmail)) {
      newErrors.restaurantEmail = 'Please enter a valid email'
      isValid = false
    }

    if (!restaurantDetails.restaurantPhoneNumber.trim()) {
      newErrors.restaurantPhoneNumber = 'This field is required'
      isValid = false
    } else if (!/^\+?[\d\s-]{10,}$/.test(restaurantDetails.restaurantPhoneNumber)) {
      newErrors.restaurantPhoneNumber = 'Please enter a valid phone number'
      isValid = false
    }

    if (!restaurantDetails.restaurantAddress.trim()) {
      newErrors.restaurantAddress = 'This field is required'
      isValid = false
    }

    if (!restaurantDetails.image) {
      newErrors.image = 'Restaurant image is required'
      isValid = false
    }

    setErrors(newErrors)
    return isValid
  }

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (validateForm()) {
      setIsSubmitting(true)
      try {
        const formData = new FormData()
        formData.append('restaurantName', restaurantDetails.restaurantName)
        formData.append('restaurantEmail', restaurantDetails.restaurantEmail)
        formData.append('restaurantPhoneNumber', restaurantDetails.restaurantPhoneNumber)
        formData.append('restaurantAddress', restaurantDetails.restaurantAddress)
        
        if (restaurantDetails.image) {
          formData.append('image', restaurantDetails.image)
        }

        const response = await fetch(`${API_BASE_URL}${ADD_RESTAURANT_ENDPOINT}`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('authToken')}`,
          },
          body: formData
        })

        if (!response.ok) {
          const errorData = await response.json()
          throw new Error(errorData.message || 'Failed to submit restaurant details')
        }

        toast.success('Restaurant created successfully')
        onSuccess()
        onClose()
      } catch (error) {
        console.error('Submission failed:', error)
        toast.error(error instanceof Error ? error.message : 'Failed to submit form')
        setErrors(prev => ({
          ...prev,
          image: error instanceof Error ? error.message : 'Failed to submit form'
        }))
      } finally {
        setIsSubmitting(false)
      }
    }
  }

  const handleLocationSelect = (location: LocationData) => {
    setRestaurantDetails(prev => ({
      ...prev,
      restaurantAddress: location.address
    }));
  };

  return (
    <>
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Add New Restaurant</DialogTitle>
            <DialogDescription>
              Enter the restaurant details below
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="restaurantName">Restaurant Name</Label>
              <Input
                id="restaurantName"
                name="restaurantName"
                value={restaurantDetails.restaurantName}
                onChange={handleChange}
                placeholder="Enter restaurant name"
              />
              {errors.restaurantName && <p className="text-sm text-red-500">{errors.restaurantName}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="restaurantEmail">Email</Label>
              <Input
                id="restaurantEmail"
                name="restaurantEmail"
                type="email"
                value={restaurantDetails.restaurantEmail}
                onChange={handleChange}
                placeholder="Enter restaurant email"
              />
              {errors.restaurantEmail && <p className="text-sm text-red-500">{errors.restaurantEmail}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="restaurantAddress">Location</Label>
              <LocationInput
                label="Restaurant Location"
                onLocationSelect={(location: LocationData) => {
                  setRestaurantDetails((prev) => ({
                    ...prev,
                    restaurantAddress: location.address,
                  }));
                }}
                prefillData={{
                  address: restaurantDetails.restaurantAddress || "",
                  city: "",
                  longitude: 0,
                  latitude: 0,
                }}
              />
              {errors.restaurantAddress && <p className="text-sm text-red-500">{errors.restaurantAddress}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="restaurantPhoneNumber">Phone Number</Label>
              <Input
                id="restaurantPhoneNumber"
                name="restaurantPhoneNumber"
                value={restaurantDetails.restaurantPhoneNumber}
                onChange={handleChange}
                placeholder="Enter phone number"
              />
              {errors.restaurantPhoneNumber && <p className="text-sm text-red-500">{errors.restaurantPhoneNumber}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="image">Restaurant Logo</Label>
              <Input
                id="image"
                name="image"
                type="file"
                accept="image/*"
                onChange={handleChange}
                className="cursor-pointer"
              />
              {imagePreview && (
                <div className="mt-2">
                  <img 
                    src={imagePreview} 
                    alt="Restaurant logo preview" 
                    className="w-40 h-40 object-cover rounded-md"
                  />
                </div>
              )}
              {errors.image && <p className="text-sm text-red-500">{errors.image}</p>}
            </div>

            <div className="flex justify-end gap-4">
              <Button type="button" variant="outline" onClick={onClose} disabled={isSubmitting}>
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? (
                  <>
                    <LoadingSpinner className="mr-2" />
                    Creating...
                  </>
                ) : (
                  'Add Restaurant'
                )}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
      <Sonner />
    </>
  )
} 