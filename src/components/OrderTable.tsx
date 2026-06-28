import type { OrderItem, DrinkItem } from '../types'

interface Props {
  items:               OrderItem[]
  drinkItems:          DrinkItem[]
  onDelete:            (localId: string) => void
  onDeleteDrink:       (localId: string) => void
  onClear:             () => void
  onCobrar:            () => void
  cobrarLabel?:        string        // overrides the default "Cobrar $total"
  cobrarDisabled?:     boolean       // extra disabled condition (e.g. combo not complete)
  lockedItemIds?:      Set<string>   // localIds that cannot be deleted (combo fixed items)
  lockedDrinkIds?:     Set<string>   // localIds that cannot be deleted (combo fixed drinks)
  onNuevoPlato?:       () => void    // undefined = button hidden (combo mode or non-guisados)
  nuevoPlatoDisabled?: boolean       // button shown but grayed (current plate is empty)
}

export default function OrderTable({
  items,
  drinkItems,
  onDelete,
  onDeleteDrink,
  onClear,
  onCobrar,
  cobrarLabel,
  cobrarDisabled,
  lockedItemIds,
  lockedDrinkIds,
  onNuevoPlato,
  nuevoPlatoDisabled,
}: Props) {
  const totalGorditas = items.reduce((s, i) => s + i.cantidad, 0)
  const totalBebidas  = drinkItems.reduce((s, i) => s + i.cantidad, 0)
  const total         = items.reduce((s, i) => s + i.subtotal, 0)
                      + drinkItems.reduce((s, i) => s + i.subtotal, 0)

  const hasAnything = items.length > 0 || drinkItems.length > 0

  const parts: string[] = []
  if (totalGorditas > 0) parts.push(`${totalGorditas} gordita${totalGorditas !== 1 ? 's' : ''}`)
  if (totalBebidas  > 0) parts.push(`${totalBebidas} bebida${totalBebidas  !== 1 ? 's' : ''}`)
  const subtitle = parts.length > 0 ? parts.join(' · ') : '0 gorditas'

  return (
    <div className="flex flex-col h-full bg-white rounded-2xl shadow-md overflow-hidden">

      {/* Header */}
      <div className="bg-orange-600 text-white px-4 py-3 flex items-center justify-between shrink-0">
        <div>
          <p className="font-bold text-base leading-tight">Orden actual</p>
          <p className="text-orange-200 text-xs">{subtitle}</p>
        </div>
        {hasAnything && (
          <button
            onClick={onClear}
            className="text-orange-200 hover:text-white text-xs border border-orange-400
                       hover:border-white rounded-lg px-2 py-1 transition-colors"
          >
            {(lockedItemIds?.size || lockedDrinkIds?.size) ? 'Limpiar extras' : 'Limpiar todo'}
          </button>
        )}
      </div>

      {/* Items list */}
      <div className="flex-1 overflow-y-auto p-2 space-y-1 min-h-0">
        {!hasAnything ? (
          <div className="flex flex-col items-center justify-center h-full text-gray-300 select-none py-8">
            <div className="text-4xl mb-2">🫓</div>
            <p className="text-sm">Sin gorditas aún</p>
          </div>
        ) : (
          <>
            {/* Gordita items with plate dividers */}
            {items.flatMap((item, idx) => {
              const prev = items[idx - 1]
              const showDivider = idx > 0 && (prev.plato ?? 1) !== (item.plato ?? 1)
              const locked = lockedItemIds?.has(item.localId)
              const result = []

              if (showDivider) {
                result.push(
                  <div key={`plato-div-${item.localId}`}
                       className="flex items-center gap-1.5 py-1 px-1">
                    <div className="flex-1 border-t-2 border-dashed border-orange-300" />
                    <span className="text-xs font-bold text-orange-400 shrink-0">
                      Plato {item.plato ?? 1}
                    </span>
                    <div className="flex-1 border-t-2 border-dashed border-orange-300" />
                  </div>
                )
              }

              result.push(
                <div
                  key={item.localId}
                  className={`flex items-center gap-2 rounded-xl px-3 py-2.5 transition-colors
                    ${locked
                      ? 'bg-orange-100 border border-orange-300'
                      : 'bg-orange-50 hover:bg-orange-100'}`}
                >
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-gray-800 text-sm leading-tight truncate">
                      {item.cantidad}× {item.guisado_nombre}
                    </p>
                    <p className="text-xs text-orange-600 font-medium">
                      {item.masa_label}{locked && ' · incluido'}
                    </p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="font-bold text-gray-900 text-sm">${item.subtotal}</p>
                    <p className="text-xs text-gray-400">${item.precio_unitario} c/u</p>
                  </div>
                  {!locked && (
                    <button
                      onClick={() => onDelete(item.localId)}
                      aria-label="Eliminar"
                      className="shrink-0 w-7 h-7 flex items-center justify-center
                                 rounded-lg text-red-400 hover:text-white hover:bg-red-400
                                 active:bg-red-500 transition-colors text-lg font-bold leading-none"
                    >
                      ×
                    </button>
                  )}
                </div>
              )

              return result
            })}

            {/* Drinks divider + items */}
            {drinkItems.length > 0 && (
              <>
                {items.length > 0 && (
                  <div className="flex items-center gap-2 py-1 px-1">
                    <div className="flex-1 h-px bg-gray-100" />
                    <span className="text-xs text-gray-400 font-medium">🥤 Bebidas</span>
                    <div className="flex-1 h-px bg-gray-100" />
                  </div>
                )}
                {drinkItems.map(item => {
                  const locked = lockedDrinkIds?.has(item.localId)
                  return (
                    <div
                      key={item.localId}
                      className={`flex items-center gap-2 rounded-xl px-3 py-2.5 transition-colors
                        ${locked
                          ? 'bg-blue-100 border border-blue-300'
                          : 'bg-blue-50 hover:bg-blue-100'}`}
                    >
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-gray-800 text-sm leading-tight truncate">
                          {item.cantidad}× {item.nombre}
                        </p>
                        <p className="text-xs text-blue-600 font-medium">
                          {item.tamaño}{locked && ' · incluido'}
                        </p>
                      </div>
                      <div className="text-right shrink-0">
                        <p className="font-bold text-gray-900 text-sm">${item.subtotal}</p>
                        <p className="text-xs text-gray-400">${item.precio_unitario} c/u</p>
                      </div>
                      {!locked && (
                        <button
                          onClick={() => onDeleteDrink(item.localId)}
                          aria-label="Eliminar"
                          className="shrink-0 w-7 h-7 flex items-center justify-center
                                     rounded-lg text-red-400 hover:text-white hover:bg-red-400
                                     active:bg-red-500 transition-colors text-lg font-bold leading-none"
                        >
                          ×
                        </button>
                      )}
                    </div>
                  )
                })}
              </>
            )}
          </>
        )}
      </div>

      {/* Footer */}
      <div className="border-t border-gray-100 p-4 space-y-2 shrink-0">
        <div className="flex items-center justify-between">
          <span className="text-gray-500 font-medium">Total</span>
          <span className="text-3xl font-black text-gray-900">${total}</span>
        </div>

        {/* + Plato — solo visible en modo guisados normal (no combo) */}
        {onNuevoPlato && (
          <button
            onClick={onNuevoPlato}
            disabled={nuevoPlatoDisabled}
            className="w-full border-2 border-dashed border-orange-300 hover:border-orange-500
                       bg-orange-50 hover:bg-orange-100 active:bg-orange-200
                       disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:border-orange-300
                       disabled:hover:bg-orange-50
                       text-orange-600 font-bold py-2 rounded-2xl text-sm transition-colors"
          >
            + Plato
          </button>
        )}

        <button
          onClick={onCobrar}
          disabled={!hasAnything || !!cobrarDisabled}
          className="w-full bg-orange-500 hover:bg-orange-600 active:bg-orange-700
                     disabled:bg-gray-200 disabled:text-gray-400 disabled:cursor-not-allowed
                     text-white font-black py-4 rounded-2xl text-xl transition-colors
                     shadow-lg shadow-orange-200 disabled:shadow-none"
        >
          {cobrarLabel ?? `Cobrar $${total}`}
        </button>
      </div>
    </div>
  )
}
