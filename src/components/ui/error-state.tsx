import { Button } from "@/components/ui/button"
import { ArrowLeft, RefreshCcw } from "lucide-react"
import { LucideIcon } from "lucide-react"

interface ErrorStateProps {
  title: string
  description: string
  icon?: LucideIcon
  primaryAction?: {
    label: string
    onClick: () => void
    icon?: LucideIcon
  }
  secondaryAction?: {
    label: string
    onClick: () => void
    icon?: LucideIcon
  }
  className?: string
}

export function ErrorState({
  title,
  description,
  icon: Icon,
  primaryAction,
  secondaryAction,
  className = ""
}: ErrorStateProps) {
  return (
    <div className={`text-center py-12 px-4 ${className}`}>
      <div className="bg-gray-50 rounded-lg p-8 max-w-md mx-auto">
        {Icon && <Icon className="h-12 w-12 text-red-400 mx-auto mb-4" />}
        <h3 className="text-lg font-medium text-gray-900 mb-2">{title}</h3>
        <p className="text-gray-500 mb-6">{description}</p>
        <div className="space-y-3">
          {primaryAction && (
            <Button 
              onClick={primaryAction.onClick} 
              variant="outline" 
              className="w-full gap-2 border-red-200 text-red-600 hover:bg-red-50 hover:text-red-700"
            >
              {primaryAction.icon && <primaryAction.icon className="h-4 w-4" />}
              {primaryAction.label}
            </Button>
          )}
          {secondaryAction && (
            <Button 
              onClick={secondaryAction.onClick}
              variant="ghost" 
              className="w-full gap-2 text-gray-600 hover:bg-gray-50"
            >
              {secondaryAction.icon && <secondaryAction.icon className="h-4 w-4" />}
              {secondaryAction.label}
            </Button>
          )}
        </div>
      </div>
    </div>
  )
} 