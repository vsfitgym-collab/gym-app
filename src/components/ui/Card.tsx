import type { HTMLAttributes, ReactNode } from 'react'
import { forwardRef } from 'react'

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode
  padding?: 'none' | 'sm' | 'md' | 'lg'
}

export const Card = forwardRef<HTMLDivElement, CardProps>(
  ({ className = '', children, padding = 'md', ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={`card card-padding-${padding} ${className}`}
        {...props}
      >
        {children}
      </div>
    )
  }
)

Card.displayName = 'Card'
