interface Props {
  value:      string
  onChange:   (v: string) => void
  onConfirm?: () => void
  size?:      'lg' | 'sm'
  maxDigits?: number
}

const ROWS = [
  ['1', '2', '3'],
  ['4', '5', '6'],
  ['7', '8', '9'],
  ['C', '0', '⌫'],
]

export default function NumericKeypad({
  value,
  onChange,
  onConfirm,
  size = 'lg',
  maxDigits = 3,
}: Props) {

  function press(key: string) {
    if (key === '⌫') {
      onChange(value.slice(0, -1))
    } else if (key === 'C') {
      onChange('')
    } else {
      if (value.length >= maxDigits) return
      if (value === '0') return
      onChange(value + key)
    }
  }

  // Handle physical keyboard input — digits only, respect maxDigits & no leading zeros
  function handleInputChange(e: React.ChangeEvent<HTMLInputElement>) {
    const raw = e.target.value.replace(/\D/g, '')
    if (raw.length > maxDigits) return
    if (raw.length > 1 && raw[0] === '0') return
    onChange(raw)
  }

  const isLg = size === 'lg'

  return (
    <div className="flex flex-col gap-1.5 sm:gap-2">
      {/* Display — real <input> so physical keyboard works */}
      <input
        type="text"
        inputMode="numeric"
        pattern="[0-9]*"
        value={value}
        placeholder="0"
        onChange={handleInputChange}
        onKeyDown={e => { if (e.key === 'Enter' && onConfirm) onConfirm() }}
        className={`w-full text-center font-black text-gray-800 bg-orange-50
                    border-2 border-orange-200 rounded-2xl outline-none
                    focus:border-orange-400 transition-colors
                    placeholder:text-orange-200
                    ${isLg
                      ? 'text-4xl sm:text-5xl lg:text-6xl min-h-[56px] sm:min-h-[68px] lg:min-h-[80px]'
                      : 'text-3xl sm:text-4xl min-h-[48px] sm:min-h-[60px]'
                    }`}
      />

      {/* Keys — height compresses on small screens */}
      <div className="grid grid-cols-3 gap-1.5 sm:gap-2">
        {ROWS.flat().map((key, i) => {
          const isAction = key === 'C' || key === '⌫'
          return (
            <button
              key={i}
              onClick={() => press(key)}
              // prevent stealing focus from the input above
              onMouseDown={e => e.preventDefault()}
              className={`
                font-bold rounded-xl select-none transition-colors
                ${isLg
                  ? 'h-[52px] sm:h-[60px] lg:h-[68px] text-xl sm:text-2xl'
                  : 'h-[44px] sm:h-[52px] text-lg sm:text-xl'
                }
                ${isAction
                  ? 'bg-orange-100 text-orange-700 hover:bg-orange-200 active:bg-orange-300 border border-orange-200'
                  : 'bg-white text-gray-800 hover:bg-orange-50 active:bg-orange-100 border-2 border-orange-200 shadow-sm'
                }
              `}
            >
              {key === '⌫' ? '←' : key}
            </button>
          )
        })}
      </div>
    </div>
  )
}
