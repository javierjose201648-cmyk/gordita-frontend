interface Props {
  onSelectCombo: (comboId: 1 | 2) => void
  onBack: () => void
}

const COMBOS = [
  {
    id: 2 as const,
    nombre: 'Combo Familiar',
    precio: 228,
    descripcion: '10 gorditas de harina con guisados a escoger + 1 refresco 1.75 L',
    detalle: ['10 gorditas de harina', '1 refresco 1.75 L (incluido)', 'Guisados a elegir'],
    color: 'orange',
  },
  {
    id: 1 as const,
    nombre: 'Combo Individual',
    precio: 80,
    descripcion: '1 gordita de frijoles con queso + 2 gorditas a elegir de harina + 1 refresco de lata',
    detalle: ['1 gordita frijoles con queso (harina)', '2 gorditas de harina a elegir', '1 refresco de lata (incluido)'],
    color: 'blue',
  },
]

export default function ComboPanel({ onSelectCombo, onBack }: Props) {
  return (
    <div className="flex flex-col gap-4 h-full">
      <h2 className="text-center text-gray-700 font-bold text-lg">Selecciona un combo</h2>

      {COMBOS.map(combo => (
        <button
          key={combo.id}
          onClick={() => onSelectCombo(combo.id)}
          className={`w-full text-left rounded-2xl border-2 p-4 transition-all active:scale-95
            ${combo.color === 'orange'
              ? 'bg-orange-50 border-orange-300 hover:border-orange-500 hover:bg-orange-100'
              : 'bg-blue-50 border-blue-300 hover:border-blue-500 hover:bg-blue-100'
            }`}
        >
          <div className="flex items-center justify-between mb-2">
            <span className={`font-black text-lg ${combo.color === 'orange' ? 'text-orange-700' : 'text-blue-700'}`}>
              {combo.nombre}
            </span>
            <span className={`font-black text-2xl ${combo.color === 'orange' ? 'text-orange-600' : 'text-blue-600'}`}>
              ${combo.precio}
            </span>
          </div>
          <ul className="space-y-1">
            {combo.detalle.map((d, i) => (
              <li key={i} className="text-sm text-gray-600 flex items-start gap-1.5">
                <span className={combo.color === 'orange' ? 'text-orange-400' : 'text-blue-400'}>•</span>
                {d}
              </li>
            ))}
          </ul>
        </button>
      ))}

      <button
        onClick={onBack}
        className="text-orange-600 hover:text-orange-800 font-medium text-sm py-2 text-center transition-colors mt-auto"
      >
        ← Volver al inicio
      </button>
    </div>
  )
}
