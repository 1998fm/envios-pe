interface Props {

  children: React.ReactNode

  onClick?: () => void

  type?: 'primary' | 'secondary' | 'danger'

  disabled?: boolean

  className?: string

}

export default function Button({

  children,

  onClick,

  type = 'primary',

  disabled = false,

  className = ''

}: Props) {

  const estilos = {

    primary: `
      bg-gradient-to-r
      from-cyan-600
      to-blue-600
      text-white
      hover:shadow-md
      hover:-translate-y-0.5
    `,

    secondary: `
      bg-white dark:bg-slate-700
      border border-slate-200 dark:border-slate-600
      text-slate-700 dark:text-slate-300
      hover:bg-slate-50 dark:hover:bg-slate-600
      hover:border-sky-500
      hover:text-sky-700 dark:hover:text-sky-400
    `,

    danger: `
      bg-red-600
      text-white
      hover:bg-red-700
    `

  }

  return (

    <button

      onClick={onClick}

      disabled={disabled}

      className={`
        px-6
        py-3
        rounded-2xl
        font-semibold
        transition-all
        duration-200
        disabled:opacity-50
        disabled:cursor-not-allowed

        ${estilos[type]}

        ${className}
      `}
    >

      {children}

    </button>

  )

}