import { useState } from 'react'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { toast } from "sonner"
import { Sonner } from "@/components/ui/sonner"

interface AddBranchModalProps {
  restaurantId: string
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
    branchCity: '',
    branchLongitude: '',
    branchLatitude: '',
  })
  const [isLoading, setIsLoading] = useState(false)

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
  }

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
            restaurantID: restaurantId,
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
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Add New Branch</DialogTitle>
            <DialogDescription>
              Add a new branch location for your restaurant.
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
              <Input
                id="branchLocation"
                name="branchLocation"
                value={formData.branchLocation}
                onChange={handleChange}
                placeholder="Enter branch location"
                required
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
            <div className="space-y-2">
              <Label htmlFor="branchCity">City</Label>
              <Input
                id="branchCity"
                name="branchCity"
                value={formData.branchCity}
                onChange={handleChange}
                placeholder="Enter city"
                required
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="branchLongitude">Longitude</Label>
                <Input
                  id="branchLongitude"
                  name="branchLongitude"
                  value={formData.branchLongitude}
                  onChange={handleChange}
                  placeholder="Enter longitude"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="branchLatitude">Latitude</Label>
                <Input
                  id="branchLatitude"
                  name="branchLatitude"
                  value={formData.branchLatitude}
                  onChange={handleChange}
                  placeholder="Enter latitude"
                />
              </div>
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
      <Sonner position="top-right" />
    </>
  )
} 