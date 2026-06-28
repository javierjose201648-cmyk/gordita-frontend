import { useState, useEffect, useRef } from 'react'
import { api, type AdminUser } from '../api/client'
import type { Guisado, TipoMasa, Refresco, CategoriaRefresco } from '../types'
import { useAuth } from '../context/AuthContext'

interface Props {
  onClose: () => void
}

type Tab = 'usuarios' | 'guisados' | 'masas' | 'bebidas'

// ── Shared helpers ────────────────────────────────────────────
function SectionHeader({ title, icon }: { title: string; icon: string }) {
  return (
    <div className="flex items-center gap-2 mb-4">
      <span className="text-xl">{icon}</span>
      <h2 className="font-black text-gray-800 text-lg">{title}</h2>
    </div>
  )
}

function ActionButton({ label, onClick, color = 'orange', disabled }: {
  label: string; onClick: () => void
  color?: 'orange' | 'red' | 'green' | 'gray' | 'blue'; disabled?: boolean
}) {
  const cls = {
    orange: 'bg-orange-500 hover:bg-orange-600 text-white',
    red:    'bg-red-100 hover:bg-red-200 text-red-700',
    green:  'bg-green-500 hover:bg-green-600 text-white',
    gray:   'bg-gray-100 hover:bg-gray-200 text-gray-700',
    blue:   'bg-blue-100 hover:bg-blue-200 text-blue-700',
  }[color]
  return (
    <button onClick={onClick} disabled={disabled}
      className={`${cls} text-xs font-bold px-2.5 py-1.5 rounded-lg transition-colors
                  disabled:opacity-40 disabled:cursor-not-allowed`}>
      {label}
    </button>
  )
}

function InputField({ label, value, onChange, type = 'text', placeholder }: {
  label: string; value: string; onChange: (v: string) => void
  type?: string; placeholder?: string
}) {
  return (
    <div className="flex flex-col gap-1">
      <label className="text-xs font-semibold text-gray-600">{label}</label>
      <input type={type} value={value} onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
        className="border-2 border-gray-200 rounded-xl px-3 py-2 text-sm
                   focus:outline-none focus:border-orange-400 transition-colors" />
    </div>
  )
}

// ── Blank masa form ───────────────────────────────────────────
const blankMasa = () => ({ nombre: '', precio: '', disponible: true })
// ── Blank bebida form ─────────────────────────────────────────
const blankBebida = () => ({ nombre: '', sabor: '', tamaño: '', precio: '', categoria_id: '' })

// ── Usuarios ──────────────────────────────────────────────────
function UsuariosSection() {
  const { user: me } = useAuth()
  const [usuarios, setUsuarios] = useState<AdminUser[]>([])
  const [loading,  setLoading]  = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({ username: '', password: '', nombre_completo: '', rol: 'empleado' })
  const [error,  setError]  = useState('')
  const [saving, setSaving] = useState(false)

  // Edición inline
  const [editingId, setEditingId] = useState<number | null>(null)
  const [editForm, setEditForm] = useState({
    nombre_completo: '', username: '', rol: 'empleado',
    oldPassword: '', newPassword: '',
  })
  const [editSaving, setEditSaving] = useState(false)
  const [editError,  setEditError]  = useState('')

  async function load() {
    setLoading(true)
    try { setUsuarios(await api.admin.usuarios.getAll()) }
    catch { setError('Error cargando usuarios') }
    finally { setLoading(false) }
  }
  useEffect(() => { load() }, [])

  async function handleCreate() {
    if (!form.username || !form.password || !form.nombre_completo) {
      setError('Todos los campos son requeridos'); return
    }
    setSaving(true); setError('')
    try {
      await api.admin.usuarios.create(form)
      setForm({ username: '', password: '', nombre_completo: '', rol: 'empleado' })
      setShowForm(false); await load()
    } catch (e: unknown) { setError(e instanceof Error ? e.message : 'Error') }
    finally { setSaving(false) }
  }

  async function toggleActivo(u: AdminUser) {
    try { await api.admin.usuarios.update(u.id, { activo: !u.activo }); await load() }
    catch { setError('Error al actualizar') }
  }

  async function handleDelete(u: AdminUser) {
    if (!confirm(`¿Eliminar al usuario "${u.username}"? Esta acción no se puede deshacer.`)) return
    try { await api.admin.usuarios.delete(u.id); await load() }
    catch (e: unknown) { setError(e instanceof Error ? e.message : 'Error al eliminar') }
  }

  function startEdit(u: AdminUser) {
    setEditingId(u.id)
    setEditForm({ nombre_completo: u.nombre_completo, username: u.username,
      rol: u.rol, oldPassword: '', newPassword: '' })
    setEditError('')
  }

  function cancelEdit() { setEditingId(null); setEditError('') }

  async function handleSaveEdit(u: AdminUser) {
    setEditSaving(true); setEditError('')
    try {
      // Guardar datos generales
      await api.admin.usuarios.update(u.id, {
        nombre_completo: editForm.nombre_completo,
        username:        editForm.username,
        ...(me?.id !== u.id ? { rol: editForm.rol } : {}),
      })

      // Cambiar contraseña solo si se escribió algo
      if (editForm.newPassword) {
        await api.admin.usuarios.updatePassword(u.id, editForm.newPassword, editForm.oldPassword || undefined)
      }

      setEditingId(null)
      await load()
    } catch (e: unknown) { setEditError(e instanceof Error ? e.message : 'Error al guardar') }
    finally { setEditSaving(false) }
  }

  const isSelf = (u: AdminUser) => me?.id === u.id

  return (
    <div className="space-y-4">
      <SectionHeader title="Usuarios" icon="👥" />
      {error && <p className="text-red-500 text-sm bg-red-50 rounded-xl px-3 py-2">{error}</p>}

      {showForm ? (
        <div className="bg-orange-50 border-2 border-orange-200 rounded-2xl p-4 space-y-3">
          <p className="font-bold text-gray-700 text-sm">Nuevo usuario</p>
          <InputField label="Nombre completo" value={form.nombre_completo}
            onChange={v => setForm(f => ({ ...f, nombre_completo: v }))} placeholder="Ej: Juan Pérez" />
          <InputField label="Username" value={form.username}
            onChange={v => setForm(f => ({ ...f, username: v }))} placeholder="Ej: juan123" />
          <InputField label="Contraseña" value={form.password} type="password"
            onChange={v => setForm(f => ({ ...f, password: v }))} placeholder="Mínimo 6 caracteres" />
          <div className="flex flex-col gap-1">
            <label className="text-xs font-semibold text-gray-600">Rol</label>
            <select value={form.rol} onChange={e => setForm(f => ({ ...f, rol: e.target.value }))}
              className="border-2 border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-orange-400">
              <option value="empleado">Empleado</option>
              <option value="administrador">Administrador</option>
            </select>
          </div>
          <div className="flex gap-2 pt-1">
            <ActionButton label={saving ? 'Guardando...' : 'Crear usuario'} onClick={handleCreate}
              color="green" disabled={saving} />
            <ActionButton label="Cancelar" onClick={() => { setShowForm(false); setError('') }} color="gray" />
          </div>
        </div>
      ) : (
        <button onClick={() => setShowForm(true)}
          className="w-full border-2 border-dashed border-orange-300 hover:border-orange-500
                     text-orange-600 font-bold py-3 rounded-2xl text-sm transition-colors">
          + Nuevo usuario
        </button>
      )}

      {loading ? <p className="text-gray-400 text-sm text-center py-4">Cargando...</p> : (
        <div className="space-y-2">
          {usuarios.map(u => (
            <div key={u.id} className="rounded-2xl border-2 overflow-hidden
              bg-white border-gray-100">

              {/* Fila principal */}
              <div className={`flex items-center gap-3 px-4 py-3
                              ${!u.activo ? 'opacity-60' : ''}`}>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="font-bold text-gray-800 text-sm leading-tight">{u.nombre_completo}</p>
                    {isSelf(u) && (
                      <span className="text-xs bg-orange-100 text-orange-600 font-bold px-1.5 py-0.5 rounded-full">
                        Tú
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-gray-500">@{u.username} · {u.rol}</p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <ActionButton label={u.activo ? 'Desactivar' : 'Activar'}
                    onClick={() => toggleActivo(u)} color={u.activo ? 'gray' : 'green'}
                    disabled={editingId === u.id} />
                  <ActionButton
                    label={editingId === u.id ? 'Cancelar' : 'Editar'}
                    onClick={() => editingId === u.id ? cancelEdit() : startEdit(u)}
                    color={editingId === u.id ? 'gray' : 'orange'} />
                  {!isSelf(u) && (
                    <ActionButton label="Eliminar" onClick={() => handleDelete(u)} color="red"
                      disabled={editingId === u.id} />
                  )}
                </div>
              </div>

              {/* Formulario de edición inline */}
              {editingId === u.id && (
                <div className="border-t-2 border-orange-100 bg-orange-50 px-4 py-4 space-y-3">
                  {editError && (
                    <p className="text-red-500 text-xs bg-red-50 border border-red-200 rounded-lg px-3 py-2">
                      {editError}
                    </p>
                  )}

                  <InputField label="Nombre completo" value={editForm.nombre_completo}
                    onChange={v => setEditForm(f => ({ ...f, nombre_completo: v }))} />
                  <InputField label="Username" value={editForm.username}
                    onChange={v => setEditForm(f => ({ ...f, username: v }))} />

                  {/* Rol: deshabilitado para cuenta propia */}
                  {!isSelf(u) && (
                    <div className="flex flex-col gap-1">
                      <label className="text-xs font-semibold text-gray-600">Rol</label>
                      <select value={editForm.rol}
                        onChange={e => setEditForm(f => ({ ...f, rol: e.target.value }))}
                        className="border-2 border-gray-200 rounded-xl px-3 py-2 text-sm
                                   focus:outline-none focus:border-orange-400 bg-white">
                        <option value="empleado">Empleado</option>
                        <option value="administrador">Administrador</option>
                      </select>
                    </div>
                  )}

                  {/* Cambio de contraseña */}
                  <div className="border-t border-orange-200 pt-3 space-y-2">
                    <p className="text-xs font-bold text-gray-500 uppercase tracking-wide">
                      Cambiar contraseña {!isSelf(u) && '(opcional)'}
                    </p>
                    {isSelf(u) && (
                      <InputField label="Contraseña actual" value={editForm.oldPassword} type="password"
                        onChange={v => setEditForm(f => ({ ...f, oldPassword: v }))}
                        placeholder="Requerida para cambiar contraseña" />
                    )}
                    <InputField
                      label={isSelf(u) ? 'Nueva contraseña' : 'Nueva contraseña (dejar vacío para no cambiar)'}
                      value={editForm.newPassword} type="password"
                      onChange={v => setEditForm(f => ({ ...f, newPassword: v }))}
                      placeholder="Mínimo 6 caracteres" />
                  </div>

                  <div className="flex gap-2 pt-1">
                    <ActionButton
                      label={editSaving ? 'Guardando...' : 'Guardar cambios'}
                      onClick={() => handleSaveEdit(u)} color="green" disabled={editSaving} />
                    <ActionButton label="Cancelar" onClick={cancelEdit} color="gray" />
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

// ── Guisados ──────────────────────────────────────────────────
function GuisadosSection() {
  const [guisados,   setGuisados]   = useState<Guisado[]>([])
  const [loading,    setLoading]    = useState(true)
  const [showForm,   setShowForm]   = useState(false)
  const [nombre,     setNombre]     = useState('')
  const [error,      setError]      = useState('')
  const [saving,     setSaving]     = useState(false)
  const [editingId,  setEditingId]  = useState<number | null>(null)
  const [editNombre, setEditNombre] = useState('')
  const [editSaving, setEditSaving] = useState(false)

  async function load() {
    setLoading(true)
    try { setGuisados(await api.admin.guisados.getAll()) }
    catch { setError('Error cargando guisados') }
    finally { setLoading(false) }
  }
  useEffect(() => { load() }, [])

  async function handleCreate() {
    if (!nombre.trim()) { setError('Escribe el nombre'); return }
    setSaving(true); setError('')
    try {
      await api.admin.guisados.create(nombre.trim())
      setNombre(''); setShowForm(false); await load()
    } catch (e: unknown) { setError(e instanceof Error ? e.message : 'Error') }
    finally { setSaving(false) }
  }

  function startEdit(g: Guisado) {
    setEditingId(g.id); setEditNombre(g.nombre); setError('')
  }

  function cancelEdit() { setEditingId(null); setEditNombre('') }

  async function handleSaveEdit(g: Guisado) {
    if (!editNombre.trim()) { setError('El nombre no puede estar vacío'); return }
    setEditSaving(true); setError('')
    try {
      await api.admin.guisados.update(g.id, { nombre: editNombre.trim() })
      cancelEdit(); await load()
    } catch (e: unknown) { setError(e instanceof Error ? e.message : 'Error al guardar') }
    finally { setEditSaving(false) }
  }

  async function toggleDisponible(g: Guisado) {
    try { await api.admin.guisados.update(g.id, { disponible: !g.disponible }); await load() }
    catch { setError('Error al actualizar') }
  }

  async function handleDelete(g: Guisado) {
    if (!confirm(`¿Eliminar "${g.nombre}"?`)) return
    try { await api.admin.guisados.delete(g.id); await load() }
    catch { setError('No se puede eliminar (puede tener órdenes asociadas)') }
  }

  return (
    <div className="space-y-4">
      <SectionHeader title="Guisados" icon="🫔" />
      {error && <p className="text-red-500 text-sm bg-red-50 rounded-xl px-3 py-2">{error}</p>}

      {showForm ? (
        <div className="bg-orange-50 border-2 border-orange-200 rounded-2xl p-4 space-y-3">
          <InputField label="Nombre del guisado" value={nombre}
            onChange={setNombre} placeholder="Ej: Chicharrón en salsa" />
          <div className="flex gap-2">
            <ActionButton label={saving ? 'Guardando...' : 'Agregar'} onClick={handleCreate}
              color="green" disabled={saving} />
            <ActionButton label="Cancelar" onClick={() => { setShowForm(false); setError('') }} color="gray" />
          </div>
        </div>
      ) : (
        <button onClick={() => setShowForm(true)}
          className="w-full border-2 border-dashed border-orange-300 hover:border-orange-500
                     text-orange-600 font-bold py-3 rounded-2xl text-sm transition-colors">
          + Nuevo guisado
        </button>
      )}

      {loading ? <p className="text-gray-400 text-sm text-center py-4">Cargando...</p> : (
        <div className="space-y-2">
          {guisados.map(g => (
            <div key={g.id}
              className={`rounded-2xl border-2 overflow-hidden
                          ${g.disponible ? 'bg-white border-gray-100' : 'bg-gray-50 border-gray-200'}`}>

              {editingId === g.id ? (
                /* Modo edición inline */
                <div className="flex items-center gap-2 px-4 py-3">
                  <input
                    autoFocus
                    value={editNombre}
                    onChange={e => setEditNombre(e.target.value)}
                    onKeyDown={e => { if (e.key === 'Enter') handleSaveEdit(g); if (e.key === 'Escape') cancelEdit() }}
                    className="flex-1 border-2 border-orange-400 rounded-xl px-3 py-1.5 text-sm
                               font-semibold focus:outline-none"
                  />
                  <ActionButton label={editSaving ? '...' : 'Guardar'} onClick={() => handleSaveEdit(g)}
                    color="green" disabled={editSaving} />
                  <ActionButton label="Cancelar" onClick={cancelEdit} color="gray" />
                </div>
              ) : (
                /* Modo normal */
                <div className={`flex items-center gap-3 px-4 py-3 ${!g.disponible ? 'opacity-60' : ''}`}>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-gray-800 text-sm">{g.nombre}</p>
                  </div>
                  <div className="flex gap-2 shrink-0">
                    <ActionButton label="Editar" onClick={() => startEdit(g)} color="blue" />
                    <ActionButton label={g.disponible ? 'Ocultar' : 'Mostrar'}
                      onClick={() => toggleDisponible(g)} color={g.disponible ? 'gray' : 'green'} />
                    <ActionButton label="Eliminar" onClick={() => handleDelete(g)} color="red" />
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

// ── Masas ─────────────────────────────────────────────────────
function MasasSection() {
  const [masas,      setMasas]      = useState<TipoMasa[]>([])
  const [loading,    setLoading]    = useState(true)
  const [error,      setError]      = useState('')
  const [saving,     setSaving]     = useState(false)
  // form state: null = hidden, -1 = new, id = editing
  const [editingId,  setEditingId]  = useState<number | null>(null)
  const [form,       setForm]       = useState(blankMasa())

  async function load() {
    setLoading(true)
    try { setMasas(await api.admin.masas.getAll()) }
    catch { setError('Error cargando tipos de masa') }
    finally { setLoading(false) }
  }
  useEffect(() => { load() }, [])

  function openNew() {
    setForm(blankMasa()); setEditingId(-1); setError('')
  }

  function openEdit(m: TipoMasa) {
    setForm({ nombre: m.nombre, precio: String(m.precio), disponible: m.disponible })
    setEditingId(m.id); setError('')
  }

  function closeForm() { setEditingId(null); setError('') }

  async function handleSave() {
    if (!form.nombre.trim()) { setError('El nombre es requerido'); return }
    const precio = parseFloat(form.precio)
    if (isNaN(precio) || precio < 0) { setError('Precio inválido'); return }
    setSaving(true); setError('')
    try {
      if (editingId === -1) {
        await api.admin.masas.create({ nombre: form.nombre.trim(), precio: precio, disponible: form.disponible })
      } else if (editingId !== null) {
        await api.admin.masas.update(editingId, { nombre: form.nombre.trim(), precio: precio, disponible: form.disponible })
      }
      closeForm(); await load()
    } catch (e: unknown) { setError(e instanceof Error ? e.message : 'Error al guardar') }
    finally { setSaving(false) }
  }

  async function handleDelete(m: TipoMasa) {
    if (!confirm(`¿Eliminar el tipo de masa "${m.nombre}"?\nEsto puede afectar órdenes existentes.`)) return
    try { await api.admin.masas.delete(m.id); await load() }
    catch { setError('No se puede eliminar (puede tener órdenes asociadas)') }
  }

  async function toggleDisponible(m: TipoMasa) {
    try { await api.admin.masas.update(m.id, { disponible: !m.disponible }); await load() }
    catch { setError('Error al actualizar') }
  }

  const isFormOpen = editingId !== null

  return (
    <div className="space-y-4">
      <SectionHeader title="Tipos de masa" icon="🫓" />
      <p className="text-sm text-gray-500 -mt-2">El precio de cada gordita se define aquí.</p>
      {error && <p className="text-red-500 text-sm bg-red-50 rounded-xl px-3 py-2">{error}</p>}

      {/* Form (create or edit) */}
      {isFormOpen ? (
        <div className="bg-orange-50 border-2 border-orange-200 rounded-2xl p-4 space-y-3">
          <p className="font-bold text-gray-700 text-sm">
            {editingId === -1 ? 'Nueva masa' : 'Editar masa'}
          </p>
          <InputField label="Nombre" value={form.nombre}
            onChange={v => setForm(f => ({ ...f, nombre: v }))} placeholder="Ej: Harina" />
          <div className="flex flex-col gap-1">
            <label className="text-xs font-semibold text-gray-600">Precio por gordita ($)</label>
            <div className="flex items-center border-2 border-gray-200 focus-within:border-orange-400
                            rounded-xl overflow-hidden transition-colors">
              <span className="px-3 text-gray-500 font-bold text-sm bg-gray-50 border-r-2 border-gray-200">$</span>
              <input type="number" min="0" step="1" value={form.precio}
                onChange={e => setForm(f => ({ ...f, precio: e.target.value }))}
                placeholder="0"
                className="px-3 py-2 text-sm font-bold flex-1 focus:outline-none" />
            </div>
          </div>
          <label className="flex items-center gap-2 cursor-pointer">
            <input type="checkbox" checked={form.disponible}
              onChange={e => setForm(f => ({ ...f, disponible: e.target.checked }))}
              className="w-4 h-4 accent-orange-500" />
            <span className="text-sm text-gray-700 font-medium">Disponible</span>
          </label>
          <div className="flex gap-2 pt-1">
            <ActionButton label={saving ? 'Guardando...' : 'Guardar'} onClick={handleSave}
              color="green" disabled={saving} />
            <ActionButton label="Cancelar" onClick={closeForm} color="gray" />
          </div>
        </div>
      ) : (
        <button onClick={openNew}
          className="w-full border-2 border-dashed border-orange-300 hover:border-orange-500
                     text-orange-600 font-bold py-3 rounded-2xl text-sm transition-colors">
          + Nueva masa
        </button>
      )}

      {loading ? <p className="text-gray-400 text-sm text-center py-4">Cargando...</p> : (
        <div className="space-y-2">
          {masas.map(m => (
            <div key={m.id}
              className={`flex items-center gap-3 rounded-2xl px-4 py-3 border-2
                          ${m.disponible ? 'bg-white border-gray-100' : 'bg-gray-50 border-gray-200 opacity-60'}`}>
              <div className="flex-1 min-w-0">
                <p className="font-bold text-gray-800 text-sm leading-tight">{m.nombre}</p>
                <p className="text-orange-600 font-black text-base">${m.precio} c/u</p>
              </div>
              <div className="flex gap-2 shrink-0">
                <ActionButton label={m.disponible ? 'Ocultar' : 'Mostrar'}
                  onClick={() => toggleDisponible(m)} color={m.disponible ? 'gray' : 'green'} />
                <ActionButton label="Editar" onClick={() => openEdit(m)} color="blue" />
                <ActionButton label="Eliminar" onClick={() => handleDelete(m)} color="red" />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

// ── Bebidas ───────────────────────────────────────────────────
function BebidasSection() {
  const [refrescos,   setRefrescos]   = useState<Refresco[]>([])
  const [categorias,  setCategorias]  = useState<CategoriaRefresco[]>([])
  const [loading,     setLoading]     = useState(true)
  const [error,       setError]       = useState('')
  const [saving,      setSaving]      = useState(false)
  // bebida form: null=hidden, -1=new, id=editing
  const [editingId,   setEditingId]   = useState<number | null>(null)
  const [form,        setForm]        = useState(blankBebida())
  const formRef = useRef<HTMLDivElement>(null)
  // category management
  const [catEditId,   setCatEditId]   = useState<number | null>(null)  // null=none, -1=new
  const [catName,     setCatName]     = useState('')
  const [catSaving,   setCatSaving]   = useState(false)

  async function load() {
    setLoading(true)
    try {
      const [r, c] = await Promise.all([api.admin.refrescos.getAll(), api.admin.categorias.getAll()])
      setRefrescos(r); setCategorias(c)
    } catch { setError('Error cargando bebidas') }
    finally { setLoading(false) }
  }
  useEffect(() => { load() }, [])

  // ── Category handlers ──────────────────────────────────────
  function openNewCat() { setCatName(''); setCatEditId(-1) }
  function openEditCat(c: CategoriaRefresco) { setCatName(c.nombre); setCatEditId(c.id) }
  function closeCat() { setCatEditId(null); setCatName('') }

  async function handleSaveCat() {
    if (!catName.trim()) return
    setCatSaving(true)
    try {
      if (catEditId === -1) await api.admin.categorias.create(catName.trim())
      else if (catEditId !== null) await api.admin.categorias.update(catEditId, catName.trim())
      closeCat(); await load()
    } catch (e: unknown) { setError(e instanceof Error ? e.message : 'Error al guardar categoría') }
    finally { setCatSaving(false) }
  }

  async function handleDeleteCat(c: CategoriaRefresco) {
    const related = refrescos.filter(r => r.categoria_id === c.id)
    const msg = related.length
      ? `¿Eliminar la categoría "${c.nombre}"?\n\nEsto también eliminará ${related.length} bebida(s) asociada(s):\n${related.map(r => `• ${r.nombre} ${r.tamaño}`).join('\n')}`
      : `¿Eliminar la categoría "${c.nombre}"?`
    if (!confirm(msg)) return
    try { await api.admin.categorias.delete(c.id); await load() }
    catch { setError('Error al eliminar categoría') }
  }

  // ── Bebida handlers ────────────────────────────────────────
  function openNew() { setForm(blankBebida()); setEditingId(-1); setError('') }

  function openEdit(r: Refresco) {
    setForm({ nombre: r.nombre, sabor: r.sabor, tamaño: r.tamaño, precio: String(r.precio), categoria_id: r.categoria_id != null ? String(r.categoria_id) : '' })
    setEditingId(r.id); setError('')
    setTimeout(() => formRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 50)
  }

  function closeForm() { setEditingId(null); setError('') }

  async function handleSave() {
    if (!form.nombre || !form.tamaño || !form.precio) {
      setError('Nombre, tamaño y precio son requeridos'); return
    }
    if (!form.categoria_id) { setError('Debes seleccionar una categoría'); return }
    const precio = parseFloat(form.precio)
    if (isNaN(precio) || precio < 0) { setError('Precio inválido'); return }
    const categoria_id = parseInt(form.categoria_id)
    setSaving(true); setError('')
    try {
      if (editingId === -1) {
        await api.admin.refrescos.create({ nombre: form.nombre, sabor: form.sabor, tamaño: form.tamaño, precio, categoria_id })
      } else if (editingId !== null) {
        await api.admin.refrescos.update(editingId, { nombre: form.nombre, sabor: form.sabor, tamaño: form.tamaño, precio, categoria_id })
      }
      closeForm(); await load()
    } catch (e: unknown) { setError(e instanceof Error ? e.message : 'Error') }
    finally { setSaving(false) }
  }

  async function toggleDisponible(r: Refresco) {
    try { await api.admin.refrescos.update(r.id, { disponible: !r.disponible }); await load() }
    catch { setError('Error al actualizar') }
  }

  async function handleDelete(r: Refresco) {
    if (!confirm(`¿Eliminar "${r.nombre} ${r.tamaño}"?`)) return
    try { await api.admin.refrescos.delete(r.id); await load() }
    catch { setError('No se puede eliminar (puede tener órdenes asociadas)') }
  }

  const isFormOpen = editingId !== null
  const sinCategoria = refrescos.filter(r => r.categoria_id == null)

  return (
    <div className="space-y-6">
      <SectionHeader title="Bebidas" icon="🥤" />
      {error && <p className="text-red-500 text-sm bg-red-50 rounded-xl px-3 py-2">{error}</p>}

      {/* ── Category management ── */}
      <div className="bg-gray-50 border-2 border-gray-200 rounded-2xl p-4 space-y-3">
        <p className="font-bold text-gray-700 text-sm">Categorías</p>
        <div className="flex flex-wrap gap-2">
          {categorias.map(c => (
            catEditId === c.id ? (
              <div key={c.id} className="flex items-center gap-1">
                <input autoFocus value={catName} onChange={e => setCatName(e.target.value)}
                  onKeyDown={e => { if (e.key === 'Enter') handleSaveCat(); if (e.key === 'Escape') closeCat() }}
                  className="border-2 border-blue-400 rounded-lg px-2 py-1 text-xs w-28 focus:outline-none" />
                <button onClick={handleSaveCat} disabled={catSaving}
                  className="text-xs bg-green-500 text-white px-2 py-1 rounded-lg font-bold disabled:opacity-40">
                  {catSaving ? '...' : '✓'}
                </button>
                <button onClick={closeCat} className="text-xs bg-gray-200 text-gray-600 px-2 py-1 rounded-lg font-bold">✕</button>
              </div>
            ) : (
              <span key={c.id}
                className="inline-flex items-center gap-1 bg-blue-100 text-blue-800 text-xs font-bold px-3 py-1.5 rounded-full">
                {c.nombre}
                <button onClick={() => openEditCat(c)} className="ml-0.5 hover:text-blue-600" title="Editar">✏️</button>
                <button onClick={() => handleDeleteCat(c)} className="hover:text-red-600" title="Eliminar">×</button>
              </span>
            )
          ))}

          {catEditId === -1 ? (
            <div className="flex items-center gap-1">
              <input autoFocus value={catName} onChange={e => setCatName(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter') handleSaveCat(); if (e.key === 'Escape') closeCat() }}
                placeholder="Nueva categoría"
                className="border-2 border-blue-400 rounded-lg px-2 py-1 text-xs w-36 focus:outline-none" />
              <button onClick={handleSaveCat} disabled={catSaving}
                className="text-xs bg-green-500 text-white px-2 py-1 rounded-lg font-bold disabled:opacity-40">
                {catSaving ? '...' : '✓'}
              </button>
              <button onClick={closeCat} className="text-xs bg-gray-200 text-gray-600 px-2 py-1 rounded-lg font-bold">✕</button>
            </div>
          ) : (
            <button onClick={openNewCat}
              className="text-xs font-bold border-2 border-dashed border-gray-300 hover:border-blue-400
                         text-gray-500 hover:text-blue-600 px-3 py-1.5 rounded-full transition-colors">
              + Categoría
            </button>
          )}
        </div>
      </div>

      {/* ── Bebida form (create or edit) ── */}
      {isFormOpen ? (
        <div ref={formRef} className="bg-blue-50 border-2 border-blue-200 rounded-2xl p-4 space-y-3">
          <p className="font-bold text-gray-700 text-sm">
            {editingId === -1 ? 'Nueva bebida' : 'Editar bebida'}
          </p>
          <div className="grid grid-cols-2 gap-3">
            <InputField label="Nombre" value={form.nombre}
              onChange={v => setForm(f => ({ ...f, nombre: v }))} placeholder="Ej: Coca Cola" />
            <InputField label="Tamaño" value={form.tamaño}
              onChange={v => setForm(f => ({ ...f, tamaño: v }))} placeholder="Ej: 355ml" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <InputField label="Sabor (opcional)" value={form.sabor}
              onChange={v => setForm(f => ({ ...f, sabor: v }))} placeholder="Ej: Cola" />
            <div className="flex flex-col gap-1">
              <label className="text-xs font-semibold text-gray-600">Precio ($)</label>
              <input type="number" min="0" step="1" value={form.precio}
                onChange={e => setForm(f => ({ ...f, precio: e.target.value }))}
                placeholder="0"
                className="border-2 border-gray-200 rounded-xl px-3 py-2 text-sm
                           focus:outline-none focus:border-blue-400" />
            </div>
          </div>

          {/* Categoría — required */}
          <div className="flex flex-col gap-2">
            <label className="text-xs font-semibold text-gray-600">
              Categoría <span className="text-red-500">*</span>
            </label>
            {categorias.length === 0
              ? <p className="text-xs text-amber-600">Crea al menos una categoría arriba antes de guardar.</p>
              : (
                <div className="flex flex-wrap gap-1.5">
                  {categorias.map(c => (
                    <button key={c.id} type="button"
                      onClick={() => setForm(f => ({ ...f, categoria_id: f.categoria_id === String(c.id) ? '' : String(c.id) }))}
                      className={`text-xs font-bold px-3 py-1.5 rounded-full border-2 transition-colors
                                  ${form.categoria_id === String(c.id)
                                    ? 'bg-blue-500 border-blue-500 text-white'
                                    : 'bg-white border-gray-200 text-gray-600 hover:border-blue-300'}`}>
                      {c.nombre}
                    </button>
                  ))}
                </div>
              )}
          </div>

          <div className="flex gap-2 pt-1">
            <ActionButton label={saving ? 'Guardando...' : 'Guardar'} onClick={handleSave}
              color="green" disabled={saving} />
            <ActionButton label="Cancelar" onClick={closeForm} color="gray" />
          </div>
        </div>
      ) : (
        <button onClick={openNew}
          className="w-full border-2 border-dashed border-blue-300 hover:border-blue-500
                     text-blue-600 font-bold py-3 rounded-2xl text-sm transition-colors">
          + Nueva bebida
        </button>
      )}

      {loading ? <p className="text-gray-400 text-sm text-center py-4">Cargando...</p> : (
        <div className="space-y-4">
          {/* Grouped by category */}
          {categorias.map(cat => {
            const items = refrescos.filter(r => r.categoria_id === cat.id)
            if (items.length === 0) return null
            return (
              <div key={cat.id}>
                <p className="text-xs font-black text-blue-700 uppercase tracking-wide mb-2">{cat.nombre}</p>
                <div className="space-y-2">
                  {items.map(r => (
                    <div key={r.id}
                      className={`flex items-center gap-3 rounded-2xl px-4 py-3 border-2
                                  ${r.disponible ? 'bg-white border-gray-100' : 'bg-gray-50 border-gray-200 opacity-60'}`}>
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-gray-800 text-sm leading-tight">
                          {r.nombre} <span className="text-gray-400 font-normal">{r.tamaño}</span>
                        </p>
                        {r.sabor && <p className="text-xs text-gray-400">{r.sabor}</p>}
                        <p className="text-orange-600 font-bold text-sm">${r.precio}</p>
                      </div>
                      <div className="flex gap-2 shrink-0">
                        <ActionButton label={r.disponible ? 'Ocultar' : 'Mostrar'}
                          onClick={() => toggleDisponible(r)} color={r.disponible ? 'gray' : 'green'} />
                        <ActionButton label="Editar" onClick={() => openEdit(r)} color="blue" />
                        <ActionButton label="Eliminar" onClick={() => handleDelete(r)} color="red" />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )
          })}

          {/* Sin categoría warning */}
          {sinCategoria.length > 0 && (
            <div>
              <p className="text-xs font-black text-amber-700 uppercase tracking-wide mb-2">
                ⚠️ Sin categoría ({sinCategoria.length})
              </p>
              <div className="space-y-2">
                {sinCategoria.map(r => (
                  <div key={r.id}
                    className="flex items-center gap-3 rounded-2xl px-4 py-3 border-2 bg-amber-50 border-amber-200">
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-gray-800 text-sm">{r.nombre} <span className="text-gray-400 font-normal">{r.tamaño}</span></p>
                      <p className="text-orange-600 font-bold text-sm">${r.precio}</p>
                    </div>
                    <div className="flex gap-2 shrink-0">
                      <ActionButton label="Editar" onClick={() => openEdit(r)} color="blue" />
                      <ActionButton label="Eliminar" onClick={() => handleDelete(r)} color="red" />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

// ── Main AdminPanel ───────────────────────────────────────────
const TABS: { id: Tab; label: string; icon: string }[] = [
  { id: 'usuarios', label: 'Usuarios', icon: '👥' },
  { id: 'guisados', label: 'Guisados', icon: '🫔' },
  { id: 'masas',    label: 'Masas',    icon: '🫓' },
  { id: 'bebidas',  label: 'Bebidas',  icon: '🥤' },
]

export default function AdminPanel({ onClose }: Props) {
  const [tab, setTab] = useState<Tab>('usuarios')

  return (
    <div className="fixed inset-0 z-50 bg-orange-50 flex flex-col overflow-hidden">

      {/* Header */}
      <header className="bg-orange-600 text-white px-4 py-3 flex items-center gap-3 shrink-0 shadow-md">
        <button onClick={onClose}
          className="bg-orange-700 hover:bg-orange-800 active:bg-orange-900
                     text-white px-3 py-1.5 rounded-xl text-sm font-semibold transition-colors">
          ← Regresar
        </button>
        <span className="font-black text-lg">⚙️ Ajustes</span>
      </header>

      {/* Tabs */}
      <div className="bg-white border-b border-gray-100 px-3 pt-3 flex gap-1 shrink-0 overflow-x-auto">
        {TABS.map(t => (
          <button key={t.id} onClick={() => setTab(t.id)}
            className={`flex items-center gap-1.5 px-4 py-2.5 rounded-t-xl font-bold text-sm
                        transition-colors whitespace-nowrap border-b-2 -mb-px
                        ${tab === t.id
                          ? 'bg-orange-50 border-orange-500 text-orange-700'
                          : 'border-transparent text-gray-500 hover:text-gray-700 hover:bg-gray-50'}`}>
            <span>{t.icon}</span>
            <span>{t.label}</span>
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4 max-w-2xl mx-auto w-full">
        {tab === 'usuarios' && <UsuariosSection />}
        {tab === 'guisados' && <GuisadosSection />}
        {tab === 'masas'    && <MasasSection />}
        {tab === 'bebidas'  && <BebidasSection />}
      </div>
    </div>
  )
}
