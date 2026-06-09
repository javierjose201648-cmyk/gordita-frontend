import { useState, useEffect } from 'react'
import type { CajaMovimiento } from '../types'
import { api } from '../api/client'
import NumericKeypad from './NumericKeypad'

interface Props { onClose: () => void }

type Step = 'list' | 'monto'

export default function CajaPanel({ onClose }: Props) {
  const [movimientos, setMovimientos] = useState<CajaMovimiento[]>([])
  const [loading,     setLoading]     = useState(true)
  const [saving,      setSaving]      = useState(false)
  const [error,       setError]       = useState('')
  const [step,        setStep]        = useState<Step>('list')
  const [monto,       setMonto]       = useState('')

  async function load() {
    setLoading(true)
    try { setMovimientos(await api.caja.getDelTurno()) }
    catch { setError('Error cargando movimientos de caja') }
    finally { setLoading(false) }
  }
  useEffect(() => { load() }, [])

  async function handleSave() {
    const m = parseFloat(monto)
    if (isNaN(m) || m <= 0) return
    setSaving(true); setError('')
    try {
      await api.caja.create(m)
      setMonto(''); setStep('list')
      await load()
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Error al guardar')
    } finally { setSaving(false) }
  }

  function startNew() { setMonto(''); setStep('monto'); setError('') }
  function cancelNew() { setStep('list'); setMonto(''); setError('') }

  const totalTurno = movimientos.reduce((s, m) => s + Number(m.monto), 0)

  return (
    <div className="fixed inset-0 z-50 bg-gray-50 flex flex-col overflow-hidden">

      {/* Header */}
      <header className="bg-emerald-700 text-white px-4 py-3 flex items-center gap-3 shrink-0 shadow-md">
        <button
          onClick={step !== 'list' ? cancelNew : onClose}
          className="bg-emerald-800 hover:bg-emerald-900 active:bg-emerald-950
                     text-white px-3 py-1.5 rounded-xl text-sm font-semibold transition-colors"
        >
          ← {step !== 'list' ? 'Cancelar' : 'Regresar'}
        </button>
        <span className="font-black text-lg">💵 Caja del turno</span>
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
          <div className="bg-emerald-700 text-white px-4 py-2 flex items-center justify-between shrink-0">
            <span className="text-sm font-semibold text-emerald-200">
              Ingresado a la caja este turno
            </span>
            <span className="text-2xl font-black">${totalTurno.toFixed(2)}</span>
          </div>

          {/* Info callout */}
          <div className="shrink-0 bg-emerald-50 border-b border-emerald-100 px-4 py-2.5">
            <p className="text-xs text-emerald-700 font-medium leading-snug">
              Registra aquí cada vez que el administrador ingresa dinero a la caja durante el turno.
              El registro queda guardado con hora y nombre del empleado.
            </p>
          </div>

          {/* Movimientos list */}
          <div className="flex-1 overflow-y-auto p-4 space-y-2">
            {loading ? (
              <p className="text-gray-400 text-sm text-center py-8">Cargando...</p>
            ) : movimientos.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-4xl mb-2">💵</p>
                <p className="text-gray-400 font-medium">Sin ingresos registrados en este turno</p>
              </div>
            ) : (
              movimientos.map(m => (
                <div key={m.id}
                  className="bg-white rounded-2xl border-2 border-gray-100 px-4 py-3
                             flex items-center gap-3 shadow-sm">
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-gray-800 text-sm leading-tight">
                      {m.usuario_nombre ?? 'Sin nombre'}
                    </p>
                    <p className="text-xs text-gray-400 mt-0.5">
                      {new Date(m.creado_en).toLocaleTimeString('es-MX', {
                        hour: '2-digit', minute: '2-digit',
                      })}
                    </p>
                  </div>
                  <span className="font-black text-lg text-emerald-700 shrink-0">
                    +${Number(m.monto).toFixed(2)}
                  </span>
                </div>
              ))
            )}
          </div>

          {/* Add button */}
          <div className="shrink-0 p-4 bg-gray-50 border-t border-gray-200">
            <button onClick={startNew}
              className="w-full bg-emerald-700 hover:bg-emerald-600 active:bg-emerald-800
                         text-white font-black py-4 rounded-2xl text-lg transition-colors
                         shadow-lg">
              + Registrar ingreso a caja
            </button>
          </div>
        </div>
      )}

      {/* ── MONTO step ── */}
      {step === 'monto' && (
        <div className="flex-1 flex flex-col min-h-0 p-4 gap-3 overflow-y-auto">

          <div>
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
              ¿Cuánto dinero se está ingresando a la caja?
            </p>
            <NumericKeypad
              value={monto}
              onChange={setMonto}
              size="lg"
              maxDigits={6}
            />
          </div>

          <button
            onClick={handleSave}
            disabled={!monto || monto === '0' || saving}
            className="shrink-0 w-full bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800
                       disabled:bg-gray-200 disabled:text-gray-400 disabled:cursor-not-allowed
                       text-white font-black py-4 rounded-2xl text-xl transition-colors
                       shadow-lg shadow-emerald-200 disabled:shadow-none"
          >
            {saving ? 'Guardando...' : `✓ Registrar — $${monto || '0'}`}
          </button>
        </div>
      )}
    </div>
  )
}
