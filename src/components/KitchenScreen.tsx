import { useEffect, useState, useCallback } from 'react'
import { api, tokenStore } from '../api/client'

type TurnoOrder = Awaited<ReturnType<typeof api.ordenes.getTurnoKitchen>>[number]

// Computed once on page load — stable for the lifetime of this tab.
// Priority: static kitchen token (?k=) > logged-in JWT > neither
const kitchenKey = new URLSearchParams(window.location.search).get('k') ?? ''
const authMode: 'token' | 'jwt' | 'none' =
  kitchenKey ? 'token' : tokenStore.get() ? 'jwt' : 'none'

export default function KitchenScreen() {
  const [orders, setOrders] = useState<TurnoOrder[]>([])
  const [tick,   setTick]   = useState(new Date())
  const [error,  setError]  = useState<string | null>(null)

  const fetchOrders = useCallback(async () => {
    try {
      const data = authMode === 'token'
        ? await api.ordenes.getTurnoKitchen(kitchenKey)
        : await api.ordenes.getTurno()
      setOrders(data)
      setTick(new Date())
      setError(null)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Error de conexión')
    }
  }, [])

  useEffect(() => {
    if (authMode === 'none') return
    fetchOrders()
    const id = setInterval(fetchOrders, 3000)
    return () => clearInterval(id)
  }, [fetchOrders])

  // Clock in header
  const [clock, setClock] = useState(() =>
    new Date().toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false })
  )
  useEffect(() => {
    const id = setInterval(() =>
      setClock(new Date().toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false }))
    , 1000)
    return () => clearInterval(id)
  }, [])

  // ── Sin credencial ─────────────────────────────────────────────
  if (authMode === 'none') {
    return (
      <div className="h-screen bg-gray-900 flex flex-col items-center justify-center gap-6 select-none">
        <div className="text-7xl animate-pulse">🍽️</div>
        <h1 className="text-white text-3xl font-black tracking-wide">Gorditas Luly — Cocina</h1>
        <p className="text-gray-500 text-base text-center max-w-sm leading-relaxed">
          Inicia sesión en la pantalla de ventas y presiona el botón <strong className="text-gray-400">Cocina</strong>,
          <br />o abre esta pantalla desde la PC del sistema.
        </p>
      </div>
    )
  }

  const sorted  = [...orders].reverse()
  const lastSec = tick.toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false })

  // ── Pantalla de cocina ─────────────────────────────────────────
  return (
    <div className="h-screen bg-gray-900 flex flex-col overflow-hidden select-none">

      {/* Header */}
      <header className="bg-orange-600 px-6 py-3 flex items-center justify-between shrink-0 shadow-lg">
        <div className="flex items-center gap-3">
          <span className="text-white font-black text-xl">🍽️ Cocina — Gorditas Luly</span>
          <span className="bg-orange-700 text-orange-100 text-sm font-semibold px-2.5 py-0.5 rounded-full">
            {sorted.length} {sorted.length === 1 ? 'orden' : 'órdenes'}
          </span>
        </div>
        <div className="flex items-center gap-4 text-orange-200 text-sm font-mono">
          {error && <span className="text-red-300 text-xs">⚠ {error}</span>}
          <span>↻ {lastSec}</span>
          <span className="text-orange-300 font-bold text-base">{clock}</span>
        </div>
      </header>

      {/* Orders */}
      <div className="flex-1 overflow-y-auto p-4">
        {sorted.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-gray-600 gap-4 select-none">
            <div className="text-8xl">✅</div>
            <p className="text-2xl font-bold text-gray-500">Sin órdenes pendientes</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 xl:grid-cols-4 2xl:grid-cols-6 gap-4 items-start">
            {sorted.map(order => {
              const hora = new Date(order.creado_en).toLocaleTimeString('es-MX', {
                hour: '2-digit', minute: '2-digit', hour12: false,
              })
              const hayVariosPlatos = order.gorditas.some((g, i) =>
                i > 0 && (order.gorditas[i - 1].plato ?? 1) !== (g.plato ?? 1)
              )
              // Filas totales = gorditas + divisores entre platos + etiqueta "Plato 1"
              const numDivisores = order.gorditas.filter((g, i) =>
                i > 0 && (order.gorditas[i - 1].plato ?? 1) !== (g.plato ?? 1)
              ).length
              const totalFilas = order.gorditas.length + numDivisores + (hayVariosPlatos ? 1 : 0)
              const doble = totalFilas > 5

              return (
                <div key={order.id} className={`bg-white rounded-2xl shadow-2xl overflow-hidden ${doble ? 'col-span-2' : ''}`}>

                  {/* Card header — compacto */}
                  <div className="bg-orange-500 px-3 py-2 flex items-center justify-between">
                    <span className="text-white font-black text-2xl leading-none">
                      #{order.numero_orden}
                    </span>
                    <span className="text-orange-100 text-sm font-semibold">{hora}</span>
                  </div>

                  {/* Gorditas — 1 columna normal, 2 columnas cuando hay muchas filas */}
                  <div className={`px-3 pt-2 pb-1.5 ${doble ? 'grid grid-cols-2 gap-x-4 gap-y-1' : 'space-y-1'}`}>
                    {order.gorditas.flatMap((g, i) => {
                      const prev = order.gorditas[i - 1]
                      const esNuevoPlato = i === 0 || (prev && (prev.plato ?? 1) !== (g.plato ?? 1))
                      const result = []

                      if (hayVariosPlatos && i === 0) {
                        result.push(
                          <div key="plato-1-label" className={`flex justify-end ${doble ? 'col-span-2' : ''}`}>
                            <span className="text-[10px] font-black text-orange-500 bg-orange-100
                                             px-2 py-px rounded-full leading-tight">
                              Plato 1
                            </span>
                          </div>
                        )
                      } else if (hayVariosPlatos && esNuevoPlato) {
                        result.push(
                          <div key={`div-${i}`}
                               className={`flex items-center gap-1.5 my-0.5 ${doble ? 'col-span-2' : ''}`}>
                            <div className="flex-1 h-[2px] bg-orange-400 rounded-full" />
                            <span className="text-[10px] font-black text-orange-600 bg-orange-100
                                             px-2 py-px rounded-full shrink-0 border border-orange-300 leading-tight">
                              Plato {g.plato ?? i + 1}
                            </span>
                          </div>
                        )
                      }

                      result.push(
                        <div key={i} className="flex items-center gap-1.5 min-w-0">
                          <span className="bg-orange-100 text-orange-700 font-black text-base
                                           rounded-md px-1.5 py-px shrink-0 leading-tight min-w-[2rem] text-center">
                            {g.cantidad}×
                          </span>
                          <div className="min-w-0">
                            <p className="font-bold text-gray-800 text-base leading-tight truncate">{g.guisado}</p>
                            <p className="text-sm text-gray-400 leading-tight">{g.masa}</p>
                          </div>
                        </div>
                      )

                      return result
                    })}

                    {/* Bebidas — siempre ancho completo */}
                    {order.bebidas.length > 0 && (
                      <div className={`border-t border-gray-100 pt-1.5 mt-0.5 space-y-1 ${doble ? 'col-span-2' : ''}`}>
                        {order.bebidas.map((b, i) => (
                          <div key={i} className="flex items-center gap-1.5">
                            <span className="text-blue-400 font-bold text-sm shrink-0">
                              {b.cantidad}×
                            </span>
                            <p className="text-blue-600 text-sm font-medium leading-tight">
                              {b.nombre} {b.tamaño}
                            </p>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
