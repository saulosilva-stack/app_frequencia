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

  // NOVO
  const [chamada, setChamada] = useState(null)

  useEffect(() => {
    iniciar()
  }, [dataSelecionada, turmaId])

  // ============================================
  // PERMISSÃO
  // ============================================

  const chamadaFinalizada = chamada?.finalizada === true

  const podeEditar =
    role === 'admin' ||
    role === 'coordenador' ||
    !chamadaFinalizada

  // ============================================
  // INICIAR
  // ============================================

  async function iniciar() {

    setLoading(true)

    await Promise.all([
      carregarRole(),
      carregarDados()
    ])

    setLoading(false)
  }

  // ============================================
  // ROLE
  // ============================================

  async function carregarRole() {

    const { data, error } = await supabase
      .rpc('get_user_role')

    if (error) {
      console.error('Erro ao buscar role:', error)
      return
    }

    setRole(data || null)
  }

  // ============================================
  // CARREGAR DADOS
  // ============================================

  async function carregarDados() {

    const dataHoje = dataSelecionada

    // =========================
    // ALUNOS
    // =========================

    const { data: alunosData, error: alunosError } = await supabase
      .from('alunos')
      .select('*')
      .eq('turma_id', turmaId)
      .order('nome')

    if (alunosError) {
      console.error(alunosError)
      return
    }

    // =========================
    // CHAMADA
    // =========================

    const { data: chamadaData, error: chamadaError } = await supabase
      .from('chamadas')
      .select('*')
      .eq('turma_id', turmaId)
      .eq('data_aula', dataHoje)
      .maybeSingle()

    if (chamadaError) {
      console.error(chamadaError)
      return
    }

    setChamada(chamadaData || null)

    // =========================
    // FREQUÊNCIA
    // =========================

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

      const registro = freqData.find(
        (f) => String(f.ra) === String(aluno.ra)
      )

      estadoInicial[String(aluno.ra)] =
        registro ? registro.presente : null

      obsInicial[String(aluno.ra)] =
        registro ? registro.observacao || '' : ''
    })

    setPresencas(estadoInicial)
    setObservacoes(obsInicial)
  }

  // ============================================
  // TOGGLE
  // ============================================

  function togglePresenca(ra) {

    if (!podeEditar) return

    const key = String(ra)

    setPresencas((prev) => ({
      ...prev,
      [key]: prev[key] === true ? false : true
    }))
  }

  // ============================================
  // SALVAR
  // ============================================

  async function salvarChamada() {

    if (!podeEditar) {
      alert('Você não possui permissão para alterar esta chamada.')
      return
    }

    const dataHoje = dataSelecionada

    const { data: userData } = await supabase.auth.getUser()

    const user = userData.user

    // ========================================
    // CRIAR CHAMADA SE NÃO EXISTIR
    // ========================================

    let chamadaAtual = chamada

    if (!chamada) {

  const { data: novaChamada, error: chamadaError } = await supabase
      .from('chamadas')
      .insert({
        turma_id: turmaId,
        data_aula: dataHoje,
        criada_por: user.email,
        finalizada: false
      })
      .select()
      .single()

    if (chamadaError) {
      console.error(chamadaError)
      alert('Erro ao criar chamada')
      return
    }

    chamadaAtual = novaChamada
  }

    // ========================================
    // SALVAR FREQUÊNCIAS
    // ========================================

    let teveErro = false

    for (const ra in presencas) {

      const valorFinal =
        presencas[ra] === null
          ? false
          : presencas[ra]

      const registro = {
        ra,
        turma_id: turmaId,
        data_aula: dataHoje,
        presente: valorFinal,
        responsavel: user.email,
        observacao: observacoes[String(ra)] ?? null,
        chamada_id: chamadaAtual.id
      }

      const { error } = await supabase
        .from('frequencia')
        .upsert(registro, {
          onConflict: 'ra,turma_id,data_aula'
        })

      if (error) {
        console.error(error)
        teveErro = true
      }
    }

    if (teveErro) {
      alert('Alguns registros não puderam ser salvos.')
    } else {
      alert('Chamada salva com sucesso!')
    }

    await carregarDados()
  }

  // ============================================
  // FINALIZAR
  // ============================================

  async function finalizarChamada() {

    if (!chamada) {
      alert('Salve a chamada antes de finalizar.')
      return
    }

    const { error } = await supabase
      .from('chamadas')
      .update({
        finalizada: true
      })
      .eq('id', chamada.id)

    if (error) {
      console.error(error)
      alert('Erro ao finalizar chamada')
      return
    }

    alert('Chamada finalizada!')

    await carregarDados()
  }

  // ============================================
  // LOADING
  // ============================================

  if (loading) {
    return (
      <div style={{ padding: 20 }}>
        Carregando...
      </div>
    )
  }

  return (
    <div style={{ padding: 20 }}>

      <button onClick={() => navigate('/')}>
        ← Voltar
      </button>

      {/* DATA */}

      <div style={{ marginTop: 20 }}>
        <label>Data da aula: </label>

        <input
          type="date"
          value={dataSelecionada}
          onChange={(e) =>
            setDataSelecionada(e.target.value)
          }
        />
      </div>

      {/* STATUS */}

      <div style={{ marginTop: 10 }}>

        <strong>Status:</strong>{' '}

        {chamadaFinalizada
          ? 'Finalizada'
          : 'Aberta'}
      </div>

      {/* TÍTULO */}

      <h2 style={{ marginTop: 20 }}>
        Chamada — Turma {turmaId}
      </h2>

      {/* CABEÇALHO */}

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '80px 1fr 120px 120px',
          fontWeight: 'bold',
          borderBottom: '2px solid #ccc',
          padding: '8px'
        }}
      >
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

          {/* CHECKBOX */}

          <div>

            <input
              type="checkbox"
              disabled={!podeEditar}
              checked={presencas[aluno.ra] === true}
              onChange={() =>
                togglePresenca(aluno.ra)
              }
            />

          </div>

          {/* NOME */}

          <div style={{ textAlign: 'left' }}>
            {aluno.nome}
          </div>

          {/* RA */}

          <div>
            {aluno.ra}
          </div>

          {/* AÇÕES */}

          <div
            style={{
              display: 'flex',
              gap: 8
            }}
          >

            <button
              disabled={!podeEditar}
              onClick={() =>
                setAlunoObservando(aluno.ra)
              }
            >
              📝
            </button>

            <button
              onClick={() =>
                navigate(`/aluno/${aluno.ra}`)
              }
            >
              📊
            </button>

          </div>

        </div>
      ))}

      <br />

      {/* MODAL OBSERVAÇÃO */}

      {alunoObservando && (

        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,

            backgroundColor: 'rgba(0,0,0,0.3)',

            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center'
          }}
        >

          <div
            style={{
              background: '#fff',
              padding: 20,
              borderRadius: 8,
              width: 300
            }}
          >

            <h3>Observação</h3>

            <textarea
              disabled={!podeEditar}
              value={observacoes[alunoObservando] || ''}

              onChange={(e) =>
                setObservacoes(prev => ({
                  ...prev,
                  [String(alunoObservando)]:
                    e.target.value
                }))
              }

              style={{
                width: '100%',
                height: 100
              }}
            />

            <br />
            <br />

            <button
              onClick={() =>
                setAlunoObservando(null)
              }
            >
              Fechar
            </button>

          </div>

        </div>
      )}

      {/* BOTÕES */}

      <div
        style={{
          display: 'flex',
          gap: 10,
          marginTop: 20,
          flexWrap: 'wrap'
        }}
      >

        <button
          disabled={!podeEditar}
          onClick={() => {

            setBackupPresencas(presencas)

            const todos = {}

            alunos.forEach(a => {
              todos[a.ra] = true
            })

            setPresencas(todos)
          }}
        >
          Marcar todos presentes
        </button>

        <button
          disabled={!podeEditar}
          onClick={() => {

            setBackupPresencas(presencas)

            const todos = {}

            alunos.forEach(a => {
              todos[a.ra] = false
            })

            setPresencas(todos)
          }}
        >
          Marcar todos faltantes
        </button>

        {backupPresencas && (

          <button
            disabled={!podeEditar}
            onClick={() => {
              setPresencas(backupPresencas)
              setBackupPresencas(null)
            }}
          >
            Desfazer
          </button>

        )}

        <button
          disabled={!podeEditar}
          onClick={salvarChamada}
        >
          Salvar chamada
        </button>

        {!chamadaFinalizada && (
          <button onClick={finalizarChamada}>
            Finalizar chamada
          </button>
        )}

      </div>

    </div>
  )
}

export default Chamada