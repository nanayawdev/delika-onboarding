import { AlertTriangle } from "lucide-react"
import { cn } from "@/lib/utils"

interface ErrorStateProps {
  message: string
  icon?: React.ReactNode
  className?: string
}

export function ErrorState({ message, icon = <AlertTriangle />, className }: ErrorStateProps) {
  return (
    <div className={cn("flex flex-col items-center justify-center p-8 text-center", className)}>
      <div className="text-red-500 mb-4">
        {icon}
      </div>
      <p className="text-sm text-gray-500 dark:text-gray-400">{message}</p>
    </div>
  )
} 