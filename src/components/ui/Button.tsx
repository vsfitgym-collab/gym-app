import * as React from "react"
import { cn } from "@/lib/utils"
import { Loader2 } from "lucide-react"

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "default" | "outline" | "ghost" | "destructive" | "gradient"
  size?: "default" | "sm" | "lg" | "icon"
  loading?: boolean
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "default", size = "default", loading, children, disabled, ...props }, ref) => {
    const variants = {
      default: "bg-primary text-primary-foreground hover:bg-primary/90",
      outline: "border border-white/20 bg-transparent hover:bg-white/10",
      ghost: "hover:bg-white/10",
      destructive: "bg-destructive text-destructive-foreground hover:bg-destructive/90",
      gradient: "premium-gradient text-white hover:opacity-90",
    }

    const sizes = {
      default: "px-4 py-2 min-h-[44px]",
      sm: "px-3 py-1.5 text-sm min-h-[36px]",
      lg: "px-6 py-3 text-lg min-h-[52px]",
      icon: "p-2 min-h-[44px] min-w-[44px]",
    }

    return (
      <button
        className={cn(
          "inline-flex items-center justify-center rounded-lg font-medium transition-all duration-200 active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50",
          variants[variant],
          sizes[size],
          className,
        )}
        ref={ref}
        disabled={disabled || loading}
        {...props}
      >
        {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
        {children}
      </button>
    )
  },
)
Button.displayName = "Button"

export { Button }
