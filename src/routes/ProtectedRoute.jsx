import { useEffect, useState } from 'react'
import { supabase } from '../supabaseClient'
import { useNavigate } from 'react-router-dom'

function ProtectedRoute({ children }) {
  const [loading, setLoading] = useState(true)
  const navigate = useNavigate()

  useEffect(() => {
    async function checkUser() {
      const { data } = await supabase.auth.getUser()

      if (!data.user) {
        navigate('/login')
      } else {
        setLoading(false)
      }
    }

    checkUser()
  }, [])

  if (loading) {
    return <div>Carregando...</div>
  }

  return children
}

export default ProtectedRoute