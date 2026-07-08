'use client'

import { ReactNode } from 'react'

interface Props {

  title: string

  value: ReactNode

  color?:
    | 'slate'
    | 'cyan'
    | 'green'
    | 'yellow'
    | 'red'

}

const colors = {

  slate: 'text-slate-900',

  cyan: 'text-cyan-700',

  green: 'text-green-700',

  yellow: 'text-amber-600',

  red: 'text-red-600',

}

export default function StatCard({

  title,

  value,

  color = 'slate'

}: Props) {

  return (

    <div
      className="
        bg-white
        border
        border-gray-100
        rounded-[28px]
        p-6
        shadow-sm
      "
    >

      <div
        className="
          text-sm
          text-gray-500
          font-medium
        "
      >
        {title}
      </div>

      <div
        className={`
          mt-3
          text-4xl
          font-extrabold
          ${colors[color]}
        `}
      >
        {value}
      </div>

    </div>

  )

}