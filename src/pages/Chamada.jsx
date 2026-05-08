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

  const [role, setRole] = useState(null)
  const [loading, setLoading] = useState(true)

  const podeEditar = role === 'admin' || role === 'coordenador'

  useEffect(() => {
    iniciar()
  }, [dataSelecionada, turmaId])

  async function iniciar() {
    setLoading(true)
    await Promise.all([
      carregarRole(),
      carregarDados()
    ])
    setLoading(false)
  }

  async function carregarRole() {
    // 1. Pega o usuário logado
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) return

    // 2. Filtra a permissão pelo ID desse usuário
    const { data, error } = await supabase
      .from('usuarios_permissoes')
      .select('role')
      .eq('id', user.id) // OU 'user_id', dependendo do nome da sua coluna
      .maybeSingle()

    if (error) {
      console.error('Erro ao buscar role:', error)
      return
    }

    setRole(data?.role || null)
  }


  async function carregarDados() {

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
    const key = String(ra);
    setPresencas((prev) => ({
      ...prev,
      [key]: prev[key] === true ? false : true
    }))
  }

  async function salvarChamada() {

    const dataHoje = dataSelecionada

    const { data: userData } = await supabase.auth.getUser()
    const user = userData.user

    const { data: existentes } = await supabase
      .from('frequencia')
      .select('ra')
      .eq('turma_id', turmaId)
      .eq('data_aula', dataHoje)

    const rasExistentes = new Set((existentes || []).map(e => e.ra))

    let teveErro = false

    for (const ra in presencas) {

      const valorFinal = presencas[ra] === null ? false : presencas[ra]

      const registro = {
        ra,
        turma_id: turmaId,
        data_aula: dataHoje,
        presente: valorFinal,
        responsavel: user.email,
        observacao: observacoes[String(ra)] ?? null
      }

      const jaExiste = rasExistentes.has(ra)

      // INSERT
      if (!jaExiste) {
        const { error } = await supabase
          .from('frequencia')
          .insert(registro)

        if (error) {
          console.error('Erro ao inserir:', error)
          teveErro = true
        }
      }

      // UPDATE
      if (jaExiste && podeEditar) {
        const { error } = await supabase
          .from('frequencia')
          .update(registro)
          .eq('ra', ra)
          .eq('turma_id', turmaId)
          .eq('data_aula', dataHoje)

        if (error) {
          console.error('Erro ao atualizar:', error)
          teveErro = true
        }
      }
    }

    if (teveErro) {
      alert('Alguns registros não puderam ser alterados (permissão).')
    } else {
      alert('Chamada salva com sucesso!')
    }

    await carregarDados()

  }

  // ================================
  // LOADING
  // ================================
  if (loading) {
    return <div style={{ padding: 20 }}>Carregando...</div>
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
      {alunos.map((aluno) => {

        const jaExiste = presencas[aluno.ra] !== null

        return (
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
                disabled={!podeEditar && jaExiste}
                checked={presencas[aluno.ra] === true}
                onChange={() => togglePresenca(aluno.ra)}
              />
            </div>

            <div style={{ textAlign: 'left' }}>{aluno.nome}</div>
            <div>{aluno.ra}</div>

            <div style={{ display: 'flex', gap: 8 }}>
              <button onClick={() => setAlunoObservando(aluno.ra)}>
                📝
              </button>

              <button onClick={() => navigate(`/aluno/${aluno.ra}`)}>
                📊
              </button>
            </div>

          </div>
        )
      })}

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