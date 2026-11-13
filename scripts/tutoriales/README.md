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
