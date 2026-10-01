'use client'

import { useEffect, useState } from 'react'
import { Eye, CheckCircle2 } from 'lucide-react'
import PublicForm from '@/components/PublicForm'
import { formCssVars } from '@/lib/formColor'
import type { ConfigState } from '@/types/config'

type Props = {
  userId: string
  config: ConfigState
  plan?: string
  distritosMotorizado: string[]
}

export default function VistaPreviaFormulario({ userId, config, plan = 'basic', distritosMotorizado }: Props) {
  const [vista, setVista] = useState<'form' | 'success'>('form')
  const isPro = plan !== 'basic'
  const cssVars = formCssVars(config.colorPrimario, config.colorSecundario)

  useEffect(() => {
    if (config.cerrarFormulario) setVista('form')
  }, [config.cerrarFormulario])

  return (
    <div data-tour="formulario-preview" className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex items-center justify-between flex-wrap gap-3 mb-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center text-white" style={{ backgroundImage: 'var(--tori-grad-br)' }}>
            <Eye size={20} className="text-white" />
          </div>
          <div>
            <h3 className="text-base font-bold text-slate-900">Vista previa</h3>
            <p className="text-xs text-slate-500">Así lo ven tus clientes. Se actualiza con tus cambios.</p>
          </div>
        </div>
        <div className="flex rounded-xl bg-slate-100 p-1 text-xs font-semibold">
          <button
            onClick={() => setVista('form')}
            className={`px-3 py-1.5 rounded-lg transition-colors ${
              vista === 'form' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            Formulario
          </button>
          <button
            onClick={() => setVista('success')}
            disabled={config.cerrarFormulario}
            className={`px-3 py-1.5 rounded-lg transition-colors ${
              vista === 'success' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'
            } ${config.cerrarFormulario ? 'opacity-40 cursor-not-allowed' : ''}`}
          >
            Confirmación
          </button>
        </div>
      </div>

      <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 sm:p-6">
        {vista === 'form' ? (
          <div className="mx-auto max-w-md">
            <div className="pointer-events-none select-none">
              <PublicForm
                userId={userId}
                isPro={isPro}
                isBusinessPlus={plan === 'business_plus'}
                logoUrl={config.logoUrl}
                redirectMessage={config.redirectMessage}
                redirectMessageImage={config.redirectMessageImage}
                redirectUrl={config.redirectUrl}
                instagramUrl={config.instagramUrl}
                facebookUrl={config.facebookUrl}
                tiktokUrl={config.tiktokUrl}
                webUrl={config.webUrl}
                whatsappUrl={config.whatsappUrl}
                metodoMotorizado={config.metodoMotorizado}
                metodoShalom={config.metodoShalom}
                metodoOlva={config.metodoOlva}
                metodoMarvisur={config.metodoMarvisur}
                metodoFlores={config.metodoFlores}
                metodoOtro={config.metodoOtro}
                nombreMetodoOtro={config.nombreMetodoOtro}
                metodoRecojo={config.metodoRecojo}
                mensajeRecojo={config.mensajeRecojo}
                solicitarCantidadProductos={config.solicitarCantidadProductos}
                mostrarEscogerFecha={config.mostrarEscogerFecha}
                mostrarTracking={config.mostrarTracking}
                formularioDeshabilitado={config.cerrarFormulario}
                cerrarFormularioMensaje={config.cerradoFormularioMensaje}
                distritosMotorizado={distritosMotorizado}
                colorPrimario={config.colorPrimario}
                colorSecundario={config.colorSecundario}
              />
            </div>
          </div>
        ) : (
          <div className="mx-auto max-w-md">
            <div className="bg-white rounded-2xl shadow-xl border border-slate-100 p-8 text-center relative overflow-hidden" style={cssVars}>
              <div
                className="absolute top-0 left-0 right-0 h-1.5"
                style={{ backgroundImage: 'var(--tori-grad)' }}
              />
              {isPro && config.logoUrl && (
                <div className="flex justify-center mb-6">
                  <img src={config.logoUrl} alt="Logo" className="max-h-20 object-contain" />
                </div>
              )}
              <div className="flex justify-center mb-5">
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-emerald-100">
                  <CheckCircle2 size={36} className="text-emerald-600" />
                </div>
              </div>
              <h4 className="text-xl font-bold text-slate-900">Pedido registrado correctamente</h4>
              <p className="mt-3 text-sm text-slate-500 whitespace-pre-line">
                {isPro && config.redirectMessage ? config.redirectMessage : 'Gracias por tu solicitud.'}
              </p>
              {isPro && config.redirectMessageImage && (
                <div className="mt-5 flex justify-center">
                  <img src={config.redirectMessageImage} alt="Mensaje de éxito" className="max-h-64 max-w-full object-contain rounded-xl" />
                </div>
              )}
              {isPro && config.redirectUrl && (
                <p className="mt-5 text-xs text-slate-400">
                  Redireccionando a <span className="font-semibold text-slate-500">{config.redirectUrl}</span>...
                </p>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}