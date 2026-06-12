import { useEffect, useState } from 'react'
import { api } from '../api/client'

type TurnoOrder = Awaited<ReturnType<typeof api.ordenes.getTurno>>[number]

type FullOrder = Awaited<ReturnType<typeof api.ordenes.getById>>

interface EditState {
  items:     Record<number, number>   // row id → nueva cantidad (puede ser 0)
  refrescos: Record<number, number>
}

interface Props {
  onClose: () => void
  onChanged: () => void  // called after edit/delete so parent can refresh turno list
}

export default function OrdenesPanel({ onClose, onChanged }: Props) {
  const [orders, setOrders]       = useState<TurnoOrder[]>([])
  const [loading, setLoading]     = useState(true)
  const [editOrder, setEditOrder] = useState<FullOrder | null>(null)
  const [editState, setEditState] = useState<EditState>({ items: {}, refrescos: {} })
  const [saving, setSaving]       = useState(false)
  const [error, setError]         = useState<string | null>(null)

  async function fetchOrders() {
    setLoading(true)
    try {
      setOrders(await api.ordenes.getTurno())
    } catch {
      setError('No se pudieron cargar las órdenes.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchOrders() }, [])

  // ── Open edit view ────────────────────────────────────────────
  async function openEdit(id: number) {
    setError(null)
    try {
      const full = await api.ordenes.getById(id)
      setEditOrder(full)
      setEditState({
        items:     Object.fromEntries(full.items.map(i => [i.id, i.cantidad])),
        refrescos: Object.fromEntries(full.refrescos.map(r => [r.id, r.cantidad])),
      })
    } catch {
      setError('No se pudo cargar la orden.')
    }
  }

  function closeEdit() {
    setEditOrder(null)
    setEditState({ items: {}, refrescos: {} })
    setError(null)
  }

  // ── Quantity helpers ──────────────────────────────────────────
  function setItemQty(id: number, delta: number) {
    setEditState(prev => ({
      ...prev,
      items: { ...prev.items, [id]: Math.max(0, (prev.items[id] ?? 1) + delta) },
    }))
  }

  function removeItem(id: number) {
    setEditState(prev => ({ ...prev, items: { ...prev.items, [id]: 0 } }))
  }

  function setRefQty(id: number, delta: number) {
    setEditState(prev => ({
      ...prev,
      refrescos: { ...prev.refrescos, [id]: Math.max(0, (prev.refrescos[id] ?? 1) + delta) },
    }))
  }

  function removeRef(id: number) {
    setEditState(prev => ({ ...prev, refrescos: { ...prev.refrescos, [id]: 0 } }))
  }

  // ── Derived totals ────────────────────────────────────────────
  const editTotal = editOrder
    ? editOrder.items.reduce((s, i) => {
        const qty = editState.items[i.id] ?? i.cantidad
        return s + Number(i.precio_unitario) * qty
      }, 0) +
      editOrder.refrescos.reduce((s, r) => {
        const qty = editState.refrescos[r.id] ?? r.cantidad
        return s + Number(r.precio_unitario) * qty
      }, 0)
    : 0

  const allZero = editOrder
    ? Object.values(editState.items).every(q => q === 0) &&
      Object.values(editState.refrescos).every(q => q === 0)
    : false

  // ── Save changes ──────────────────────────────────────────────
  async function handleSave() {
    if (!editOrder) return
    setSaving(true)
    setError(null)
    try {
      await api.ordenes.update(editOrder.id, {
        items:     editOrder.items.map(i => ({ id: i.id, cantidad: editState.items[i.id] ?? i.cantidad })),
        refrescos: editOrder.refrescos.map(r => ({ id: r.id, cantidad: editState.refrescos[r.id] ?? r.cantidad })),
      })
      onChanged()
      closeEdit()
      fetchOrders()
    } catch {
      setError('Error al guardar cambios.')
    } finally {
      setSaving(false)
    }
  }

  // ── Delete order ──────────────────────────────────────────────
  async function handleDelete(id: number) {
    if (!window.confirm('¿Eliminar esta orden? No se puede deshacer.')) return
    setError(null)
    try {
      await api.ordenes.delete(id)
      onChanged()
      fetchOrders()
    } catch {
      setError('Error al eliminar la orden.')
    }
  }

  // ── Render ────────────────────────────────────────────────────
  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-white">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200 shrink-0">
        {editOrder ? (
          <>
            <button
              onClick={closeEdit}
              className="text-gray-500 hover:text-gray-700 font-medium text-sm flex items-center gap-1"
            >
              ← Volver
            </button>
            <h2 className="font-bold text-gray-800 text-base">
              Orden #{editOrder.numero_orden}
            </h2>
            <div className="w-16" />
          </>
        ) : (
          <>
            <h2 className="font-bold text-gray-800 text-base">📋 Órdenes del turno</h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-700 text-xl font-bold leading-none"
            >
              ✕
            </button>
          </>
        )}
      </div>

      {/* Error banner */}
      {error && (
        <div className="px-4 py-2 bg-red-50 text-red-600 text-sm border-b border-red-100">
          {error}
        </div>
      )}

      {/* Body */}
      <div className="flex-1 overflow-y-auto">
        {editOrder ? (
          /* ── Edit view ── */
          <div className="p-4 flex flex-col gap-4">
            {/* Gorditas */}
            {editOrder.items.length > 0 && (
              <section>
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
                  Gorditas
                </p>
                <div className="flex flex-col gap-2">
                  {editOrder.items.map(item => {
                    const qty = editState.items[item.id] ?? item.cantidad
                    if (qty === 0) return null
                    return (
                      <div
                        key={item.id}
                        className="flex items-center gap-2 bg-orange-50 border border-orange-200 rounded-xl px-3 py-2"
                      >
                        <div className="flex-1 min-w-0">
                          <p className="font-semibold text-gray-800 text-sm truncate">
                            {item.guisado_nombre}
                          </p>
                          <p className="text-xs text-gray-500">{item.tipo_masa_nombre} · ${Number(item.precio_unitario)} c/u</p>
                        </div>
                        <div className="flex items-center gap-1 shrink-0">
                          <button
                            onClick={() => setItemQty(item.id, -1)}
                            disabled={qty <= 1}
                            className="w-7 h-7 rounded-lg bg-white border border-gray-300
                                       text-gray-700 font-bold text-base leading-none
                                       disabled:opacity-30 hover:bg-gray-50 active:bg-gray-100"
                          >
                            −
                          </button>
                          <span className="w-6 text-center font-bold text-gray-800 text-sm">{qty}</span>
                          <button
                            onClick={() => setItemQty(item.id, +1)}
                            className="w-7 h-7 rounded-lg bg-white border border-gray-300
                                       text-gray-700 font-bold text-base leading-none
                                       hover:bg-gray-50 active:bg-gray-100"
                          >
                            +
                          </button>
                          <button
                            onClick={() => removeItem(item.id)}
                            className="w-7 h-7 rounded-lg bg-red-50 border border-red-200
                                       text-red-500 font-bold text-sm leading-none ml-1
                                       hover:bg-red-100 active:bg-red-200"
                            title="Quitar"
                          >
                            ×
                          </button>
                        </div>
                      </div>
                    )
                  })}
                  {editOrder.items.every(i => (editState.items[i.id] ?? i.cantidad) === 0) && (
                    <p className="text-sm text-gray-400 italic">Sin gorditas</p>
                  )}
                </div>
              </section>
            )}

            {/* Refrescos */}
            {editOrder.refrescos.length > 0 && (
              <section>
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
                  Refrescos
                </p>
                <div className="flex flex-col gap-2">
                  {editOrder.refrescos.map(ref => {
                    const qty = editState.refrescos[ref.id] ?? ref.cantidad
                    if (qty === 0) return null
                    return (
                      <div
                        key={ref.id}
                        className="flex items-center gap-2 bg-blue-50 border border-blue-200 rounded-xl px-3 py-2"
                      >
                        <div className="flex-1 min-w-0">
                          <p className="font-semibold text-gray-800 text-sm truncate">
                            {ref.refresco_nombre}
                          </p>
                          <p className="text-xs text-gray-500">
                            {ref.sabor} · {ref.tamaño} · ${Number(ref.precio_unitario)} c/u
                          </p>
                        </div>
                        <div className="flex items-center gap-1 shrink-0">
                          <button
                            onClick={() => setRefQty(ref.id, -1)}
                            disabled={qty <= 1}
                            className="w-7 h-7 rounded-lg bg-white border border-gray-300
                                       text-gray-700 font-bold text-base leading-none
                                       disabled:opacity-30 hover:bg-gray-50 active:bg-gray-100"
                          >
                            −
                          </button>
                          <span className="w-6 text-center font-bold text-gray-800 text-sm">{qty}</span>
                          <button
                            onClick={() => setRefQty(ref.id, +1)}
                            className="w-7 h-7 rounded-lg bg-white border border-gray-300
                                       text-gray-700 font-bold text-base leading-none
                                       hover:bg-gray-50 active:bg-gray-100"
                          >
                            +
                          </button>
                          <button
                            onClick={() => removeRef(ref.id)}
                            className="w-7 h-7 rounded-lg bg-red-50 border border-red-200
                                       text-red-500 font-bold text-sm leading-none ml-1
                                       hover:bg-red-100 active:bg-red-200"
                            title="Quitar"
                          >
                            ×
                          </button>
                        </div>
                      </div>
                    )
                  })}
                  {editOrder.refrescos.every(r => (editState.refrescos[r.id] ?? r.cantidad) === 0) && (
                    <p className="text-sm text-gray-400 italic">Sin refrescos</p>
                  )}
                </div>
              </section>
            )}

            {allZero && (
              <p className="text-sm text-red-500 text-center bg-red-50 rounded-xl px-3 py-2">
                Todos los productos son 0 — usa <strong>Eliminar orden</strong> en su lugar.
              </p>
            )}
          </div>
        ) : (
          /* ── List view ── */
          <div className="p-4 flex flex-col gap-3">
            {loading && (
              <p className="text-center text-gray-400 py-8 text-sm">Cargando…</p>
            )}
            {!loading && orders.length === 0 && (
              <p className="text-center text-gray-400 py-8 text-sm">No hay órdenes en este turno.</p>
            )}
            {!loading && orders.map(order => (
              <div
                key={order.id}
                className="bg-white border border-gray-200 rounded-2xl shadow-sm overflow-hidden"
              >
                {/* Card header */}
                <div className="flex items-center justify-between px-4 py-2.5 bg-orange-50 border-b border-orange-100">
                  <span className="font-bold text-orange-700 text-sm">
                    #{order.numero_orden}
                  </span>
                  <span className="font-bold text-gray-700 text-sm">
                    ${Number(order.total).toFixed(2)}
                  </span>
                </div>

                {/* Card body */}
                <div className="px-4 py-2 text-xs text-gray-600 space-y-0.5">
                  {order.gorditas.map((g, i) => (
                    <p key={i}>• {g.guisado} ({g.masa}) × {g.cantidad}</p>
                  ))}
                  {order.bebidas.map((b, i) => (
                    <p key={i}>🥤 {b.nombre} {b.tamaño} × {b.cantidad}</p>
                  ))}
                </div>

                {/* Card actions */}
                <div className="grid grid-cols-2 gap-2 px-4 py-2.5 border-t border-gray-100">
                  <button
                    onClick={() => openEdit(order.id)}
                    className="py-2 bg-blue-50 hover:bg-blue-100 active:bg-blue-200
                               border border-blue-200 rounded-xl text-blue-600 font-semibold
                               text-sm transition-colors"
                  >
                    ✏️ Editar
                  </button>
                  <button
                    onClick={() => handleDelete(order.id)}
                    className="py-2 bg-red-50 hover:bg-red-100 active:bg-red-200
                               border border-red-200 rounded-xl text-red-600 font-semibold
                               text-sm transition-colors"
                  >
                    🗑️ Eliminar
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Footer — only in edit view */}
      {editOrder && (
        <div className="shrink-0 border-t border-gray-200 px-4 py-3 bg-white flex items-center gap-3">
          <div className="flex-1">
            <p className="text-xs text-gray-500">Total actualizado</p>
            <p className="font-bold text-gray-800 text-lg">${editTotal.toFixed(2)}</p>
          </div>
          <button
            onClick={handleSave}
            disabled={saving || allZero}
            className="flex-1 py-3 bg-green-500 hover:bg-green-600 active:bg-green-700
                       disabled:opacity-40 text-white font-bold rounded-2xl text-sm
                       transition-colors shadow-md"
          >
            {saving ? 'Guardando…' : '✓ Guardar cambios'}
          </button>
        </div>
      )}
    </div>
  )
}
