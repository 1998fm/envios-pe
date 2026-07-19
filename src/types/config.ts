import { Dispatch, SetStateAction } from 'react'

export type ConfigState = {
  vistaConfig: string
  empresa: string
  telefonoEmpresa: string
  direccionEmpresa: string
  nuevoOrigen: string
  logoFile: File | null
  logoUrl: string
  redirectUrl: string
  redirectMessage: string
  instagramUrl: string
  facebookUrl: string
  tiktokUrl: string
  webUrl: string
  whatsappUrl: string
  metodoMotorizado: boolean
  metodoShalom: boolean
  metodoOlva: boolean
  metodoMarvisur: boolean
  metodoFlores: boolean
  metodoOtro: boolean
  nombreMetodoOtro: string
  metodoRecojo: boolean
  mensajeRecojo: string
  logisticaMotoDias: string[]
  logisticaMotoHoraCorte: string
  logisticaMotoUsaHoraCorte: boolean
  logisticaMotoLimitar: boolean
  logisticaMotoCupo: number
  logisticaAgenciasDias: string[]
  logisticaAgenciasHoraCorte: string
  logisticaAgenciasUsaHoraCorte: boolean
  logisticaAgenciasLimitar: boolean
  logisticaAgenciasCupo: number
  tarifas: Record<string, string>
}

export const initialConfigState: ConfigState = {
  vistaConfig: 'EMPRESA',
  empresa: '',
  telefonoEmpresa: '',
  direccionEmpresa: '',
  nuevoOrigen: '',
  logoFile: null,
  logoUrl: '',
  redirectUrl: '',
  redirectMessage: '',
  instagramUrl: '',
  facebookUrl: '',
  tiktokUrl: '',
  webUrl: '',
  whatsappUrl: '',
  metodoMotorizado: true,
  metodoShalom: true,
  metodoOlva: false,
  metodoMarvisur: false,
  metodoFlores: false,
  metodoOtro: false,
  nombreMetodoOtro: '',
  metodoRecojo: false,
  mensajeRecojo: 'Recoge tu pedido en nuestra tienda. Te esperamos!',
  logisticaMotoDias: ['MONDAY'],
  logisticaMotoHoraCorte: '18:00',
  logisticaMotoUsaHoraCorte: false,
  logisticaMotoLimitar: false,
  logisticaMotoCupo: 0,
  logisticaAgenciasDias: ['MONDAY'],
  logisticaAgenciasHoraCorte: '18:00',
  logisticaAgenciasUsaHoraCorte: false,
  logisticaAgenciasLimitar: false,
  logisticaAgenciasCupo: 0,
  tarifas: {},
}

export type ConfigModalProps = {
  config: ConfigState
  setConfig: Dispatch<SetStateAction<ConfigState>>
  abierto: boolean
  onCerrar: () => void
  distritosMoto: string[]
  guardarConfiguracion: () => void
  plan?: string
}
