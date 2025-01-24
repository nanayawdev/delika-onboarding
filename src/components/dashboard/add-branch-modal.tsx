'use client'

import { useState } from 'react'
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
import { toast } from "sonner"
import LocationInput from "@/components/ui/LocationInput";
import { LocationData } from '../../types/location'; // Fix module import for location types

interface AddBranchModalProps {
  restaurantId: string; // Add this property to AddBranchModalProps
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
}

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;
const ADD_BRANCH_ENDPOINT = import.meta.env.VITE_ADD_BRANCH_ENDPOINT;

export function AddBranchModal({ restaurantId, isOpen, onClose, onSuccess }: AddBranchModalProps) {
  const [formData, setFormData] = useState({
    branchName: '',
    branchLocation: '',
    branchPhoneNumber: '',
    branchCity: '', // This will be populated from the location selection
    branchLongitude: '', // This will be populated from the location selection
    branchLatitude: '', // This will be populated from the location selection
  })
  const [isLoading, setIsLoading] = useState(false)

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
  }

  const handleLocationSelect = (location: LocationData) => {
    setFormData(prev => ({
      ...prev,
      branchLocation: location.address,
      branchCity: location.city || '', // Use city from location data
      branchLongitude: location.longitude.toString(), // Convert to string for form data
      branchLatitude: location.latitude.toString(), // Convert to string for form data
    }));
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      const response = await fetch(
        `${API_BASE_URL}${ADD_BRANCH_ENDPOINT}`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('authToken')}`
          },
          body: JSON.stringify({
            ...formData,
            restaurantID: restaurantId, // Ensure restaurantId is defined in your component
            delika_onboarding_id: localStorage.getItem('delikaOnboardingId')
          })
        }
      )

      if (!response.ok) {
        throw new Error('Failed to add branch')
      }

      toast.success(`${formData.branchName} branch has been added successfully`)
      onSuccess()
      onClose()
      // Reset form
      setFormData({
        branchName: '',
        branchLocation: '',
        branchPhoneNumber: '',
        branchCity: '',
        branchLongitude: '',
        branchLatitude: '',
      })
    } catch (error) {
      console.error('Error adding branch:', error)
      toast.error(`Failed to add ${formData.branchName} branch. Please try again.`)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <>
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Add New Branch</DialogTitle>
            <DialogDescription>
              Enter the branch details below
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="branchName">Branch Name</Label>
              <Input
                id="branchName"
                name="branchName"
                value={formData.branchName}
                onChange={handleChange}
                placeholder="Enter branch name"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="branchLocation">Location</Label>
              <LocationInput
                label="Branch Location"
                onLocationSelect={handleLocationSelect}
                prefillData={null}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="branchPhoneNumber">Phone Number</Label>
              <Input
                id="branchPhoneNumber"
                name="branchPhoneNumber"
                value={formData.branchPhoneNumber}
                onChange={handleChange}
                placeholder="Enter phone number"
                required
              />
            </div>

            <div className="flex justify-end gap-3 pt-4">
              <Button type="button" variant="outline" onClick={onClose}>
                Cancel
              </Button>
              <Button type="submit" disabled={isLoading}>
                {isLoading ? 'Adding...' : 'Add Branch'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
      <Sonner />
    </>
  )
} 