import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { useEffect, useState } from 'react'
import { supabase } from './supabaseClient'

// páginas
import Login from './pages/Login'
import Turmas from './pages/Turmas'
import Chamada from './pages/Chamada'
import RelatorioFrequencia from './pages/RelatorioFrequencia'
import RelatorioAluno from './pages/RelatorioAluno'

// layout
import Layout from './components/Layout'

// proteção de rota
import ProtectedRoute from './routes/ProtectedRoute'

// hooks
import useAutoLogout from './hooks/useAutoLogout'

function App() {

  // ================================
  // ESTADO DE AUTENTICAÇÃO
  // ================================
  const [session, setSession] = useState(null)
  const [loading, setLoading] = useState(true)

  // ================================
  // AUTO LOGOUT (AGORA CONTROLADO)
  // ================================
  useAutoLogout(session)

  // ================================
  // VERIFICAR SESSÃO AO INICIAR
  // ================================
  useEffect(() => {

    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session)
      setLoading(false)
    })

    const { data: listener } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setSession(session)
      }
    )

    return () => {
      listener.subscription.unsubscribe()
    }

  }, [])

  // ================================
  // LOADING INICIAL
  // ================================
  if (loading) {
    return <div>Carregando...</div>
  }

  // ================================
  // ROTAS
  // ================================
  return (
    <BrowserRouter>
      <Routes>

        {/* ROTA PÚBLICA */}
        <Route
          path="/login"
          element={
            session
              ? <Navigate to="/" />
              : <Login />
          }
        />

        {/* ROTAS PROTEGIDAS */}
        <Route
          path="/"
          element={
            <ProtectedRoute>
              <Layout />
            </ProtectedRoute>
          }
        >

          <Route index element={<Turmas />} />

          <Route path="chamada/:turmaId" element={<Chamada />} />

          <Route path="relatorio/:turmaId" element={<RelatorioFrequencia />} />

          <Route path="aluno/:ra" element={<RelatorioAluno />} />

        </Route>

        {/* FALLBACK */}
        <Route path="*" element={<Navigate to="/login" />} />

      </Routes>
    </BrowserRouter>
  )
}

export default App