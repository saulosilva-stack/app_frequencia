import { useEffect, useState } from 'react'
import { supabase } from '../supabaseClient'
import { useParams, useNavigate } from 'react-router-dom'
import RelatorioBaseTS from '../components/RelatorioBaseTS'

function RelatorioAluno() {

  const { ra } = useParams()
  const navigate = useNavigate()
  const [aluno, setAluno] = useState(null)

  const [dados, setDados] = useState([])

  useEffect(() => {
    buscarDados()
  }, [])

  async function buscarDados() {

    if (!ra) return

    const [relatorioRes, alunoRes] = await Promise.all([
      supabase.rpc('relatorio_aluno', { ra_param: ra }),
      supabase
        .from('alunos')
        .select('nome, turma_id')
        .eq('ra', ra)
        .maybeSingle()
    ])

    if (relatorioRes.error) {
      console.error(relatorioRes.error)
      alert('Erro ao carregar relatório')
      return
    }

    if (alunoRes.error) {
      console.error(alunoRes.error)
    }

    setDados(relatorioRes.data || [])
    setAluno(alunoRes.data || null)
  }

  const colunas = [
      {
          campo: 'data_aula',
          label: 'Data',
          tipo: 'data',
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

  const titulo = aluno
  ? `${aluno.nome} - RA: ${ra} - Turma: ${aluno.turma_id}`
  : `Relatório do aluno ${ra}`

  return (
      <div style={{ padding: 20 }}>

          <button onClick={() => navigate(-1)}>
          ← Voltar
          </button>

          <RelatorioBaseTS
            titulo={titulo}
            dados={dados}
            colunas={colunas}
          />

      </div>
  )
}

export default RelatorioAluno