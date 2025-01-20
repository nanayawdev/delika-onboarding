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
import { Label } from "@/components/ui/label"
import { LoadingSpinner } from "@/components/ui/loading-spinner"
import { toast } from "sonner"

interface ResetPasswordModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
  email: string
}

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;
const RESET_PASSWORD_ENDPOINT = import.meta.env.VITE_RESET_PASSWORD_ENDPOINT;

export function ResetPasswordModal({
  isOpen,
  onClose,
  onSuccess,
  email
}: ResetPasswordModalProps) {
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [isResetting, setIsResetting] = useState(false)
  const [error, setError] = useState('')

  const handleReset = async () => {
    if (!password || !confirmPassword) {
      setError('Please fill in all fields')
      return
    }
    if (password !== confirmPassword) {
      setError('Passwords do not match')
      return
    }
    if (password.length < 6) {
      setError('Password must be at least 6 characters')
      return
    }

    setIsResetting(true)
    try {
      const response = await fetch(`${API_BASE_URL}${RESET_PASSWORD_ENDPOINT}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email,
          password
        })
      })

      if (response.ok) {
        toast.success('Password reset successfully')
        onSuccess()
      } else {
        throw new Error('Failed to reset password')
      }
    } catch (error) {
      console.error('Reset password failed:', error)
      toast.error('Failed to reset password. Please try again.')
    } finally {
      setIsResetting(false)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[400px]">
        <DialogHeader>
          <DialogTitle>Reset Password</DialogTitle>
          <DialogDescription>
            Enter your new password
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="password">New Password</Label>
            <Input
              id="password"
              type="password"
              value={password}
              onChange={(e) => {
                setPassword(e.target.value)
                setError('')
              }}
              placeholder="Enter new password"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="confirmPassword">Confirm Password</Label>
            <Input
              id="confirmPassword"
              type="password"
              value={confirmPassword}
              onChange={(e) => {
                setConfirmPassword(e.target.value)
                setError('')
              }}
              placeholder="Confirm new password"
            />
          </div>

          {error && <p className="text-sm text-red-500">{error}</p>}
          
          <Button 
            onClick={handleReset} 
            className="w-full bg-black hover:bg-black/80 text-white"
            disabled={isResetting}
          >
            {isResetting ? (
              <>
                <LoadingSpinner className="mr-2" />
                Resetting...
              </>
            ) : (
              'Reset Password'
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
} 