'use client'

import {
  forwardRef,
  InputHTMLAttributes
} from 'react'

interface Props
  extends InputHTMLAttributes<HTMLInputElement> {}

const Input = forwardRef<HTMLInputElement, Props>(
  ({ className = '', ...props }, ref) => {
    return (
      <input
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
          placeholder:text-gray-400
          shadow-sm
          transition-all
          focus:outline-none
          focus:ring-2
          focus:ring-cyan-500
          focus:border-cyan-500
          ${className}
        `}
      />
    )
  }
)

Input.displayName = 'Input'

export default Input