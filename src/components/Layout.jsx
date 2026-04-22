import { Outlet, useNavigate } from 'react-router-dom'
import { useEffect, useState } from 'react'
import { supabase } from '../supabaseClient'

function Layout() {

  // ================================
  // ESTADO DO USUÁRIO LOGADO
  // ================================
  const [user, setUser] = useState(null)

  const navigate = useNavigate()

  // ================================
  // BUSCAR USUÁRIO AO CARREGAR
  // ================================
  useEffect(() => {
    async function getUser() {
      const { data, error } = await supabase.auth.getUser()

      if (error) {
        console.error('Erro ao buscar usuário:', error)
        return
      }

      setUser(data.user)
    }

    getUser()
  }, [])

  // ================================
  // LOGOUT
  // ================================
  async function logout() {
    await supabase.auth.signOut()
    navigate('/login')
  }

  // ================================
  // RENDER
  // ================================
  return (
    <div>

      {/* =========================
          HEADER GLOBAL
      ========================= */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          padding: '12px 20px',
          borderBottom: '1px solid #ccc',
          backgroundColor: '#f8f9fa'
        }}
      >
        {/* LADO ESQUERDO */}
        <div>
          <strong>Sistema de Frequência</strong>

          {/* EMAIL DO USUÁRIO */}
          <div style={{ fontSize: '12px', color: '#666' }}>
            {user?.email}
          </div>
        </div>

        {/* LADO DIREITO */}
        <button onClick={logout}>
          Sair
        </button>
      </div>

      {/* =========================
          CONTEÚDO DAS PÁGINAS
      ========================= */}
      <div style={{ padding: 20 }}>
        <Outlet />
      </div>

    </div>
  )
}

export default Layout