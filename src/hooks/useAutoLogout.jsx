import { useEffect } from 'react'
import { supabase } from '../supabaseClient'

const TEMPO_LIMITE = 1000 * 60 * 15 // 30 minutos

function useAutoLogout(session) {

  useEffect(() => {
    if (!session) return

    let timeout

    function resetTimer() {
      clearTimeout(timeout)

      timeout = setTimeout(async () => {
        await supabase.auth.signOut()
        window.location.href = '/login'
      }, TEMPO_LIMITE)
    }

    const eventos = ['mousemove', 'keydown', 'click', 'scroll']

    eventos.forEach(evento =>
      window.addEventListener(evento, resetTimer)
    )

    resetTimer()

    return () => {
      eventos.forEach(evento =>
        window.removeEventListener(evento, resetTimer)
      )
      clearTimeout(timeout)
    }

  }, [session])
}

export default useAutoLogout