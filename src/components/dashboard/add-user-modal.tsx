'use client'

import { useState, useEffect } from 'react'
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { toast } from "sonner"
import { LoadingSpinner } from "@/components/ui/loading-spinner"

interface Branch {
  id: string
  branchName: string
}

interface AddUserModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
  restaurantId: string
  branches: Branch[]
}

interface FormData {
  userName: string
  fullName: string
  role: string
  dateOfBirth: string
  email: string
  phoneNumber: string
  address: string
  city: string
  country: string
  postalCode: string
  restaurantName: string
  restaurantLocation: string
  image?: File | null
  restaurantId: string
  branchId: string
}

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;
const GET_USERS_ENDPOINT = import.meta.env.VITE_GET_USERS_ENDPOINT;

export function AddUserModal({ isOpen, onClose, onSuccess, restaurantId, branches }: AddUserModalProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [roles, setRoles] = useState<string[]>([])
  const [formData, setFormData] = useState<FormData>({
    userName: "",
    fullName: "",
    role: "",
    dateOfBirth: "",
    email: "",
    phoneNumber: "",
    address: "",
    city: "",
    country: "",
    postalCode: "",
    restaurantName: "",
    restaurantLocation: "",
    image: null,
    restaurantId,
    branchId: "",
  })

  useEffect(() => {
    const fetchRoles = async () => {
      try {
        const response = await fetch(
          `${API_BASE_URL}${GET_USERS_ENDPOINT}`,
          {
            headers: {
              'Authorization': `Bearer ${localStorage.getItem('authToken')}`
            }
          }
        )

        if (!response.ok) {
          throw new Error('Failed to fetch roles')
        }

        const users = await response.json()
        
        // Extract unique roles from users and ensure they are strings
        const uniqueRoles = Array.from(new Set(users
          .map((user: { role?: unknown }) => user.role)
          .filter((role: unknown): role is string => 
            typeof role === 'string' && role.trim() !== ''
          )
        )) as string[]
        console.log('Fetched roles:', uniqueRoles)
        setRoles(uniqueRoles)
      } catch (error) {
        console.error('Error fetching roles:', error)
        toast.error('Failed to load roles')
      }
    }

    if (isOpen) {
      fetchRoles()
    }
  }, [isOpen])

  useEffect(() => {
    if (isOpen) {
      // Get restaurant details from the parent component
      const restaurantDetails = document.querySelector('.restaurant-hero')
      if (restaurantDetails) {
        const name = restaurantDetails.querySelector('h1')?.textContent || ""
        const location = restaurantDetails.querySelector('.restaurant-location')?.textContent || ""
        
        setFormData(prev => ({
          ...prev,
          restaurantName: name,
          restaurantLocation: location
        }))
      }
    }
  }, [isOpen])

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFormData(prev => ({ ...prev, image: e.target.files![0] }))
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    try {
      setIsLoading(true)
      const formDataToSend = new FormData()
      
      // Append all form fields
      formDataToSend.append('userName', formData.userName)
      formDataToSend.append('fullName', formData.fullName)
      formDataToSend.append('email', formData.email)
      formDataToSend.append('phoneNumber', formData.phoneNumber)
      formDataToSend.append('dateOfBirth', formData.dateOfBirth)
      formDataToSend.append('address', formData.address)
      formDataToSend.append('city', formData.city)
      formDataToSend.append('country', formData.country)
      formDataToSend.append('postalCode', formData.postalCode)
      formDataToSend.append('role', formData.role)
      formDataToSend.append('branchId', formData.branchId)
      formDataToSend.append('restaurantId', restaurantId)

      // Changed: append file with input name 'photo' instead of 'image'
      if (formData.image) {
        formDataToSend.append('photo', formData.image)
      }

      const response = await fetch(
        'https://api-server.krontiva.africa/api:uEBBwbSs/delikaquickshipper_user_table',
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('authToken')}`
          },
          body: formDataToSend
        }
      )

      if (!response.ok) {
        throw new Error('Failed to add user')
      }

      toast.success(`${formData.fullName} has been added successfully`)
      onSuccess()
    } catch (error) {
      console.error('Error adding user:', error)
      toast.error(`Failed to add ${formData.fullName}. Please try again.`)
    } finally {
      setIsLoading(false)
    }
  }

  // Add this check to filter out any empty roles
  const validRoles = roles.filter(role => role && role.trim() !== '');

  // Add this check to filter out any branches with empty ids
  const validBranches = branches.filter(branch => branch && branch.id && branch.id.trim() !== '');

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[700px]">
        <DialogHeader>
          <DialogTitle>Add New User</DialogTitle>
          <DialogDescription>
            Fill in the details to add a new user to the system.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="image">Profile Image</Label>
                <Input
                  id="image"
                  type="file"
                  accept="image/*"
                  onChange={handleFileChange}
                  className="cursor-pointer"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="userName">Username</Label>
                <Input
                  id="userName"
                  value={formData.userName}
                  onChange={(e) => setFormData(prev => ({ ...prev, userName: e.target.value }))}
                  placeholder="Enter username"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="fullName">Full Name</Label>
                <Input
                  id="fullName"
                  value={formData.fullName}
                  onChange={(e) => setFormData(prev => ({ ...prev, fullName: e.target.value }))}
                  placeholder="Enter full name"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="dateOfBirth">Date of Birth</Label>
                <Input
                  id="dateOfBirth"
                  type="date"
                  value={formData.dateOfBirth}
                  onChange={(e) => setFormData(prev => ({ ...prev, dateOfBirth: e.target.value }))}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                  placeholder="Enter email"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="phoneNumber">Phone Number</Label>
                <Input
                  id="phoneNumber"
                  value={formData.phoneNumber}
                  onChange={(e) => setFormData(prev => ({ ...prev, phoneNumber: e.target.value }))}
                  placeholder="Enter phone number"
                  required
                />
              </div>
            </div>

            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="address">Address</Label>
                <Input
                  id="address"
                  value={formData.address}
                  onChange={(e) => setFormData(prev => ({ ...prev, address: e.target.value }))}
                  placeholder="Enter address"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="city">City</Label>
                <Input
                  id="city"
                  value={formData.city}
                  onChange={(e) => setFormData(prev => ({ ...prev, city: e.target.value }))}
                  placeholder="Enter city"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="country">Country</Label>
                <Input
                  id="country"
                  value={formData.country}
                  onChange={(e) => setFormData(prev => ({ ...prev, country: e.target.value }))}
                  placeholder="Enter country"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="postalCode">Postal Code</Label>
                <Input
                  id="postalCode"
                  value={formData.postalCode}
                  onChange={(e) => setFormData(prev => ({ ...prev, postalCode: e.target.value }))}
                  placeholder="Enter postal code"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="role">Role</Label>
                <Select
                  value={formData.role}
                  onValueChange={(value) => setFormData(prev => ({ ...prev, role: value }))}
                  required
                >
                  <SelectTrigger className="bg-white border border-gray-300 rounded">
                    <SelectValue placeholder="Select role" />
                  </SelectTrigger>
                  <SelectContent className="bg-white border border-gray-300 rounded">
                    {validRoles.map((role) => (
                      <SelectItem key={role} value={role}>
                        {role.split('_').map(word => 
                          word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()
                        ).join(' ')}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="branch">Branch</Label>
                <Select
                  value={formData.branchId}
                  onValueChange={(value) => setFormData(prev => ({ ...prev, branchId: value }))}
                  required
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select branch" />
                  </SelectTrigger>
                  <SelectContent>
                    {validBranches.map((branch) => (
                      <SelectItem key={branch.id} value={branch.id}>
                        {branch.branchName}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? (
                <>
                  <LoadingSpinner className="mr-2 h-4 w-4" />
                  Adding...
                </>
              ) : (
                'Add User'
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
} 