import { useState } from 'react'
import * as XLSX from 'xlsx'

function RelatorioBase({ titulo, dados, colunas }) {

  // ================================
  // ESTADO DE ORDENAÇÃO
  // ================================
  const [ordenacao, setOrdenacao] = useState({
    campo: colunas[0]?.campo,
    direcao: 'asc'
  })

  // ================================
  // ALTERAR ORDENAÇÃO
  // ================================
  function alterarOrdenacao(campo) {
    setOrdenacao((prev) => ({
      campo,
      direcao:
        prev.campo === campo && prev.direcao === 'asc'
          ? 'desc'
          : 'asc'
    }))
  }

  // ================================
  // ORDENAR DADOS
  // ================================
  function ordenarDados(lista) {
    return [...lista].sort((a, b) => {

      let valorA = a[ordenacao.campo]
      let valorB = b[ordenacao.campo]

      if (typeof valorA === 'string') {
        return ordenacao.direcao === 'asc'
          ? valorA.localeCompare(valorB)
          : valorB.localeCompare(valorA)
      }

      return ordenacao.direcao === 'asc'
        ? valorA - valorB
        : valorB - valorA
    })
  }

  // ================================
  // EXPORTAR EXCEL
  // ================================
  function exportarExcel() {

    const dadosFormatados = dados.map((item) => {
      const linha = {}

      colunas.forEach((col) => {
        linha[col.label] = item[col.campo]
      })

      return linha
    })

    const worksheet = XLSX.utils.json_to_sheet(dadosFormatados)
    const workbook = XLSX.utils.book_new()

    XLSX.utils.book_append_sheet(workbook, worksheet, titulo)
    XLSX.writeFile(workbook, `${titulo}.xlsx`)
  }

  // ================================
  // GRID DINÂMICO
  // ================================
  const gridTemplate = colunas.map(() => '1fr').join(' ')

  return (
    <div style={{ padding: 20 }}>

      <h2>{titulo}</h2>

      <button onClick={exportarExcel}>
        Exportar Excel
      </button>

      {/* CABEÇALHO */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: gridTemplate,
        fontWeight: 'bold',
        borderBottom: '2px solid #000',
        padding: '8px 0',
        marginTop: 20
      }}>
        {colunas.map((col) => (
          <div
            key={col.campo}
            onClick={() => alterarOrdenacao(col.campo)}
            style={{ cursor: 'pointer' }}
          >
            {col.label}{' '}
            {ordenacao.campo === col.campo
              ? (ordenacao.direcao === 'asc' ? '↑' : '↓')
              : ''}
          </div>
        ))}
      </div>

      {/* LINHAS */}
      {ordenarDados(dados).map((item, index) => (

        <div
          key={index}
          style={{
            display: 'grid',
            gridTemplateColumns: gridTemplate,
            padding: '6px 0',
            borderBottom: '1px solid #ddd',

            // regra opcional por linha
            backgroundColor:
              colunas.some(c => c.highlight?.(item))
                ? '#f8d7da'
                : 'transparent'
          }}
        >
          {colunas.map((col) => (
            <div key={col.campo}>

              {/* render customizado */}
              {col.render
                ? col.render(item)
                : item[col.campo] ?? '-'
              }

            </div>
          ))}
        </div>

      ))}

    </div>
  )
}

export default RelatorioBase