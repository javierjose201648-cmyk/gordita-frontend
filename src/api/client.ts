import type { Guisado, TipoMasa, Refresco, CategoriaRefresco, User, Gasto, RefriEntry, ResumenDia } from '../types';

const BASE = (import.meta.env.VITE_API_URL as string | undefined) ?? 'http://localhost:3000';

// Token storage 
const TK = 'gorditas_token';
export const tokenStore = {
  get:   ()          => localStorage.getItem(TK),
  set:   (t: string) => localStorage.setItem(TK, t),
  clear: ()          => localStorage.removeItem(TK),
};

//Base request 
async function req<T>(path: string, init: RequestInit = {}): Promise<T> {
  const token = tokenStore.get();
  const res = await fetch(`${BASE}${path}`, {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(init.headers as Record<string, string> | undefined ?? {}),
    },
  });

  const data = await res.json().catch(() => ({}));

  if (!res.ok) {
    // Token expirado, inválido o sin permisos → limpiar sesión y recargar al login
    if (res.status === 401 || res.status === 403) {
      tokenStore.clear();
      window.location.href = '/';
    }
    const err = new Error(
      (data as { message?: string }).message ?? `Error ${res.status}`
    ) as Error & { status: number; data: unknown };
    err.status = res.status;
    err.data   = data;
    throw err;
  }

  return data as T;
}

// ── Admin user type (no password) ────────────────────────────
export interface AdminUser {
  id: number;
  username: string;
  nombre_completo: string;
  rol: 'administrador' | 'empleado';
  activo: boolean;
  creado_en: string;
}

// ── API surface ───────────────────────────────────────────────
export const api = {
  // Auth
  login: (username: string, password: string) =>
    req<{ token: string; usuario: User }>('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ username, password }),
    }),

  // Catalog (public read)
  guisados:  () => req<Guisado[]>('/api/guisados/disponibles'),
  tiposMasa: () => req<TipoMasa[]>('/api/tipos-masa'),
  refrescos: () => req<Refresco[]>('/api/refrescos/disponibles'),

  // Refri inventory (all users)
  refri: {
    getAll:     () => req<RefriEntry[]>('/api/refri'),
    ajustar:    (categoriaId: number, delta: number) =>
      req<RefriEntry>(`/api/refri/${categoriaId}/ajustar`, {
        method: 'PATCH', body: JSON.stringify({ delta }),
      }),
    setCantidad: (categoriaId: number, cantidad: number) =>
      req<RefriEntry>(`/api/refri/${categoriaId}`, {
        method: 'PUT', body: JSON.stringify({ cantidad }),
      }),
  },

  // Gastos (all users)
  gastos: {
    getToday: () => req<Gasto[]>('/api/gastos/hoy'),
    create:   (concepto: string, monto: number) =>
      req<Gasto>('/api/gastos', { method: 'POST', body: JSON.stringify({ concepto, monto }) }),
    delete:   (id: number) =>
      req<{ message: string }>(`/api/gastos/${id}`, { method: 'DELETE' }),
  },

  // Resumen del día (admin only)
  resumen: {
    getHoy:  () => req<ResumenDia>('/api/resumen/hoy'),
    cerrar:  () => req<{ message: string }>('/api/resumen/cerrar', { method: 'POST' }),
  },

  // Promociones
  promos: {
    getActivas: () => req<{ id: number; nombre: string; descripcion: string; precio_fijo: number }[]>('/api/promociones/activas'),
  },

  // Orders
  crearOrden: (body: object) =>
    req<{ id: number; numero_orden: string; total: number }>('/api/ordenes', {
      method: 'POST',
      body: JSON.stringify(body),
    }),

  ordenes: {
    getTurno: () => req<{
      id: number;
      numero_orden: string;
      total: number;
      creado_en: string;
      gorditas: { guisado: string; masa: string; cantidad: number }[];
      bebidas:  { nombre: string; tamaño: string; cantidad: number }[];
    }[]>('/api/ordenes/turno'),
  },

  // ── Admin: Usuarios ──────────────────────────────────────
  admin: {
    usuarios: {
      getAll: () => req<AdminUser[]>('/api/usuarios'),
      create: (data: { username: string; password: string; nombre_completo: string; rol: string }) =>
        req<AdminUser>('/api/usuarios', { method: 'POST', body: JSON.stringify(data) }),
      update: (id: number, data: Partial<{ username: string; nombre_completo: string; rol: string; activo: boolean }>) =>
        req<AdminUser>(`/api/usuarios/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
      updatePassword: (id: number, newPassword: string, oldPassword?: string) =>
        req<{ message: string }>(`/api/usuarios/${id}/password`, {
          method: 'PATCH', body: JSON.stringify({ newPassword, oldPassword }),
        }),
      delete: (id: number) =>
        req<{ message: string }>(`/api/usuarios/${id}`, { method: 'DELETE' }),
    },

    // ── Admin: Guisados ────────────────────────────────────
    guisados: {
      getAll: () => req<Guisado[]>('/api/guisados'),
      create: (nombre: string) =>
        req<Guisado>('/api/guisados', { method: 'POST', body: JSON.stringify({ nombre, precio: 0, disponible: true }) }),
      update: (id: number, data: Partial<Guisado>) =>
        req<Guisado>(`/api/guisados/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
      delete: (id: number) =>
        req<{ message: string }>(`/api/guisados/${id}`, { method: 'DELETE' }),
    },

    // ── Admin: Masas ───────────────────────────────────────
    masas: {
      getAll:  () => req<TipoMasa[]>('/api/tipos-masa'),
      create:  (data: Omit<TipoMasa, 'id'>) =>
        req<TipoMasa>('/api/tipos-masa', { method: 'POST', body: JSON.stringify(data) }),
      update:  (id: number, data: Partial<TipoMasa>) =>
        req<TipoMasa>(`/api/tipos-masa/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
      delete:  (id: number) =>
        req<{ message: string }>(`/api/tipos-masa/${id}`, { method: 'DELETE' }),
    },

    // ── Admin: Refrescos ───────────────────────────────────
    refrescos: {
      getAll: () => req<Refresco[]>('/api/refrescos'),
      create: (data: { nombre: string; sabor: string; tamaño: string; precio: number; categoria_id: number | null }) =>
        req<Refresco>('/api/refrescos', { method: 'POST', body: JSON.stringify({ ...data, disponible: true }) }),
      update: (id: number, data: Partial<{ nombre: string; sabor: string; tamaño: string; precio: number; disponible: boolean; categoria_id: number | null }>) =>
        req<Refresco>(`/api/refrescos/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
      delete: (id: number) =>
        req<{ message: string }>(`/api/refrescos/${id}`, { method: 'DELETE' }),
    },

    // ── Admin: Categorías de refresco ──────────────────────
    categorias: {
      getAll:  () => req<CategoriaRefresco[]>('/api/categorias-refresco'),
      create:  (nombre: string) =>
        req<CategoriaRefresco>('/api/categorias-refresco', { method: 'POST', body: JSON.stringify({ nombre }) }),
      update:  (id: number, nombre: string) =>
        req<CategoriaRefresco>(`/api/categorias-refresco/${id}`, { method: 'PUT', body: JSON.stringify({ nombre }) }),
      delete:  (id: number) =>
        req<{ message: string }>(`/api/categorias-refresco/${id}`, { method: 'DELETE' }),
    },
  },
};
