-- Permitir ventas a clientes sin DNI (personas.dni ya es nullable)
-- El insert en /api/ventas usaba persona_dni NOT NULL y fallaba con 500
alter table ventas alter column persona_dni drop not null;