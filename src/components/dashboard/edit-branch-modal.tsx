import { useState, useEffect } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { LoadingSpinner } from "@/components/ui/loading-spinner"
import { toast } from "sonner"
import LocationInput from "@/components/ui/LocationInput"
import { LocationData } from '../types/location'

interface Branch {
  id: string
  branchName: string
  branchLocation: string
  branchPhoneNumber: string
  branchCity: string
  branchLongitude: string
  branchLatitude: string
}

interface EditBranchModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
  branch: Branch | null
  restaurantId: string
}

export function EditBranchModal({ isOpen, onClose, onSuccess, branch, restaurantId }: EditBranchModalProps) {
  const [formData, setFormData] = useState({
    branchName: '',
    branchLocation: '',
    branchPhoneNumber: '',
    branchCity: '',
    branchLongitude: '',
    branchLatitude: '',
    restaurantID: ''
  })
  const [isSubmitting, setIsSubmitting] = useState(false)

  useEffect(() => {
    if (branch) {
      setFormData({
        branchName: branch.branchName,
        branchLocation: branch.branchLocation,
        branchPhoneNumber: branch.branchPhoneNumber,
        branchCity: branch.branchCity,
        branchLongitude: branch.branchLongitude,
        branchLatitude: branch.branchLatitude,
        restaurantID: restaurantId
      })
    }
  }, [branch, restaurantId])

  const handleLocationSelect = (location: LocationData) => {
    setFormData(prev => ({
      ...prev,
      branchLocation: location.address,
      branchCity: location.city || '',
      branchLongitude: location.longitude.toString(),
      branchLatitude: location.latitude.toString(),
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)

    try {
      const response = await fetch(
        `${import.meta.env.VITE_API_BASE_URL}${import.meta.env.VITE_EDIT_BRANCH_ENDPOINT}/${branch?.id}`,
        {
          method: 'PATCH',
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('authToken')}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(formData)
        }
      )

      if (!response.ok) {
        throw new Error('Failed to update branch')
      }

      toast.success('Branch updated successfully')
      onSuccess()
    } catch (error) {
      console.error('Error updating branch:', error)
      toast.error('Failed to update branch')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Edit Branch</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="branchName">Branch Name</Label>
            <Input
              id="branchName"
              value={formData.branchName}
              onChange={(e) => setFormData(prev => ({ ...prev, branchName: e.target.value }))}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="branchLocation">Location</Label>
            <LocationInput
              id="branchLocation"
              label="Branch Location"
              onLocationSelect={handleLocationSelect}
              prefillData={{
                address: formData.branchLocation,
                city: formData.branchCity,
                longitude: parseFloat(formData.branchLongitude),
                latitude: parseFloat(formData.branchLatitude),
              }}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="branchPhoneNumber">Phone Number</Label>
            <Input
              id="branchPhoneNumber"
              value={formData.branchPhoneNumber}
              onChange={(e) => setFormData(prev => ({ ...prev, branchPhoneNumber: e.target.value }))}
              required
            />
          </div>

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