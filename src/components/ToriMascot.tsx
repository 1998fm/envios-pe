'use client'

import { motion } from 'framer-motion'
import { useState } from 'react'
import LogoTori from './LogoTori'

export type ToriVariant = 'logo' | 'happy' | 'guide' | 'empty' | 'loading' | 'error' | 'notfound' | 'onboard'

type Props = {
  variant?: ToriVariant
  size?: number
  animate?: boolean
  className?: string
}

const motionConfig: Record<ToriVariant, { animate: Record<string, any>; transition?: Record<string, any> }> = {
  logo: {
    animate: { rotate: [0, -3, 3, -3, 0] },
    transition: { duration: 3, repeat: Infinity, repeatDelay: 5, ease: 'easeInOut' },
  },
  happy: {
    animate: { y: [0, -8, 0] },
    transition: { duration: 0.8, repeat: Infinity, ease: 'easeInOut' },
  },
  guide: {
    animate: { y: [0, -4, 0] },
    transition: { duration: 2, repeat: Infinity, ease: 'easeInOut' },
  },
  empty: {
    animate: { rotate: [-4, 4, -4] },
    transition: { duration: 2, repeat: Infinity, ease: 'easeInOut' },
  },
  loading: {
    animate: { y: [0, -14, 0], scale: [1, 1.05, 1] },
    transition: { duration: 0.5, repeat: Infinity, ease: 'easeInOut' },
  },
  error: {
    animate: { x: [0, -4, 4, -4, 4, 0] },
    transition: { duration: 0.5, ease: 'easeInOut' },
  },
  notfound: {
    animate: { rotate: [-6, 6, -6] },
    transition: { duration: 3, repeat: Infinity, ease: 'easeInOut' },
  },
  onboard: {
    animate: { scale: [1, 1.1, 1] },
    transition: { duration: 1.2, repeat: Infinity, ease: 'easeInOut' },
  },
}

export default function ToriMascot({ variant = 'logo', size = 40, animate = true, className = '' }: Props) {
  const [imgError, setImgError] = useState(false)

  const imgSrc = `/images/tori/tori-${variant}.webp`
  const config = motionConfig[variant]

  return (
    <motion.div
      className={`inline-flex items-center justify-center ${className}`}
      {...(animate ? config : {})}
    >
      {imgError ? (
        <LogoTori size={size} />
      ) : (
        <img
          src={imgSrc}
          alt=""
          width={size}
          height={size}
          onError={() => setImgError(true)}
          className="object-contain"
        />
      )}
    </motion.div>
  )
}
