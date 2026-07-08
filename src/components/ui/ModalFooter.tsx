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

        p-6

        flex
        justify-end
        gap-4

        ${className}
      `}
    >

      {children}

    </div>

  )

}