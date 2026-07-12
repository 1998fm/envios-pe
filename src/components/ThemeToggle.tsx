'use client'

import { useCallback } from 'react'
import { useSyncExternalStore } from 'react'
import { motion } from 'framer-motion'
import { Sun, Moon } from 'lucide-react'

function getSnapshot() {
  return document.documentElement.classList.contains('dark')
}

function getServerSnapshot() {
  return false
}

function subscribe(callback: () => void) {
  const observer = new MutationObserver(callback)
  observer.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] })
  return () => observer.disconnect()
}

export default function ThemeToggle() {
  const dark = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot)

  const toggle = useCallback(() => {
    const next = !dark
    document.documentElement.classList.toggle('dark', next)
    try {
      localStorage.setItem('theme', next ? 'dark' : 'light')
    } catch {}
  }, [dark])

  return (
    <motion.button
      type="button"
      onClick={toggle}
      whileTap={{ scale: 0.9 }}
      className="
        absolute top-4 right-4 z-10
        w-9 h-9 flex items-center justify-center
        rounded-full
        bg-white/80 dark:bg-slate-800/80
        border border-slate-200 dark:border-slate-700
        text-slate-500 dark:text-slate-400
        hover:text-slate-700 dark:hover:text-slate-200
        hover:border-slate-300 dark:hover:border-slate-600
        shadow-sm transition-colors backdrop-blur-sm
        cursor-pointer
      "
      aria-label={dark ? 'Activar modo claro' : 'Activar modo oscuro'}
    >
      <motion.div
        key={dark ? 'moon' : 'sun'}
        initial={{ rotate: -90, opacity: 0, scale: 0.5 }}
        animate={{ rotate: 0, opacity: 1, scale: 1 }}
        transition={{ duration: 0.3, ease: 'easeOut' }}
      >
        {dark ? <Moon size={16} /> : <Sun size={16} />}
      </motion.div>
    </motion.button>
  )
}
