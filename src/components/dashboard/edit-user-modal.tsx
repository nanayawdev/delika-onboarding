'use client'

import { useState, useEffect } from 'react'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { LoadingSpinner } from "@/components/ui/loading-spinner"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { toast } from "sonner"

interface UserDetails {
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
  image?: File | null
  branchId?: string
}

interface EditUserModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
  user: any
  branches: any[]
}

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;
const GET_USERS_ENDPOINT = import.meta.env.VITE_GET_USERS_ENDPOINT;
const DELETE_USER_ENDPOINT = import.meta.env.VITE_DELETE_USER_ENDPOINT;

export function EditUserModal({
  isOpen,
  onClose,
  onSuccess,
  user,
  branches,
}: EditUserModalProps) {
  const [userDetails, setUserDetails] = useState<UserDetails>({
    userName: user.userName || "",
    fullName: user.fullName || "",
    role: user.role || "",
    dateOfBirth: user.dateOfBirth || "",
    email: user.email || "",
    phoneNumber: user.phoneNumber || "",
    address: user.address || "",
    city: user.city || "",
    country: user.country || "",
    postalCode: user.postalCode || "",
    image: null,
    branchId: user.branchId || "",
  })
  const [errors, setErrors] = useState<Partial<UserDetails>>({})
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [roles, setRoles] = useState<string[]>([])
  const [isLoadingRoles, setIsLoadingRoles] = useState(true)
  const [isLoading, setIsLoading] = useState(true)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)

  useEffect(() => {
    const fetchRoles = async () => {
      try {
        setIsLoadingRoles(true)
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
        const uniqueRoles = [...new Set(users.map((user: any) => user.role))]
        setRoles(uniqueRoles)
      } catch (error) {
        console.error('Error fetching roles:', error)
        toast.error('Failed to load roles')
      } finally {
        setIsLoadingRoles(false)
      }
    }

    if (isOpen) {
      fetchRoles()
    }
  }, [isOpen])

  useEffect(() => {
    if (isOpen) {
      const restaurantDetails = document.querySelector('.restaurant-hero')
      if (restaurantDetails) {
        const name = restaurantDetails.querySelector('h1')?.textContent || ""
        const location = restaurantDetails.querySelector('.restaurant-location')?.textContent || ""
        
        setUserDetails(prev => ({
          ...prev,
          restaurantName: name,
          restaurantLocation: location
        }))
      }
    }
  }, [isOpen])

  useEffect(() => {
    const fetchUserDetails = async () => {
      if (!user?.id) return

      try {
        setIsLoading(true)
        const response = await fetch(
          `https://api-server.krontiva.africa/api:uEBBwbSs/delikaquickshipper_user_table/${user.id}`,
          {
            headers: {
              'Authorization': `Bearer ${localStorage.getItem('authToken')}`
            }
          }
        )

        if (!response.ok) {
          throw new Error('Failed to fetch user details')
        }

        const userData = await response.json()
        setUserDetails({
          userName: userData.userName,
          fullName: userData.fullName,
          email: userData.email,
          role: userData.role,
          dateOfBirth: userData.dateOfBirth,
          phoneNumber: userData.phoneNumber,
          address: userData.address,
          city: userData.city,
          country: userData.country,
          postalCode: userData.postalCode,
          branchId: userData.branchId,
          restaurantId: userData.restaurantId,
          image: userData.image
        })
        setIsLoading(false)
      } catch (error) {
        console.error('Error fetching user details:', error)
        toast.error('Failed to load user details')
        setIsLoading(false)
      }
    }

    if (isOpen && user?.id) {
      fetchUserDetails()
    }
  }, [isOpen, user?.id])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)

    try {
      const formDataToSend = new FormData()
      
      formDataToSend.append('userId', user.id)
      
      formDataToSend.append('userName', userDetails.userName)
      formDataToSend.append('fullName', userDetails.fullName)
      formDataToSend.append('email', userDetails.email)
      formDataToSend.append('role', userDetails.role)
      formDataToSend.append('dateOfBirth', userDetails.dateOfBirth)
      formDataToSend.append('phoneNumber', userDetails.phoneNumber)
      formDataToSend.append('address', userDetails.address)
      formDataToSend.append('city', userDetails.city)
      formDataToSend.append('country', userDetails.country)
      formDataToSend.append('postalCode', userDetails.postalCode)
      formDataToSend.append('branchId', userDetails.branchId)
      formDataToSend.append('restaurantId', user.restaurantId)

      if (selectedFile) {
        formDataToSend.append('photo', selectedFile)
      }

      const response = await fetch(
        `https://api-server.krontiva.africa/api:uEBBwbSs/delikaquickshipper_user_table/${user.id}`,
        {
          method: 'PATCH',
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('authToken')}`
          },
          body: formDataToSend
        }
      )

      if (!response.ok) {
        throw new Error('Failed to update user')
      }

      toast.success(`${userDetails.fullName} has been updated successfully`)
      onSuccess()
      onClose()
    } catch (error) {
      console.error('Error updating user:', error)
      toast.error(`Failed to update ${userDetails.fullName}. Please try again.`)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setSelectedFile(e.target.files[0])
    }
  }

  const handleDeleteUser = async () => {
    if (!userToDelete) return;

    try {
      const response = await fetch(
        `${API_BASE_URL}${DELETE_USER_ENDPOINT}/${userToDelete.id}`,
        {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('authToken')}`
          }
        }
      );

      // existing code...
    } catch (error) {
      // existing error handling...
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[700px]">
        <DialogHeader>
          <DialogTitle>Edit User</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            {/* Column 1 */}
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="photo">Profile Photo</Label>
                <Input
                  id="photo"
                  name="photo"
                  type="file"
                  accept="image/*"
                  onChange={handleFileChange}
                  className="cursor-pointer"
                />
                {userDetails.image && (
                  <div className="mt-2">
                    <img 
                      src={userDetails.image.url} 
                      alt="Current profile" 
                      className="w-20 h-20 rounded-xl object-cover"
                    />
                    <p className="text-sm text-gray-500 mt-1">Current photo</p>
                  </div>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="userName">Username</Label>
                <Input
                  id="userName"
                  value={userDetails.userName}
                  onChange={(e) => setUserDetails(prev => ({ ...prev, userName: e.target.value }))}
                  placeholder="Enter username"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="fullName">Full Name</Label>
                <Input
                  id="fullName"
                  value={userDetails.fullName}
                  onChange={(e) => setUserDetails(prev => ({ ...prev, fullName: e.target.value }))}
                  placeholder="Enter full name"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="dateOfBirth">Date of Birth</Label>
                <Input
                  id="dateOfBirth"
                  type="date"
                  value={userDetails.dateOfBirth}
                  onChange={(e) => setUserDetails(prev => ({ ...prev, dateOfBirth: e.target.value }))}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={userDetails.email}
                  onChange={(e) => setUserDetails(prev => ({ ...prev, email: e.target.value }))}
                  placeholder="Enter email"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="phoneNumber">Phone Number</Label>
                <Input
                  id="phoneNumber"
                  value={userDetails.phoneNumber}
                  onChange={(e) => setUserDetails(prev => ({ ...prev, phoneNumber: e.target.value }))}
                  placeholder="Enter phone number"
                  required
                />
              </div>
            </div>

            {/* Column 2 */}
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="address">Address</Label>
                <Input
                  id="address"
                  value={userDetails.address}
                  onChange={(e) => setUserDetails(prev => ({ ...prev, address: e.target.value }))}
                  placeholder="Enter address"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="city">City</Label>
                <Input
                  id="city"
                  value={userDetails.city}
                  onChange={(e) => setUserDetails(prev => ({ ...prev, city: e.target.value }))}
                  placeholder="Enter city"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="country">Country</Label>
                <Input
                  id="country"
                  value={userDetails.country}
                  onChange={(e) => setUserDetails(prev => ({ ...prev, country: e.target.value }))}
                  placeholder="Enter country"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="postalCode">Postal Code</Label>
                <Input
                  id="postalCode"
                  value={userDetails.postalCode}
                  onChange={(e) => setUserDetails(prev => ({ ...prev, postalCode: e.target.value }))}
                  placeholder="Enter postal code"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="role">Role</Label>
                <Select
                  value={userDetails.role}
                  onValueChange={(value) => setUserDetails(prev => ({ ...prev, role: value }))}
                  required
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select role" />
                  </SelectTrigger>
                  <SelectContent className="bg-white border shadow-md">
                    {isLoadingRoles ? (
                      <div className="flex items-center justify-center p-4">
                        <LoadingSpinner className="h-4 w-4" />
                      </div>
                    ) : (
                      roles.map((role) => (
                        <SelectItem 
                          key={role} 
                          value={role}
                          className="hover:bg-gray-100"
                        >
                          {role.split('_').map(word => 
                            word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()
                          ).join(' ')}
                        </SelectItem>
                      ))
                    )}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="branch">Branch</Label>
                <Select
                  value={userDetails.branchId}
                  onValueChange={(value) => setUserDetails(prev => ({ ...prev, branchId: value }))}
                  required
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select branch" />
                  </SelectTrigger>
                  <SelectContent className="bg-white border shadow-md">
                    {branches.map((branch) => (
                      <SelectItem 
                        key={branch.id} 
                        value={branch.id}
                        className="hover:bg-gray-100"
                      >
                        {branch.branchName}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-4">
            <Button type="button" variant="outline" onClick={onClose} disabled={isSubmitting}>
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