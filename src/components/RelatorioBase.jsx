import { useState } from 'react'
import ExcelJS from 'exceljs'

function RelatorioBase({ titulo, dados, colunas }) {

  const [ordenacao, setOrdenacao] = useState({
    campo: colunas[0]?.campo,
    direcao: 'asc'
  })

  function alterarOrdenacao(campo) {
    setOrdenacao((prev) => ({
      campo,
      direcao:
        prev.campo === campo && prev.direcao === 'asc'
          ? 'desc'
          : 'asc'
    }))
  }

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
  // FORMATADOR
  // ================================
  function formatarValor(col, item) {

    const valor = item[col.campo]

    if (col.render) {
      return col.render(item)
    }

    if (col.tipo === 'data') {
      if (!valor) return '-'

      const [ano, mes, dia] = valor.split('-')
      return `${dia}/${mes}/${ano}`
    }

    return valor ?? '-'
  }

  // ================================
  // EXPORTAR EXCEL (NOVO PADRÃO)
  // ================================
  async function exportarExcel() {

    const workbook = new ExcelJS.Workbook()
    const worksheet = workbook.addWorksheet(titulo)

    // colunas
    worksheet.columns = colunas.map(col => ({
      header: col.label,
      key: col.campo,
      width: 20
    }))

    // linhas
    dados.forEach(item => {
      const linha = {}

      colunas.forEach(col => {
        linha[col.campo] = formatarValor(col, item)
      })

      worksheet.addRow(linha)
    })

    // estilo header
    worksheet.getRow(1).font = { bold: true }

    // gerar arquivo
    const buffer = await workbook.xlsx.writeBuffer()

    const blob = new Blob([buffer], {
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    })

    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${titulo}.xlsx`
    a.click()
    window.URL.revokeObjectURL(url)
  }

  const gridTemplate = colunas.map(() => '1fr').join(' ')

  return (
    <div style={{
      padding: 20,
      maxWidth: 1000,
      margin: '0 auto'
    }}>

      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center'
      }}>
        <h2>{titulo}</h2>

        <button onClick={exportarExcel}>
          Exportar Excel
        </button>
      </div>

      {/* CABEÇALHO */}
      <div style={{
        display: 'grid',
        position: 'sticky',
        top: 0,
        background: '#fff',
        zIndex: 2,
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
          onMouseEnter={(e) => e.currentTarget.style.background = '#eef'}
          onMouseLeave={(e) => {
            e.currentTarget.style.background =
              index % 2 === 0 ? '#ffffff' : '#f9f9f9'
          }}
          style={{
            cursor: 'pointer',
            display: 'grid',
            gridTemplateColumns: gridTemplate,
            padding: '6px 0',
            borderBottom: '1px solid #ddd',
            backgroundColor: index % 2 === 0 ? '#ffffff' : '#f9f9f9'
          }}
        >
          {colunas.map((col) => (
            <div
              key={col.campo}
              style={{
                textAlign:
                  col.tipo === 'numero' || col.tipo === 'percentual'
                    ? 'right'
                    : 'left'
              }}
            >
              {formatarValor(col, item)}
            </div>
          ))}
        </div>

      ))}

    </div>
  )
}

export default RelatorioBase