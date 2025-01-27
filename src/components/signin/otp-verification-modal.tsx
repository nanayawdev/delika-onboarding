import { useState } from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { LoadingSpinner } from "@/components/ui/loading-spinner"
import { toast } from "sonner"
import { Sonner } from "@/components/ui/sonner"

interface OTPVerificationModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
  email: string
}

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;
const VERIFY_OTP_ENDPOINT = import.meta.env.VITE_VERIFY_OTP_ENDPOINT;
const AUTH_ME_ENDPOINT = import.meta.env.VITE_AUTH_ME_ENDPOINT;

export function OTPVerificationModal({
  isOpen,
  onClose,
  onSuccess,
  email
}: OTPVerificationModalProps) {
  const [otp, setOtp] = useState('')
  const [isVerifying, setIsVerifying] = useState(false)

  const handleVerifyOTP = async () => {
    if (!otp) {
      toast.error('Please enter the OTP code')
      return
    }

    setIsVerifying(true)
    try {
      const authToken = localStorage.getItem('authToken');
      if (!authToken) {
        throw new Error('No auth token found');
      }

      // Verify OTP using GET request
      const response = await fetch(
        `${API_BASE_URL}${VERIFY_OTP_ENDPOINT}?email=${encodeURIComponent(email)}&otp=${encodeURIComponent(otp)}`, 
        {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${authToken}`
          }
        }
      )

      const data = await response.json()
      console.log('OTP verification response:', data)

      if (response.ok && data.otpValidate === 'otpFound') {
        // Call auth/me endpoint to get user details
        const authMeResponse = await fetch(`${API_BASE_URL}${AUTH_ME_ENDPOINT}`, {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${authToken}`
          }
        });

        if (!authMeResponse.ok) {
          throw new Error('Failed to get user details');
        }

        const userData = await authMeResponse.json();
        console.log('Auth/me response:', userData);

        // Store user data in localStorage if needed
        localStorage.setItem('userData', JSON.stringify(userData));

        toast.success('OTP verified successfully')
        // Use Promise to handle the delay
        await new Promise(resolve => setTimeout(resolve, 1000))
        onSuccess()
      } else {
        toast.error('Invalid OTP code. Please try again.')
      }
    } catch (error) {
      console.error('Error verifying OTP:', error)
      toast.error('Failed to verify OTP. Please try again.')
    } finally {
      setIsVerifying(false)
    }
  }

  return (
    <>
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="sm:max-w-[400px]">
          <DialogHeader>
            <DialogTitle>Enter Verification Code</DialogTitle>
            <DialogDescription>
              Please enter the verification code sent to your email
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <Input
              placeholder="Enter OTP code"
              value={otp}
              onChange={(e) => setOtp(e.target.value)}
              className="text-center text-lg tracking-widest"
              maxLength={6}
            />
            
            <Button 
              onClick={handleVerifyOTP} 
              className="w-full bg-black hover:bg-black/80 text-white"
              disabled={isVerifying}
            >
              {isVerifying ? (
                <>
                  <LoadingSpinner className="mr-2" />
                  Verifying...
                </>
              ) : (
                'Verify OTP'
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
      <Sonner />
    </>
  )
} 