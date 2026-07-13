'use client'

import { useState } from 'react'

type Props = {
  className?: string
  size?: number
}

export default function LogoTori({ className, size = 40 }: Props) {
  const [imgError, setImgError] = useState(false)

  if (imgError) {
    return (
      <svg
        width={size}
        height={size}
        viewBox="0 0 40 40"
        fill="none"
        className={className}
        aria-label="Tori"
      >
        <path d="M10,12 L4,4 L15,8 Z" className="fill-sky-500 " />
        <path d="M30,12 L36,4 L25,8 Z" className="fill-sky-500 " />
        <rect x="9" y="10" width="22" height="15" rx="5" className="fill-indigo-500 " />
        <path d="M11,16 L17,14 L18,17 L12,19 Z" className="fill-slate-900 " />
        <path d="M29,16 L23,14 L22,17 L28,19 Z" className="fill-slate-900 " />
        <circle cx="14.5" cy="19" r="1" className="fill-white" />
        <circle cx="25.5" cy="19" r="1" className="fill-white" />
        <circle cx="14.5" cy="19" r="0.6" className="fill-slate-900 " />
        <circle cx="25.5" cy="19" r="0.6" className="fill-slate-900 " />
        <rect x="13" y="19" width="14" height="6" rx="2.5" className="fill-white/80 " />
        <ellipse cx="20" cy="19.5" rx="3" ry="1.5" className="fill-slate-900 " />
        <path d="M12,25 h16 l-2,4 h-12 z" className="fill-white/80 " />
        <rect x="10" y="28" width="20" height="3" rx="1.5" className="fill-sky-600 " />
        <circle cx="20" cy="32" r="3" className="fill-amber-400 " />
        <circle cx="20" cy="32" r="1.2" className="fill-amber-600 " />
      </svg>
    )
  }

  return (
    <img
      src="/images/tori/tori-logo.webp"
      alt="Tori"
      width={size}
      height={size}
      onError={() => setImgError(true)}
      className={`object-contain ${className || ''}`}
    />
  )
}
