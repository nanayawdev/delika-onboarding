'use client'

import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card"
import { OTPVerificationModal } from './otp-verification-modal'
import { toast } from "sonner"
import { Sonner } from "@/components/ui/sonner"

interface SignInDetails {
  email: string
  password: string
}

interface SignInResponse {
  authToken: string
  delika_onboarding_id: string
}

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;
const SIGN_IN_ENDPOINT = import.meta.env.VITE_SIGN_IN_ENDPOINT;
const SEND_OTP_ENDPOINT = import.meta.env.VITE_SEND_OTP_ENDPOINT;

export default function SignIn() {
  const navigate = useNavigate()
  const [signInDetails, setSignInDetails] = useState<SignInDetails>({
    email: '',
    password: '',
  })
  const [errors, setErrors] = useState<Partial<SignInDetails>>({})
  const [isLoading, setIsLoading] = useState(false)
  const [showOTPModal, setShowOTPModal] = useState(false)
  const [tempAuthData, setTempAuthData] = useState<SignInResponse | null>(null)

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setSignInDetails(prev => ({ ...prev, [name]: value }))
    if (errors[name as keyof SignInDetails]) {
      setErrors(prev => ({ ...prev, [name]: '' }))
    }
  }

  const validateForm = (): boolean => {
    const newErrors: Partial<SignInDetails> = {}
    let isValid = true

    if (!signInDetails.email.trim()) {
      newErrors.email = 'Email is required'
      isValid = false
    } else if (!/\S+@\S+\.\S+/.test(signInDetails.email)) {
      newErrors.email = 'Please enter a valid email'
      isValid = false
    }

    if (!signInDetails.password.trim()) {
      newErrors.password = 'Password is required'
      isValid = false
    }

    setErrors(newErrors)
    return isValid
  }

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (validateForm()) {
      setIsLoading(true)
      try {
        const response = await fetch(`${API_BASE_URL}${SIGN_IN_ENDPOINT}`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(signInDetails)
        })

        const data: SignInResponse = await response.json()

        if (response.ok && data.authToken) {
          setTempAuthData(data)
          // Generate and send OTP
          const otpResponse = await fetch(`${API_BASE_URL}${SEND_OTP_ENDPOINT}`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              email: signInDetails.email
            })
          })

          if (otpResponse.ok) {
            setShowOTPModal(true)
          } else {
            throw new Error('Failed to send OTP')
          }
        } else {
          setErrors(prev => ({
            ...prev,
            email: 'Invalid email or password'
          }))
        }
      } catch (error) {
        console.error('Sign in failed:', error)
        toast.error('An error occurred during sign in')
      } finally {
        setIsLoading(false)
      }
    }
  }

  const handleOTPSuccess = () => {
    if (tempAuthData) {
      // Store auth data and navigate
      localStorage.setItem('authToken', tempAuthData.authToken)
      localStorage.setItem('delikaOnboardingId', tempAuthData.delika_onboarding_id)
      
      // Use requestAnimationFrame to handle state updates
      requestAnimationFrame(() => {
        setShowOTPModal(false)
        toast.success('Successfully logged in!')
        
        // Navigate after a brief delay
        setTimeout(() => {
          navigate('/restaurant-onboarding')
        }, 1000)
      })
    }
  }

  return (
    <div className="flex min-h-screen bg-gray-100">
      <div className="w-full flex items-center justify-center">
        <Card className="w-full max-w-md text-left mx-4">
          <CardHeader>
            <CardTitle className="text-2xl font-bold text-left">Sign In</CardTitle>
            <CardDescription className="text-left">Sign in to access restaurant onboarding</CardDescription>
          </CardHeader>
          <form onSubmit={handleSubmit}>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  value={signInDetails.email}
                  onChange={handleChange}
                  placeholder="Enter your email"
                />
                {errors.email && <p className="text-sm text-red-500">{errors.email}</p>}
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  name="password"
                  type="password"
                  value={signInDetails.password}
                  onChange={handleChange}
                  placeholder="Enter your password"
                />
                {errors.password && <p className="text-sm text-red-500">{errors.password}</p>}
              </div>
            </CardContent>
            <CardFooter className="flex flex-col space-y-4">
              <Button 
                type="submit" 
                className="w-full bg-black text-white hover:bg-black/80"
                disabled={isLoading}
              >
                {isLoading ? 'Signing in...' : 'Sign In'}
              </Button>
            </CardFooter>
          </form>
        </Card>
      </div>

      <OTPVerificationModal
        isOpen={showOTPModal}
        onClose={() => setShowOTPModal(false)}
        onSuccess={handleOTPSuccess}
        email={signInDetails.email}
      />
      <Sonner position="top-right" />
    </div>
  )
} 