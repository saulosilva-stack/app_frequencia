import { useEffect, useState } from 'react'
import { supabase } from './supabaseClient'

function App() {

  // ================================
  // ESTADOS (memória do componente)
  // ================================

  // lista de turmas vindas do banco
  const [turmas, setTurmas] = useState([]) 
  
  // qual turma o usuário clicou
  const [turmaSelecionada, setTurmaSelecionada] = useState(null)
  
  // alunos da turma selecionada
  const [alunos, setAlunos] = useState([])

  // objeto: { ra: true/false/null }
  const [presencas, setPresencas] = useState({})

  // backup para desfazer ações
  const [backupPresencas, setBackupPresencas] = useState(null)

  // data selecionada pelo usuário
  const [dataSelecionada, setDataSelecionada] = useState(
    new Date().toISOString().split('T')[0]
  )


  // ================================
  // INICIALIZAÇÃO (executa 1 vez)
  // ================================

  useEffect(() => {
    fetchTurmas()
  }, []) // [] = roda só quando a página carrega

  // recarrega chamada quando muda a data
  useEffect(() => {
    if (turmaSelecionada) {
      selecionarTurma(turmaSelecionada, dataSelecionada)
    }
  }, [dataSelecionada])


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
  // SELECIONAR TURMA (núcleo da tela)
  // ================================

  async function selecionarTurma(turmaId, dataParam) {    
    setPresencas({})

    // salva qual turma foi clicada
    setTurmaSelecionada(turmaId)

    // data de hoje (YYYY-MM-DD)
     const dataHoje = dataParam


    // --------------------------------
    // 1. buscar alunos da turma
    // --------------------------------
    const { data: alunosData, error: alunosError } = await supabase
      .from('alunos')
      .select('*')
      .eq('turma_id', turmaId)

    if (alunosError) {
      console.error(alunosError)
      return // para tudo se der erro
    }


    // --------------------------------
    // 2. buscar frequência do dia
    // --------------------------------
    const { data: freqData, error: freqError } = await supabase
      .from('frequencia')
      .select('*')
      .eq('turma_id', turmaId)
      .eq('data_aula', dataHoje)

    if (freqError) {
      console.error(freqError)
      return
    }


    // --------------------------------
    // 3. atualizar lista de alunos
    // --------------------------------
    setAlunos(alunosData)


    // --------------------------------
    // 4. montar estado de presença
    // --------------------------------

    const estadoInicial = {}

    alunosData.forEach((aluno) => {

      // procura se já existe registro no banco
      const registro = freqData.find((f) => f.ra === aluno.ra)

      // se existe → usa valor do banco
      // se não → null (não marcado ainda)
      estadoInicial[aluno.ra] = registro ? registro.presente : null
    })

    setPresencas(estadoInicial)
  }


  // ================================
  // MARCAR / DESMARCAR PRESENÇA
  // ================================

  function togglePresenca(ra) {
    setPresencas((prev) => ({
      ...prev, // mantém todos os outros alunos
      [ra]: prev[ra] === true ? false : true
      // alterna:
      // true → false
      // false/null → true
    }))
  }


  // ================================
  // SALVAR CHAMADA (persistência)
  // ================================

  async function salvarChamada() {

    // INÍCIO DO SALVAMENTO
    console.log('Salvando...')

    const dataHoje = dataSelecionada

    // percorre todos os alunos
    for (const ra in presencas) {

      const presente = presencas[ra]

      // regra de negócio:
      // null vira falta
      const valorFinal = presente === null ? false : presente


      // --------------------------------
      // UPSERT no banco
      // --------------------------------
      const { error } = await supabase
        .from('frequencia')
        .upsert(
          {
            ra: ra,
            turma_id: turmaSelecionada,
            data_aula: dataHoje,
            presente: valorFinal
          },
          {
            onConflict: ['ra', 'turma_id', 'data_aula']
            // garante:
            // se já existe → atualiza
            // se não existe → cria
          }
        )

      if (error) {
        console.error(error)
      }
    }

    alert('Chamada salva!')

    // =========================
    // RECARREGAR DADOS DO BANCO
    // =========================
    await selecionarTurma(turmaSelecionada, dataSelecionada)
  }


  // ================================
  // RENDER (o que aparece na tela)
  // ================================

  return (
    <div style={{ padding: 20 }}>

      <h1>Turmas</h1>

      {/* LISTA DE TURMAS */}
      {turmas.map((turma) => (
        <div
          key={turma.id}
          onClick={() => selecionarTurma(turma.id, dataSelecionada)}
          style={{
            cursor: 'pointer',
            padding: 5,
            border: '1px solid #ccc',
            marginBottom: 5
          }}
        >
          {turma.id} - {turma.abrev}
        </div>
      ))}


      {/* SE UMA TURMA FOI SELECIONADA */}
      {turmaSelecionada && (
        <>
          <div style={{ marginTop: '20px' }}>
            <label>Data da aula: </label>

            <input
              type="date"
              value={dataSelecionada}
              onChange={(e) => setDataSelecionada(e.target.value)}
            />
          </div>

          <h2 style={{ marginTop: '20px' }}>
            Chamada — Turma {turmaSelecionada}
          </h2>

          {/* LISTA DE ALUNOS */}
          {alunos.map((aluno) => (
            <div
              key={aluno.ra}
              style={{
                padding: '6px',
                marginBottom: '4px',

                // =========================
                // COR DINÂMICA
                // =========================
                backgroundColor:
                  presencas[aluno.ra] === true
                    ? '#d4edda'   // verde claro (presente)
                    : presencas[aluno.ra] === false
                    ? '#f8d7da'   // vermelho claro (faltou)
                    : '#ffffff',  // branco (não marcado)

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
          {/* =========================
            BOTÕES DE AÇÃO
          ========================= */}

          <button
            onClick={() => {

              // =========================
              // SALVA BACKUP
              // =========================
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
              style={{ marginRight: '10px' }}
            >
              Desfazer última ação
            </button>
          )}

          <br /><br />
          {/* BOTÃO SALVAR */}
          <button onClick={salvarChamada}>
            Salvar chamada
          </button>
        </>
      )}
    </div>
  )
}

export default App