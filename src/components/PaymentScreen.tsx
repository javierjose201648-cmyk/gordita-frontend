import { useState } from 'react'
import type { OrderItem, DrinkItem } from '../types'
import NumericKeypad from './NumericKeypad'

type Metodo = 'efectivo' | 'tarjeta'

interface Props {
  items:      OrderItem[]
  drinkItems: DrinkItem[]
  total:      number
  onConfirm:  (metodo: Metodo) => Promise<void>
  onCancel:   () => void
  loading:    boolean
}

// Billetes comunes en México
const BILLETES = [20, 50, 100, 200, 500]

export default function PaymentScreen({ items, drinkItems, total, onConfirm, onCancel, loading }: Props) {
  const [metodo,      setMetodo]      = useState<Metodo>('efectivo')
  const [clientePaga, setClientePaga] = useState('')

  const pagado = parseInt(clientePaga) || 0
  const cambio = pagado - total

  const canCobrar =
    !loading &&
    (metodo === 'tarjeta' || (clientePaga !== '' && pagado >= total))

  return (
    <div className="fixed inset-0 z-50 bg-orange-50 flex flex-col overflow-hidden">

      {/* Header */}
      <header className="bg-orange-600 text-white px-4 py-3 flex items-center gap-3 shrink-0 shadow-md">
        <button
          onClick={onCancel}
          className="bg-orange-700 hover:bg-orange-800 active:bg-orange-900
                     text-white px-3 py-1.5 rounded-xl text-sm font-semibold transition-colors"
        >
          ← Regresar
        </button>
        <span className="font-black text-lg">Cobro</span>
      </header>

      <div className="flex-1 flex flex-col md:flex-row gap-3 p-3 min-h-0 overflow-y-auto">

        {/* ── LEFT: resumen + método ── */}
        <div className="flex flex-col gap-3 flex-1">

          {/* Resumen de la orden */}
          <div className="bg-white rounded-2xl shadow-md p-4">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">
              Resumen de la orden
            </p>
            <div className="space-y-2 mb-3">
              {items.map(item => (
                <div key={item.localId} className="flex justify-between text-sm">
                  <span className="text-gray-700">
                    {item.cantidad}× {item.guisado_nombre}
                    <span className="text-orange-500 ml-1 text-xs">({item.masa_label})</span>
                  </span>
                  <span className="font-semibold text-gray-900">${item.subtotal}</span>
                </div>
              ))}
              {drinkItems.length > 0 && items.length > 0 && (
                <div className="flex items-center gap-2 py-0.5">
                  <div className="flex-1 h-px bg-gray-100" />
                  <span className="text-xs text-gray-400">🥤 Bebidas</span>
                  <div className="flex-1 h-px bg-gray-100" />
                </div>
              )}
              {drinkItems.map(item => (
                <div key={item.localId} className="flex justify-between text-sm">
                  <span className="text-gray-700">
                    {item.cantidad}× {item.nombre}
                    <span className="text-blue-500 ml-1 text-xs">({item.tamaño})</span>
                  </span>
                  <span className="font-semibold text-gray-900">${item.subtotal}</span>
                </div>
              ))}
            </div>
            <div className="border-t border-gray-100 pt-2 flex justify-between items-center">
              <span className="font-bold text-gray-700">Total</span>
              <span className="text-3xl font-black text-gray-900">${total}</span>
            </div>
          </div>

          {/* Método de pago */}
          <div className="bg-white rounded-2xl shadow-md p-4">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">
              Método de pago
            </p>
            <div className="grid grid-cols-2 gap-2">
              {(['efectivo', 'tarjeta'] as Metodo[]).map(m => (
                <button
                  key={m}
                  onClick={() => { setMetodo(m); setClientePaga('') }}
                  className={`py-4 rounded-xl font-bold text-lg transition-colors border-2 ${
                    metodo === m
                      ? 'bg-orange-500 border-orange-500 text-white shadow-md shadow-orange-200'
                      : 'bg-white border-gray-200 text-gray-600 hover:border-orange-300'
                  }`}
                >
                  {m === 'efectivo' ? '💵 Efectivo' : '💳 Tarjeta'}
                </button>
              ))}
            </div>
          </div>

          {/* Tarjeta: mensaje simple */}
          {metodo === 'tarjeta' && (
            <div className="bg-white rounded-2xl shadow-md p-4 text-center">
              <p className="text-4xl mb-2">💳</p>
              <p className="text-gray-600 font-medium">Cobrar</p>
              <p className="text-4xl font-black text-gray-900 mt-1">${total}</p>
            </div>
          )}
        </div>

        {/* ── RIGHT: teclado efectivo ── */}
        {metodo === 'efectivo' && (
          <div className="flex flex-col gap-3 w-full md:w-80 shrink-0">

            {/* Billetes rápidos */}
            <div className="bg-white rounded-2xl shadow-md p-4">
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">
                Pago del cliente
              </p>

              <div className="flex flex-wrap gap-2 mb-3">
                {BILLETES.map(b => (
                  <button
                    key={b}
                    onClick={() => setClientePaga(prev => String((parseInt(prev) || 0) + b))}
                    className="flex-1 min-w-[52px] py-2 rounded-xl text-sm font-bold
                               border-2 transition-colors
                               bg-orange-50 border-orange-200 text-orange-700
                               hover:bg-orange-500 hover:border-orange-500 hover:text-white
                               active:bg-orange-600"
                  >
                    +${b}
                  </button>
                ))}
                {/* Clear bill total */}
                <button
                  onClick={() => setClientePaga('')}
                  className="flex-1 min-w-[52px] py-2 rounded-xl text-sm font-bold
                             border-2 border-gray-200 bg-gray-50 text-gray-500
                             hover:bg-red-50 hover:border-red-300 hover:text-red-600
                             active:bg-red-100 transition-colors"
                >
                  ×
                </button>
              </div>

              <NumericKeypad
                value={clientePaga}
                onChange={setClientePaga}
                size="sm"
                maxDigits={4}
              />
            </div>

            {/* Cambio */}
            <div className={`rounded-2xl shadow-md p-4 transition-colors ${
              cambio >= 0 && clientePaga !== ''
                ? 'bg-green-500 text-white'
                : 'bg-white'
            }`}>
              <p className={`text-xs font-semibold uppercase tracking-wide mb-1 ${
                cambio >= 0 && clientePaga !== '' ? 'text-green-100' : 'text-gray-500'
              }`}>
                Cambio a dar
              </p>
              <p className={`text-5xl font-black ${
                cambio >= 0 && clientePaga !== '' ? 'text-white' : 'text-gray-300'
              }`}>
                ${cambio >= 0 && clientePaga !== '' ? cambio : '—'}
              </p>
              {clientePaga !== '' && cambio < 0 && (
                <p className="text-red-500 text-sm font-semibold mt-1">
                  Faltan ${Math.abs(cambio)}
                </p>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Botón cobrar */}
      <div className="p-4 shrink-0 bg-orange-50 border-t border-orange-100">
        <button
          onClick={() => onConfirm(metodo)}
          disabled={!canCobrar}
          className="w-full bg-green-500 hover:bg-green-600 active:bg-green-700
                     disabled:bg-gray-200 disabled:text-gray-400 disabled:cursor-not-allowed
                     text-white font-black py-5 rounded-2xl text-2xl transition-colors
                     shadow-lg shadow-green-200 disabled:shadow-none"
        >
          {loading ? 'Procesando...' : `✓ Cobrar $${total}`}
        </button>
      </div>
    </div>
  )
}
