import { useState, useEffect } from 'react'
import type { Guisado, TipoMasa, OrderItem } from '../types'
import NumericKeypad from './NumericKeypad'

interface Props {
  guisados:       Guisado[]
  tiposMasa:      TipoMasa[]
  masaFijaId?:    number
  comboMode:      boolean
  onAdd:          (item: Omit<OrderItem, 'localId'>) => void
  onCancelCombo:  () => void
  onRefrescos:    () => void
  onCombos:       () => void
}

export default function GuisadoPanel({
  guisados,
  tiposMasa,
  masaFijaId,
  comboMode,
  onAdd,
  onCancelCombo,
  onRefrescos,
  onCombos,
}: Props) {
  const masas = tiposMasa.filter(m => m.disponible)

  // null = user hasn't explicitly picked a masa → falls back to Harina synchronously,
  // no useEffect needed, no flash.
  const [masaId, setMasaId] = useState<number | null>(null)
  const [miniValue, setMiniValue] = useState('')

  // Find Harina by actual name (not by a mapping function that breaks new masas).
  // Falls back to first available masa if none contains "harina".
  const harineId =
    masas.find(m => m.nombre.toLowerCase().includes('harina'))?.id ??
    masas[0]?.id ??
    null

  // Priority: combo lock > explicit user pick > Harina default
  const activeMasaId = masaFijaId ?? masaId ?? harineId
  const selectedMasa = masas.find(m => m.id === activeMasaId)

  // When combo ends (masaFijaId → undefined/null), clear the explicit selection
  // so Harina re-applies automatically without any flash.
  useEffect(() => {
    if (!masaFijaId) setMasaId(null)
  }, [masaFijaId])

  function handleGuisado(g: Guisado) {
    if (!selectedMasa || activeMasaId == null) return
    const cantidad        = Math.max(1, parseInt(miniValue) || 1)
    const precio_unitario = Number(selectedMasa.precio)

    onAdd({
      guisado_id:     g.id,
      guisado_nombre: g.nombre,
      tipo_masa_id:   activeMasaId,
      masa_label:     selectedMasa.nombre,   // use real name, not a mapped label
      cantidad,
      precio_unitario,
      subtotal: precio_unitario * cantidad,
    })
    setMiniValue('')
  }

  return (
    <div className="flex flex-col gap-2.5 h-full overflow-y-auto">

      {/* Refrescos / Combos quick-access — hidden while in combo mode */}
      {!comboMode && (
        <div className="grid grid-cols-2 gap-2 shrink-0">
          <button
            onClick={onRefrescos}
            className="bg-white hover:bg-blue-50 active:bg-blue-100
                       border-2 border-blue-200 hover:border-blue-400
                       text-blue-600 font-bold py-2.5 rounded-2xl text-sm
                       transition-colors flex items-center justify-center gap-1.5"
          >
            <span>🥤</span>
            <span>Refrescos</span>
          </button>
          <button
            onClick={onCombos}
            className="bg-white hover:bg-purple-50 active:bg-purple-100
                       border-2 border-purple-200 hover:border-purple-400
                       text-purple-600 font-bold py-2.5 rounded-2xl text-sm
                       transition-colors flex items-center justify-center gap-1.5"
          >
            <span>🎁</span>
            <span>Combos</span>
          </button>
        </div>
      )}

      {/* Masa selector — hidden when locked by a combo */}
      {masaFijaId ? (
        <div className="bg-orange-50 border border-orange-200 rounded-xl px-3 py-2 text-center">
          <p className="text-xs font-semibold text-orange-600 uppercase tracking-wide">
            Masa fija: {masas.find(m => m.id === masaFijaId)?.nombre ?? 'Harina'}
          </p>
        </div>
      ) : (
        <div>
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">
            Tipo de masa
          </p>
          {/* Up to 4 per row — new masas fit without pushing anything down */}
          <div className="grid grid-cols-4 gap-2">
            {masas.map(m => (
              <button
                key={m.id}
                onClick={() => setMasaId(m.id)}
                className={`py-2 rounded-xl font-bold transition-colors border-2 ${
                  activeMasaId === m.id
                    ? 'bg-orange-500 border-orange-500 text-white shadow-md shadow-orange-200'
                    : 'bg-white border-gray-200 text-gray-600 hover:border-orange-300'
                }`}
              >
                <div className="text-sm">{m.nombre}</div>
                <div className="text-xs opacity-70">${m.precio} c/u</div>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Guisado grid — 5 columns */}
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

      {/* Cancelar combo — solo visible en modo combo */}
      {comboMode && (
        <button
          onClick={onCancelCombo}
          className="text-red-500 hover:text-red-700 font-semibold text-sm
                     py-2 text-center transition-colors"
        >
          ✕ Cancelar combo
        </button>
      )}
    </div>
  )
}
