export type SupportProfile = {
  id: string;
  empresa: string | null;
  slug: string | null;
  telefono: string | null;
  direccion: string | null;
  plan: string;
  trial_end: string | null;
  pro_until: string | null;
  disabled: boolean;
  role: string;
  cerrar_formulario: boolean;
  cerrar_formulario_mensaje: string | null;
  metodo_motorizado: boolean;
  metodo_shalom: boolean;
  metodo_olva: boolean;
  metodo_marvisur: boolean;
  metodo_flores: boolean;
  metodo_otro: boolean;
  metodo_recojo: boolean;
  origen_shalom: string | null;
  moto_region: string | null;
  logistica_moto_dias: string[] | null;
};
export type SupportOrder = {
  id: string;
  codigo: string | null;
  nombre: string | null;
  telefono: string | null;
  dni: string | null;
  estado: string;
  metodo: string;
  destino: string | null;
  direccion: string | null;
  observaciones: string | null;
  fecha_programada: string | null;
  updated_at: string | null;
  fecha_registro: string;
};
export type SupportData = {
  profile: SupportProfile;
  cuenta: {
    email: string | null;
    ultimoIngreso: string | null;
    confirmado: boolean;
    bloqueada: boolean;
  } | null;
  planEfectivo: {
    plan: "basic" | "business_plus";
    isTrial: boolean;
    diasRestantes: number | null;
  };
  diagnosticos: {
    codigo: string;
    nivel: "aviso" | "error" | "ok";
    titulo: string;
    detalle: string;
  }[];
  pedidos: SupportOrder[];
  totalPedidos: number;
  pagina: number;
  historial: {
    id: number;
    accion: string;
    admin_email: string;
    created_at: string;
    detalle: Record<string, unknown>;
  }[];
};
