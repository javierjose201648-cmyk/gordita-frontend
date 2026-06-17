import { useEffect, useState, useCallback } from 'react'
import { api } from '../api/client'

type TurnoOrder = Awaited<ReturnType<typeof api.ordenes.getTurnoKitchen>>[number]

// The kitchen key comes from ?k= in the URL — set once in the .bat file, never changes.
const kitchenKey = new URLSearchParams(window.location.search).get('k') ?? ''

export default function KitchenScreen() {
  const [orders, setOrders] = useState<TurnoOrder[]>([])
  const [tick,   setTick]   = useState(new Date())
  const [error,  setError]  = useState<string | null>(null)

  const fetchOrders = useCallback(async () => {
    try {
      setOrders(await api.ordenes.getTurnoKitchen(kitchenKey))
      setTick(new Date())
      setError(null)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Error de conexión')
    }
  }, [])

  useEffect(() => {
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

  // Sin llave configurada en la URL
  if (!kitchenKey) {
    return (
      <div className="h-screen bg-gray-900 flex flex-col items-center justify-center gap-4 select-none">
        <div className="text-6xl">⚠️</div>
        <p className="text-yellow-400 text-xl font-bold">Pantalla de cocina no configurada</p>
        <p className="text-gray-500 text-sm">Falta el parámetro ?k= en la URL</p>
      </div>
    )
  }

  const sorted  = [...orders].reverse()
  const lastSec = tick.toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false })

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
          <div className="grid grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-4 items-start">
            {sorted.map(order => {
              const hora = new Date(order.creado_en).toLocaleTimeString('es-MX', {
                hour: '2-digit', minute: '2-digit', hour12: false,
              })
              return (
                <div
                  key={order.id}
                  className="bg-white rounded-2xl shadow-2xl overflow-hidden"
                >
                  {/* Card header */}
                  <div className="bg-orange-500 px-4 py-3 flex items-center justify-between">
                    <span className="text-white font-black text-4xl leading-none">
                      #{order.numero_orden}
                    </span>
                    <span className="text-orange-100 text-sm font-semibold">{hora}</span>
                  </div>

                  {/* Gorditas */}
                  <div className="px-4 pt-3 pb-2 space-y-2">
                    {order.gorditas.map((g, i) => (
                      <div key={i} className="flex items-start gap-2">
                        <span className="bg-orange-100 text-orange-700 font-black text-base
                                         rounded-lg px-2 py-0.5 shrink-0 leading-tight min-w-[2rem] text-center">
                          {g.cantidad}×
                        </span>
                        <div className="min-w-0">
                          <p className="font-bold text-gray-800 text-base leading-tight">{g.guisado}</p>
                          <p className="text-sm text-gray-400 leading-tight">{g.masa}</p>
                        </div>
                      </div>
                    ))}

                    {/* Bebidas */}
                    {order.bebidas.length > 0 && (
                      <div className="border-t border-gray-100 pt-2 mt-1 space-y-1">
                        {order.bebidas.map((b, i) => (
                          <div key={i} className="flex items-center gap-2">
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
