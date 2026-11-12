import type { Producto } from "./inventario";
export type FamiliaProducto = {
  id: string;
  nombre: string;
  descripcion: string | null;
  precio_base: number;
  imagen_url: string | null;
  unidad: string;
  opciones: string[];
  updated_at: string;
};
export type VarianteProducto = {
  producto_id: string;
  opciones: Record<string, string>;
  precio_especial: boolean;
  nombre_especial: boolean;
  descripcion_especial: boolean;
  imagen_especial: boolean;
  producto: Producto;
};
export type FichaFamilia = {
  familia: FamiliaProducto;
  variantes: VarianteProducto[];
};
export type ResumenFamilia = FamiliaProducto & {
  cantidad: number;
  stock: number;
  desde: number;
  hasta: number;
};
