import { useEffect, useState } from 'react'
import { supabase } from '../supabaseClient'
import { useParams, useNavigate } from 'react-router-dom'

function Chamada() {

  const { turmaId } = useParams()
  const navigate = useNavigate()

  const [alunos, setAlunos] = useState([])
  const [presencas, setPresencas] = useState({})
  const [backupPresencas, setBackupPresencas] = useState(null)

  const [dataSelecionada, setDataSelecionada] = useState(
    new Date().toISOString().split('T')[0]
  )

  const [observacoes, setObservacoes] = useState({})
  const [alunoObservando, setAlunoObservando] = useState(null)

  useEffect(() => {
    carregarDados()
  }, [dataSelecionada, turmaId])

  async function carregarDados() {

    setPresencas({})

    const dataHoje = dataSelecionada

    const { data: alunosData, error: alunosError } = await supabase
      .from('alunos')
      .select('*')
      .eq('turma_id', turmaId)

    if (alunosError) {
      console.error(alunosError)
      return
    }

    const { data: freqData, error: freqError } = await supabase
      .from('frequencia')
      .select('*')
      .eq('turma_id', turmaId)
      .eq('data_aula', dataHoje)

    if (freqError) {
      console.error(freqError)
      return
    }

    setAlunos(alunosData)

    const estadoInicial = {}
    const obsInicial = {}

    alunosData.forEach((aluno) => {
      const registro = freqData.find((f) => f.ra === aluno.ra)

      estadoInicial[String(aluno.ra)] = registro ? registro.presente : null
      obsInicial[String(aluno.ra)] = registro ? registro.observacao || '' : ''
    })

    setPresencas(estadoInicial)
    setObservacoes(obsInicial)
  }

  function togglePresenca(ra) {
    setPresencas((prev) => ({
      ...prev,
      [ra]: prev[ra] === true ? false : true
    }))
  }

  async function salvarChamada() {

    const dataHoje = dataSelecionada

    const { data: userData } = await supabase.auth.getUser()
    const user = userData.user

    for (const ra in presencas) {

      const valorFinal = presencas[ra] === null ? false : presencas[ra]

      const { error } = await supabase
        .from('frequencia')
        .upsert(
          {
            ra,
            turma_id: turmaId,
            data_aula: dataHoje,
            presente: valorFinal,
            responsavel: user.email,
            observacao: observacoes[String(ra)] ?? null
          },
          {
            onConflict: ['ra', 'turma_id', 'data_aula']
          }
        )

      if (error) {
        console.error(error)
      }
    }

    alert('Chamada salva!')
    await carregarDados()
  }

  return (
    <div style={{ padding: 20 }}>

      <button onClick={() => navigate('/')}>
        ← Voltar
      </button>

      <div style={{ marginTop: '20px' }}>
        <label>Data da aula: </label>
        <input
          type="date"
          value={dataSelecionada}
          onChange={(e) => setDataSelecionada(e.target.value)}
        />
      </div>

      <h2 style={{ marginTop: '20px' }}>
        Chamada — Turma {turmaId}
      </h2>

      {/* CABEÇALHO */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: '80px 1fr 120px 120px',
        fontWeight: 'bold',
        borderBottom: '2px solid #ccc',
        padding: '8px'
      }}>
        <div>Presença</div>
        <div>Aluno</div>
        <div>RA</div>
        <div>Ações</div>
      </div>

      {/* LISTA */}
      {alunos.map((aluno) => (
        <div
          key={aluno.ra}
          style={{
            display: 'grid',
            gridTemplateColumns: '80px 1fr 120px 120px',
            alignItems: 'center',
            padding: '6px 8px',
            borderBottom: '1px solid #eee',
            backgroundColor:
              presencas[aluno.ra] === true
                ? '#d4edda'
                : presencas[aluno.ra] === false
                ? '#f8d7da'
                : '#fff'
          }}
        >

          <div>
            <input
              type="checkbox"
              checked={presencas[aluno.ra] === true}
              onChange={() => togglePresenca(aluno.ra)}
            />
          </div>

          <div style={{textAlign: 'left'}}>{aluno.nome}</div>
          <div>{aluno.ra}</div>

          <div style={{ display: 'flex', gap: 8 }}>
            <button 
              title='Observação'
              onClick={() => setAlunoObservando(aluno.ra)}>
              📝
            </button>

            <button 
              title='Relatório de Assiduidade'
              onClick={() => navigate(`/aluno/${aluno.ra}`)}>
              📊
            </button>
          </div>

        </div>
      ))}

      <br />

      {/* MODAL */}
      {alunoObservando && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0,0,0,0.3)',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center'
        }}>
          <div style={{
            background: '#fff',
            padding: 20,
            borderRadius: 8,
            width: 300
          }}>

            <h3>Observação</h3>

            <textarea
              value={observacoes[alunoObservando] || ''}
              onChange={(e) =>
                setObservacoes(prev => ({
                  ...prev,
                  [String(alunoObservando)]: e.target.value
                }))
              }
              style={{ width: '100%', height: 100 }}
            />

            <br /><br />

            <button onClick={() => setAlunoObservando(null)}>
              Fechar
            </button>

          </div>
        </div>
      )}

      <button
        onClick={() => {
          setBackupPresencas(presencas)
          const todos = {}
          alunos.forEach(a => todos[a.ra] = true)
          setPresencas(todos)
        }}
        onMouseEnter={() => {

        }
        }
      >
        Marcar todos presentes
      </button>

      <button
        onClick={() => {
          setBackupPresencas(presencas)
          const todos = {}
          alunos.forEach(a => todos[a.ra] = false)
          setPresencas(todos)
        }}
      >
        Marcar todos faltantes
      </button>

      {backupPresencas && (
        <button
          onClick={() => {
            setPresencas(backupPresencas)
            setBackupPresencas(null)
          }}
        >
          Desfazer
        </button>
      )}

      <br /><br />

      <button onClick={salvarChamada}>
        Salvar chamada
      </button>

    </div>
  )
}

export default Chamada