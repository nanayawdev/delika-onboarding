import { Link, useNavigate } from 'react-router-dom'
import { Button } from "@/components/ui/button"
import logo from '@/assets/logo.png'
import { toast } from 'sonner'
import { useState, useEffect } from 'react'
import { SignOutWarningModal } from '../dashboard/sign-out-warning-modal'

export function Navbar() {
  const navigate = useNavigate()
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const [isSignOutModalOpen, setIsSignOutModalOpen] = useState(false)

  useEffect(() => {
    const authToken = localStorage.getItem('authToken')
    setIsLoggedIn(!!authToken)
  }, [])

  const handleProtectedNavigation = (path: string, itemName: string) => {
    if (!isLoggedIn) {
      toast.error(`Please sign in to access ${itemName}.`)
      navigate('/signin')
    } else {
      navigate(path)
    }
  }

  const handleSignOut = () => {
    localStorage.removeItem('authToken')
    localStorage.removeItem('delikaOnboardingId')
    setIsLoggedIn(false)
    navigate('/')
    toast.success('You have been signed out.')
    setIsSignOutModalOpen(false)
  }

  return (
    <>
      <nav className="fixed top-4 left-1/2 -translate-x-1/2 w-[90%] max-w-3xl bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-full z-40">
        <div className="px-2 sm:px-4">
          <div className="flex justify-between items-center h-14">
            {/* Logo/Home */}
            <Link to="/" className="flex items-center pl-4">
              <img src={logo} alt="Delika Logo" className="h-8 w-auto" />
              <span className="text-xl font-bold text-[#f24d1d]">Delika</span>
            </Link>

            {/* Navigation Links */}
            <div className="flex items-center gap-2">
              <Button 
                onClick={() => handleProtectedNavigation('/overview', 'Overview')} 
                variant="ghost" 
                className="text-black dark:text-white hover:text-[#f24d1d]"
              >
                Overview
              </Button>
              <Button 
                onClick={() => handleProtectedNavigation('/dashboard', 'Restaurant Dashboard')} 
                className="text-black dark:text-white hover:text-[#f24d1d] p-2 shadow-none"
              >
                Restaurants
              </Button>
              <Button 
                onClick={() => handleProtectedNavigation('/broadcast', 'Broadcast')} 
                variant="ghost" 
                className="text-black dark:text-white hover:text-[#f24d1d]"
              >
                Broadcast
              </Button>
              {isLoggedIn ? (
                <Button 
                  onClick={() => setIsSignOutModalOpen(true)} 
                  className="bg-black dark:bg-gray-100 text-white dark:text-black hover:bg-[#f24d1d] dark:hover:bg-gray-200 rounded-full px-6 py-2"
                >
                  Sign Out
                </Button>
              ) : (
                <Link to="/signin" className="pr-[0.5px]">
                  <Button className="bg-[#f24d1d] dark:bg-gray-100 text-white dark:text-black hover:bg-gray-800 dark:hover:bg-gray-200 rounded-full px-6 py-2">
                    Login
                  </Button>
                </Link>
              )}
            </div>
          </div>
        </div>
      </nav>

      {/* Sign Out Modal */}
      <SignOutWarningModal 
        isOpen={isSignOutModalOpen}
        onClose={() => setIsSignOutModalOpen(false)}
        onConfirm={handleSignOut}
      />
    </>
  )
} 