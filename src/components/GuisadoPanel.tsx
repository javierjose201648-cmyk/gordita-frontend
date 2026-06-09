import { useState } from 'react'
import type { Guisado, TipoMasa, OrderItem } from '../types'
import NumericKeypad from './NumericKeypad'

interface Props {
  guisados:           Guisado[]
  tiposMasa:          TipoMasa[]
  gorditas_total:     number
  gorditas_asignadas: number
  masaFijaId?:        number   // if set, locks masa selection (used by combos)
  onAdd:  (item: Omit<OrderItem, 'localId'>) => void
  onBack: () => void
}

/** Maps DB masa nombre → display label */
function masaLabel(nombre: string) {
  const n = nombre.toLowerCase()
  if (n.includes('maíz') || n.includes('maiz') || n.includes('azul')) return 'Maíz'
  return 'Harina'
}

export default function GuisadoPanel({
  guisados,
  tiposMasa,
  gorditas_total,
  gorditas_asignadas,
  masaFijaId,
  onAdd,
  onBack,
}: Props) {
  const masas = tiposMasa.filter(m => m.disponible)

  // Default to Harina (the most common) — find it by label, fall back to first
  const defaultMasaId = masaFijaId ?? masas.find(m => masaLabel(m.nombre) === 'Harina')?.id ?? masas[0]?.id ?? 1
  const [masaId,    setMasaId]    = useState<number>(defaultMasaId)
  const [miniValue, setMiniValue] = useState('')

  const selectedMasa = masas.find(m => m.id === masaId) ?? masas[0]

  function handleGuisado(g: Guisado) {
    const cantidad        = Math.max(1, parseInt(miniValue) || 1)
    const precio_unitario = selectedMasa?.precio_extra ?? 20
    const label           = selectedMasa ? masaLabel(selectedMasa.nombre) : 'Harina'

    onAdd({
      guisado_id:     g.id,
      guisado_nombre: g.nombre,
      tipo_masa_id:   masaId,
      masa_label:     label,
      cantidad,
      precio_unitario,
      subtotal: precio_unitario * cantidad,
    })

    setMiniValue('') // reset after every add
  }

  const pendientes = gorditas_total - gorditas_asignadas

  return (
    <div className="flex flex-col gap-2.5 h-full overflow-y-auto">

      {/* Progress bar */}
      {gorditas_total > 0 && (
        <div className="bg-orange-50 border border-orange-200 rounded-xl px-4 py-2">
          <div className="flex items-center justify-between text-sm mb-1">
            <span className="text-orange-700 font-medium">Gorditas asignadas</span>
            <span className="font-bold text-orange-600">
              {gorditas_asignadas}/{gorditas_total}
            </span>
          </div>
          <div className="h-2 bg-orange-100 rounded-full overflow-hidden">
            <div
              className="h-full bg-orange-500 rounded-full transition-all"
              style={{ width: `${Math.min(100, (gorditas_asignadas / gorditas_total) * 100)}%` }}
            />
          </div>
          {pendientes > 0 && (
            <p className="text-xs text-orange-500 mt-1">
              {pendientes} gordita{pendientes !== 1 ? 's' : ''} pendiente{pendientes !== 1 ? 's' : ''}
            </p>
          )}
          {gorditas_asignadas > gorditas_total && (
            <p className="text-xs text-amber-600 mt-1 font-medium">
              ⚠️ Se agregaron más gorditas de las indicadas
            </p>
          )}
        </div>
      )}

      {/* Masa selector — hidden when locked by a combo */}
      {masaFijaId ? (
        <div className="bg-orange-50 border border-orange-200 rounded-xl px-3 py-2 text-center">
          <p className="text-xs font-semibold text-orange-600 uppercase tracking-wide">
            Masa fija: {masaLabel(masas.find(m => m.id === masaFijaId)?.nombre ?? 'Harina')}
          </p>
        </div>
      ) : (
        <div>
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">
            Tipo de masa
          </p>
          <div className="grid grid-cols-2 gap-2">
            {masas.map(m => (
              <button
                key={m.id}
                onClick={() => setMasaId(m.id)}
                className={`py-2 rounded-xl font-bold transition-colors border-2 ${
                  masaId === m.id
                    ? 'bg-orange-500 border-orange-500 text-white shadow-md shadow-orange-200'
                    : 'bg-white border-gray-200 text-gray-600 hover:border-orange-300'
                }`}
              >
                <div className="text-sm">{masaLabel(m.nombre)}</div>
                <div className="text-xs opacity-70">${m.precio_extra} c/u</div>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Guisado grid — 3 columns, compact buttons */}
      <div>
        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
          Selecciona guisado
        </p>
        <div className="grid grid-cols-5 gap-1">
          {guisados.map(g => (
            <button
              key={g.id}
              onClick={() => handleGuisado(g)}
              className="h-14 bg-white border-2 border-orange-200 hover:border-orange-400
                         hover:bg-orange-50 active:bg-orange-100 active:scale-95
                         text-gray-800 font-medium rounded-xl
                         transition-all flex items-center justify-center
                         text-center p-1 leading-tight"
              style={{ fontSize: '17px' }}
            >
              <span className="line-clamp-2 break-words w-full">{g.nombre}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Mini keypad */}
      <div className="bg-gray-50 rounded-xl p-2.5 border border-gray-200">
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

      {/* Back */}
      <button
        onClick={onBack}
        className="text-orange-600 hover:text-orange-800 font-medium text-sm
                   py-2 text-center transition-colors"
      >
        ← Volver al inicio
      </button>
    </div>
  )
}
