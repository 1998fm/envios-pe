'use client'

import { useEffect, useState } from 'react'
import agenciasFallback from '@/data/agencias-olva.json'

export type AgenciaOlva = {
  office_id: string
  nombres: string
  direccion: string
  department: string
  province: string
  district: string
  office_type: string
  lat?: string | null
  lng?: string | null
}

// Caché de módulo: se comparte entre todos los consumidores para evitar
// repetir el fetch del endpoint cada vez que se monta un componente.
let cachePromesa: Promise<AgenciaOlva[]> | null = null

function cargarAgencias(): Promise<AgenciaOlva[]> {
  if (cachePromesa) return cachePromesa

  cachePromesa = (async () => {
    try {
      const res = await fetch('/api/olva/agencias', { cache: 'no-store' })
      if (res.ok) {
        const json = await res.json()
        const lista = Array.isArray(json?.agencias) ? json.agencias : null
        if (lista && lista.length > 0) return lista
      }
    } catch (e) {
      console.error('[olva] error cargando agencias:', e)
    }
    // Respaldo automático si el endpoint falla o viene vacío.
    return agenciasFallback
  })()

  return cachePromesa
}

export function useAgenciasOlva(): {
  agencias: AgenciaOlva[]
  cargando: boolean
} {
  const [agencias, setAgencias] = useState<AgenciaOlva[]>(agenciasFallback)
  const [cargando, setCargando] = useState(true)

  useEffect(() => {
    let activo = true
    cargarAgencias().then((lista) => {
      if (activo) {
        setAgencias(lista)
        setCargando(false)
      }
    })
    return () => {
      activo = false
    }
  }, [])

  return { agencias, cargando }
}

// Normaliza texto (minusculas, sin acentos, sin espacios extra) para
// comparar "DEPARTAMENTO - PROVINCIA" con los campos reales de Olva.
export function normalizarTexto(v: string): string {
  return (v || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/\s+/g, ' ')
    .trim()
}

// Devuelve true si la agencia pertenece a la provincia seleccionada
// (formato "DEPARTAMENTO - PROVINCIA", el mismo de provincias-olva.json).
export function agenciaEsDeProvincia(
  a: AgenciaOlva,
  provincia: string
): boolean {
  if (!provincia) return false
  const llave = normalizarTexto(`${a.department} - ${a.province}`)
  return llave === normalizarTexto(provincia)
}