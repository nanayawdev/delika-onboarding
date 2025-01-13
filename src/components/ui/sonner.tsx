"use client"

import { Toaster } from "sonner"

export function Sonner() {
  return (
    <Toaster 
      position="top-center"
      toastOptions={{
        style: {
          background: 'white',
          border: '1px solid #E2E8F0',
          borderRadius: '0.5rem',
          boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
        },
      }}
    />
  )
}
