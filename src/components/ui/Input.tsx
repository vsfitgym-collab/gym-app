import type { InputHTMLAttributes } from 'react'
import { forwardRef } from 'react'
import './Input.css'

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string
  error?: string
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className = '', label, error, ...props }, ref) => {
    return (
      <div className={`input-wrapper ${className}`}>
        {label && <label className="input-label">{label}</label>}
        <input
          ref={ref}
          className={`input-field ${error ? 'input-error' : ''}`}
          {...props}
        />
        {error && <span className="input-error-text">{error}</span>}
      </div>
    )
  }
)

Input.displayName = 'Input'
