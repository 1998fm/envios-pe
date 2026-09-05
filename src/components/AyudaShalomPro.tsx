'use client'

import { useState } from 'react'
import {
  BookOpen,
  X,
  ListOrdered,
  FileSpreadsheet,
  AlertTriangle,
  CheckCircle2,
  Lightbulb,
  ExternalLink,
} from 'lucide-react'

const pasos = [
  {
    titulo: 'Configura tu agencia de origen',
    texto:
      'En Configuración, en "Agencia de origen (Shalom)", busca y elige la sucursal desde donde despachas. Es obligatoria: define el ORIGEN que lleva el archivo.',
  },
  {
    titulo: 'Abre "Exportar Shalom"',
    texto:
      'En el menú lateral del panel toca "Exportar Shalom". Se juntan los envíos Shalom que te faltan registrar.',
  },
  {
    titulo: 'Revisa el resumen',
    texto:
      'Mira cuántos envíos son y confirma que el origen sea el correcto. Si quieres, activa "Marcar como ENVIADO" para que tu panel se actualice solo al exportar.',
  },
  {
    titulo: 'Descarga el/los archivos',
    texto:
      'Toca "Exportar". Tori genera el archivo (o varios, si pasas de 50) en el formato exacto de Shalom y lo descarga.',
  },
  {
    titulo: 'Sube los archivos en Shalom Pro',
    texto:
      'Entra a pro.shalom.pe → carga masiva / subir formato → sube cada archivo descargado → confirma. Eso registra los envíos en Shalom de verdad.',
  },
]

const MAX_POR_ARCHIVO = 50

export default function AyudaShalomPro({ className = '' }: { className?: string }) {
  const [abierto, setAbierto] = useState(false)

  return (
    <>
      <button
        type="button"
        onClick={() => setAbierto(true)}
        title="Guía para usar Shalom Pro"
        aria-label="Ver guía de Shalom Pro"
        className={`inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-semibold text-sky-700 bg-sky-50 border border-sky-200 hover:bg-sky-100 hover:border-sky-300 hover:shadow-sm active:scale-95 transition-all ${className}`}
      >
        <BookOpen size={14} className="shrink-0" />
        Ver guía
      </button>

      {abierto && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-sm">
          <div className="flex max-h-[90vh] w-full max-w-2xl flex-col overflow-hidden rounded-3xl bg-white shadow-2xl">
            <div className="flex shrink-0 items-start justify-between border-b border-slate-100 px-6 py-5">
              <div>
                <h2 className="text-xl font-extrabold tracking-tight text-slate-900">Cómo usar Shalom Pro</h2>
                <p className="mt-0.5 text-sm text-slate-500">
                  La forma correcta de registrar tus envíos Shalom en masa, sin errores.
                </p>
              </div>
              <button
                onClick={() => setAbierto(false)}
                className="rounded-xl p-2 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-700"
                aria-label="Cerrar"
              >
                <X size={20} />
              </button>
            </div>

            <div className="flex-1 space-y-4 overflow-y-auto px-6 py-5">
              <div className="rounded-2xl border border-slate-200 bg-white p-4">
                <div className="flex items-center gap-2">
                  <ListOrdered size={17} className="shrink-0 text-sky-600" />
                  <h3 className="text-sm font-bold text-slate-900">Paso a paso</h3>
                </div>
                <div className="mt-3 space-y-3">
                  {pasos.map((p, i) => (
                    <div key={p.titulo} className="flex gap-3">
                      <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-sky-600 text-xs font-bold text-white">
                        {i + 1}
                      </div>
                      <div className="text-sm text-slate-600">
                        <span className="font-semibold text-slate-800">{p.titulo}. </span>
                        {p.texto}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4">
                <div className="flex items-center gap-2">
                  <FileSpreadsheet size={17} className="shrink-0 text-amber-700" />
                  <h3 className="text-sm font-bold text-amber-900">Límite de {MAX_POR_ARCHIVO} envíos por archivo</h3>
                </div>
                <p className="mt-2 text-sm text-amber-800 leading-relaxed">
                  Shalom Pro solo acepta máximo {MAX_POR_ARCHIVO} envíos por archivo. Por eso, si exportas 75, Tori
                  genera <span className="font-semibold">envios-shalom-1.xlsx</span> (50) y{' '}
                  <span className="font-semibold">envios-shalom-2.xlsx</span> (25) automáticamente. Sube{' '}
                  <span className="font-semibold">cada archivo por separado</span> en Shalom Pro.
                </p>
                <div className="mt-2 flex items-start gap-1.5 rounded-xl bg-white px-3 py-2 text-xs text-amber-700">
                  <AlertTriangle size={13} className="mt-0.5 shrink-0" />
                  <span>
                    Si el navegador te pide permiso para varias descargas, acéptalo: es normal cuando hay más de un
                    archivo.
                  </span>
                </div>
              </div>

              <div className="rounded-2xl border border-slate-200 bg-white p-4">
                <div className="flex items-center gap-2">
                  <CheckCircle2 size={17} className="shrink-0 text-emerald-600" />
                  <h3 className="text-sm font-bold text-slate-900">Consideraciones importantes</h3>
                </div>
                <div className="mt-2 space-y-2 text-sm text-slate-600 leading-relaxed">
                  <p>
                    <span className="font-semibold text-slate-800">El formato ya está listo.</span> El archivo sale con
                    las columnas de Shalom (destinatario, teléfono, origen, destino, mercadería, medidas, peso,
                    cantidad). No cambies columnas: solo sube.
                  </p>
                  <p>
                    <span className="font-semibold text-slate-800">Medidas automáticas.</span> Las dimensiones y el peso
                    se llenan solos según el tamaño del paquete: XS (0.5kg), S (2kg), M (5kg), L (10kg).
                  </p>
                  <p>
                    <span className="font-semibold text-slate-800">Solo agencias que reciben.</span> En el formulario
                    público solo aparecen agencias Shalom que aceptan paquetes. Las de solo-envío, terminales
                    aeroportuarias y centros internos se ocultan para que tus clientes no elijan una que no recibe.
                  </p>
                  <p>
                    <span className="font-semibold text-slate-800">"Marcar como ENVIADO" solo es en tu panel.</span>{' '}
                    Eso actualiza el estado en Tori. El registro real en Shalom ocurre cuando subes el archivo en
                    Shalom Pro.
                  </p>
                  <p>
                    <span className="font-semibold text-slate-800">Plan Básico tiene tope mensual.</span> El export a
                    Shalom tiene un límite de usos hasta que actualices a Pro o Business Plus.
                  </p>
                </div>
              </div>

              <div className="rounded-2xl border border-indigo-200 bg-indigo-50 p-4">
                <div className="flex items-center gap-2">
                  <Lightbulb size={17} className="shrink-0 text-indigo-600" />
                  <h3 className="text-sm font-bold text-indigo-900">La forma correcta de registrar en masa</h3>
                </div>
                <p className="mt-2 text-sm text-indigo-900 leading-relaxed">
                  El export es la vía recomendada y segura: agrupa todos los pedidos que tus clientes hicieron por tu
                  formulario y los convierte en el archivo de Shalom. <span className="font-semibold">No copies guías
                  desde el seguimiento de Shalom</span>: esa pantalla no muestra a cuál pedido pertenece cada guía y
                  se pierde el control de quién pidió qué. Cuando Shalom te devuelva las guías, asígnalas en tu panel.
                </p>
              </div>
            </div>

            <div className="flex shrink-0 items-center justify-between gap-3 border-t border-slate-100 px-6 py-4">
              <button
                onClick={() => window.open('https://pro.shalom.pe', '_blank', 'noopener,noreferrer')}
                className="inline-flex items-center gap-1.5 rounded-xl px-4 py-2 text-sm font-semibold text-sky-700 bg-sky-50 border border-sky-200 hover:bg-sky-100 transition-all"
              >
                <ExternalLink size={15} />
                Abrir Shalom Pro
              </button>
              <button
                onClick={() => setAbierto(false)}
                className="rounded-xl bg-gradient-to-r from-sky-600 to-indigo-600 px-5 py-2 text-sm font-semibold text-white transition-all duration-200 hover:shadow-lg hover:shadow-sky-500/20"
              >
                Entendido
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}