import { useState } from 'react'
import type { Refresco, DrinkItem } from '../types'
import NumericKeypad from './NumericKeypad'

interface Props {
  refrescos: Refresco[]
  onAdd:     (item: Omit<DrinkItem, 'localId'>) => void
  onBack:    () => void
}

// Paleta de colores por categoría (cicla si hay más de 5)
const PALETAS = [
  {
    fondo:    'bg-sky-50',
    borde:    'border-sky-300',
    hover:    'hover:bg-sky-100 hover:border-sky-500',
    active:   'active:bg-sky-200',
    etiqueta: 'bg-sky-100 text-sky-700 border-sky-200',
    precio:   'text-sky-700',
    texto:    'text-sky-900',
  },
  {
    fondo:    'bg-emerald-50',
    borde:    'border-emerald-300',
    hover:    'hover:bg-emerald-100 hover:border-emerald-500',
    active:   'active:bg-emerald-200',
    etiqueta: 'bg-emerald-100 text-emerald-700 border-emerald-200',
    precio:   'text-emerald-700',
    texto:    'text-emerald-900',
  },
  {
    fondo:    'bg-violet-50',
    borde:    'border-violet-300',
    hover:    'hover:bg-violet-100 hover:border-violet-500',
    active:   'active:bg-violet-200',
    etiqueta: 'bg-violet-100 text-violet-700 border-violet-200',
    precio:   'text-violet-700',
    texto:    'text-violet-900',
  },
  {
    fondo:    'bg-amber-50',
    borde:    'border-amber-300',
    hover:    'hover:bg-amber-100 hover:border-amber-500',
    active:   'active:bg-amber-200',
    etiqueta: 'bg-amber-100 text-amber-700 border-amber-200',
    precio:   'text-amber-700',
    texto:    'text-amber-900',
  },
  {
    fondo:    'bg-rose-50',
    borde:    'border-rose-300',
    hover:    'hover:bg-rose-100 hover:border-rose-500',
    active:   'active:bg-rose-200',
    etiqueta: 'bg-rose-100 text-rose-700 border-rose-200',
    precio:   'text-rose-700',
    texto:    'text-rose-900',
  },
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

  // Excluir bebidas exclusivas de combos (no se venden por separado)
  const refrescosVenta = refrescos.filter(
    r => !r.nombre.toLowerCase().includes('combo')
  )

  // Agrupar por nombre de categoría
  const grupos = refrescosVenta.reduce<Record<string, Refresco[]>>((acc, r) => {
    if (!acc[r.nombre]) acc[r.nombre] = []
    acc[r.nombre].push(r)
    return acc
  }, {})

  const categorias = Object.entries(grupos)

  return (
    <div className="flex flex-col gap-2.5 h-full overflow-y-auto">

      {/* Título */}
      <div className="flex items-center gap-2 shrink-0">
        <span className="text-2xl">🥤</span>
        <h2 className="font-black text-gray-700 text-lg">Bebidas</h2>
      </div>

      {refrescosVenta.length === 0 ? (
        <div className="flex flex-col items-center justify-center flex-1 text-gray-300 py-10">
          <div className="text-5xl mb-3">🥤</div>
          <p className="text-sm">Sin bebidas disponibles</p>
        </div>
      ) : (
        <>
          {/* 4 columnas de categorías — igual que guisados pero por grupo */}
          <div className="grid grid-cols-4 gap-2">
            {categorias.map(([nombre, items], idx) => {
              const p = PALETAS[idx % PALETAS.length]
              return (
                <div key={nombre} className="flex flex-col gap-1.5">

                  {/* Encabezado de categoría */}
                  <span className={`text-xs font-bold uppercase tracking-wide
                                   px-2 py-0.5 rounded-full border text-center
                                   leading-tight block ${p.etiqueta}`}>
                    {nombre}
                  </span>

                  {/* Botones de la categoría — 1 columna por grupo */}
                  {items.map(r => (
                    <button
                      key={r.id}
                      onClick={() => handleDrink(r)}
                      className={`w-full flex flex-col items-center justify-center
                                 px-1 py-2.5 rounded-xl border-2 transition-all
                                 active:scale-95 text-center
                                 ${p.fondo} ${p.borde} ${p.hover} ${p.active}`}
                    >
                      <p className={`font-semibold text-xs leading-tight
                                    line-clamp-2 w-full ${p.texto}`}>
                        {r.tamaño}
                      </p>
                      {r.sabor && r.sabor.toLowerCase() !== 'original' && (
                        <p className="text-xs text-gray-400 leading-tight line-clamp-1">
                          {r.sabor}
                        </p>
                      )}
                      <p className={`font-black text-sm mt-0.5 ${p.precio}`}>
                        ${r.precio}
                      </p>
                    </button>
                  ))}
                </div>
              )
            })}
          </div>

          {/* Mini keypad — mismo estilo que GuisadoPanel */}
          <div className="bg-gray-50 rounded-xl p-2.5 border border-gray-200 shrink-0">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">
              Cantidad a agregar
            </p>
            <NumericKeypad
              value={miniValue}
              onChange={setMiniValue}
              size="sm"
              maxDigits={2}
            />
          </div>
        </>
      )}

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
