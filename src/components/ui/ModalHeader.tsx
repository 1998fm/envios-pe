'use client'

import { ReactNode } from 'react'

interface Props {

  title: string

  subtitle?: string

  children?: ReactNode

}

export default function ModalHeader({

  title,

  subtitle,

  children

}: Props) {

  return (

    <div
      className="
        shrink-0

        p-8

        border-b
        border-gray-100
      "
    >

      <h2
        className="
          text-4xl
          font-extrabold
          text-slate-900
        "
      >
        {title}
      </h2>

      {subtitle && (

        <p
          className="
            mt-2
            text-gray-500
          "
        >
          {subtitle}
        </p>

      )}

      {children}

    </div>

  )

}