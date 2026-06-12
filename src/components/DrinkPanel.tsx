import { useState } from 'react'
import type { Refresco, DrinkItem } from '../types'
import NumericKeypad from './NumericKeypad'

interface Props {
  refrescos: Refresco[]
  onAdd:     (item: Omit<DrinkItem, 'localId'>) => void
  onBack:    () => void
}

const PALETAS = [
  { header: 'bg-sky-100 text-sky-700 border-sky-200',              btn: 'bg-sky-50 border-sky-300 hover:bg-sky-100 hover:border-sky-500 active:bg-sky-200',              precio: 'text-sky-700',     texto: 'text-sky-900' },
  { header: 'bg-emerald-100 text-emerald-700 border-emerald-200',  btn: 'bg-emerald-50 border-emerald-300 hover:bg-emerald-100 hover:border-emerald-500 active:bg-emerald-200', precio: 'text-emerald-700', texto: 'text-emerald-900' },
  { header: 'bg-violet-100 text-violet-700 border-violet-200',     btn: 'bg-violet-50 border-violet-300 hover:bg-violet-100 hover:border-violet-500 active:bg-violet-200',     precio: 'text-violet-700',  texto: 'text-violet-900' },
  { header: 'bg-amber-100 text-amber-700 border-amber-200',        btn: 'bg-amber-50 border-amber-300 hover:bg-amber-100 hover:border-amber-500 active:bg-amber-200',         precio: 'text-amber-700',   texto: 'text-amber-900' },
  { header: 'bg-rose-100 text-rose-700 border-rose-200',           btn: 'bg-rose-50 border-rose-300 hover:bg-rose-100 hover:border-rose-500 active:bg-rose-200',              precio: 'text-rose-700',    texto: 'text-rose-900' },
  { header: 'bg-orange-100 text-orange-700 border-orange-200',     btn: 'bg-orange-50 border-orange-300 hover:bg-orange-100 hover:border-orange-500 active:bg-orange-200',    precio: 'text-orange-700',  texto: 'text-orange-900' },
]

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

  // Group by categoria_nombre preserving insertion order
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
        /*
         * CSS columns — categories flow top→bottom then left→right.
         * break-inside-avoid keeps each category block together.
         * Short categories share a column with the next one automatically.
         */
        <div className="columns-3 gap-x-2">
          {Array.from(grupos.entries()).map(([cat, items], idx) => {
            const p = PALETAS[idx % PALETAS.length]
            return (
              <div key={cat} className="break-inside-avoid mb-2">
                {/* Category header */}
                <span className={`inline-block text-xs font-bold uppercase tracking-wide
                                  px-2.5 py-0.5 rounded-full border mb-1 ${p.header}`}>
                  {cat}
                </span>

                {/* Drinks — stacked vertically within the column */}
                <div className="flex flex-col gap-1">
                  {items.map(r => {
                    const sabor = r.sabor?.toLowerCase()
                    const showSabor = sabor && sabor !== 'original' && sabor !== 'regular' && sabor !== ''
                    return (
                      <button
                        key={r.id}
                        onClick={() => handleDrink(r)}
                        className={`w-full flex items-center justify-between
                                   px-2 py-1.5 rounded-xl border-2 transition-all
                                   active:scale-95 text-left ${p.btn}`}
                      >
                        <div className="flex-1 min-w-0 mr-1">
                          <p className={`font-semibold text-xs leading-tight line-clamp-1 ${p.texto}`}>
                            {r.nombre}
                          </p>
                          <p className="text-xs text-gray-400 leading-tight line-clamp-1">
                            {showSabor ? `${r.sabor} · ${r.tamaño}` : r.tamaño}
                          </p>
                        </div>
                        <span className={`font-black text-sm shrink-0 ${p.precio}`}>
                          ${r.precio}
                        </span>
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
