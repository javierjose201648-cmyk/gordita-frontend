import { useState } from 'react'
import { api } from '../api/client'
import { useAuth } from '../context/AuthContext'

export default function LoginScreen() {
  const { login } = useAuth()
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error,    setError]    = useState('')
  const [loading,  setLoading]  = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const { token, usuario } = await api.login(username.trim(), password)
      login(usuario, token)
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Usuario o contraseña incorrectos')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-500 to-orange-700 flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl shadow-2xl p-8 w-full max-w-xs">

        {/* Brand */}
        <div className="text-center mb-8">
          <img src="/logo.png" alt="Gorditas Luly" className="h-24 w-24 object-contain rounded-full mx-auto mb-3 shadow-md" />
          <h1 className="text-3xl font-black text-orange-600 tracking-tight">Gorditas</h1>
          <p className="text-gray-400 text-sm mt-1">Sistema de ventas</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <input
            type="text"
            value={username}
            onChange={e => setUsername(e.target.value)}
            placeholder="Usuario"
            autoCapitalize="none"
            autoComplete="username"
            required
            className="w-full px-4 py-3.5 text-lg border-2 border-gray-200 rounded-2xl
                       focus:outline-none focus:border-orange-400 transition-colors"
          />
          <input
            type="password"
            value={password}
            onChange={e => setPassword(e.target.value)}
            placeholder="Contraseña"
            autoComplete="current-password"
            required
            className="w-full px-4 py-3.5 text-lg border-2 border-gray-200 rounded-2xl
                       focus:outline-none focus:border-orange-400 transition-colors"
          />

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-600 rounded-xl
                            px-4 py-3 text-sm text-center">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-orange-500 hover:bg-orange-600 active:bg-orange-700
                       disabled:opacity-50 text-white font-bold py-4 rounded-2xl text-xl
                       transition-colors shadow-lg shadow-orange-200"
          >
            {loading ? 'Entrando…' : 'Entrar'}
          </button>
        </form>
      </div>
    </div>
  )
}
