import { useEffect, useState } from 'react'
import { supabase } from '../supabaseClient'
import { useParams, useNavigate } from 'react-router-dom'
import RelatorioBase from '../components/RelatorioBase'

function RelatorioAluno() {

  const { ra } = useParams()
  const navigate = useNavigate()

  const [dados, setDados] = useState([])

  useEffect(() => {
    buscarDados()
  }, [])

  async function buscarDados() {

    const { data, error } = await supabase
      .rpc('relatorio_aluno', { ra_param: ra })

    if (error) {
      console.error(error)
      alert('Erro ao carregar relatório')
      return
    }
    console.log('DADOS BRUTOS:', data)
    setDados(data || [])
  }

    const colunas = [
        {
            campo: 'data_aula',
            label: 'Data',
        },
        {
            campo: 'presente',
            label: 'Presença',
            render: (item) => (item.presente ? 'Presente' : 'Faltou')
        },
        {
            campo: 'observacao',
            label: 'Observação',
        },
        {
            campo: 'responsavel',
            label: 'Responsável',
        }
    ]

    return (
        <div style={{ padding: 20 }}>

            <button onClick={() => navigate(-1)}>
            ← Voltar
            </button>

            <h2>Relatório do aluno {ra}</h2>

            <RelatorioBase
            dados={dados}
            colunas={colunas}
            />

        </div>
    )
}

export default RelatorioAluno