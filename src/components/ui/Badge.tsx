'use client'

import { ReactNode } from 'react'

interface Props {

  children: ReactNode

  color?:
    | 'gray'
    | 'blue'
    | 'green'
    | 'yellow'
    | 'red'
    | 'cyan'

}

const colors = {

  gray:
    'bg-gray-100 text-gray-700',

  blue:
    'bg-blue-50 text-blue-700',

  cyan:
    'bg-cyan-50 text-cyan-700',

  green:
    'bg-green-50 text-green-700',

  yellow:
    'bg-yellow-50 text-yellow-700',

  red:
    'bg-red-50 text-red-700',

}

export default function Badge({

  children,

  color = 'gray'

}: Props) {

  return (

    <span
      className={`
        inline-flex
        items-center
        justify-center
        px-3
        py-1.5
        rounded-full
        text-sm
        font-semibold
        ${colors[color]}
      `}
    >

      {children}

    </span>

  )

}