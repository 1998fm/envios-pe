interface FieldProps {

  label: string

  children: React.ReactNode

  className?: string

}

export default function Field({

  label,

  children,

  className = ''

}: FieldProps) {

  return (

    <div className={className}>

      <label
        className="
          block
          text-sm
          font-semibold
          text-gray-700
          mb-3
        "
      >
        {label}
      </label>

      {children}

    </div>

  )

}