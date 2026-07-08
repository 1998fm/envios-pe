'use client'

import {
  forwardRef,
  SelectHTMLAttributes
} from 'react'

interface Props
  extends SelectHTMLAttributes<HTMLSelectElement> {}

const Select = forwardRef<HTMLSelectElement, Props>(
  ({ className = '', children, ...props }, ref) => {
    return (
      <select
        ref={ref}
        {...props}
        className={`
          w-full
          px-4
          py-3
          rounded-2xl
          border
          border-gray-200
          bg-gray-50
          text-slate-900
          shadow-sm
          transition-all
          focus:outline-none
          focus:ring-2
          focus:ring-cyan-500
          focus:border-cyan-500
          ${className}
        `}
      >
        {children}
      </select>
    )
  }
)

Select.displayName = 'Select'

export default Select