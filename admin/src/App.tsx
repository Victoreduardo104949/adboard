import { useEffect, useState } from 'react'
import { Navigate, Route, Routes } from 'react-router-dom'
import type { Session } from '@supabase/supabase-js'
import { supabase, supabaseConfigOk } from './lib/supabase'
import Login from './screens/Login'
import Dashboard from './screens/Dashboard'
import MobilePlayerPreview from './screens/MobilePlayerPreview'

function App() {
  const [session, setSession] = useState<Session | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session)
      setLoading(false)
    })
    const { data: sub } = supabase.auth.onAuthStateChange((_event, s) => {
      setSession(s)
      setLoading(false)
    })
    return () => sub.subscription.unsubscribe()
  }, [])

  if (!supabaseConfigOk) {
    return (
      <div className="config-warning">
        <h1>Configuração incompleta</h1>
        <p>
          Crie o arquivo <code>.env.local</code> na pasta <code>admin/</code> com{' '}
          <code>VITE_SUPABASE_URL</code> e <code>VITE_SUPABASE_ANON_KEY</code>.
        </p>
      </div>
    )
  }

  if (loading) {
    return <div className="loading">Carregando…</div>
  }

  const isPreview = window.location.search.includes('preview=1') || Boolean(session)

  return (
    <Routes>
      <Route path="/player-preview" element={<MobilePlayerPreview />} />
      <Route
        path="/login"
        element={isPreview ? <Navigate to="/" replace /> : <Login />}
      />
      <Route
        path="/"
        element={isPreview ? <Dashboard /> : <Navigate to="/login" replace />}
      />
    </Routes>
  )
}

export default App
