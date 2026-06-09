import { useState, useEffect } from 'react'
import type { Gasto } from '../types'
import { api } from '../api/client'
import QwertyKeyboard from './QwertyKeyboard'
import NumericKeypad  from './NumericKeypad'

interface Props { onClose: () => void }

type Step = 'list' | 'concepto' | 'monto'

export default function GastosPanel({ onClose }: Props) {
  const [gastos,   setGastos]   = useState<Gasto[]>([])
  const [loading,  setLoading]  = useState(true)
  const [saving,   setSaving]   = useState(false)
  const [error,    setError]    = useState('')
  const [step,     setStep]     = useState<Step>('list')
  const [concepto, setConcepto] = useState('')
  const [monto,    setMonto]    = useState('')

  async function load() {
    setLoading(true)
    try { setGastos(await api.gastos.getToday()) }
    catch { setError('Error cargando gastos') }
    finally { setLoading(false) }
  }
  useEffect(() => { load() }, [])

  async function handleSave() {
    const m = parseFloat(monto)
    if (!concepto.trim() || isNaN(m) || m <= 0) return
    setSaving(true); setError('')
    try {
      await api.gastos.create(concepto.trim(), m)
      setConcepto(''); setMonto(''); setStep('list')
      await load()
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Error al guardar')
    } finally { setSaving(false) }
  }

  async function handleDelete(g: Gasto) {
    if (!confirm(`¿Eliminar el gasto "${g.concepto}"?`)) return
    try { await api.gastos.delete(g.id); await load() }
    catch { setError('Error al eliminar') }
  }

  function startNew() { setConcepto(''); setMonto(''); setStep('concepto'); setError('') }
  function cancelNew() { setStep('list'); setConcepto(''); setMonto(''); setError('') }

  const totalHoy = gastos.reduce((s, g) => s + Number(g.monto), 0)

  return (
    <div className="fixed inset-0 z-50 bg-gray-50 flex flex-col overflow-hidden">

      {/* Header */}
      <header className="bg-gray-800 text-white px-4 py-3 flex items-center gap-3 shrink-0 shadow-md">
        <button
          onClick={step !== 'list' ? cancelNew : onClose}
          className="bg-gray-700 hover:bg-gray-600 active:bg-gray-900
                     text-white px-3 py-1.5 rounded-xl text-sm font-semibold transition-colors"
        >
          ← {step !== 'list' ? 'Cancelar' : 'Regresar'}
        </button>
        <span className="font-black text-lg">💸 Gastos del día</span>
      </header>

      {error && (
        <div className="shrink-0 bg-red-500 text-white text-sm font-semibold px-4 py-2 text-center">
          {error}
        </div>
      )}

      {/* ── LIST view ── */}
      {step === 'list' && (
        <div className="flex-1 flex flex-col min-h-0">

          {/* Total bar */}
          <div className="bg-gray-800 text-white px-4 py-2 flex items-center justify-between shrink-0">
            <span className="text-sm font-semibold text-gray-300">Total gastado hoy</span>
            <span className="text-2xl font-black">${totalHoy.toFixed(2)}</span>
          </div>

          {/* Expense list */}
          <div className="flex-1 overflow-y-auto p-4 space-y-2">
            {loading ? (
              <p className="text-gray-400 text-sm text-center py-8">Cargando...</p>
            ) : gastos.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-4xl mb-2">📋</p>
                <p className="text-gray-400 font-medium">Sin gastos registrados hoy</p>
              </div>
            ) : (
              gastos.map(g => (
                <div key={g.id}
                  className="bg-white rounded-2xl border-2 border-gray-100 px-4 py-3
                             flex items-center gap-3 shadow-sm">
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-gray-800 text-sm leading-tight">{g.concepto}</p>
                    <p className="text-xs text-gray-400 mt-0.5">
                      {new Date(g.creado_en).toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </div>
                  <span className="font-black text-lg text-gray-900 shrink-0">
                    ${Number(g.monto).toFixed(2)}
                  </span>
                  <button
                    onClick={() => handleDelete(g)}
                    className="text-xs bg-red-50 hover:bg-red-100 text-red-600 font-bold
                               px-2.5 py-1.5 rounded-lg transition-colors shrink-0">
                    ×
                  </button>
                </div>
              ))
            )}
          </div>

          {/* Add button */}
          <div className="shrink-0 p-4 bg-gray-50 border-t border-gray-200">
            <button onClick={startNew}
              className="w-full bg-gray-800 hover:bg-gray-700 active:bg-gray-900
                         text-white font-black py-4 rounded-2xl text-lg transition-colors
                         shadow-lg">
              + Nuevo gasto
            </button>
          </div>
        </div>
      )}

      {/* ── CONCEPTO step ── */}
      {step === 'concepto' && (
        <div className="flex-1 flex flex-col min-h-0 p-4 gap-3">

          {/* Display — real input: physical keyboard AND QWERTY both work */}
          <div>
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
              ¿Cuál es el concepto del gasto?
            </p>
            <input
              autoFocus
              type="text"
              value={concepto}
              onChange={e => setConcepto(e.target.value.slice(0, 80))}
              onKeyDown={e => { if (e.key === 'Enter' && concepto.trim()) setStep('monto') }}
              placeholder="Escribe el concepto..."
              className="w-full bg-white border-2 border-gray-200 rounded-2xl px-4 py-3
                         text-gray-900 font-semibold text-lg outline-none
                         focus:border-gray-400 transition-colors
                         placeholder:text-gray-300 placeholder:font-normal"
            />
          </div>

          {/* QWERTY — buttons also update the same state */}
          <div className="flex-1 flex items-end">
            <QwertyKeyboard value={concepto} onChange={setConcepto} maxLength={80} />
          </div>

          {/* Next button */}
          <button
            onClick={() => { if (concepto.trim()) setStep('monto') }}
            disabled={!concepto.trim()}
            className="shrink-0 w-full bg-gray-800 hover:bg-gray-700
                       disabled:bg-gray-200 disabled:text-gray-400 disabled:cursor-not-allowed
                       text-white font-black py-4 rounded-2xl text-lg transition-colors"
          >
            Continuar → Cantidad
          </button>
        </div>
      )}

      {/* ── MONTO step ── */}
      {step === 'monto' && (
        <div className="flex-1 flex flex-col min-h-0 p-4 gap-3 overflow-y-auto">

          {/* Concepto chip (tap to edit) */}
          <button
            onClick={() => setStep('concepto')}
            className="shrink-0 bg-gray-100 hover:bg-gray-200 border-2 border-gray-200
                       rounded-2xl px-4 py-2.5 text-left transition-colors">
            <p className="text-xs text-gray-400 font-semibold uppercase tracking-wide">Concepto (toca para editar)</p>
            <p className="font-bold text-gray-800">{concepto}</p>
          </button>

          {/* Monto display + numpad */}
          <div>
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
              ¿Cuánto fue el gasto?
            </p>
            <NumericKeypad
              value={monto}
              onChange={setMonto}
              size="lg"
              maxDigits={5}
            />
          </div>

          {/* Save button */}
          <button
            onClick={handleSave}
            disabled={!monto || monto === '0' || saving}
            className="shrink-0 w-full bg-green-500 hover:bg-green-600 active:bg-green-700
                       disabled:bg-gray-200 disabled:text-gray-400 disabled:cursor-not-allowed
                       text-white font-black py-4 rounded-2xl text-xl transition-colors
                       shadow-lg shadow-green-200 disabled:shadow-none"
          >
            {saving ? 'Guardando...' : `✓ Guardar — $${monto || '0'}`}
          </button>
        </div>
      )}
    </div>
  )
}
