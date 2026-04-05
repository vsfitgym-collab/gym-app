import type { ButtonHTMLAttributes } from 'react'
import { forwardRef, useState } from 'react'
import './Button.css'

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'danger'
  size?: 'sm' | 'md' | 'lg'
  loading?: boolean
  fullWidth?: boolean
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className = '', variant = 'primary', size = 'md', loading, fullWidth, children, disabled, onClick, ...props }, ref) => {
    const [ripples, setRipples] = useState<{ x: number; y: number; id: number }[]>([])

    const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
      if (disabled || loading) return
      
      const rect = e.currentTarget.getBoundingClientRect()
      const x = e.clientX - rect.left
      const y = e.clientY - rect.top
      const newRipple = { x, y, id: Date.now() }
      setRipples(prev => [...prev, newRipple])
      
      setTimeout(() => {
        setRipples(prev => prev.filter(r => r.id !== newRipple.id))
      }, 600)

      onClick?.(e)
    }

    return (
      <button
        ref={ref}
        className={`btn btn-${variant} btn-${size} ${fullWidth ? 'btn-full' : ''} ${loading ? 'btn-loading' : ''} ${className}`}
        disabled={disabled || loading}
        onClick={handleClick}
        {...props}
      >
        {loading && <span className="btn-spinner" />}
        {children}
        {ripples.map(ripple => (
          <span 
            key={ripple.id} 
            className="ripple" 
            style={{ left: ripple.x, top: ripple.y }}
          />
        ))}
      </button>
    )
  }
)

Button.displayName = 'Button'

export default Button
