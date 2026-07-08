interface Props {

  children: React.ReactNode

  className?: string

}

export default function FieldGroup({

  children,

  className = ''

}: Props) {

  return (

    <div
      className={`
        bg-slate-50
        border
        border-gray-200
        rounded-2xl
        p-5
        ${className}
      `}
    >

      {children}

    </div>

  )

}