'use client'

import { motion } from "framer-motion"
import { Button } from "@/components/ui/button"
import { LogOut } from "lucide-react"

interface SignOutWarningModalProps {
  isOpen: boolean
  onClose: () => void
  onConfirm: () => void
}

export function SignOutWarningModal({
  isOpen,
  onClose,
  onConfirm,
}: SignOutWarningModalProps) {
  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center">
      <motion.div
        initial={{ y: 50, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: 100, opacity: 0 }}
        transition={{ 
          type: "spring", 
          damping: 20, 
          stiffness: 300,
          opacity: { duration: 0.2 } 
        }}
        className="w-full max-w-sm bg-white dark:bg-gray-800 rounded-lg shadow-lg mx-4"
      >
        <div className="p-4">
          <div className="flex items-center gap-2 text-gray-900 dark:text-gray-100 mb-2">
            <LogOut className="h-5 w-5" />
            <h2 className="text-base font-semibold">Sign Out</h2>
          </div>
          <p className="text-sm text-gray-600 dark:text-gray-300 mb-4">
            Are you sure you want to sign out? You will need to sign in again to access the dashboard.
          </p>
          
          <div className="flex gap-2 justify-end">
            <Button
              variant="outline"
              size="sm"
              onClick={onClose}
              className="px-3"
            >
              Cancel
            </Button>
            <Button
              variant="default"
              size="sm"
              onClick={onConfirm}
              className="px-3 bg-red-500 hover:bg-red-600 text-white"
            >
              Sign Out
            </Button>
          </div>
        </div>
      </motion.div>
    </div>
  )
} 