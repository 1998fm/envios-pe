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
        bg-white dark:bg-slate-800
        border border-slate-100 dark:border-slate-700
        rounded-[28px]
        shadow-sm dark:shadow-slate-900/50
        ${className}
      `}
    >

      {children}

    </div>

  )

}