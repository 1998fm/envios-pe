'use client'

import { ReactNode } from 'react'
import Card from './Card'

interface Props {

  open: boolean

  children: ReactNode

  maxWidth?: string

}

export default function Modal({

  open,

  children,

  maxWidth = 'max-w-xl'

}: Props) {

  if (!open) return null

  return (

    <div
      className="
        fixed
        inset-0
        bg-black/40
        flex
        items-center
        justify-center
        p-4
        z-50
      "
    >

      <Card
        className={`
          w-full
          ${maxWidth}
          max-h-[95vh]
          overflow-hidden
        `}
      >

        {children}

      </Card>

    </div>

  )

}