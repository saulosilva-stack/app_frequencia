import { useEffect, useState } from 'react'
import { supabase } from '../supabaseClient'
import { useParams, useNavigate } from 'react-router-dom'

function Chamada() {

  const { turmaId } = useParams()
  const navigate = useNavigate()

  // ================================
  // ESTADOS
  // ================================

  const [alunos, setAlunos] = useState([])
  const [presencas, setPresencas] = useState({})
  const [backupPresencas, setBackupPresencas] = useState(null)

  const [dataSelecionada, setDataSelecionada] = useState(
    new Date().toISOString().split('T')[0]
  )

  // ================================
  // CARREGAMENTO
  // ================================

  useEffect(() => {
    carregarDados()
  }, [dataSelecionada])

  // ================================
  // BUSCAR DADOS
  // ================================

  async function carregarDados() {

    setPresencas({})

    const dataHoje = dataSelecionada

    // 1. alunos
    const { data: alunosData, error: alunosError } = await supabase
      .from('alunos')
      .select('*')
      .eq('turma_id', turmaId)

    if (alunosError) {
      console.error(alunosError)
      return
    }

    // 2. frequência
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

    alunosData.forEach((aluno) => {
      const registro = freqData.find((f) => f.ra === aluno.ra)
      estadoInicial[aluno.ra] = registro ? registro.presente : null
    })

    setPresencas(estadoInicial)
  }

  // ================================
  // TOGGLE
  // ================================

  function togglePresenca(ra) {
    setPresencas((prev) => ({
      ...prev,
      [ra]: prev[ra] === true ? false : true
    }))
  }

  // ================================
  // SALVAR
  // ================================

  async function salvarChamada() {

    console.log('Salvando...')

    const dataHoje = dataSelecionada

    for (const ra in presencas) {

      const valorFinal = presencas[ra] === null ? false : presencas[ra]

      const { error } = await supabase
        .from('frequencia')
        .upsert(
          {
            ra,
            turma_id: turmaId,
            data_aula: dataHoje,
            presente: valorFinal
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

  // ================================
  // RENDER
  // ================================

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

      {alunos.map((aluno) => (
        <div
          key={aluno.ra}
          style={{
            padding: '6px',
            marginBottom: '4px',
            backgroundColor:
              presencas[aluno.ra] === true
                ? '#d4edda'
                : presencas[aluno.ra] === false
                ? '#f8d7da'
                : '#ffffff',
            border: '1px solid #ccc',
            borderRadius: '4px'
          }}
        >
          <input
            type="checkbox"
            checked={presencas[aluno.ra] === true}
            onChange={() => togglePresenca(aluno.ra)}
          />

          <span style={{ marginLeft: '8px' }}>
            {aluno.nome}
          </span>
        </div>
      ))}

      <br />

      <button
        onClick={() => {
          setBackupPresencas(presencas)
          const todos = {}
          alunos.forEach(a => todos[a.ra] = true)
          setPresencas(todos)
        }}
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