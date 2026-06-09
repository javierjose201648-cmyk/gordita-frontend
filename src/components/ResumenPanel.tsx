import { useState, useEffect } from 'react'
import type { ResumenDia, Gasto } from '../types'
import { api } from '../api/client'

interface Props {
  onClose: () => void
  onTurnoCerrado: () => void   // limpia el contador de gorditas vendidas en OrderScreen
}

// ── Helpers de fecha en español ──────────────────────────────
const DIAS   = ['Domingo','Lunes','Martes','Miércoles','Jueves','Viernes','Sábado']
const MESES  = ['enero','febrero','marzo','abril','mayo','junio',
                 'julio','agosto','septiembre','octubre','noviembre','diciembre']

function fechaLarga(d: Date) {
  return `${DIAS[d.getDay()]} ${d.getDate()} de ${MESES[d.getMonth()]} del ${d.getFullYear()}`
}
function horaCorta(d: Date) {
  return `${String(d.getHours()).padStart(2,'0')}:${String(d.getMinutes()).padStart(2,'0')}`
}

// ── Generación de PDF ────────────────────────────────────────
async function generarPDF(resumen: ResumenDia): Promise<void> {
  const { jsPDF } = await import('jspdf')
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' })

  const now         = new Date()
  const turnoInicio = new Date(resumen.turno_inicio)
  const fecha       = fechaLarga(turnoInicio)
  const horaInicio  = horaCorta(turnoInicio)
  const horaCierre  = horaCorta(now)

  const marL  = 20   // margen izquierdo
  const marR  = 190  // margen derecho
  const anchoContenido = marR - marL
  const centro = 105
  let y = 12

  // ── Logo ──
  try {
    const resp = await fetch('/logo.png')
    if (resp.ok) {
      const blob  = await resp.blob()
      const b64   = await new Promise<string>(resolve => {
        const reader = new FileReader()
        reader.onload = e => resolve(e.target!.result as string)
        reader.readAsDataURL(blob)
      })
      doc.addImage(b64, 'PNG', centro - 18, y, 36, 36)
      y += 40
    } else {
      y += 4
    }
  } catch {
    y += 4
  }

  // ── Encabezado ──
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(20)
  doc.setTextColor(93, 42, 14)          // marrón oscuro
  doc.text('Gorditas Luly', centro, y, { align: 'center' })
  y += 7

  doc.setFont('helvetica', 'normal')
  doc.setFontSize(11)
  doc.setTextColor(100, 100, 100)
  doc.text('Resumen del Día', centro, y, { align: 'center' })
  y += 6

  // línea decorativa
  doc.setDrawColor(93, 42, 14)
  doc.setLineWidth(0.8)
  doc.line(marL, y, marR, y)
  y += 6

  doc.setFontSize(10)
  doc.setTextColor(60, 60, 60)
  doc.text(`Fecha:`, marL, y)
  doc.setFont('helvetica', 'bold')
  doc.text(fecha, marL + 16, y)
  doc.setFont('helvetica', 'normal')
  y += 5
  doc.text(`Inicio de turno:`, marL, y)
  doc.setFont('helvetica', 'bold')
  doc.text(horaInicio, marL + 32, y)
  doc.setFont('helvetica', 'normal')
  y += 5
  doc.text(`Hora de cierre:`, marL, y)
  doc.setFont('helvetica', 'bold')
  doc.text(horaCierre, marL + 30, y)
  doc.setFont('helvetica', 'normal')
  y += 7

  doc.setDrawColor(180, 180, 180)
  doc.setLineWidth(0.3)
  doc.line(marL, y, marR, y)
  y += 7

  // ── Helper: sección ──
  function seccion(titulo: string) {
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(11)
    doc.setTextColor(93, 42, 14)
    doc.text(titulo, marL, y)
    y += 5
    doc.setDrawColor(230, 230, 230)
    doc.setLineWidth(0.3)
    doc.line(marL, y, marR, y)
    y += 4
  }

  function filaTabla(col1: string, col2: string, col3: string, negrita = false) {
    doc.setFont('helvetica', negrita ? 'bold' : 'normal')
    doc.setFontSize(10)
    doc.setTextColor(40, 40, 40)
    doc.text(col1, marL, y)
    doc.text(col2, marL + anchoContenido * 0.6, y, { align: 'right' })
    doc.text(col3, marR, y, { align: 'right' })
    y += 5
  }

  function encabezadoTabla(c1: string, c2: string, c3: string) {
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(8.5)
    doc.setTextColor(130, 130, 130)
    doc.text(c1, marL, y)
    doc.text(c2, marL + anchoContenido * 0.6, y, { align: 'right' })
    doc.text(c3, marR, y, { align: 'right' })
    y += 4
  }

  // ── Gorditas ──
  seccion('GORDITAS VENDIDAS')
  if (resumen.gorditas.length === 0) {
    doc.setFont('helvetica', 'italic')
    doc.setFontSize(9)
    doc.setTextColor(150, 150, 150)
    doc.text('Sin ventas de gorditas hoy', marL, y)
    y += 6
  } else {
    encabezadoTabla('Tipo de masa', 'Piezas', 'Subtotal')
    for (const g of resumen.gorditas) {
      filaTabla(g.masa_nombre, String(g.cantidad), `$${g.subtotal.toFixed(2)}`)
    }
    doc.setDrawColor(180, 180, 180)
    doc.setLineWidth(0.3)
    doc.line(marL, y, marR, y)
    y += 3
    filaTabla('Total gorditas', String(resumen.total_gorditas),
      `$${resumen.total_gorditas_pesos.toFixed(2)}`, true)
    y += 3
  }

  // ── Refrescos vendidos ──
  seccion('REFRESCOS VENDIDOS')
  if (resumen.refrescos_vendidos.length === 0) {
    doc.setFont('helvetica', 'italic')
    doc.setFontSize(9)
    doc.setTextColor(150, 150, 150)
    doc.text('Sin ventas de refrescos hoy', marL, y)
    y += 6
  } else {
    encabezadoTabla('Categoría', 'Piezas', 'Subtotal')
    for (const r of resumen.refrescos_vendidos) {
      filaTabla(r.categoria_nombre, String(r.cantidad), `$${r.subtotal.toFixed(2)}`)
    }
    doc.setDrawColor(180, 180, 180)
    doc.setLineWidth(0.3)
    doc.line(marL, y, marR, y)
    y += 3
    filaTabla('Total refrescos', String(resumen.total_refrescos),
      `$${resumen.total_refrescos_pesos.toFixed(2)}`, true)
    y += 3
  }

  // ── Gastos ──
  seccion('GASTOS DEL TURNO')
  if (resumen.gastos.length === 0) {
    doc.setFont('helvetica', 'italic')
    doc.setFontSize(9)
    doc.setTextColor(150, 150, 150)
    doc.text('Sin gastos registrados', marL, y)
    y += 6
  } else {
    encabezadoTabla('Concepto', '', 'Monto')
    for (const g of resumen.gastos) {
      filaTabla(g.concepto, '', `-$${parseFloat(String(g.monto)).toFixed(2)}`)
    }
    doc.setDrawColor(180, 180, 180)
    doc.setLineWidth(0.3)
    doc.line(marL, y, marR, y)
    y += 3
    filaTabla('Total gastos', '', `-$${resumen.total_gastos.toFixed(2)}`, true)
    y += 3
  }

  // ── Resumen final ──
  y += 2
  doc.setDrawColor(93, 42, 14)
  doc.setLineWidth(0.8)
  doc.line(marL, y, marR, y)
  y += 7

  doc.setFont('helvetica', 'bold')
  doc.setFontSize(11)
  doc.setTextColor(93, 42, 14)
  doc.text('RESUMEN FINAL', marL, y)
  y += 7

  const ganancia = resumen.total_ventas - resumen.total_gastos

  function filaFinal(label: string, valor: string, color?: [number,number,number]) {
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(10)
    doc.setTextColor(60, 60, 60)
    doc.text(label, marL, y)
    if (color) doc.setTextColor(...color)
    doc.setFont('helvetica', 'bold')
    doc.text(valor, marR, y, { align: 'right' })
    doc.setTextColor(60, 60, 60)
    y += 6
  }

  filaFinal('Ingresos totales del día', `$${resumen.total_ventas.toFixed(2)}`, [22, 101, 52])
  filaFinal('Total gastos', `-$${resumen.total_gastos.toFixed(2)}`, [185, 28, 28])

  y += 1
  doc.setDrawColor(93, 42, 14)
  doc.setLineWidth(1)
  doc.line(marL, y, marR, y)
  y += 7

  doc.setFont('helvetica', 'bold')
  doc.setFontSize(14)
  const gananciaColor: [number,number,number] = ganancia >= 0 ? [22, 101, 52] : [185, 28, 28]
  doc.setTextColor(40, 40, 40)
  doc.text('GANANCIA NETA:', marL, y)
  doc.setTextColor(...gananciaColor)
  doc.text(`$${ganancia.toFixed(2)}`, marR, y, { align: 'right' })
  y += 12

  // ── Pie de página ──
  doc.setFont('helvetica', 'italic')
  doc.setFontSize(8)
  doc.setTextColor(180, 180, 180)
  doc.text('Generado por Gorditas Luly POS', centro, y, { align: 'center' })

  // ── Descargar ──
  const nombreArchivo = `resumen-${now.getFullYear()}-${String(now.getMonth()+1).padStart(2,'0')}-${String(now.getDate()).padStart(2,'0')}.pdf`
  doc.save(nombreArchivo)
}

// ── Componente principal ─────────────────────────────────────
export default function ResumenPanel({ onClose, onTurnoCerrado }: Props) {
  const [resumen,   setResumen]   = useState<ResumenDia | null>(null)
  const [loading,   setLoading]   = useState(true)
  const [error,     setError]     = useState('')

  // Gasto adicional
  const [gastoConcepto, setGastoConcepto] = useState('')
  const [gastoMonto,    setGastoMonto]    = useState('')
  const [savingGasto,   setSavingGasto]   = useState(false)

  // "Dejar para mañana" (refri)
  const [dejarInputs, setDejarInputs] = useState<Record<number, string>>({})

  // Caja: cuánto dejar para el siguiente turno
  const [cajaFinalInput, setCajaFinalInput] = useState('')

  // Estado de cierre
  const [cerrando,   setCerrando]   = useState(false)
  const [turnoCerrado, setTurnoCerrado] = useState(false)

  async function load() {
    setLoading(true)
    setError('')
    try {
      const data = await api.resumen.getHoy()
      setResumen(data)
      const init: Record<number, string> = {}
      if (data) {
        data.refri_actual.forEach(r => { init[r.categoria_id] = '' })
      }
      setDejarInputs(init)
    } catch {
      setError('Error cargando el resumen del día')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [])

  // ── Gasto adicional ─────────────────────────────────────────
  async function handleAddGasto() {
    const monto = parseFloat(gastoMonto)
    if (!gastoConcepto.trim() || isNaN(monto) || monto <= 0) return
    setSavingGasto(true)
    try {
      const nuevo = await api.gastos.create(gastoConcepto.trim(), monto)
      setResumen(prev => {
        if (!prev) return prev
        return {
          ...prev,
          gastos:       [...prev.gastos, nuevo],
          total_gastos: prev.total_gastos + monto,
        }
      })
      setGastoConcepto('')
      setGastoMonto('')
    } catch {
      setError('Error al agregar gasto')
    } finally {
      setSavingGasto(false)
    }
  }

  async function handleDeleteGasto(g: Gasto) {
    try {
      await api.gastos.delete(g.id)
      setResumen(prev => {
        if (!prev) return prev
        return {
          ...prev,
          gastos:       prev.gastos.filter(x => x.id !== g.id),
          total_gastos: prev.total_gastos - parseFloat(String(g.monto)),
        }
      })
    } catch {
      setError('Error al eliminar gasto')
    }
  }

  // ── Cerrar turno: PDF → actualizar refri → borrar gastos → reset ──
  async function handleCerrarTurno() {
    if (!resumen) return
    const ok = window.confirm(
      '¿Cerrar el turno del día?\n\nSe descargará el resumen en PDF y se reiniciará el turno.\n(Las ventas se conservan en el sistema para historial.)'
    )
    if (!ok) return

    setCerrando(true)
    try {
      // 1. Generar y descargar PDF (con los datos actuales, antes de borrar)
      await generarPDF(resumen)

      // 2. Actualizar refri con los valores de cierre (solo los que el admin llenó)
      for (const cat of resumen.refri_actual) {
        const raw = dejarInputs[cat.categoria_id]
        if (raw === '' || raw === undefined) continue
        const n = parseInt(raw)
        if (!isNaN(n) && n >= 0) {
          await api.refri.setCantidad(cat.categoria_id, n)
        }
      }

      // 3. Cerrar turno en el backend (borra gastos del día, guarda caja_final)
      const cajaFinal = parseFloat(cajaFinalInput) || 0
      await api.resumen.cerrar(cajaFinal)

      // 4. Notificar a OrderScreen para limpiar contador local
      onTurnoCerrado()

      setTurnoCerrado(true)
    } catch (err) {
      setError('Error al cerrar el turno. Intenta de nuevo.')
      console.error(err)
    } finally {
      setCerrando(false)
    }
  }

  // ── Derived ─────────────────────────────────────────────────
  const totalVentas = resumen?.total_ventas ?? 0
  const totalGastos = resumen?.total_gastos ?? 0
  const ganancia    = totalVentas - totalGastos

  // ── Pantalla de turno cerrado ────────────────────────────────
  if (turnoCerrado) {
    return (
      <div className="fixed inset-0 z-50 bg-slate-50 flex flex-col overflow-hidden">
        <header className="bg-indigo-700 text-white px-4 py-3 flex items-center gap-3 shrink-0 shadow-md">
          <button onClick={onClose}
            className="bg-indigo-800 hover:bg-indigo-900 text-white px-3 py-1.5 rounded-xl
                       text-sm font-semibold transition-colors">
            ← Regresar
          </button>
          <span className="font-black text-lg">📊 Resumen del Día</span>
        </header>
        <div className="flex-1 flex flex-col items-center justify-center gap-6 p-8 text-center">
          <div className="text-6xl">✅</div>
          <div>
            <p className="font-black text-2xl text-indigo-700 mb-2">¡Turno cerrado!</p>
            <p className="text-gray-500 text-sm">
              El PDF con el resumen se descargó automáticamente.<br />
              El inventario del refri fue actualizado.<br />
              Los gastos del día han sido reiniciados.
            </p>
          </div>
          <button onClick={onClose}
            className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold
                       px-8 py-3 rounded-2xl text-base transition-colors shadow-lg">
            Continuar →
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="fixed inset-0 z-50 bg-slate-50 flex flex-col overflow-hidden">

      {/* Header */}
      <header className="bg-indigo-700 text-white px-4 py-3 flex items-center gap-3 shrink-0 shadow-md">
        <button onClick={onClose}
          className="bg-indigo-800 hover:bg-indigo-900 text-white px-3 py-1.5 rounded-xl
                     text-sm font-semibold transition-colors">
          ← Regresar
        </button>
        <span className="font-black text-lg">📊 Resumen del Día</span>
        {resumen && (
          <span className="text-indigo-200 text-xs font-semibold hidden sm:block">
            Turno desde {horaCorta(new Date(resumen.turno_inicio))}
          </span>
        )}
        <button onClick={load}
          className="ml-auto bg-indigo-600 hover:bg-indigo-500 text-white
                     px-3 py-1.5 rounded-xl text-sm font-semibold transition-colors">
          ↻
        </button>
      </header>

      {error && (
        <div className="shrink-0 bg-red-500 text-white text-sm font-semibold px-4 py-2 text-center">
          {error}
          <button className="ml-3 underline text-xs" onClick={() => setError('')}>✕</button>
        </div>
      )}

      <div className="flex-1 overflow-y-auto p-4 space-y-4 pb-6">
        {loading ? (
          <p className="text-gray-400 text-sm text-center py-16">Cargando resumen...</p>
        ) : error ? null : !resumen ? (
          <p className="text-gray-400 text-sm text-center py-16">Sin ventas registradas en este turno aún.</p>
        ) : (
          <>
            {/* ══ GORDITAS ════════════════════════════════════════ */}
            <Card title="Gorditas vendidas"
              icon={<img src="/logo.png" className="h-5 w-5 object-contain" />}
              badge={resumen.total_gorditas > 0 ? `${resumen.total_gorditas} pzas` : undefined}
              badgeColor="orange">
              {resumen.gorditas.length === 0 ? (
                <p className="text-gray-400 text-sm text-center py-2">Sin gorditas vendidas hoy</p>
              ) : (
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-gray-400 text-xs uppercase tracking-wide border-b border-gray-100">
                      <th className="text-left pb-2">Masa</th>
                      <th className="text-right pb-2">Pzas</th>
                      <th className="text-right pb-2">Subtotal</th>
                    </tr>
                  </thead>
                  <tbody>
                    {resumen.gorditas.map(g => (
                      <tr key={g.masa_nombre} className="border-b border-gray-50 last:border-0">
                        <td className="py-2 font-semibold text-gray-700">{g.masa_nombre}</td>
                        <td className="py-2 text-right text-gray-500">{g.cantidad}</td>
                        <td className="py-2 text-right font-bold text-green-700">
                          ${g.subtotal.toFixed(2)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot>
                    <tr className="font-black text-sm border-t-2 border-gray-200">
                      <td className="pt-2 text-gray-800">Total</td>
                      <td className="pt-2 text-right text-gray-800">{resumen.total_gorditas}</td>
                      <td className="pt-2 text-right text-green-700">
                        ${resumen.total_gorditas_pesos.toFixed(2)}
                      </td>
                    </tr>
                  </tfoot>
                </table>
              )}
            </Card>

            {/* ══ REFRESCOS ════════════════════════════════════════ */}
            <Card title="Refrescos vendidos" icon="🥤"
              badge={resumen.total_refrescos > 0 ? `${resumen.total_refrescos} pzas` : undefined}
              badgeColor="blue">
              {resumen.refrescos_vendidos.length === 0 ? (
                <p className="text-gray-400 text-sm text-center py-2">Sin refrescos vendidos hoy</p>
              ) : (
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-gray-400 text-xs uppercase tracking-wide border-b border-gray-100">
                      <th className="text-left pb-2">Categoría</th>
                      <th className="text-right pb-2">Pzas</th>
                      <th className="text-right pb-2">Subtotal</th>
                    </tr>
                  </thead>
                  <tbody>
                    {resumen.refrescos_vendidos.map(r => (
                      <tr key={r.categoria_nombre} className="border-b border-gray-50 last:border-0">
                        <td className="py-2 font-semibold text-gray-700">{r.categoria_nombre}</td>
                        <td className="py-2 text-right text-gray-500">{r.cantidad}</td>
                        <td className="py-2 text-right font-bold text-green-700">
                          ${r.subtotal.toFixed(2)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot>
                    <tr className="font-black text-sm border-t-2 border-gray-200">
                      <td className="pt-2 text-gray-800">Total</td>
                      <td className="pt-2 text-right text-gray-800">{resumen.total_refrescos}</td>
                      <td className="pt-2 text-right text-green-700">
                        ${resumen.total_refrescos_pesos.toFixed(2)}
                      </td>
                    </tr>
                  </tfoot>
                </table>
              )}
            </Card>

            {/* Total ingresos — desglose efectivo / tarjeta */}
            <div className="bg-green-50 border-2 border-green-200 rounded-2xl px-5 py-3 space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="font-black text-green-800 text-base">💰 Total ingresos del día</span>
                <span className="font-black text-green-700 text-2xl">${totalVentas.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-sm border-t border-green-200 pt-1.5 gap-4">
                <div className="flex items-center gap-1.5">
                  <span className="text-green-600">💵</span>
                  <span className="text-green-700 font-semibold">Efectivo</span>
                  <span className="font-black text-green-800 ml-auto">${resumen.ventas_efectivo.toFixed(2)}</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="text-blue-500">💳</span>
                  <span className="text-blue-700 font-semibold">Tarjeta</span>
                  <span className="font-black text-blue-800 ml-auto">${resumen.ventas_tarjeta.toFixed(2)}</span>
                </div>
              </div>
            </div>

            {/* ══ CAJA ═════════════════════════════════════════════ */}
            <Card title="Caja del turno" icon="💵"
              badge={`Esperada: $${resumen.caja_esperada.toFixed(2)}`}
              badgeColor="green">

              {/* Fórmula informativa */}
              <div className="bg-emerald-50 border border-emerald-100 rounded-xl px-3 py-2.5 mb-3
                              text-xs text-emerald-700 space-y-1">
                <div className="flex justify-between">
                  <span>Saldo inicial de caja</span>
                  <span className="font-bold">+${resumen.caja_inicial.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Ventas en efectivo</span>
                  <span className="font-bold">+${resumen.ventas_efectivo.toFixed(2)}</span>
                </div>
                {resumen.total_movimientos_caja > 0 && (
                  <div className="flex justify-between">
                    <span>Ingresos manuales a caja</span>
                    <span className="font-bold">+${resumen.total_movimientos_caja.toFixed(2)}</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span>Gastos del turno</span>
                  <span className="font-bold text-red-600">-${resumen.total_gastos.toFixed(2)}</span>
                </div>
                <div className="flex justify-between border-t border-emerald-200 pt-1 font-black">
                  <span>Debería haber en caja</span>
                  <span className="text-emerald-800">${resumen.caja_esperada.toFixed(2)}</span>
                </div>
              </div>

              {/* Movimientos manuales del turno */}
              {resumen.movimientos_caja.length === 0 ? (
                <p className="text-gray-400 text-sm text-center py-1">Sin ingresos manuales este turno</p>
              ) : (
                <div className="space-y-1.5 mb-2">
                  {resumen.movimientos_caja.map(m => (
                    <div key={m.id}
                      className="flex items-center gap-2 bg-emerald-50 border border-emerald-100
                                 rounded-lg px-3 py-2.5">
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-gray-700 leading-tight">
                          {m.usuario_nombre ?? 'Sin nombre'}
                        </p>
                        <p className="text-xs text-gray-400">
                          {new Date(m.creado_en).toLocaleTimeString('es-MX', {
                            hour: '2-digit', minute: '2-digit',
                          })}
                        </p>
                      </div>
                      <span className="font-black text-emerald-700 text-sm shrink-0">
                        +${parseFloat(String(m.monto)).toFixed(2)}
                      </span>
                    </div>
                  ))}
                </div>
              )}

              {/* Tarjeta separado — no entra a la caja */}
              {resumen.ventas_tarjeta > 0 && (
                <div className="mt-3 bg-blue-50 border border-blue-100 rounded-xl px-3 py-2.5">
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-semibold text-blue-700">
                      💳 Ventas con tarjeta (no están en la caja)
                    </span>
                    <span className="font-black text-blue-800">${resumen.ventas_tarjeta.toFixed(2)}</span>
                  </div>
                </div>
              )}
            </Card>

            {/* ══ GASTOS ═══════════════════════════════════════════ */}
            <Card title="Gastos del turno" icon="💸"
              badge={totalGastos > 0 ? `-$${totalGastos.toFixed(2)}` : undefined}
              badgeColor="red">

              {/* Agregar gasto adicional */}
              <div className="bg-indigo-50 border border-indigo-100 rounded-xl p-3 mb-4">
                <p className="text-xs font-bold text-indigo-500 uppercase tracking-wide mb-2">
                  Agregar gasto (nómina, compras, etc.)
                </p>
                <input
                  type="text"
                  value={gastoConcepto}
                  onChange={e => setGastoConcepto(e.target.value)}
                  placeholder="Concepto del gasto..."
                  className="w-full border border-indigo-200 rounded-lg px-3 py-2 text-sm mb-2
                             outline-none focus:border-indigo-400 bg-white transition-colors"
                />
                <div className="flex gap-2">
                  <input
                    type="number"
                    value={gastoMonto}
                    onChange={e => setGastoMonto(e.target.value)}
                    onKeyDown={e => { if (e.key === 'Enter') handleAddGasto() }}
                    placeholder="$0.00"
                    min="0"
                    step="0.01"
                    className="flex-1 border border-indigo-200 rounded-lg px-3 py-2 text-sm
                               outline-none focus:border-indigo-400 bg-white transition-colors"
                  />
                  <button
                    onClick={handleAddGasto}
                    disabled={savingGasto || !gastoConcepto.trim() || !gastoMonto}
                    className="bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800
                               disabled:bg-gray-200 disabled:text-gray-400
                               text-white font-bold px-4 py-2 rounded-lg text-sm transition-colors">
                    {savingGasto ? '...' : '+ Agregar'}
                  </button>
                </div>
              </div>

              {resumen.gastos.length === 0 ? (
                <p className="text-gray-400 text-sm text-center py-2">Sin gastos registrados hoy</p>
              ) : (
                <div className="space-y-1.5">
                  {resumen.gastos.map(g => (
                    <div key={g.id}
                      className="flex items-center gap-2 bg-red-50 border border-red-100
                                 rounded-lg px-3 py-2.5">
                      <span className="flex-1 text-sm text-gray-700 font-medium leading-tight">
                        {g.concepto}
                      </span>
                      <span className="font-black text-red-700 text-sm shrink-0">
                        -${parseFloat(String(g.monto)).toFixed(2)}
                      </span>
                      <button
                        onClick={() => handleDeleteGasto(g)}
                        className="text-red-300 hover:text-red-600 font-bold text-sm
                                   px-1 shrink-0 transition-colors">
                        ✕
                      </button>
                    </div>
                  ))}
                  <div className="flex justify-between items-center px-3 py-2.5
                                  bg-red-100 rounded-lg border border-red-200">
                    <span className="font-black text-red-800 text-sm">Total gastos</span>
                    <span className="font-black text-red-800 text-sm">
                      -${totalGastos.toFixed(2)}
                    </span>
                  </div>
                </div>
              )}
            </Card>

            {/* ══ REFRI ACTUAL ═════════════════════════════════════ */}
            <Card title="Inventario actual del refri" icon="🧊">
              {resumen.refri_actual.length === 0 ? (
                <p className="text-gray-400 text-sm text-center py-2">
                  Sin categorías configuradas
                </p>
              ) : (
                <div className="grid grid-cols-2 gap-2">
                  {resumen.refri_actual.map(r => (
                    <div key={r.categoria_id}
                      className="bg-sky-50 border border-sky-100 rounded-xl
                                 px-3 py-2.5 flex justify-between items-center gap-2">
                      <span className="text-sm font-semibold text-gray-700 truncate">
                        {r.categoria_nombre}
                      </span>
                      <span className="text-xl font-black text-sky-700 shrink-0">
                        {r.cantidad}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </Card>

            {/* ══ DEJAR PARA MAÑANA ════════════════════════════════ */}
            <Card title="Refrescos para el siguiente turno" icon="🌅">
              <p className="text-xs text-gray-400 mb-4">
                Anota cuántos refrescos quedan en el refri al cerrar. Al cerrar el turno se
                actualiza el inventario para el siguiente día.
              </p>
              {resumen.refri_actual.length === 0 ? (
                <p className="text-gray-400 text-sm text-center py-2">Sin categorías</p>
              ) : (
                <div className="grid grid-cols-2 gap-2">
                  {resumen.refri_actual.map(r => (
                    <div key={r.categoria_id}
                      className="bg-white border-2 border-gray-100 rounded-xl p-2.5
                                 flex flex-col gap-1.5">
                      <p className="text-xs font-bold text-gray-400 truncate text-center">
                        {r.categoria_nombre}
                      </p>
                      <input
                        type="text"
                        inputMode="numeric"
                        value={dejarInputs[r.categoria_id] ?? ''}
                        onChange={ev => {
                          const raw = ev.target.value.replace(/\D/g, '')
                          setDejarInputs(prev => ({ ...prev, [r.categoria_id]: raw }))
                        }}
                        placeholder="0"
                        className="w-full text-center text-2xl font-black text-indigo-700
                                   border-2 border-indigo-100 rounded-lg outline-none py-1.5
                                   focus:border-indigo-400 bg-indigo-50 transition-colors
                                   placeholder:text-indigo-200"
                      />
                    </div>
                  ))}
                </div>
              )}
            </Card>

            {/* ══ RESUMEN FINAL ════════════════════════════════════ */}
            <div className="bg-indigo-700 rounded-2xl p-5 text-white shadow-lg">
              <p className="font-black text-base text-center mb-4 text-indigo-100 uppercase tracking-wide">
                Resumen Final del Día
              </p>
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-indigo-200 text-sm font-semibold">Gorditas</span>
                  <span className="font-black text-white">
                    {resumen.total_gorditas} pzas — ${resumen.total_gorditas_pesos.toFixed(2)}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-indigo-200 text-sm font-semibold">Refrescos</span>
                  <span className="font-black text-white">
                    {resumen.total_refrescos} pzas — ${resumen.total_refrescos_pesos.toFixed(2)}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-indigo-200 text-sm font-semibold">💰 Total ingresos</span>
                  <span className="font-black text-green-300 text-lg">${totalVentas.toFixed(2)}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-indigo-200 text-sm font-semibold">💸 Total gastos</span>
                  <span className="font-black text-red-300 text-lg">-${totalGastos.toFixed(2)}</span>
                </div>
                <div className="border-t-2 border-indigo-500 pt-4 flex justify-between items-center">
                  <span className="font-black text-lg text-white">Ganancia neta</span>
                  <span className={`font-black text-3xl ${ganancia >= 0 ? 'text-green-300' : 'text-red-300'}`}>
                    ${ganancia.toFixed(2)}
                  </span>
                </div>
                {/* Caja info al cierre */}
                <div className="border-t-2 border-indigo-500 pt-4 space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-indigo-200 text-sm font-semibold">💵 Caja esperada</span>
                    <span className="font-black text-emerald-300 text-lg">
                      ${resumen.caja_esperada.toFixed(2)}
                    </span>
                  </div>
                  {resumen.ventas_tarjeta > 0 && (
                    <div className="flex justify-between items-center">
                      <span className="text-indigo-200 text-sm font-semibold">💳 Ventas tarjeta</span>
                      <span className="font-black text-blue-300 text-lg">
                        ${resumen.ventas_tarjeta.toFixed(2)}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* ══ ¿CUÁNTO DEJAR EN LA CAJA? ════════════════════════ */}
            <Card title="¿Cuánto dejar en la caja para mañana?" icon="🏦">
              <p className="text-xs text-gray-400 mb-3">
                Este monto será el saldo inicial de caja del siguiente turno.
                Si no llenas nada, se guardará como $0.
              </p>
              <div className="flex items-center gap-3">
                <span className="text-gray-400 font-bold text-lg shrink-0">$</span>
                <input
                  type="text"
                  inputMode="decimal"
                  value={cajaFinalInput}
                  onChange={e => setCajaFinalInput(e.target.value.replace(/[^\d.]/g, ''))}
                  placeholder={resumen.caja_esperada.toFixed(2)}
                  className="flex-1 text-center text-2xl font-black text-indigo-700
                             border-2 border-indigo-100 rounded-xl outline-none py-2.5
                             focus:border-indigo-400 bg-indigo-50 transition-colors
                             placeholder:text-indigo-200"
                />
              </div>
            </Card>

            {/* ══ BOTÓN CERRAR TURNO ═══════════════════════════════ */}
            <button
              onClick={handleCerrarTurno}
              disabled={cerrando}
              className="w-full bg-red-600 hover:bg-red-700 active:bg-red-800
                         disabled:bg-gray-300 disabled:text-gray-400 disabled:cursor-not-allowed
                         text-white font-black py-4 rounded-2xl text-base transition-colors
                         shadow-lg shadow-red-200 flex items-center justify-center gap-2">
              {cerrando ? (
                <>⏳ Cerrando turno...</>
              ) : (
                <>📄 Descargar PDF y cerrar turno</>
              )}
            </button>
            <p className="text-center text-xs text-gray-400 -mt-2 pb-2">
              Se descargará el resumen, se actualizará el refri y se reiniciarán los gastos del día.
            </p>

          </>
        )}
      </div>
    </div>
  )
}

// ── Tarjeta reutilizable ─────────────────────────────────────
function Card({
  title, icon, badge, badgeColor = 'green', children,
}: {
  title: string
  icon?: React.ReactNode
  badge?: string
  badgeColor?: 'orange' | 'blue' | 'green' | 'red'
  children: React.ReactNode
}) {
  const badgeClasses: Record<string, string> = {
    orange: 'bg-orange-100 text-orange-700',
    blue:   'bg-blue-100   text-blue-700',
    green:  'bg-green-100  text-green-700',
    red:    'bg-red-100    text-red-700',
  }
  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
      <div className="flex items-center gap-2 px-4 py-3 bg-gray-50 border-b border-gray-100">
        {icon && (
          typeof icon === 'string'
            ? <span>{icon}</span>
            : icon
        )}
        <span className="font-black text-gray-700 text-sm">{title}</span>
        {badge && (
          <span className={`ml-auto text-xs font-black px-2.5 py-0.5 rounded-full ${badgeClasses[badgeColor]}`}>
            {badge}
          </span>
        )}
      </div>
      <div className="p-4">{children}</div>
    </div>
  )
}
