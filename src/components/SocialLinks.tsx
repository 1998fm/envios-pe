'use client'

import { motion } from 'framer-motion'
import { FaInstagram, FaFacebook, FaTiktok, FaWhatsapp } from 'react-icons/fa'
import { Globe } from 'lucide-react'

type Props = {
  instagramUrl?: string
  facebookUrl?: string
  tiktokUrl?: string
  webUrl?: string
  whatsappUrl?: string
}

const links: {
  key: string
  prop: keyof Props
  icon: React.ComponentType<{ size?: number }>
  label: string
}[] = [
  { key: 'ig', prop: 'instagramUrl', icon: FaInstagram, label: 'Instagram' },
  { key: 'fb', prop: 'facebookUrl', icon: FaFacebook, label: 'Facebook' },
  { key: 'tt', prop: 'tiktokUrl', icon: FaTiktok, label: 'TikTok' },
  { key: 'web', prop: 'webUrl', icon: () => <Globe size={18} />, label: 'Sitio Web' },
  { key: 'wa', prop: 'whatsappUrl', icon: FaWhatsapp, label: 'WhatsApp' },
]

export default function SocialLinks(props: Props) {
  const hasAny = links.some((l) => props[l.prop])

  if (!hasAny) return null

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ delay: 0.3, duration: 0.4 }}
      className="pt-6 border-t border-slate-100 dark:border-slate-800"
    >
      <div className="flex justify-center flex-wrap gap-3">
        {links.map(
          (l) =>
            props[l.prop] && (
              <motion.a
                key={l.key}
                href={props[l.prop]}
                target="_blank"
                rel="noopener noreferrer"
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.95 }}
                className="
                  flex items-center gap-1.5
                  text-xs font-medium
                  text-slate-400 dark:text-slate-500
                  hover:text-slate-700 dark:hover:text-slate-300
                  transition-colors duration-200
                "
              >
                <l.icon size={16} />
                <span>{l.label}</span>
              </motion.a>
            )
        )}
      </div>
    </motion.div>
  )
}
