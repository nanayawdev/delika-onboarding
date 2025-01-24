'use client'

import { useState } from 'react'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card"
import { useNavigate } from 'react-router-dom'
import { ArrowRight } from "lucide-react"
import heroImage from '@/assets/hero-image.jpg'

interface RestaurantDetails {
  restaurantName: string
  restaurantEmail: string
  restaurantPhoneNumber: string
  restaurantAddress: string
  image: File | null
}

interface RestaurantErrors {
  restaurantName?: string
  restaurantEmail?: string
  restaurantPhoneNumber?: string
  restaurantAddress?: string
  image?: string
}

export default function RestaurantOnboarding() {
  const [restaurantDetails, setRestaurantDetails] = useState<RestaurantDetails>({
    restaurantName: '',
    restaurantEmail: '',
    restaurantPhoneNumber: '',
    restaurantAddress: '',
    image: null
  })

  const [imagePreview, setImagePreview] = useState<string | null>(null)
  const [errors, setErrors] = useState<RestaurantErrors>({})
  const navigate = useNavigate()

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, files } = e.target
    
    if (type === 'file' && files && files[0]) {
      const file = files[0]
      setRestaurantDetails(prev => ({ ...prev, image: file }))
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

    Object.entries(restaurantDetails).forEach(([key, value]) => {
      if (key !== 'image' && !value?.trim()) {
        newErrors[key as keyof RestaurantErrors] = 'This field is required'
        isValid = false
      }
    })

    if (restaurantDetails.restaurantEmail && !/\S+@\S+\.\S+/.test(restaurantDetails.restaurantEmail)) {
      newErrors.restaurantEmail = 'Please enter a valid email'
      isValid = false
    }

    if (restaurantDetails.restaurantPhoneNumber && !/^\+?[\d\s-]{10,}$/.test(restaurantDetails.restaurantPhoneNumber)) {
      newErrors.restaurantPhoneNumber = 'Please enter a valid phone number'
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
      try {
        const formData = new FormData()
        formData.append('restaurantName', restaurantDetails.restaurantName)
        formData.append('restaurantEmail', restaurantDetails.restaurantEmail)
        formData.append('restaurantPhoneNumber', restaurantDetails.restaurantPhoneNumber)
        formData.append('restaurantAddress', restaurantDetails.restaurantAddress)
        
        if (restaurantDetails.image) {
          formData.append('image', restaurantDetails.image)
        }

        const response = await fetch('https://api-server.krontiva.africa/api:uEBBwbSs/delikaquickshipper_restaurants_table', {
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

        const result = await response.json()
        console.log('Restaurant creation response:', result)

        navigate('/dashboard')
      } catch (error) {
        console.error('Submission failed:', error)
        setErrors(prev => ({
          ...prev,
          image: error instanceof Error ? error.message : 'Failed to submit form'
        }))
      }
    }
  }

  return (
    <div className="flex min-h-screen">
      <div className="fixed top-0 left-0 w-1/2 h-screen flex items-center justify-center">
        <Card className="w-full max-w-md text-left mx-8">
          <CardHeader className="space-y-6">
            <div>
              <CardTitle className="text-2xl font-bold text-left">Restaurant Onboarding</CardTitle>
              <CardDescription className="text-left">Please enter your restaurant details below</CardDescription>
            </div>
          </CardHeader>
          <form onSubmit={handleSubmit}>
            <CardContent className="space-y-4 text-left">
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
                <Input
                  id="restaurantAddress"
                  name="restaurantAddress"
                  value={restaurantDetails.restaurantAddress}
                  onChange={handleChange}
                  placeholder="Enter restaurant location"
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
            </CardContent>
            <CardFooter className="flex flex-col gap-4">
              <Button type="submit" className="w-full bg-black text-white hover:bg-black/80">
                Submit
              </Button>
              <Button 
                type="button"
                variant="link" 
                onClick={() => navigate('/dashboard')}
                className="w-full"
              >
                Skip to Dashboard
              </Button>
            </CardFooter>
          </form>
        </Card>
      </div>

      {/* Right side - Hero Image */}
      <div className="fixed top-0 right-0 w-1/2 h-screen">
        <img 
          src={heroImage} 
          alt="Restaurant hero" 
          className="w-full h-full object-cover"
        />
      </div>
    </div>
  )
}

