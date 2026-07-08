'use client'

interface Props {

  title: string

  subtitle?: string

  actions?: React.ReactNode

}

export default function PageHeader({

  title,

  subtitle,

  actions

}: Props) {

  return (

    <div
      className="
        flex
        justify-between
        items-start
        gap-6
        mb-8
        flex-wrap
      "
    >

      <div>

        <h1
          className="
            text-4xl
            font-extrabold
            text-slate-900
            tracking-tight
          "
        >
          {title}
        </h1>

        {

          subtitle && (

            <p
              className="
                mt-2
                text-gray-500
                text-lg
              "
            >
              {subtitle}
            </p>

          )

        }

      </div>

      {actions}

    </div>

  )

}