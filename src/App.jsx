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

function App() {

  // ================================
  // ESTADO DE AUTENTICAÇÃO
  // ================================
  const [session, setSession] = useState(null)
  const [loading, setLoading] = useState(true)

  // ================================
  // VERIFICAR SESSÃO AO INICIAR
  // ================================
  useEffect(() => {

    // pega sessão atual
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session)
      setLoading(false)
    })

    // escuta login / logout
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

        {/* =========================
            ROTA DE LOGIN (PÚBLICA)
        ========================= */}
        <Route path="/login" element={<Login />} />

        {/* =========================
            ROTAS PROTEGIDAS
        ========================= */}
        {session ? (
          <Route path="/" element={<Layout />}>

            {/* página inicial */}
            <Route index element={<Turmas />} />

            {/* chamada */}
            <Route path="chamada/:turmaId" element={<Chamada />} />

            {/* relatório de frequência*/}
            <Route path="relatorio/:turmaId" element={<RelatorioFrequencia />} />
            
            {/* relatório de aluno*/}
            <Route path="aluno/:ra" element={<RelatorioAluno />} />
          </Route>
        ) : (
          /* qualquer rota sem login → volta pro login */
          <Route path="*" element={<Navigate to="/login" />} />
        )}

      </Routes>
    </BrowserRouter>
  )
}

export default App