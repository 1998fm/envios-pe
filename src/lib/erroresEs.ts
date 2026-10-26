// Mensajes de error para el usuario, siempre en español.
//
// La base de datos y el servicio de autenticación responden en inglés y con
// detalles internos (nombres de tablas, restricciones). Nada de eso se muestra:
// se traduce a un mensaje claro y el detalle original queda solo en el log del
// servidor.

const GENERICO = 'No se pudo completar la operación. Intenta de nuevo.'

type ErrorConCodigo = { message?: string; code?: string; status?: number } | null | undefined

/** Error de la base de datos (PostgREST/Postgres) -> mensaje en español. */
export function mensajeDb(error: unknown, porDefecto = GENERICO): string {
  const e = error as ErrorConCodigo
  if (!e) return porDefecto

  // Errores que lanzamos nosotros desde SQL con RAISE EXCEPTION: ya están en español.
  if (e.code === 'P0001' && e.message) return e.message

  console.error('[db]', e.code ?? '', e.message ?? error)

  switch (e.code) {
    case '23505':
      return 'Ya existe un registro con esos datos.'
    case '23503':
      return 'No se puede completar porque hay información relacionada.'
    case '23514':
      return 'Alguno de los datos no es válido.'
    case '23502':
      return 'Falta un dato obligatorio.'
    case '22P02':
    case '22007':
    case '22008':
      return 'Alguno de los datos no tiene un formato válido.'
    case '22003':
      return 'Alguno de los valores está fuera del rango permitido.'
    case '42501':
      return 'No tienes permiso para realizar esta acción.'
    case '40001':
    case '40P01':
      return 'El sistema está ocupado. Intenta de nuevo en unos segundos.'
    case 'PGRST116':
      return 'No se encontró el registro.'
    case 'PGRST205':
    case '42P01':
    case '42703':
      return 'Falta actualizar la base de datos. Contacta a soporte.'
    default:
      return porDefecto
  }
}

const POR_CODIGO: Record<string, string> = {
  invalid_credentials: 'Correo o contraseña incorrectos.',
  email_not_confirmed: 'Aún no confirmaste tu correo. Revisa tu bandeja de entrada.',
  user_banned: 'Tu cuenta está desactivada. Contacta a soporte.',
  weak_password: 'La contraseña es muy débil. Usa al menos 8 caracteres.',
  same_password: 'La nueva contraseña debe ser distinta de la anterior.',
  over_request_rate_limit: 'Demasiados intentos. Espera unos minutos e intenta de nuevo.',
  over_email_send_rate_limit: 'Se enviaron demasiados correos. Espera unos minutos e intenta de nuevo.',
  user_already_exists: 'No se pudo crear la cuenta con ese correo.',
  email_exists: 'No se pudo crear la cuenta con ese correo.',
  signup_disabled: 'El registro está desactivado por ahora.',
  validation_failed: 'Revisa el correo y la contraseña e intenta de nuevo.',
  email_address_invalid: 'El correo no es válido.',
  otp_expired: 'El enlace venció o no es válido. Pide uno nuevo.',
  flow_state_not_found: 'El enlace venció o no es válido. Pide uno nuevo.',
  flow_state_expired: 'El enlace venció o no es válido. Pide uno nuevo.',
  bad_code_verifier: 'El enlace debe abrirse en el mismo navegador donde lo pediste. Pide uno nuevo.',
  session_not_found: 'Tu sesión venció. Inicia sesión de nuevo.',
  session_expired: 'Tu sesión venció. Inicia sesión de nuevo.',
  bad_jwt: 'Tu sesión venció. Inicia sesión de nuevo.',
  user_not_found: 'No se encontró el usuario.',
  captcha_failed: 'No se pudo verificar que eres una persona. Intenta de nuevo.',
}

const POR_TEXTO: [RegExp, string][] = [
  [/invalid login credentials/i, POR_CODIGO.invalid_credentials],
  [/email not confirmed/i, POR_CODIGO.email_not_confirmed],
  [/banned/i, POR_CODIGO.user_banned],
  [/(already|been) registered|already exists/i, POR_CODIGO.user_already_exists],
  [/same.*password|different from the old/i, POR_CODIGO.same_password],
  [/password should be at least|weak/i, POR_CODIGO.weak_password],
  [/rate limit|too many/i, POR_CODIGO.over_request_rate_limit],
  [/expired|invalid.*(link|token|code)|flow state/i, POR_CODIGO.otp_expired],
  [/jwt|session.*(missing|not found)/i, POR_CODIGO.session_not_found],
  [/invalid.*email|unable to validate email/i, POR_CODIGO.email_address_invalid],
  [/signups? not allowed|signup.*disabled/i, POR_CODIGO.signup_disabled],
]

/** Error del servicio de autenticación -> mensaje en español. */
export function mensajeAuth(error: unknown, porDefecto = GENERICO): string {
  const e = error as ErrorConCodigo & { error_code?: string }
  if (!e) return porDefecto
  const codigo = e.code ?? e.error_code
  if (codigo && POR_CODIGO[codigo]) return POR_CODIGO[codigo]
  const texto = e.message ?? ''
  for (const [re, msg] of POR_TEXTO) if (re.test(texto)) return msg
  console.error('[auth]', codigo ?? '', texto)
  return porDefecto
}
