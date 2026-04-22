import { useState } from 'react'
import { supabase } from '../supabaseClient'
import { useNavigate } from 'react-router-dom'

function Login() {

  // ================================
  // ESTADOS
  // ================================
  const [email, setEmail] = useState('')
  const [senha, setSenha] = useState('')
  const [loading, setLoading] = useState(false)

  const navigate = useNavigate()

  // ================================
  // LOGIN
  // ================================
  async function fazerLogin() {

    setLoading(true)

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password: senha
    })

    setLoading(false)

    if (error) {
      console.error(error)
      alert('Email ou senha inválidos')
      return
    }

    // login ok
    navigate('/')
  }

  // ================================
  // RENDER
  // ================================
  return (
    <div
      style={{
        height: '100vh',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#f5f5f5'
      }}
    >
      <div
        style={{
          padding: 30,
          backgroundColor: '#fff',
          borderRadius: 8,
          boxShadow: '0 0 10px rgba(0,0,0,0.1)',
          width: 300
        }}
      >

        <h2 style={{ marginBottom: 20 }}>
          Login
        </h2>

        {/* FORM → permite Enter */}
        <form onSubmit={(e) => {
          e.preventDefault()
          fazerLogin()
        }}>

          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            style={{
              width: '100%',
              padding: 8,
              marginBottom: 10
            }}
          />

          <input
            type="password"
            placeholder="Senha"
            value={senha}
            onChange={(e) => setSenha(e.target.value)}
            required
            style={{
              width: '100%',
              padding: 8,
              marginBottom: 15
            }}
          />

          <button
            type="submit"
            disabled={loading}
            style={{
              width: '100%',
              padding: 10,
              cursor: 'pointer'
            }}
          >
            {loading ? 'Entrando...' : 'Entrar'}
          </button>

        </form>

      </div>
    </div>
  )
}

export default Login