/**
 * Prompts para generar los SVGs de Tori (Schnauzer) con ChatGPT.
 *
 * Instrucciones generales para ChatGPT:
 * - Genera SVG puro, sin HTML ni markdown alrededor
 * - viewBox="0 0 200 200"
 * - Estilo: vector plano, geométrico, minimalista
 * - Colores: #0ea5e9 (sky-500), #4f46e5 (indigo-600), #fbbf24 (amber-400), #1e293b (slate-800)
 * - El perro es un Schnauzer: cejas pobladas, bigote/barba, hocico cuadrado, orejas dobladas
 * - Sin fondo, sin recuadro, solo el personaje
 * - Apto para dark mode: usar colores sólidos, sin sombras dependientes de fondo
 */

export const prompts: Record<string, string> = {
  logo: `Genera un SVG de la cabeza de un Schnauzer en estilo geométrico plano.
- viewBox="0 0 200 200"
- Solo la cabeza, frente, con orejas dobladas
- Cejas muy pobladas y tupidas (rasgo distintivo)
- Hocico cuadrado con bigote
- Barba corta debajo del hocico
- Collar azul con medalla dorada
- Colores: #0ea5e9 para orejas y collar, #4f46e5 para la cabeza, #fbbf24 para la medalla, #1e293b para ojos y nariz
- El hocico y barba en blanco/gris claro #f1f5f9
- Estilo SVG puro, sin bordes, sin fondo`,

  happy: `Genera un SVG de un Schnauzer feliz saltando, cuerpo completo.
- viewBox="0 0 200 200"
- Cuerpo completo del perro, saltando con las 4 patas en el aire
- Cola levantada moviéndose
- Lengua afuera, ojos brillantes y alegres
- Cejas pobladas características
- Collar azul con medalla dorada
- Colores: #0ea5e9 (accesorios), #4f46e5 (cuerpo), #fbbf24 (medalla), #1e293b (ojos/nariz)
- Cuerpo y patas en tonos indigo, hocico y pecho en #f1f5f9
- SVG puro, sin fondo`,

  guide: `Genera un SVG de un Schnauzer caminando y señalando hacia adelante.
- viewBox="0 0 200 200"
- Cuerpo completo, perfil 3/4, caminando con actitud segura
- Una pata levantada señalando hacia adelante
- Cejas pobladas y expresivas, mirada amigable
- Collar azul con medalla dorada
- Colores: #0ea5e9 (accesorios), #4f46e5 (cuerpo), #fbbf24 (medalla), #1e293b (ojos/nariz)
- Hocico y pecho en #f1f5f9
- SVG puro, sin fondo`,

  empty: `Genera un SVG de un Schnauzer sentado con la cabeza ladeada, expresión de "no hay nada aquí".
- viewBox="0 0 200 200"
- Sentado, cabeza ligeramente inclinada
- Ojos entrecerrados o mirando hacia arriba
- Orejas caídas ligeramente
- Cejas pobladas levantadas
- Collar azul con medalla dorada
- Colores: #0ea5e9 (accesorios), #4f46e5 (cuerpo), #fbbf24 (medalla), #1e293b (ojos/nariz)
- Hocico y pecho en #f1f5f9
- SVG puro, sin fondo`,

  loading: `Genera un SVG de un Schnauzer corriendo en el lugar, con líneas de movimiento.
- viewBox="0 0 200 200"
- Cuerpo completo, patas en posición de carrera
- Líneas de movimiento o circles alrededor
- Lengua afuera, ojos alegres
- Cejas pobladas
- Collar azul con medalla dorada
- Colores: #0ea5e9 (accesorios), #4f46e5 (cuerpo), #fbbf24 (medalla), #1e293b (ojos/nariz)
- Hocico y pecho en #f1f5f9
- SVG puro, sin fondo`,

  error: `Genera un SVG de un Schnauzer con expresión triste o apenada.
- viewBox="0 0 200 200"
- Cuerpo completo o medio cuerpo
- Orejas caídas
- Ojos grandes y tristes, cejas inclinadas hacia arriba (tristeza)
- Una venda en una oreja o pata
- Collar azul con medalla dorada
- Colores: #0ea5e9 (accesorios), #4f46e5 (cuerpo), #fbbf24 (medalla), #1e293b (ojos/nariz)
- Hocico y pecho en #f1f5f9
- SVG puro, sin fondo`,

  notfound: `Genera un SVG de un Schnauzer mirando un mapa al revés, confundido.
- viewBox="0 0 200 200"
- Cuerpo completo sentado
- Sosteniendo un mapa o papel al revés
- Cabeza ladeada, expresión confundida
- Cejas pobladas arqueadas
- Collar azul con medalla dorada
- Colores: #0ea5e9, #4f46e5, #fbbf24, #1e293b, #f1f5f9
- SVG puro, sin fondo`,

  onboard: `Genera un SVG de un Schnauzer sosteniendo un letrero de bienvenida.
- viewBox="0 0 200 200"
- Cuerpo completo sentado o parado
- Sosteniendo un letrero con texto "¡Bienvenido!" (en español)
- Ojos alegres, lengua afuera, cola moviéndose
- Cejas pobladas felices
- Collar azul con medalla dorada
- Colores: #0ea5e9, #4f46e5, #fbbf24, #1e293b, #f1f5f9
- SVG puro, sin fondo`,
}
