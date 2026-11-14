# Alta y primeros pasos

El registro sigue creando una prueba Plus de 14 días. El asistente usa los datos de `/api/session`, conserva los campos existentes y guarda cada paso al pulsar **Guardar y continuar**. No hay migraciones ni cambios en los registros de ventas, productos o envíos.

## Fricción detectada

- El nombre ya pedido en el registro volvía a aparecer vacío; reabrir el asistente partía de valores predeterminados y podía sustituir datos existentes.
- Se mostraban cuatro pasos aunque el negocio solo ofreciera recojo. Horarios incluía desde el inicio todas las reglas avanzadas.
- La explicación de anticipación y hora de corte era ambigua, y las tarifas no distinguían con claridad reparto, precio del producto y cobertura retirada.
- Al terminar se borraban las marcas de ayuda y arrancaba una navegación automática por siete secciones. Los modales podían abrir más mensajes encima del trabajo del usuario.
- Algunas ayudas antiguas señalaban elementos que ya no existían o mostraban textos desactualizados.

## Recorrido actual

1. **Tu negocio:** nombre precargado y teléfono opcional. Logo y dirección se despliegan si el usuario los necesita.
2. **Entregas:** elegir al menos un método. Shalom requiere agencia de origen; un método propio requiere nombre. Básico admite hasta dos métodos.
3. **Días y horarios:** solo cuando hay Motorizado o agencias. Días y anticipación primero; corte, conteo hábil y cupo dentro de opciones avanzadas. La guía se abre en Logística. En agencias se programa el despacho, no se garantiza la llegada del courier.
4. **Cobertura y tarifas:** solo con Motorizado. Reutiliza el editor de Lima/Provincia y la exclusión de distritos; exige al menos una tarifa válida y admite decimales. La guía abre Lima o Provincia según la región elegida.

Con solo recojo se completan dos pasos; con agencias, tres; con Motorizado, hasta cuatro. El contador se adapta a la selección. El resultado permite probar el formulario, copiar su enlace o entrar a Envíos. No afirma que el formulario esté probado: pide revisarlo como cliente antes de compartirlo.

**Continuar después** conserva los pasos ya guardados. No guarda los cambios pendientes del paso actual. El próximo paso se recuerda durante la sesión del navegador, por usuario; al recargar se obtienen otra vez los datos guardados del servidor. No se guardan teléfonos, imágenes ni configuración en el almacenamiento local para esa reanudación. En otro navegador se conservan los datos del servidor, aunque el asistente puede comenzar por el primer paso.

## Ayuda sin interrupciones

El dashboard incluye **Primeros pasos y guías**, desplegable y minimizable. Se abre al salir del asistente; las cuentas existentes lo ven cerrado. Su estado y la declaración manual de haber revisado el formulario se guardan por usuario en ese navegador. No representan ventas, solicitudes ni actividad real inventada.

El dueño puede continuar el asistente o abrir Configuración. Los enlaces de inventario se muestran con Plus y con las secciones permitidas para ese usuario. Los miembros no ven acciones para configurar el negocio. El acceso a las guías no concede permisos para usar herramientas.

Los recorridos con globos dejaron de arrancar automáticamente. `OnboardingContext.startTour` requiere `manual=true`; `TourHelpButton` lo establece al pulsarlo. Se conservan las ayudas manuales donde siguen siendo útiles. El antiguo enlace `?tour=start` abre la lista de primeros pasos sin navegar por las pestañas.

Logística y Tarifas reutilizan el video de Configuración. Etiquetas, Copiar datos, Cambio Masivo y Shalom Pro abren el capítulo correspondiente de la guía de Envíos. Las ventanas conservan sus opciones al cerrar el video. Productos, Compras y Ventas mantienen sus guías; la lista explica el orden del inventario y las funciones de variantes, SKU y costo general.

## Validaciones y conservación

`src/lib/onboarding.ts` centraliza carga, pasos y requisitos. El servidor valida también los pasos y usa el dueño de la sesión. Un miembro no puede modificar la configuración mediante `/api/onboarding`. En Básico se desactivan corte, cupos y anticipación avanzada igual que en Configuración.

Guardar los datos del negocio devuelve las URLs guardadas de sus imágenes, para no perderlas al volver atrás. Se conservan redes, mensajes, imágenes y distritos excluidos cargados al reabrir. Los distritos fuera de cobertura no cuentan como tarifas en el resumen.

## Comprobación

- `e2e/onboarding-simple.spec.ts`: registro real, solo recojo, ausencia de recorrido forzado, reanudación, conservación de datos, ayudas manuales, Motorizado con video y tarifa decimal, validación de Básico.
- `e2e/onboarding-ayudas.spec.ts`: capítulo correcto de las cuatro herramientas de Envíos y conservación de las opciones del modal.
- Regresión: autenticación, seguridad, ausencia de credenciales en navegador, operaciones principales, Configuración y guías existentes.
