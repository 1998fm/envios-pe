# Módulo Copiar Datos

## Objetivo

Generar la información necesaria para entregar pedidos a motorizados.

---

## Responsabilidades

- Mostrar únicamente pedidos seleccionados de Moto.
- Permitir decidir qué pedidos cobran envío.
- Calcular automáticamente la tarifa según el distrito.
- Generar el texto para copiar.
- Exportar los pedidos.

---

## No debe hacer

- Consultar Supabase.
- Actualizar pedidos.
- Modificar estados del dashboard.
- Filtrar pedidos.

---

## Estructura

components/
Componentes visuales.

hooks/
Lógica reutilizable.

utils/
Funciones auxiliares.

types.ts
Tipos compartidos.

index.ts
Punto de entrada del módulo.