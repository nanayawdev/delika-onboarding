'use client'

import { motion } from "framer-motion"
import { Button } from "@/components/ui/button"
import { AlertTriangle } from "lucide-react"

interface DeleteWarningModalProps {
  isOpen: boolean
  onClose: () => void
  onConfirm: () => void
  title: string
  description: string
}

export function DeleteWarningModal({
  isOpen,
  onClose,
  onConfirm,
  title,
  description
}: DeleteWarningModalProps) {
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
        className="w-full max-w-sm bg-white rounded-lg shadow-lg mx-4"
      >
        <div className="p-4">
          <div className="flex items-center gap-2 text-red-600 mb-2">
            <AlertTriangle className="h-5 w-5" />
            <h2 className="text-base font-semibold">{title}</h2>
          </div>
          <p className="text-sm text-gray-600 mb-4">{description}</p>
          
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
              variant="destructive"
              size="sm"
              onClick={onConfirm}
              className="px-3 bg-red-600 hover:bg-red-700 text-white"
            >
              Delete
            </Button>
          </div>
        </div>
      </motion.div>
    </div>
  )
} 