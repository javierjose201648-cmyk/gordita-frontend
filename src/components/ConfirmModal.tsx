import type { OrderItem } from '../types'

interface Props {
  items:     OrderItem[]
  total:     number
  onConfirm: () => void
  onCancel:  () => void
  loading:   boolean
}

export default function ConfirmModal({ items, total, onConfirm, onCancel, loading }: Props) {
  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-sm overflow-hidden
                      animate-[fadeIn_0.15s_ease]">

        {/* Header */}
        <div className="bg-orange-500 text-white px-6 py-4">
          <h2 className="text-xl font-bold">Confirmar orden</h2>
          <p className="text-orange-100 text-sm">
            {items.reduce((s, i) => s + i.cantidad, 0)} gorditas en total
          </p>
        </div>

        {/* Item list */}
        <div className="px-6 py-4 space-y-2 max-h-56 overflow-y-auto">
          {items.map(item => (
            <div key={item.localId} className="flex items-center justify-between">
              <div>
                <span className="text-gray-800 font-semibold text-sm">
                  {item.cantidad}× {item.guisado_nombre}
                </span>
                <span className="text-orange-500 text-xs ml-1.5">({item.masa_label})</span>
              </div>
              <span className="font-bold text-gray-700 text-sm">${item.subtotal}</span>
            </div>
          ))}
        </div>

        {/* Total */}
        <div className="px-6 pb-2 border-t border-gray-100 pt-3 flex items-center justify-between">
          <span className="text-gray-600 font-semibold text-lg">Total a cobrar</span>
          <span className="text-4xl font-black text-gray-900">${total}</span>
        </div>

        {/* Actions */}
        <div className="px-6 pb-6 pt-4 grid grid-cols-2 gap-3">
          <button
            onClick={onCancel}
            disabled={loading}
            className="py-3.5 rounded-2xl border-2 border-gray-200 text-gray-600 font-semibold
                       hover:bg-gray-50 disabled:opacity-50 text-lg transition-colors"
          >
            Regresar
          </button>
          <button
            onClick={onConfirm}
            disabled={loading}
            className="py-3.5 rounded-2xl bg-orange-500 hover:bg-orange-600 active:bg-orange-700
                       disabled:opacity-50 text-white font-black text-lg transition-colors
                       shadow-lg shadow-orange-200"
          >
            {loading ? '…' : 'Confirmar'}
          </button>
        </div>
      </div>
    </div>
  )
}
