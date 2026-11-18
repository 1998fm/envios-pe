# Diagnóstico de tráfico real, 18 de noviembre de 2026

Auditoría de solo lectura de Supabase. No se modificaron datos, políticas, contratos, esquema ni código de producción. Producción revisada: commit `39e4733`.

## Fuente principal confirmada

`app/api/envios/route.ts`, GET con búsqueda, descarga `select('*')`, hasta 10.000 candidatos, y después aplica `buscar()` en memoria. Estado, método y fechas se filtran en PostgREST; nombre, DNI y teléfono se filtran después de transferir las filas a Vercel. La paginación de 50 resultados se realiza demasiado tarde para reducir la transferencia Supabase → Vercel.

El dashboard repite la búsqueda al refrescar. El debounce anterior reduce consultas al escribir y el intervalo nuevo reduce frecuencia, pero ninguno reduce el contenido de esta consulta. Por ello la corrección anterior fue parcial.

Ventana de logs 17/11 12:25 UTC → 18/11 12:25 UTC (24 horas, incluye antes y después del despliegue):

| Lecturas GET de Envíos con select=* | Solicitudes | Filas transferidas |
| --- | ---: | ---: |
| Búsquedas con limit=10000 | 6.053 | 3.834.496 |
| Otras consultas | 6.312 | 206.276 |
| Total | 12.365 | 4.040.772 |

Las búsquedas representan el 94,9 % de estas filas transferidas. Los recuentos proceden de `response.headers.content_range`; son filas devueltas repetidamente, no registros nuevos ni filas examinadas internamente por PostgreSQL.

## Evidencia posterior al despliegue

Ventana 18/11 00:38 → 12:25 UTC, equivalente a 17/11 19:38 → 18/11 07:25 en Lima:

- 5.578 solicitudes API totales, 11 solicitudes a `/auth/v1/token`, cero HTTP429.
- Búsquedas completas: 209 consultas y 165.059 filas. Otras lecturas completas de Envíos: 732 consultas y 14.534 filas. El problema de búsquedas sigue presente después del despliegue.
- Un mismo conjunto de filtros devolvió 875 pedidos en cada una de 188 consultas, entre 00:38:07 y 01:38:38 UTC. Todos los accesos a esta consulta figuran con agente Node. No se puede distinguir con ese agente si cada llamada procede de un temporizador, una interacción manual o una pestaña antigua; no se atribuyen todas al temporizador nuevo.
- Una consulta SQL agregada, sin extraer datos personales, midió el conjunto equivalente actual: 885 filas y 719.783 bytes JSON (~813 bytes/fila). El conjunto había cambiado desde los logs. Aplicar ese promedio a 875 × 188 estima aproximadamente 134 MB de JSON repetido. **No son bytes facturados medidos**, ni prueba de correspondencia exacta con el salto de 6,12 a 6,22 GB. Pueden variar serialización, compresión y desfase del contador.
- El promedio actual global es 814 bytes JSON por envío (5.730 filas). Multiplicarlo por 3,83 millones de filas orienta sobre la magnitud, pero tampoco constituye una medición de egress facturado.
- Cero solicitudes a Storage `tori-billing` y cero a `/rest/v1/pagos` en esta ventana. No hay evidencia para atribuir este crecimiento a la conciliación de suscripciones. Esto no certifica su funcionamiento financiero.
- Storage: 101 respuestas HIT, 14.510.513 bytes declarados; 5 DYNAMIC, 2.630 bytes; una MISS sin Content-Length. No sumar todos esos bytes como transferencia sin caché. Muchos resultados Database/Auth no incluyen Content-Length.

## Otros candidatos comprobados

En la ventana de 24 horas, el resumen de Ventas transfirió 342.679 filas en 852 lecturas (`total,monto_pagado,estado,items:venta_items(cantidad,costo_unitario)`). Calcula agregados en la aplicación y repite datos. Productos descargó 309.818 filas completas en 652 consultas. Son fuentes secundarias que deben optimizarse, no se han cuantificado sus bytes exactos. Consultas de permisos son frecuentes pero devuelven pocas columnas y una fila; no deben eliminarse ni cachearse indebidamente para reducir solicitudes.

## Corrección técnica recomendada

1. Ejecutar la búsqueda de Envíos en PostgreSQL, con filtro del negocio, filtros actuales, normalización de tildes, reglas de coincidencia y orden de relevancia equivalentes, y paginación antes de devolver filas. No sustituirla por un ilike ingenuo que cambie resultados.
2. Como alternativa incremental sin esquema, traer solo id/nombre/DNI/teléfono para seleccionar candidatos y después los detalles de la página, revalidando el negocio en ambas consultas. Reduce contenido, pero sigue transfiriendo todos los candidatos y no es la solución definitiva.
3. Dejar de descargar listas completas sin cambios durante el refresco, utilizando una señal fiable de cambios que cubra altas, ediciones y eliminaciones; no basarla únicamente en la última fecha de alta.
4. Agregar el resumen de Ventas en PostgreSQL y revisar los selectores/búsquedas de Productos conservando stock, costos autorizados y resultados actuales.
5. Verificar con pruebas locales el aislamiento entre negocios, permisos, estados, métodos, fechas de Perú, tildes, búsqueda por palabras, relevancia y paginación; medir filas/bytes transferidos y comparar una nueva ventana real posterior.

No se afirma que todo el ciclo de 6,22 GB haya quedado conciliado. Los logs prueban una causa concreta de transferencia excesiva; el desglose oficial de Usage sigue siendo necesario para cerrar la atribución de bytes facturados.
