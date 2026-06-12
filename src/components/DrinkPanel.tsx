import { useState } from 'react'
import type { Refresco, DrinkItem } from '../types'
import NumericKeypad from './NumericKeypad'

interface Props {
  refrescos: Refresco[]
  onAdd:     (item: Omit<DrinkItem, 'localId'>) => void
  onBack:    () => void
}

const PALETAS = [
  { header: 'bg-sky-100 text-sky-700 border-sky-200',     btn: 'bg-sky-50 border-sky-300 hover:bg-sky-100 hover:border-sky-500 active:bg-sky-200 text-sky-900',     precio: 'text-sky-700' },
  { header: 'bg-emerald-100 text-emerald-700 border-emerald-200', btn: 'bg-emerald-50 border-emerald-300 hover:bg-emerald-100 hover:border-emerald-500 active:bg-emerald-200 text-emerald-900', precio: 'text-emerald-700' },
  { header: 'bg-violet-100 text-violet-700 border-violet-200',  btn: 'bg-violet-50 border-violet-300 hover:bg-violet-100 hover:border-violet-500 active:bg-violet-200 text-violet-900',  precio: 'text-violet-700' },
  { header: 'bg-amber-100 text-amber-700 border-amber-200',    btn: 'bg-amber-50 border-amber-300 hover:bg-amber-100 hover:border-amber-500 active:bg-amber-200 text-amber-900',    precio: 'text-amber-700' },
  { header: 'bg-rose-100 text-rose-700 border-rose-200',      btn: 'bg-rose-50 border-rose-300 hover:bg-rose-100 hover:border-rose-500 active:bg-rose-200 text-rose-900',      precio: 'text-rose-700' },
  { header: 'bg-orange-100 text-orange-700 border-orange-200',  btn: 'bg-orange-50 border-orange-300 hover:bg-orange-100 hover:border-orange-500 active:bg-orange-200 text-orange-900',  precio: 'text-orange-700' },
]

/** Short label for the button: marca + tamaño, sabor only if non-trivial */
function drinkLabel(r: Refresco) {
  const sabor = r.sabor?.toLowerCase()
  const showSabor = sabor && sabor !== 'original' && sabor !== 'regular' && sabor !== ''
  return { top: r.nombre, mid: showSabor ? r.sabor : r.tamaño, sub: showSabor ? r.tamaño : null }
}

export default function DrinkPanel({ refrescos, onAdd, onBack }: Props) {
  const [miniValue, setMiniValue] = useState('')

  function handleDrink(r: Refresco) {
    const cantidad = Math.max(1, parseInt(miniValue) || 1)
    onAdd({
      refresco_id:     r.id,
      nombre:          r.nombre,
      sabor:           r.sabor,
      tamaño:          r.tamaño,
      cantidad,
      precio_unitario: r.precio,
      subtotal:        r.precio * cantidad,
    })
    setMiniValue('')
  }

  // Exclude combo-only drinks
  const venta = refrescos.filter(r => !r.nombre.toLowerCase().includes('combo'))

  // Group by categoria_nombre (fallback: "Otros")
  const grupos = new Map<string, Refresco[]>()
  for (const r of venta) {
    const cat = r.categoria_nombre?.trim() || 'Otros'
    if (!grupos.has(cat)) grupos.set(cat, [])
    grupos.get(cat)!.push(r)
  }

  return (
    <div className="flex flex-col gap-2 h-full overflow-y-auto">

      {/* Título */}
      <div className="flex items-center gap-2 shrink-0">
        <span className="text-2xl">🥤</span>
        <h2 className="font-black text-gray-700 text-lg">Bebidas</h2>
      </div>

      {venta.length === 0 ? (
        <div className="flex flex-col items-center justify-center flex-1 text-gray-300 py-10">
          <div className="text-5xl mb-3">🥤</div>
          <p className="text-sm">Sin bebidas disponibles</p>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {Array.from(grupos.entries()).map(([cat, items], idx) => {
            const p = PALETAS[idx % PALETAS.length]
            return (
              <div key={cat}>
                {/* Category header */}
                <span className={`inline-block text-xs font-bold uppercase tracking-wide
                                  px-2.5 py-0.5 rounded-full border mb-1.5 ${p.header}`}>
                  {cat}
                </span>

                {/* Dense grid — 5 columns */}
                <div className="grid grid-cols-5 gap-1.5">
                  {items.map(r => {
                    const { top, mid, sub } = drinkLabel(r)
                    return (
                      <button
                        key={r.id}
                        onClick={() => handleDrink(r)}
                        className={`flex flex-col items-center justify-center
                                   px-1 py-2 rounded-xl border-2 transition-all
                                   active:scale-95 text-center leading-tight ${p.btn}`}
                      >
                        <p className="font-semibold text-xs line-clamp-1 w-full">{top}</p>
                        <p className="text-xs opacity-75 line-clamp-1 w-full">{mid}</p>
                        {sub && <p className="text-xs opacity-60 line-clamp-1 w-full">{sub}</p>}
                        <p className={`font-black text-sm mt-0.5 ${p.precio}`}>${r.precio}</p>
                      </button>
                    )
                  })}
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Mini keypad */}
      <div className="bg-gray-50 rounded-xl p-2.5 border border-gray-200 shrink-0">
        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">
          Cantidad a agregar
        </p>
        <NumericKeypad value={miniValue} onChange={setMiniValue} size="sm" maxDigits={2} />
      </div>

      {/* Volver */}
      <button
        onClick={onBack}
        className="text-orange-600 hover:text-orange-800 font-medium text-sm
                   py-2 text-center transition-colors shrink-0"
      >
        ← Volver al inicio
      </button>
    </div>
  )
}
