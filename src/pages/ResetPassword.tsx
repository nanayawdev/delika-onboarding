'use client'

import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card"
import { OTPVerificationModal } from '@/components/signin/otp-verification-modal'
import { ResetPasswordModal } from '@/components/signin/reset-password-modal'
import { toast } from "sonner"
import { Sonner } from "@/components/ui/sonner"

interface ResetPasswordDetails {
  email: string
}

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;
const SEND_OTP_ENDPOINT = import.meta.env.VITE_SEND_OTP_ENDPOINT;

export default function ResetPassword() {
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [showOTPModal, setShowOTPModal] = useState(false)
  const [showResetModal, setShowResetModal] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (!email) {
      setError('Email is required')
      return
    }
    if (!/\S+@\S+\.\S+/.test(email)) {
      setError('Please enter a valid email')
      return
    }

    setIsLoading(true)
    try {
      const response = await fetch(`${API_BASE_URL}${SEND_OTP_ENDPOINT}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email })
      })

      if (response.ok) {
        toast.success('OTP sent to your email')
        setShowOTPModal(true)
      } else {
        throw new Error('Failed to send OTP')
      }
    } catch (error) {
      console.error('Reset password failed:', error)
      toast.error('Failed to send OTP. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  const handleOTPSuccess = () => {
    setShowOTPModal(false)
    setShowResetModal(true)
  }

  const handleResetSuccess = () => {
    toast.success('Password reset successfully')
    setTimeout(() => {
      navigate('/signin')
    }, 1000)
  }

  return (
    <div className="flex min-h-screen bg-gray-100">
      <div className="w-full flex items-center justify-center">
        <Card className="w-full max-w-md text-left mx-4">
          <CardHeader>
            <CardTitle className="text-2xl font-bold text-left">Reset Password</CardTitle>
            <CardDescription className="text-left">
              Enter your email to receive a verification code
            </CardDescription>
          </CardHeader>
          <form onSubmit={handleSubmit}>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value)
                    setError('')
                  }}
                  placeholder="Enter your email"
                />
                {error && <p className="text-sm text-red-500">{error}</p>}
              </div>
            </CardContent>
            <CardFooter className="flex flex-col space-y-4">
              <Button 
                type="submit" 
                className="w-full bg-black text-white hover:bg-black/80"
                disabled={isLoading}
              >
                {isLoading ? 'Sending...' : 'Send Reset Code'}
              </Button>
              <Button 
                type="button" 
                variant="link"
                onClick={() => navigate('/signin')}
                className="w-full"
              >
                Back to Sign In
              </Button>
            </CardFooter>
          </form>
        </Card>
      </div>

      <OTPVerificationModal
        isOpen={showOTPModal}
        onClose={() => setShowOTPModal(false)}
        onSuccess={handleOTPSuccess}
        email={email}
      />

      <ResetPasswordModal
        isOpen={showResetModal}
        onClose={() => setShowResetModal(false)}
        onSuccess={handleResetSuccess}
        email={email}
      />
      
      <Sonner position="top-right" />
    </div>
  )
} 