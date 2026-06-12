import { useState, useEffect, useCallback } from 'react'
import type { Guisado, TipoMasa, Refresco, OrderItem, DrinkItem } from '../types'
import { api } from '../api/client'
import { useAuth } from '../context/AuthContext'
import GuisadoPanel from './GuisadoPanel'
import DrinkPanel from './DrinkPanel'
import OrderTable from './OrderTable'
import PaymentScreen from './PaymentScreen'
import AdminPanel   from './AdminPanel'
import GastosPanel  from './GastosPanel'
import CajaPanel    from './CajaPanel'
import RefriPanel   from './RefriPanel'
import ResumenPanel from './ResumenPanel'
import ComboPanel   from './ComboPanel'
import OrdenesPanel from './OrdenesPanel'

type Phase = 'guisados' | 'drinks' | 'combos' | 'payment'

interface Toast { msg: string; type: 'success' | 'error' }

interface TurnoOrder {
  id: number
  numero_orden: string
  total: number
  creado_en: string
  gorditas: { guisado: string; masa: string; cantidad: number }[]
  bebidas:  { nombre: string; tamaño: string; cantidad: number }[]
}

const ORDER_KEY = 'gordita_order_v1'

export default function OrderScreen() {
  const { user, logout } = useAuth()

  // ── Catalog ────────────────────────────────────────────────
  const [guisados,  setGuisados]  = useState<Guisado[]>([])
  const [tiposMasa, setTiposMasa] = useState<TipoMasa[]>([])
  const [refrescos, setRefrescos] = useState<Refresco[]>([])

  // ── Order state ────────────────────────────────────────────
  const [phase, setPhase] = useState<Phase>('guisados')
  // Single item list — all confirmed gorditas (no draft/confirmed split)
  const [items,         setItems]         = useState<OrderItem[]>(() => {
    try { return JSON.parse(localStorage.getItem(ORDER_KEY) ?? '{}').items ?? [] } catch { return [] }
  })
  const [drinkItems,    setDrinkItems]    = useState<DrinkItem[]>(() => {
    try { return JSON.parse(localStorage.getItem(ORDER_KEY) ?? '{}').drinkItems ?? [] } catch { return [] }
  })
  const [masaFijaId,    setMasaFijaId]    = useState<number | null>(null)
  const [lockedItemIds,  setLockedItemIds]  = useState<Set<string>>(new Set())
  const [lockedDrinkIds, setLockedDrinkIds] = useState<Set<string>>(new Set())
  // Combo tracking: target = gorditas needed (10 or 3), base = gordita count before combo started
  const [comboTarget,   setComboTarget]   = useState<number | null>(null)
  const [comboBase,     setComboBase]     = useState(0)
  // Session tally — used by ResumenPanel; not displayed in this screen
  const [soldByMasa,    setSoldByMasa]    = useState<Record<string, number>>(() => {
    try { return JSON.parse(localStorage.getItem(ORDER_KEY) ?? '{}').soldByMasa ?? {} } catch { return {} }
  })
  // Orders committed to the DB during this shift (shown in right panel)
  const [turnoOrders, setTurnoOrders] = useState<TurnoOrder[]>([])

  // ── UI ─────────────────────────────────────────────────────
  const [loading,    setLoading]    = useState(false)
  const [toast,      setToast]      = useState<Toast | null>(null)
  const [showAdmin,    setShowAdmin]    = useState(() => window.location.hash === '#admin')
  const [showGastos,  setShowGastos]  = useState(() => window.location.hash === '#gastos')
  const [showCaja,    setShowCaja]    = useState(() => window.location.hash === '#caja')
  const [showRefri,   setShowRefri]   = useState(() => window.location.hash === '#refri')
  const [showResumen, setShowResumen] = useState(() => window.location.hash === '#resumen')
  const [showOrdenes, setShowOrdenes] = useState(() => window.location.hash === '#ordenes')

  useEffect(() => {
    if (showAdmin)         window.history.replaceState(null, '', '#admin')
    else if (showGastos)  window.history.replaceState(null, '', '#gastos')
    else if (showCaja)    window.history.replaceState(null, '', '#caja')
    else if (showRefri)   window.history.replaceState(null, '', '#refri')
    else if (showResumen) window.history.replaceState(null, '', '#resumen')
    else if (showOrdenes) window.history.replaceState(null, '', '#ordenes')
    else                  window.history.replaceState(null, '', window.location.pathname)
  }, [showAdmin, showGastos, showCaja, showRefri, showResumen, showOrdenes])

  useEffect(() => {
    const onHashChange = () => {
      setShowAdmin(window.location.hash === '#admin')
      setShowGastos(window.location.hash === '#gastos')
      setShowCaja(window.location.hash === '#caja')
      setShowRefri(window.location.hash === '#refri')
      setShowResumen(window.location.hash === '#resumen')
      setShowOrdenes(window.location.hash === '#ordenes')
    }
    window.addEventListener('hashchange', onHashChange)
    return () => window.removeEventListener('hashchange', onHashChange)
  }, [])

  function fetchTurnoOrders() {
    api.ordenes.getTurno()
      .then(setTurnoOrders)
      .catch(() => {/* silencioso — no crítico */})
  }

  useEffect(() => {
    api.guisados()
      .then(setGuisados)
      .catch(() => showToast('Error cargando guisados', 'error'))
    api.tiposMasa()
      .then(ms => setTiposMasa(ms.filter(m => m.disponible && !m.nombre.toLowerCase().includes('integral'))))
      .catch(() => showToast('Error cargando tipos de masa', 'error'))
    api.refrescos()
      .then(setRefrescos)
      .catch(() => showToast('Error cargando bebidas', 'error'))
    fetchTurnoOrders()
  }, [])

  useEffect(() => {
    localStorage.setItem(ORDER_KEY, JSON.stringify({ items, drinkItems, soldByMasa }))
  }, [items, drinkItems, soldByMasa])

  useEffect(() => {
    if (!toast) return
    const t = setTimeout(() => setToast(null), 3500)
    return () => clearTimeout(t)
  }, [toast])

  function showToast(msg: string, type: Toast['type']) {
    setToast({ msg, type })
  }

  // ── Derived ────────────────────────────────────────────────
  const comboProgress   = comboTarget !== null
    ? items.reduce((s, i) => s + i.cantidad, 0) - comboBase
    : 0
  const gorditasFaltantes = comboTarget !== null ? Math.max(0, comboTarget - comboProgress) : 0
  const comboIncompleto   = comboTarget !== null && gorditasFaltantes > 0

  const total = items.reduce((s, i) => s + i.subtotal, 0)
              + drinkItems.reduce((s, i) => s + i.subtotal, 0)

  // ── Gordita handlers ───────────────────────────────────────
  // Adds directly to items. Merges with existing non-locked entries of same guisado+masa.
  const handleAddItem = useCallback((item: Omit<OrderItem, 'localId'>) => {
    setItems(prev => {
      const existing = prev.find(
        i => i.guisado_id === item.guisado_id &&
             i.tipo_masa_id === item.tipo_masa_id &&
             !lockedItemIds.has(i.localId)
      )
      if (existing) {
        return prev.map(i =>
          i.localId === existing.localId
            ? { ...i, cantidad: i.cantidad + item.cantidad, subtotal: i.subtotal + item.subtotal }
            : i
        )
      }
      return [...prev, { ...item, localId: crypto.randomUUID() }]
    })
  }, [lockedItemIds])

  // Cancels an active combo: removes locked items/drinks and resets combo state.
  // Stays in guisados — guisados is the home screen now.
  function handleCancelCombo() {
    setItems(prev => prev.filter(i => !lockedItemIds.has(i.localId)))
    setDrinkItems(prev => prev.filter(d => !lockedDrinkIds.has(d.localId)))
    setLockedItemIds(new Set())
    setLockedDrinkIds(new Set())
    setComboTarget(null)
    setMasaFijaId(null)
  }

  // Called when a combo is complete and the employee presses "Agregar combo".
  // Unlocks all combo items so they become regular order items, then stays in guisados.
  function handleFinishCombo() {
    setLockedItemIds(new Set())
    setLockedDrinkIds(new Set())
    setComboTarget(null)
    setMasaFijaId(null)
  }

  function handleDeleteItem(localId: string) {
    if (lockedItemIds.has(localId)) return
    setItems(prev => prev.filter(i => i.localId !== localId))
  }

  // ── Drink handlers ─────────────────────────────────────────
  const handleAddDrink = useCallback((item: Omit<DrinkItem, 'localId'>) => {
    setDrinkItems(prev => {
      const existing = prev.find(d => d.refresco_id === item.refresco_id)
      if (existing) {
        return prev.map(d =>
          d.localId === existing.localId
            ? { ...d, cantidad: d.cantidad + item.cantidad, subtotal: d.subtotal + item.subtotal }
            : d
        )
      }
      return [...prev, { ...item, localId: crypto.randomUUID() }]
    })
  }, [])

  function handleDeleteDrink(localId: string) {
    if (lockedDrinkIds.has(localId)) return
    setDrinkItems(prev => prev.filter(d => d.localId !== localId))
  }

  function handleClear() {
    setItems(prev => prev.filter(i => lockedItemIds.has(i.localId)))
    setDrinkItems(prev => prev.filter(d => lockedDrinkIds.has(d.localId)))
  }

  function resetOrder() {
    setItems([])
    setDrinkItems([])
    setPhase('guisados')
    setMasaFijaId(null)
    setLockedItemIds(new Set())
    setLockedDrinkIds(new Set())
    setComboTarget(null)
    setComboBase(0)
    localStorage.removeItem(ORDER_KEY)
  }

  // ── Combo handler ──────────────────────────────────────────
  // Drinks are APPENDED so that a previous combo's soda is never lost.
  // comboBase records gordita count before combo starts so progress is isolated.
  function handleSelectCombo(comboId: 1 | 2) {
    const harina = tiposMasa.find(m => m.nombre.toLowerCase().includes('harina'))
    if (!harina) return

    const baseCount = items.reduce((s, i) => s + i.cantidad, 0)
    setComboBase(baseCount)

    if (comboId === 2) {
      // Combo Familiar: 10 gorditas de harina + Refresco 1.75 combo
      const bebida  = refrescos.find(r => r.nombre === 'Refresco 1.75 combo')
      const drinkId = crypto.randomUUID()
      if (bebida) {
        const precio = Number(bebida.precio)
        setDrinkItems(prev => [...prev, {
          localId: drinkId,
          refresco_id: bebida.id,
          nombre: bebida.nombre,
          sabor: bebida.sabor,
          tamaño: bebida.tamaño,
          cantidad: 1,
          precio_unitario: precio,
          subtotal: precio,
        }])
        setLockedDrinkIds(new Set([drinkId]))
      }
      setLockedItemIds(new Set())
      setComboTarget(10)
      setMasaFijaId(harina.id)
      setPhase('guisados')
    } else {
      // Combo Individual: 1 gordita frijoles (locked) + 2 a elegir + Lata combo
      const bebida   = refrescos.find(r => r.nombre === 'Lata combo')
      const frijoles = guisados.find(g => g.nombre.toLowerCase().includes('frijol'))
      const drinkId  = crypto.randomUUID()
      const itemId   = crypto.randomUUID()
      if (bebida) {
        const precio = Number(bebida.precio)
        setDrinkItems(prev => [...prev, {
          localId: drinkId,
          refresco_id: bebida.id,
          nombre: bebida.nombre,
          sabor: bebida.sabor,
          tamaño: bebida.tamaño,
          cantidad: 1,
          precio_unitario: precio,
          subtotal: precio,
        }])
        setLockedDrinkIds(new Set([drinkId]))
      }
      if (frijoles) {
        const precioMasa = Number(harina.precio)
        setItems(prev => [...prev, {
          localId: itemId,
          guisado_id: frijoles.id,
          guisado_nombre: frijoles.nombre,
          tipo_masa_id: harina.id,
          masa_label: 'Harina',
          cantidad: 1,
          precio_unitario: precioMasa,
          subtotal: precioMasa,
        }])
        setLockedItemIds(new Set([itemId]))
      }
      setComboTarget(3)
      setMasaFijaId(harina.id)
      setPhase('guisados')
    }
  }

  // ── Payment ────────────────────────────────────────────────
  async function handleConfirmPayment(metodo: 'efectivo' | 'tarjeta') {
    setLoading(true)
    try {
      const result = await api.crearOrden({
        metodo_pago: metodo,
        items: items.map(i => ({
          tipo_masa_id: i.tipo_masa_id,
          guisado_id:   i.guisado_id,
          cantidad:     i.cantidad,
        })),
        refrescos: drinkItems.map(d => ({
          refresco_id: d.refresco_id,
          cantidad:    d.cantidad,
        })),
      })
      setSoldByMasa(prev => {
        const next = { ...prev }
        items.forEach(i => { next[i.masa_label] = (next[i.masa_label] ?? 0) + i.cantidad })
        return next
      })
      showToast(`✓ Orden #${result.numero_orden} — $${result.total} (${metodo})`, 'success')
      resetOrder()
      fetchTurnoOrders()
    } catch (err: unknown) {
      showToast(err instanceof Error ? err.message : 'Error al crear la orden', 'error')
    } finally {
      setLoading(false)
    }
  }

  // ── Panel overlays ─────────────────────────────────────────
  if (showOrdenes) return (
    <OrdenesPanel
      onClose={() => setShowOrdenes(false)}
      onChanged={fetchTurnoOrders}
    />
  )
  if (showAdmin)   return <AdminPanel   onClose={() => setShowAdmin(false)} />
  if (showGastos)  return <GastosPanel  onClose={() => setShowGastos(false)} />
  if (showCaja)    return <CajaPanel    onClose={() => setShowCaja(false)} />
  if (showRefri)   return <RefriPanel   onClose={() => setShowRefri(false)} />
  if (showResumen) return (
    <ResumenPanel
      onClose={() => setShowResumen(false)}
      onTurnoCerrado={() => {
        setSoldByMasa({})
        setTurnoOrders([])
        fetchTurnoOrders()
        setShowResumen(false)
      }}
    />
  )

  // Payment overlay — onCancel returns to guisados
  if (phase === 'payment') {
    return (
      <>
        {toast && (
          <div
            className={`fixed top-0 left-0 right-0 z-[60] px-4 py-2.5 text-center
                        text-sm font-semibold text-white
                        ${toast.type === 'success' ? 'bg-green-500' : 'bg-red-500'}`}
          >
            {toast.msg}
          </div>
        )}
        <PaymentScreen
          items={items}
          drinkItems={drinkItems}
          total={total}
          onConfirm={handleConfirmPayment}
          onCancel={() => setPhase('guisados')}
          loading={loading}
        />
      </>
    )
  }

  // ── Button labels / actions for the right panel (OrderTable) ──
  const cobrarLabel =
    phase === 'guisados'
      ? comboTarget !== null
        ? comboIncompleto
          ? `Faltan ${gorditasFaltantes} gordita${gorditasFaltantes !== 1 ? 's' : ''}`
          : 'Agregar combo'
        : undefined  // normal guisados → shows default "Cobrar $X"
      : phase === 'drinks'
        ? 'Agregar refrescos'
        : phase === 'combos'
          ? 'Agregar'
          : undefined

  const cobrarAction =
    phase === 'guisados'
      ? comboTarget !== null
        ? handleFinishCombo
        : () => setPhase('payment')
      : () => setPhase('guisados')  // drinks + combos both return to guisados

  return (
    <div className="h-screen flex flex-col bg-orange-50 overflow-hidden">

      {/* Header */}
      <header className="bg-orange-600 text-white px-4 py-3 flex items-center justify-between
                         shrink-0 shadow-md z-10">
        <div className="flex items-center gap-2 select-none shrink-0">
          <img src="/logo.png" alt="Gorditas Luly" className="h-9 w-9 object-contain rounded-full" />
          <span className="font-black text-lg tracking-tight">Gorditas Luly</span>
        </div>
        <div className="flex-1 overflow-x-auto ml-2">
          <div className="flex items-center gap-2 justify-end min-w-max">
            <span className="text-orange-200 text-sm hidden sm:block">
              {user?.nombre || user?.username}
            </span>
            <button
              onClick={() => setShowRefri(true)}
              className="bg-orange-700 hover:bg-orange-800 active:bg-orange-900
                         text-white text-sm px-3 py-1.5 rounded-xl transition-colors whitespace-nowrap"
            >
              🧊 Refri
            </button>
            <button
              onClick={() => setShowGastos(true)}
              className="bg-orange-700 hover:bg-orange-800 active:bg-orange-900
                         text-white text-sm px-3 py-1.5 rounded-xl transition-colors whitespace-nowrap"
            >
              💸 Gastos
            </button>
            <button
              onClick={() => setShowCaja(true)}
              className="bg-orange-700 hover:bg-orange-800 active:bg-orange-900
                         text-white text-sm px-3 py-1.5 rounded-xl transition-colors whitespace-nowrap"
            >
              💵 Caja
            </button>
            {user?.rol === 'administrador' && (
              <>
                <button
                  onClick={() => setShowOrdenes(true)}
                  className="bg-orange-700 hover:bg-orange-800 active:bg-orange-900
                             text-white text-sm px-3 py-1.5 rounded-xl transition-colors whitespace-nowrap"
                >
                  📋 Órdenes
                </button>
                <button
                  onClick={() => setShowResumen(true)}
                  className="bg-orange-700 hover:bg-orange-800 active:bg-orange-900
                             text-white text-sm px-3 py-1.5 rounded-xl transition-colors whitespace-nowrap"
                >
                  📊 Resumen
                </button>
                <button
                  onClick={() => setShowAdmin(true)}
                  className="bg-orange-700 hover:bg-orange-800 active:bg-orange-900
                             text-white text-sm px-3 py-1.5 rounded-xl transition-colors whitespace-nowrap"
                >
                  ⚙️ Ajustes
                </button>
              </>
            )}
            <button
              onClick={logout}
              className="bg-orange-700 hover:bg-orange-800 active:bg-orange-900
                         text-white text-sm px-3 py-1.5 rounded-xl transition-colors whitespace-nowrap"
            >
              Salir
            </button>
          </div>
        </div>
      </header>

      {/* Toast */}
      {toast && (
        <div
          className={`shrink-0 px-4 py-2.5 text-center text-sm font-semibold text-white
                      ${toast.type === 'success' ? 'bg-green-500' : 'bg-red-500'}`}
        >
          {toast.msg}
        </div>
      )}

      {/* Main */}
      <div className="flex-1 flex flex-col md:flex-row gap-3 p-3 min-h-0">

        {/* ── PANEL CENTRAL ── */}
        <div className="flex-1 bg-white rounded-2xl shadow-md p-4 flex flex-col min-h-0 overflow-y-auto">

          {phase === 'guisados' && (
            <GuisadoPanel
              guisados={guisados}
              tiposMasa={tiposMasa}
              masaFijaId={masaFijaId ?? undefined}
              comboMode={comboTarget !== null}
              onAdd={handleAddItem}
              onCancelCombo={handleCancelCombo}
              onRefrescos={() => setPhase('drinks')}
              onCombos={() => setPhase('combos')}
            />
          )}

          {phase === 'drinks' && (
            <DrinkPanel
              refrescos={refrescos}
              onAdd={handleAddDrink}
              onBack={() => setPhase('guisados')}
            />
          )}

          {phase === 'combos' && (
            <ComboPanel
              onSelectCombo={handleSelectCombo}
              onBack={() => setPhase('guisados')}
            />
          )}
        </div>

        {/* ── RIGHT PANEL — Orden actual + Órdenes del turno ── */}
        <div className="w-full md:w-52 lg:w-64 shrink-0 flex flex-col gap-2 min-h-[260px] md:min-h-0">

          {/* OrderTable — ocupa 2/3 del alto */}
          <div className="flex-[2] min-h-0">
            <OrderTable
              items={items}
              drinkItems={drinkItems}
              onDelete={handleDeleteItem}
              onDeleteDrink={handleDeleteDrink}
              onClear={handleClear}
              lockedItemIds={phase === 'guisados' ? lockedItemIds : undefined}
              lockedDrinkIds={phase === 'guisados' ? lockedDrinkIds : undefined}
              cobrarDisabled={comboIncompleto}
              onCobrar={cobrarAction}
              cobrarLabel={cobrarLabel}
            />
          </div>

          {/* Órdenes del turno — ocupa 1/3 del alto */}
          <div className="flex-1 bg-white rounded-2xl shadow-md p-3 flex flex-col min-h-0 overflow-hidden">
            <p className="text-xs font-bold text-gray-400 uppercase tracking-wide mb-2 shrink-0">
              Órdenes del turno
            </p>
            <div className="flex-1 overflow-y-auto space-y-2 min-h-0 pr-0.5">
              {turnoOrders.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full
                                text-gray-300 select-none py-4">
                  <div className="text-3xl mb-1">🧾</div>
                  <p className="text-xs">Sin órdenes aún</p>
                </div>
              ) : (
                [...turnoOrders].reverse().map(o => {
                  const hora = new Date(o.creado_en).toLocaleTimeString('es-MX', {
                    hour: '2-digit', minute: '2-digit', hour12: false,
                  })
                  return (
                    <div key={o.id}
                      className="bg-gray-50 border border-gray-200 rounded-xl px-3 py-2">
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-black text-sm text-gray-700">#{o.numero_orden}</span>
                        <span className="text-xs text-gray-400 font-medium">{hora}</span>
                      </div>
                      <div className="space-y-0.5">
                        {o.gorditas.map((g, i) => (
                          <p key={i} className="text-xs text-gray-600 leading-tight">
                            {g.cantidad}× <span className="font-medium">{g.guisado}</span>
                            <span className="text-gray-400"> · {g.masa}</span>
                          </p>
                        ))}
                        {o.bebidas?.map((b, i) => (
                          <p key={`b${i}`} className="leading-tight"
                             style={{ fontSize: '10px' }}>
                            <span className="text-blue-400">{b.cantidad}× </span>
                            <span className="text-gray-500">{b.tamaño}</span>
                          </p>
                        ))}
                      </div>
                      <p className="text-xs font-black text-orange-500 mt-1.5">
                        ${Number(o.total).toFixed(0)}
                      </p>
                    </div>
                  )
                })
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
