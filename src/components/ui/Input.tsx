import { forwardRef } from 'react'
import { cn } from '@/lib/utils'

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string
  error?: string
  leftIcon?: React.ReactNode
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className, label, error, leftIcon, ...props }, ref) => {
    return (
      <div className="flex flex-col gap-1.5">
        {label && (
          <label className="text-sm font-medium text-[#2D2D2D]">{label}</label>
        )}
        <div className="relative">
          {leftIcon && (
            <div className="absolute left-3 top-1/2 -translate-y-1/2 text-[#8A8A8A]">
              {leftIcon}
            </div>
          )}
          <input
            ref={ref}
            className={cn(
              'w-full rounded-xl border border-[#E8E4DE] bg-white px-4 py-2.5 text-sm text-[#2D2D2D]',
              'placeholder:text-[#B0A8A0]',
              'focus:outline-none focus:ring-2 focus:ring-[#A0856C]/40 focus:border-[#A0856C]',
              'transition-all duration-150',
              leftIcon && 'pl-10',
              error && 'border-red-400 focus:ring-red-300/40 focus:border-red-400',
              className
            )}
            {...props}
          />
        </div>
        {error && (
          <p className="text-xs text-red-500">{error}</p>
        )}
      </div>
    )
  }
)

Input.displayName = 'Input'
