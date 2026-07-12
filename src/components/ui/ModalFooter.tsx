'use client'

import { ReactNode } from 'react'

interface Props {

  children: ReactNode

  className?: string

}

export default function ModalFooter({

  children,

  className = ''

}: Props) {

  return (

    <div
      className={`
        shrink-0

        border-t
        border-gray-100

        bg-white

        p-4 sm:p-6

        flex
        flex-col sm:flex-row
        justify-end
        gap-2 sm:gap-4

        ${className}
      `}
    >

      {children}

    </div>

  )

}