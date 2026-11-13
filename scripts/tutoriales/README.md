# Tutorial: serie con variantes

La grabación utiliza Chromium y la interfaz real de la aplicación. No simula formularios ni genera capturas con IA. Crea una cuenta de demostración en el stack local y verifica que se hayan guardado cuatro variantes con stock independiente y que el cambio de precio general se haya aplicado.

1. Inicia `dev:local` con `APP_PORT=3100` y `LOCAL_DB_PORT=54322`, siguiendo las instrucciones del entorno local del repositorio.
2. Con Chromium, FFmpeg del sistema y FFmpeg de Playwright disponibles, ejecuta:

   ```sh
   APP_PORT=3100 LOCAL_DB_PORT=54322 node scripts/tutoriales/serie-variantes.mjs
   ```

   Usa `PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH` para otra ubicación de Chromium y `TUTORIAL_OUTPUT` para elegir la carpeta de salida. Por defecto se usa una carpeta temporal. Si falta el codificador de Playwright, se instala con `npx playwright install ffmpeg`.

3. Revisa el video completo. El guion, los tiempos y los subtítulos quedan en `timeline.json` e `instrucciones.ass`. Los tutoriales automáticos del producto se marcan como vistos en esa cuenta para que no tapen la grabación.
4. Copia `serie-con-variantes.mp4` y `portada.jpg` a `public/recursos/serie-variantes/`. Actualiza `pasos.json` con `duration` y `marks` del nuevo `timeline.json` (omite `lead`, que solo sirve para recortar la toma).

Página para ver, descargar y navegar por capítulos: `/recursos/serie-variantes/index.html`. Las instrucciones están integradas en el MP4; se entiende sin audio. En móvil se recomienda pantalla completa en horizontal.

El generador solo admite el stack local y no utiliza datos ni cuentas de producción. Si cambian los campos o botones del producto, actualiza los selectores y vuelve a grabar.

## Configuración

`scripts/tutoriales/configuracion.mjs` graba Empresa, agencia de origen Shalom, Métodos, Logística, Tarifas de Lima y Guardar. El ejemplo usa Plus, verifica la persistencia del teléfono, Shalom, anticipación, tarifa y exclusión de un distrito. Los datos son de una cuenta local de demostración.

```sh
APP_PORT=3100 LOCAL_DB_PORT=54322 node scripts/tutoriales/configuracion.mjs
```

La salida temporal usa `tori-configuracion`. Se publica en `public/recursos/configuracion/` con `configuracion.mp4`, `portada.jpg` y los capítulos en `pasos.json`. `TUTORIAL_FAST=1` permite comprobar los controles rápidamente y limpia su perfil de ensayo local; esa versión acelerada no es el video que se publica. Inicia un stack local nuevo para evitar que el nombre del negocio del ejemplo ya esté registrado.

Ambas ayudas usan `TutorialEnVideo`: el botón abre un reproductor sin desmontar el formulario, permite cerrar con Escape y devuelve el foco al botón. El de Configuración usa el tono oscuro para su cabecera blanca.

### Guía ampliada de Logística y Tarifas

La guía de Configuración dedica una explicación con ejemplos a cada opción. Los ejemplos de fechas suponen lunes a viernes y cupo libre, salvo donde se indica lo contrario: lunes antes del corte +2 → miércoles; desde el corte +3 → jueves; viernes +2 de calendario → lunes; viernes +2 de atención → martes.

El ejemplo de Lima demuestra precio único, cambio individual, exclusión, guardado y restauración con nueva tarifa. Provincia se graba con otra cuenta local que empieza sin tarifas: cambiar de región no limpia automáticamente una lista existente. Ambos perfiles de demostración se eliminan al finalizar el generador, también si ocurre un error.

El tiempo de cada explicación se calcula para permitir su lectura (aprox. 187 palabras por minuto). Los capítulos se leen desde `pasos.json`; el botón de ayuda abre el tema correspondiente a la pestaña actual, con accesos a Inicio, Logística, Tarifas Lima y Tarifas Provincia. La transcripción incluye los ejemplos, además de las instrucciones cortas.
