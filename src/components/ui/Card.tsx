import { ReactNode } from 'react'

interface Props {

  children: ReactNode

  className?: string

}

export default function Card({

  children,

  className = ''

}: Props) {

  return (

    <div

      className={`
        bg-white
        border
        border-gray-100
        rounded-[28px]
        shadow-sm
        ${className}
      `}

    >

      {children}

    </div>

  )

}