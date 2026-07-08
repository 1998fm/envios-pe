'use client'

import { ReactNode } from 'react'

interface Props {

  children: ReactNode

  className?: string

}

export default function ModalBody({

  children,

  className = ''

}: Props) {

  return (

    <div
      className={`
        flex-1
        overflow-y-auto

        p-8

        ${className}
      `}
    >

      {children}

    </div>

  )

}
