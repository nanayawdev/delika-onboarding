import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card"
import { OTPVerificationModal } from './otp-verification-modal'
import { toast } from "sonner"
import { Sonner } from "@/components/ui/sonner"
import { Eye, EyeOff } from "lucide-react"

interface SignInDetails {
  email: string
  password: string
}

interface SignInResponse {
  authToken: string
  delika_onboarding_id: string
}

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
  const [showPassword, setShowPassword] = useState(false)

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
        const signInUrl = 'https://api-server.krontiva.africa/api:uEBBwbSs/delika/onboarding/login';
        console.log('Attempting to sign in with URL:', signInUrl);
        
        const response = await fetch(signInUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(signInDetails)
        })

        if (!response.ok) {
          const contentType = response.headers.get("content-type");
          if (contentType && contentType.includes("application/json")) {
            const errorData = await response.json();
            console.error('Sign in failed with status:', response.status);
            console.error('Error details:', errorData);
            throw new Error(`Sign in failed: ${response.status} ${errorData?.message || ''}`);
          } else {
            const textError = await response.text();
            console.error('Non-JSON error response:', textError);
            throw new Error(`Sign in failed: ${response.status} - Invalid API endpoint`);
          }
        }

        const data: SignInResponse = await response.json()

        if (data.authToken) {
          setTempAuthData(data)
          // Generate and send OTP
          const otpUrl = `${import.meta.env.VITE_API_BASE_URL}${import.meta.env.VITE_SEND_OTP_ENDPOINT}`;
          console.log('Sending OTP to URL:', otpUrl);
          
          const otpResponse = await fetch(otpUrl, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              email: signInDetails.email
            })
          })

          if (!otpResponse.ok) {
            const contentType = otpResponse.headers.get("content-type");
            if (contentType && contentType.includes("application/json")) {
              const otpErrorData = await otpResponse.json();
              console.error('OTP request failed with status:', otpResponse.status);
              console.error('OTP error details:', otpErrorData);
              throw new Error(`Failed to send OTP: ${otpErrorData?.message || ''}`);
            } else {
              const textError = await otpResponse.text();
              console.error('Non-JSON error response from OTP endpoint:', textError);
              throw new Error(`Failed to send OTP: Invalid API endpoint`);
            }
          }

          setShowOTPModal(true)
        } else {
          setErrors(prev => ({
            ...prev,
            email: 'Invalid email or password'
          }))
        }
      } catch (error) {
        console.error('Full error:', error);
        toast.error(error instanceof Error ? error.message : 'An error occurred during sign in')
      } finally {
        setIsLoading(false)
      }
    }
  }

  const handleOTPSuccess = () => {
    if (tempAuthData) {
      // Store auth data
      localStorage.setItem('authToken', tempAuthData.authToken)
      localStorage.setItem('delikaOnboardingId', tempAuthData.delika_onboarding_id)
      
      // Dispatch a custom event to notify navbar of auth state change
      window.dispatchEvent(new Event('authStateChange'))
      
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
                <div className="relative">
                  <Input
                    id="password"
                    name="password"
                    type={showPassword ? "text" : "password"}
                    value={signInDetails.password}
                    onChange={handleChange}
                    placeholder="Enter your password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                  >
                    {showPassword ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </button>
                </div>
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
              <Button
                type="button"
                variant="link"
                onClick={() => navigate('/reset-password')}
                className="text-sm text-gray-600 hover:text-black"
              >
                Forgot Password?
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
      <Sonner />
    </div>
  )
} 