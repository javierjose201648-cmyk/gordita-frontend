import { useState } from 'react'

interface Props {
  value:     string
  onChange:  (v: string) => void
  maxLength?: number
}

const ROW1 = ['q','w','e','r','t','y','u','i','o','p']
const ROW2 = ['a','s','d','f','g','h','j','k','l']
const ROW3 = ['z','x','c','v','b','n','m']
const NUMS = ['1','2','3','4','5','6','7','8','9','0']

export default function QwertyKeyboard({ value, onChange, maxLength = 100 }: Props) {
  const [caps, setCaps] = useState(true)

  // Prevent stealing focus from the real <input> above
  const noFocusSteal = (e: React.MouseEvent) => e.preventDefault()

  function press(char: string) {
    if (value.length >= maxLength) return
    const out = caps ? char.toUpperCase() : char
    onChange(value + out)
    if (caps) setCaps(false)
  }

  function pressNum(n: string) {
    if (value.length >= maxLength) return
    onChange(value + n)
  }

  function pressSpace() {
    if (value.length >= maxLength) return
    onChange(value + ' ')
    setCaps(false)
  }

  function backspace() { onChange(value.slice(0, -1)) }
  function clear()     { onChange(''); setCaps(true)  }

  const keyBase = `flex-1 font-bold rounded-xl select-none transition-colors
                   active:scale-95
                   bg-white border-2 border-gray-200 text-gray-800
                   hover:bg-gray-50 hover:border-gray-300`

  const keyAction = `font-bold rounded-xl select-none transition-colors
                     active:scale-95 bg-gray-100 border-2 border-gray-200
                     text-gray-600 hover:bg-gray-200`

  return (
    <div className="flex flex-col gap-1.5 w-full select-none">

      {/* Number row */}
      <div className="flex gap-1">
        {NUMS.map(n => (
          <button key={n}
            onMouseDown={noFocusSteal}
            onClick={() => pressNum(n)}
            className={`${keyBase} h-9 text-sm`}>
            {n}
          </button>
        ))}
      </div>

      {/* Row 1: QWERTYUIOP */}
      <div className="flex gap-1">
        {ROW1.map(k => (
          <button key={k}
            onMouseDown={noFocusSteal}
            onClick={() => press(k)}
            className={`${keyBase} h-10 text-base`}>
            {caps ? k.toUpperCase() : k}
          </button>
        ))}
      </div>

      {/* Row 2: ASDFGHJKL */}
      <div className="flex gap-1 px-[5%]">
        {ROW2.map(k => (
          <button key={k}
            onMouseDown={noFocusSteal}
            onClick={() => press(k)}
            className={`${keyBase} h-10 text-base`}>
            {caps ? k.toUpperCase() : k}
          </button>
        ))}
      </div>

      {/* Row 3: CAPS + ZXCVBNM + ⌫ */}
      <div className="flex gap-1">
        <button
          onMouseDown={noFocusSteal}
          onClick={() => setCaps(c => !c)}
          className={`${keyAction} h-10 px-2 text-xs min-w-[52px]
                      ${caps ? 'bg-orange-100 border-orange-300 text-orange-700' : ''}`}>
          {caps ? '⇧ MAY' : '⇧ min'}
        </button>
        {ROW3.map(k => (
          <button key={k}
            onMouseDown={noFocusSteal}
            onClick={() => press(k)}
            className={`${keyBase} h-10 text-base`}>
            {caps ? k.toUpperCase() : k}
          </button>
        ))}
        <button
          onMouseDown={noFocusSteal}
          onClick={backspace}
          className={`${keyAction} h-10 px-3 text-base min-w-[44px]`}>
          ⌫
        </button>
      </div>

      {/* Row 4: . + SPACE + C */}
      <div className="flex gap-1">
        <button
          onMouseDown={noFocusSteal}
          onClick={() => pressNum('.')}
          className={`${keyAction} h-10 px-3 text-sm min-w-[44px]`}>
          .
        </button>
        <button
          onMouseDown={noFocusSteal}
          onClick={pressSpace}
          className={`${keyBase} h-10 text-sm flex-[6]`}>
          ESPACIO
        </button>
        <button
          onMouseDown={noFocusSteal}
          onClick={clear}
          className={`${keyAction} h-10 px-2 text-xs min-w-[44px] text-red-500
                      hover:bg-red-50 hover:border-red-200`}>
          C
        </button>
      </div>
    </div>
  )
}
