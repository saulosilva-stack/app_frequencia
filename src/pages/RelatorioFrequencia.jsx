import { useEffect, useState } from 'react'
import { supabase } from '../supabaseClient'
import { useParams, useNavigate } from 'react-router-dom'
import RelatorioBaseTS from '../components/RelatorioBaseTS'

function RelatorioFrequencia() {

  const { turmaId } = useParams()
  const navigate = useNavigate()

  const [dados, setDados] = useState([])

  useEffect(() => {
    buscar()
  }, [])

  async function buscar() {

    if (!turmaId) return

    const { data, error } = await supabase
      .rpc('relatorio_frequencia', { turma_id_param: turmaId })

    if (error) {
      console.error(error)
      alert('Erro ao carregar relatório')
      return
    }

    setDados(data || [])
  }

  // ================================
  // CONFIGURAÇÃO DAS COLUNAS
  // ================================
  const colunas = [

    { campo: 'ra', label: 'RA' },

    { campo: 'nome', label: 'Nome' },

    { campo: 'total_aulas', label: 'Total' },

    { campo: 'presencas', label: 'Presenças' },

    {
      campo: 'frequencia_percentual',
      label: '%',

      render: (item) => `${item.frequencia_percentual}%`,

      highlight: (item) => item.frequencia_percentual < 75
    }
  ]

  return (
    <div style={{ padding: 20 }}>

      <button onClick={() => navigate('/')}>
        ← Voltar
      </button>

      <RelatorioBaseTS
        titulo={`Relatório da turma ${turmaId}`}
        dados={dados}
        colunas={colunas}
      />

    </div>
  )
}

export default RelatorioFrequencia