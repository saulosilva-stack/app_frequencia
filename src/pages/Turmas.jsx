import { useEffect, useState } from 'react'
import { supabase } from '../supabaseClient'
import { useNavigate } from 'react-router-dom'


function Turmas() {

  // ================================
  // ESTADOS
  // ================================
  const [turmas, setTurmas] = useState([])
  const navigate = useNavigate()

  // ================================
  // INICIALIZAÇÃO
  // ================================
  useEffect(() => {
    fetchTurmas()
  }, [])

  // ================================
  // BUSCAR TURMAS
  // ================================
  async function fetchTurmas() {
    const { data, error } = await supabase
      .from('turmas')
      .select('*')

    if (error) {
      console.error(error)
    } else {
      setTurmas(data)
    }
  }

  // ================================
  // RENDER
  // ================================
  return (
    <div style={{ padding: 20 }}>
      <h1>Turmas</h1>

      {turmas.map((turma) => (
        <div
          key={turma.id}
          onClick={() => navigate(`/chamada/${turma.id}`)}
          style={{
            cursor: 'pointer',
            padding: 5,
            border: '1px solid #ccc',
            marginBottom: 5
          }}
        >
            <button onClick={(e) => {
                e.stopPropagation()
                navigate(`/relatorio/${turma.id}`)
            }}>
            Relatório
            </button>
            {turma.id} - {turma.abrev}
        </div>
        
      ))}
    </div>
  )
}

export default Turmas