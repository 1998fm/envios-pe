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
          border border-slate-200 dark:border-slate-600
          bg-gray-50 dark:bg-slate-700
          text-slate-900 dark:text-slate-100
          shadow-sm
          transition-all
          focus:outline-none
          focus:ring-2
          focus:ring-sky-500
          focus:border-sky-500
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