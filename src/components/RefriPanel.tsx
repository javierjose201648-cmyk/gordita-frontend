import { useState, useEffect } from 'react'
import type { RefriEntry } from '../types'
import { api } from '../api/client'

interface Props { onClose: () => void }

const QUICK_NEG = [-12, -6, -1]
const QUICK_POS = [+1,  +6, +12]

export default function RefriPanel({ onClose }: Props) {
  const [entries,  setEntries]  = useState<RefriEntry[]>([])
  const [loading,  setLoading]  = useState(true)
  const [error,    setError]    = useState('')
  // Local input values keyed by categoria_id (string while editing)
  const [inputs, setInputs] = useState<Record<number, string>>({})

  async function load() {
    setLoading(true)
    try {
      const data = await api.refri.getAll()
      setEntries(data)
      // Seed inputs from DB values
      const init: Record<number, string> = {}
      data.forEach(e => { init[e.categoria_id] = String(e.cantidad) })
      setInputs(init)
    } catch { setError('Error cargando inventario') }
    finally { setLoading(false) }
  }
  useEffect(() => { load() }, [])

  async function handleAjustar(e: RefriEntry, delta: number) {
    try {
      const updated = await api.refri.ajustar(e.categoria_id, delta)
      setEntries(prev => prev.map(r =>
        r.categoria_id === e.categoria_id ? { ...r, cantidad: updated.cantidad } : r
      ))
      setInputs(prev => ({ ...prev, [e.categoria_id]: String(updated.cantidad) }))
    } catch { setError('Error al ajustar') }
  }

  async function handleInputBlur(e: RefriEntry) {
    const raw = inputs[e.categoria_id] ?? ''
    const n = parseInt(raw)
    if (isNaN(n) || n < 0) {
      // Revert to current DB value
      setInputs(prev => ({ ...prev, [e.categoria_id]: String(e.cantidad) }))
      return
    }
    if (n === e.cantidad) return // no change
    try {
      const updated = await api.refri.setCantidad(e.categoria_id, n)
      setEntries(prev => prev.map(r =>
        r.categoria_id === e.categoria_id ? { ...r, cantidad: updated.cantidad } : r
      ))
      setInputs(prev => ({ ...prev, [e.categoria_id]: String(updated.cantidad) }))
    } catch { setError('Error al guardar') }
  }

  const total = entries.reduce((s, e) => s + e.cantidad, 0)

  return (
    <div className="fixed inset-0 z-50 bg-sky-50 flex flex-col overflow-hidden">

      {/* Header */}
      <header className="bg-sky-700 text-white px-4 py-3 flex items-center gap-3 shrink-0 shadow-md">
        <button onClick={onClose}
          className="bg-sky-800 hover:bg-sky-900 text-white px-3 py-1.5 rounded-xl
                     text-sm font-semibold transition-colors">
          ← Regresar
        </button>
        <span className="font-black text-lg">🧊 Refri</span>
        <span className="ml-auto text-sky-200 text-sm font-semibold">
          Total: <span className="text-white font-black">{total}</span>
        </span>
      </header>

      {error && (
        <div className="shrink-0 bg-red-500 text-white text-sm font-semibold px-4 py-2 text-center">
          {error}
        </div>
      )}

      {/* 3-column grid */}
      <div className="flex-1 overflow-y-auto p-3">
        {loading ? (
          <p className="text-gray-400 text-sm text-center py-8">Cargando...</p>
        ) : entries.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-4xl mb-2">🧊</p>
            <p className="text-gray-400 font-medium">Sin categorías aún.</p>
            <p className="text-gray-400 text-sm">Agrégalas desde Ajustes → Bebidas.</p>
          </div>
        ) : (
          <div className="grid grid-cols-3 gap-2">
            {entries.map(e => (
              <div key={e.categoria_id}
                className="bg-white rounded-2xl border-2 border-sky-100 p-2.5
                           shadow-sm flex flex-col gap-2">

                {/* Category name */}
                <p className="text-xs font-black text-gray-700 text-center leading-tight truncate">
                  {e.categoria_nombre}
                </p>

                {/* Quantity — always shown as input so it's clear it's editable */}
                <input
                  type="text"
                  inputMode="numeric"
                  value={inputs[e.categoria_id] ?? String(e.cantidad)}
                  onChange={ev => {
                    const raw = ev.target.value.replace(/\D/g, '')
                    setInputs(prev => ({ ...prev, [e.categoria_id]: raw }))
                  }}
                  onFocus={ev => {
                    if (ev.target.value === '0') {
                      setInputs(prev => ({ ...prev, [e.categoria_id]: '' }))
                    }
                    ev.target.select()
                  }}
                  onBlur={() => handleInputBlur(e)}
                  onKeyDown={ev => { if (ev.key === 'Enter') (ev.target as HTMLInputElement).blur() }}
                  className="w-full text-center text-3xl font-black text-sky-700
                             border-2 border-sky-200 rounded-xl outline-none py-1
                             focus:border-sky-500 transition-colors bg-sky-50"
                />

                {/* − buttons */}
                <div className="flex gap-1">
                  {QUICK_NEG.map(d => (
                    <button key={d} onClick={() => handleAjustar(e, d)}
                      onMouseDown={ev => ev.preventDefault()}
                      className="flex-1 h-7 rounded-lg text-xs font-black
                                 bg-red-100 text-red-700 hover:bg-red-200
                                 active:bg-red-300 border border-red-200 transition-colors">
                      {d}
                    </button>
                  ))}
                </div>

                {/* + buttons */}
                <div className="flex gap-1">
                  {QUICK_POS.map(d => (
                    <button key={d} onClick={() => handleAjustar(e, d)}
                      onMouseDown={ev => ev.preventDefault()}
                      className="flex-1 h-7 rounded-lg text-xs font-black
                                 bg-green-100 text-green-700 hover:bg-green-200
                                 active:bg-green-300 border border-green-200 transition-colors">
                      +{d}
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Refresh */}
      <div className="shrink-0 p-3 bg-sky-50 border-t border-sky-100">
        <button onClick={load}
          className="w-full border-2 border-sky-300 hover:border-sky-500 text-sky-700
                     font-bold py-2.5 rounded-2xl text-sm transition-colors">
          ↻ Actualizar
        </button>
      </div>
    </div>
  )
}
