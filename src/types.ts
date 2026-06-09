export interface User {
  id: number;
  username: string;
  nombre: string;
  rol: 'administrador' | 'empleado';
}

export interface Guisado {
  id: number;
  nombre: string;
  precio: number;
  disponible: boolean;
}

export interface TipoMasa {
  id: number;
  nombre: string;
  precio_extra: number;   // this IS the gordita price for this masa
  disponible: boolean;
}

export interface OrderItem {
  localId: string;
  guisado_id: number;
  guisado_nombre: string;
  tipo_masa_id: number;
  masa_label: string;     // 'Harina' | 'Maíz'
  cantidad: number;
  precio_unitario: number;
  subtotal: number;
}

export interface CategoriaRefresco {
  id: number;
  nombre: string;
}

export interface Refresco {
  id: number;
  nombre: string;
  sabor: string;
  tamaño: string;
  precio: number;
  disponible: boolean;
  categoria_id: number | null;
  categoria_nombre?: string;
}

export interface DrinkItem {
  localId: string;
  refresco_id: number;
  nombre: string;
  sabor: string;
  tamaño: string;
  cantidad: number;
  precio_unitario: number;
  subtotal: number;
}

export interface RefriEntry {
  id: number;
  categoria_id: number;
  categoria_nombre: string;
  cantidad: number;
  actualizado_en: string;
}

export interface Gasto {
  id: number;
  concepto: string;
  monto: number;
  fecha: string;
  usuario_id: number | null;
  creado_en: string;
}

export interface GorditaResumen {
  masa_nombre: string;
  cantidad: number;
  subtotal: number;
}

export interface RefrescoVendidoResumen {
  categoria_nombre: string;
  cantidad: number;
  subtotal: number;
}

export interface ResumenDia {
  turno_id: number;
  turno_inicio: string;
  total_ventas: number;
  total_gorditas_pesos: number;
  total_refrescos_pesos: number;
  gorditas: GorditaResumen[];
  total_gorditas: number;
  refrescos_vendidos: RefrescoVendidoResumen[];
  total_refrescos: number;
  gastos: Gasto[];
  total_gastos: number;
  refri_actual: {
    categoria_id: number;
    categoria_nombre: string;
    cantidad: number;
  }[];
}
