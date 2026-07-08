'use client'

import { ReactNode } from 'react'

interface Props {

  title: string

  subtitle?: string

  children: ReactNode

}

export default function Section({

  title,

  subtitle,

  children

}: Props) {

  return (

    <div
      className="
        space-y-5
      "
    >

      <div>

        <h3
          className="
            text-xl
            font-bold
            text-slate-900
          "
        >
          {title}
        </h3>

        {

          subtitle && (

            <p
              className="
                mt-1
                text-sm
                text-gray-500
              "
            >
              {subtitle}
            </p>

          )

        }

      </div>

      {children}

    </div>

  )

}